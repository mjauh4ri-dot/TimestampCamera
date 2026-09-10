import SwiftUI

struct CameraView: View {
    @StateObject private var camera = CameraModel()

    var body: some View {
        ZStack {
            CameraPreview(session: camera.session)
                .ignoresSafeArea()

            VStack {
                HStack {
                    Spacer()
                    Text(camera.liveStamp)
                        .font(.system(size: 15, weight: .semibold, design: .monospaced))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 7)
                        .background(.black.opacity(0.45))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .padding()
                }
                Spacer()
                HStack(spacing: 36) {
                    Button { camera.switchCamera() } label: {
                        Image(systemName: "camera.rotate")
                            .font(.system(size: 25, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: 56, height: 56)
                            .background(.black.opacity(0.45))
                            .clipShape(Circle())
                    }

                    Button { camera.takePhoto() } label: {
                        ZStack {
                            Circle().fill(.white).frame(width: 76, height: 76)
                            Circle().stroke(.black.opacity(0.25), lineWidth: 3)
                                .frame(width: 66, height: 66)
                        }
                    }

                    Button { camera.toggleFlash() } label: {
                        Image(systemName: camera.flashEnabled ? "bolt.fill" : "bolt.slash")
                            .font(.system(size: 23, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: 56, height: 56)
                            .background(.black.opacity(0.45))
                            .clipShape(Circle())
                    }
                }
                .padding(.bottom, 28)
            }

            if let message = camera.message {
                VStack {
                    Spacer()
                    Text(message)
                        .font(.callout.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(.black.opacity(0.72))
                        .clipShape(Capsule())
                        .padding(.bottom, 115)
                }
            }
        }
        .task { await camera.start() }
        .onDisappear { camera.stop() }
    }
}
