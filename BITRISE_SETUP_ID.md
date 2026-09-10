# Panduan singkat Windows -> GitHub -> Bitrise

1. Extract ZIP.
2. Upload isi folder `TimestampCamera` ke repository GitHub baru.
3. Di Bitrise pilih **Get started with Bitrise CI**.
4. Pilih repository tersebut.
5. Biarkan Bitrise membaca `bitrise.yml`.
6. Jalankan `primary` terlebih dahulu.
7. Jika primary PASS, lanjut konfigurasi Apple Service di Bitrise.
8. Jalankan `archive_development` untuk IPA.

Jangan memasukkan password Apple, private key, certificate, atau provisioning profile ke GitHub.
Masukkan kredensial melalui Bitrise Secrets / Apple Service Connection.
