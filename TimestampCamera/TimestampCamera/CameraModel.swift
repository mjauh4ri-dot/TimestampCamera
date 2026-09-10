import Foundation
import Combine
import AVFoundation
import UIKit
import Photos

final class CameraModel: NSObject, ObservableObject {
    let session = AVCaptureSession()

    @Published var liveStamp = ""
    @Published var message: String?
    @Published var flashEnabled = false

    private let photoOutput = AVCapturePhotoOutput()
    private let sessionQueue = DispatchQueue(label: "com.example.TimestampCamera.session")
    private var currentInput: AVCaptureDeviceInput?
    private var position: AVCaptureDevice.Position = .back
    private var timer: Timer?

    func start() async {
        await MainActor.run { self.updateStamp() }

        guard await AVCaptureDevice.requestAccess(for: .video) else {
            await MainActor.run { self.message = "Izin kamera diperlukan." }
            return
        }

        configureSession()

        await MainActor.run {
            self.timer?.invalidate()
            self.timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
                self?.updateStamp()
            }
        }
    }

    func stop() {
        timer?.invalidate()
        timer = nil
        sessionQueue.async { [session] in
            if session.isRunning {
                session.stopRunning()
            }
        }
    }

    private func updateStamp() {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy/MM/dd HH:mm:ss"
        liveStamp = formatter.string(from: Date())
    }

    private func configureSession() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            guard !self.session.isRunning else { return }

            self.session.beginConfiguration()
            self.session.sessionPreset = .photo

            if let old = self.currentInput {
                self.session.removeInput(old)
                self.currentInput = nil
            }

            guard
                let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: self.position),
                let input = try? AVCaptureDeviceInput(device: device),
                self.session.canAddInput(input)
            else {
                self.session.commitConfiguration()
                self.showMessage("Kamera tidak tersedia.")
                return
            }

            self.session.addInput(input)
            self.currentInput = input

            if !self.session.outputs.contains(where: { $0 === self.photoOutput }) {
                guard self.session.canAddOutput(self.photoOutput) else {
                    self.session.commitConfiguration()
                    self.showMessage("Photo output gagal dibuat.")
                    return
                }
                self.session.addOutput(self.photoOutput)
                self.photoOutput.maxPhotoQualityPrioritization = .quality
            }

            self.session.commitConfiguration()
            self.session.startRunning()
        }
    }

    func switchCamera() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            let newPosition = self.position == .back ? AVCaptureDevice.Position.front : .back
            guard
                let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: newPosition),
                let newInput = try? AVCaptureDeviceInput(device: device)
            else {
                self.showMessage("Kamera depan/belakang tidak tersedia.")
                return
            }

            self.session.beginConfiguration()
            if let old = self.currentInput {
                self.session.removeInput(old)
            }
            guard self.session.canAddInput(newInput) else {
                if let old = self.currentInput, self.session.canAddInput(old) {
                    self.session.addInput(old)
                }
                self.session.commitConfiguration()
                self.showMessage("Gagal mengganti kamera.")
                return
            }
            self.session.addInput(newInput)
            self.currentInput = newInput
            self.position = newPosition
            self.session.commitConfiguration()
        }
    }

    func toggleFlash() { flashEnabled.toggle() }

    func takePhoto() {
        let stamp = liveStamp
        let flash = flashEnabled
        sessionQueue.async { [weak self] in
            guard let self else { return }
            let settings = AVCapturePhotoSettings()
            if let device = self.currentInput?.device,
               device.hasFlash,
               self.photoOutput.supportedFlashModes.contains(.on) {
                settings.flashMode = flash ? .on : .off
            }
            settings.photoQualityPrioritization = .quality

            let delegate = PhotoCaptureDelegate { [weak self] image in
                Task { @MainActor in
                    self?.saveStampedImage(image, stamp: stamp)
                }
            }
            self.photoOutput.capturePhoto(with: settings, delegate: delegate)
        }
    }

    @MainActor
    private func saveStampedImage(_ image: UIImage, stamp: String) {
        let stamped = ImageStamp.render(image: image, text: stamp, position: .bottomRight)

        let save: () -> Void = { [weak self] in
            guard let self else { return }
            UIImageWriteToSavedPhotosAlbum(
                stamped, self,
                #selector(CameraModel.saveCompleted(_:didFinishSavingWithError:contextInfo:)), nil
            )
        }

        switch PHPhotoLibrary.authorizationStatus(for: .addOnly) {
        case .authorized, .limited:
            save()
        case .notDetermined:
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                Task { @MainActor in
                    guard status == .authorized || status == .limited else {
                        self.message = "Izin Photos diperlukan."
                        return
                    }
                    save()
                }
            }
        default:
            message = "Izin Photos diperlukan."
        }
    }

    @objc private func saveCompleted(_ image: UIImage, didFinishSavingWithError error: Error?, contextInfo: UnsafeRawPointer?) {
        message = error == nil ? "Foto tersimpan + timestamp" : "Gagal menyimpan foto."
        Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            message = nil
        }
    }

    private func showMessage(_ text: String) {
        Task { @MainActor in self.message = text }
    }
}

final class PhotoCaptureDelegate: NSObject, AVCapturePhotoCaptureDelegate {
    private let completion: (UIImage) -> Void

    init(completion: @escaping (UIImage) -> Void) {
        self.completion = completion
    }

    func photoOutput(_ output: AVCapturePhotoOutput,
                     didFinishProcessingPhoto photo: AVCapturePhoto,
                     error: Error?) {
        guard error == nil,
              let data = photo.fileDataRepresentation(),
              let image = UIImage(data: data) else { return }
        completion(image)
    }
}
