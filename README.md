# Live Assistant

Monorepo untuk aplikasi live streaming yang mencakup desktop Electron + React, overlay OBS, layanan FastAPI, gateway realtime, adapter platform sosial, dan infrastruktur pendukung.

## Integrasi Overlay dengan OBS

1. Buka OBS Studio dan buka scene yang ingin ditambahkan overlay.
2. Klik tombol `+` pada daftar `Sources`, pilih `Browser Source`, lalu tekan `OK`.
3. Isi kolom URL dengan `http://localhost:3000/overlay/chat` untuk menampilkan overlay chat dan sesuaikan ukuran kanvas sesuai kebutuhan.
4. Ulangi langkah yang sama dan gunakan URL `http://localhost:3000/overlay/alert` untuk menampilkan overlay alert donasi/gift.
5. Pastikan kedua sumber browser berada di urutan layer yang tepat agar overlay terlihat di atas video utama.
