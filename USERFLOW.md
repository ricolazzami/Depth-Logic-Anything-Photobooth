# User Flow — Photobooth PWA

## Alur Tamu (Happy Path <40 detik)
```
Masuk (PWA fullscreen) → [S1 Pilih Template] tap A/B → [S2 Preview Kamera] cek pose
→ tap "Tap to Start" → [S3 Capture] 4× (3-2-1 pop → flash → shutter) jeda 1.5s, indikator dot kanan
→ [S4 Hasil] lihat strip 1200×3600 + status "Mengupload..." → QR muncul + "Buka Gambar"
→ scan QR pakai HP → save/share → tap "Start Over" → kembali S1 untuk tamu berikut
```

## Alternate / Error Flows
- **Izin kamera ditolak / HTTP:** banner merah "Kamera tidak tersedia — butuh HTTPS & izin Safari", tetap di S2, tombol back aktif.
- **Upload gagal (offline/ENV salah):** S4 tampil "Upload gagal: ..." + "QR tidak tersedia", gambar tetap tampil — tamu long-press save.
- **Template PNG belum ada:** `<img onerror hidden>` kartu tetap tampil label, canvas fallback putih tanpa overlay.
- **Keluar mid-sequence:** tidak ada cancel; tunggu 4 shot selesai atau refresh. ponytail: tambah tombol Batal.

## State Tiap Screen
- **S1 `screen-template`:** pilih template → `selectedTemplate`, badge, `startCamera()`.
- **S2 `screen-camera`:** live `<video>` mirror, `Tap to Start` / `← Ganti Template`.
- **S3 `screen-capture`:** dua `<video>` share stream, `#countdown`, `#flash.show`, `#shot-current`, dots.
- **S4 `screen-result`:** `#result-img` (base64), `#canvas` hidden, `#qrcode` QRCode.js, `#upload-status`, `#download-link`, `Start Over` → `reset()`.

## Diagram State
```
[Idle S1] --pilih--> [S2 Camera] --start--> [S3 Loop i=1..4] --compose--> [S4 Result] --reset--> [S1]
                          |                      |                              |
                     back ke S1            countdown/flash              upload→QR / fallback
```
