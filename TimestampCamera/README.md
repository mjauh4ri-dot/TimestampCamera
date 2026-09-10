# Timestamp Camera V2 — Bitrise Ready

Ini adalah V2 dari project yang Anda kirim. Saya mempertahankan source kamera V1 dan menambahkan:

- `TimestampCamera.xcodeproj`
- Shared Xcode Scheme `TimestampCamera`
- `bitrise.yml`
- Workflow `primary` untuk build Simulator tanpa signing
- Workflow `archive_development` untuk membuat IPA development dengan automatic Apple signing
- README dan panduan Bitrise

## Struktur

```text
TimestampCamera/
├── TimestampCamera.xcodeproj/
│   ├── project.pbxproj
│   └── xcshareddata/xcschemes/TimestampCamera.xcscheme
├── TimestampCamera/
│   ├── CameraModel.swift
│   ├── CameraPreview.swift
│   ├── CameraView.swift
│   ├── ImageStamp.swift
│   ├── TimestampCameraApp.swift
│   └── Info.plist
├── bitrise.yml
└── README.md
```

## Cara memakai Bitrise

1. Upload folder ini ke GitHub sebagai repository baru.
2. Di Bitrise pilih **Get started with Bitrise CI**.
3. Hubungkan repository GitHub tersebut.
4. Pastikan Bitrise mendeteksi:
   `TimestampCamera.xcodeproj`
5. Untuk tes compile tanpa signing, jalankan workflow:
   `primary`
6. Untuk IPA iPhone fisik, jalankan:
   `archive_development`

### Penting untuk IPA iPhone

Workflow `archive_development` menggunakan:

```yaml
distribution_method: development
automatic_code_signing: apple-id
```

Anda harus menghubungkan Apple service/account di Bitrise dan menyediakan signing yang diperlukan. Bitrise mendokumentasikan bahwa Xcode Archive & Export dapat mengelola automatic code signing, dan `development` digunakan untuk internal/device testing.

Bundle ID project saat ini adalah:

`com.example.TimestampCamera`

Sebelum distribusi/signing, sebaiknya ganti ke Bundle ID unik milik Anda.

## Hasil build

Workflow `primary` menghasilkan artifact hasil build Simulator.

Workflow `archive_development` ditujukan menghasilkan `.ipa` development setelah Apple signing berhasil dikonfigurasi.

## Catatan

Build IPA dan pemasangan ke iPhone adalah dua hal berbeda. IPA untuk perangkat fisik harus ditandatangani dengan provisioning/certificate yang sesuai.

Source aplikasi tetap menggunakan:
- Swift
- SwiftUI
- AVFoundation
- Photos

Timestamp yang dibuat aplikasi ditanam langsung ke piksel foto.
