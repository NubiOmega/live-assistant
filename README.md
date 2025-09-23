# Live Assistant Monorepo

Live Assistant adalah rangkaian aplikasi untuk membantu streamers mengelola live commerce: mulai dari API backend berbasis FastAPI, gateway WebSocket berbasis Node.js, overlay OBS berbasis React, hingga aplikasi desktop Electron.

## Fitur Utama
- **API (FastAPI + PostgreSQL + Redis)** untuk autentikasi dan penyimpanan data streaming/produk.
- **Gateway WebSocket (Node.js)** dengan integrasi Redis pub/sub untuk menyiarkan event chat dan gift.
- **Overlay React** siap pakai untuk chat dan alert donasi/gift yang dapat di-embed di OBS.
- **Aplikasi Desktop Electron + React** sebagai dashboard kontrol utama.
- **Adapter Platform** (contoh TikTok dummy) yang menyimulasikan event chat/gift.
- **Docker Compose** untuk menjalankan PostgreSQL, Redis, API, dan gateway secara terpadu.

## Struktur Repository
```
apps/
  desktop/        # Aplikasi dashboard (Electron + React)
  overlay/        # Overlay chat & alert (React + Vite)
infra/            # (placeholder) konfigurasi infrastruktur tambahan
packages/
  platforms/      # Adapter platform sosial (dummy TikTok, dll.)
services/
  api/            # FastAPI backend + SQLAlchemy models + Alembic
  gateway/        # Node.js WebSocket gateway
```

## Prasyarat
- **Node.js 20.x** dan npm 10.x
- **Python 3.11+** (disarankan menggunakan venv)
- **Docker & Docker Compose** (untuk orkestrasi lokal)
- **Git**

## Bootstrap Lingkungan Dev (Windows)
Gunakan skrip `scripts/run-dev.ps1` untuk menyiapkan seluruh dependency dan menjalankan service pengembangan di jendela PowerShell terpisah.

```powershell
# dari akar repository
./scripts/run-dev.ps1             # menjalankan setup lengkap
./scripts/run-dev.ps1 -StartDocker # otomatis menyalakan PostgreSQL & Redis via docker compose
./scripts/run-dev.ps1 -SkipInstalls # lewati npm/pip install setelah dependensi sudah terpasang
./scripts/run-dev.ps1 -SkipDesktop  # tidak membuka aplikasi desktop
```

Skrip akan:
- Membuat virtualenv Python (`services/api/.venv`) jika belum ada dan memasang dependency (termasuk `pydantic-settings`).
- Menjalankan `npm install` untuk gateway, overlay, dan desktop (kecuali `-SkipDesktop`).
- Menjalankan migrasi database dengan `alembic upgrade head`.
- Membuka jendela PowerShell baru untuk masing-masing service (API, gateway, overlay, dan desktop).

## Quick Start dengan Docker Compose
Menjalankan seluruh infrastruktur inti (PostgreSQL, Redis, API, Gateway) dengan satu perintah.

```bash
# dari akar repository
docker compose up --build
```

Layanan yang tersedia setelah container aktif:
- API: `http://localhost:8000` (Swagger UI di `/docs`)
- Redis: `localhost:6379`
- PostgreSQL: `localhost:5432` (db/user/password: `live_assistant`)
- Gateway WebSocket & HTTP: `ws://localhost:3000` / `http://localhost:3000`

> **Catatan:** Overlay React dan aplikasi desktop tidak dijalankan lewat Docker Compose. Jalankan secara manual sesuai panduan di bawah atau gunakan skrip bootstrap.

## Setup Manual per Komponen
### 1. Backend API (FastAPI)
```bash
cd services/api
python -m venv .venv
.venv\Scripts\activate  # PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# jalankan migrasi database
alembic upgrade head

# start API (dev mode)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Secara default API menggunakan `postgresql+asyncpg://postgres:postgres@db:5432/postgres`. Ubah env `DATABASE_URL` jika diperlukan (mis. gunakan koneksi lokal).

### 2. Migrasi Database (Alembic)
```bash
cd services/api
alembic revision -m "deskripsi"  # membuat migrasi baru
alembic upgrade head             # menerapkan migrasi
alembic downgrade -1             # rollback satu langkah
```

### 3. Gateway WebSocket (Node.js)
```bash
cd services/gateway
npm install
npm run dev   # menjalankan gateway di http://localhost:3000
```
Endpoint penting:
- WebSocket: `ws://localhost:3000`
- REST Broadcast: `POST /broadcast` dengan body `{ "channel": "chat.events", "message": {...} }`
- Health check: `GET /health`

### 4. Overlay React
```bash
cd apps/overlay
npm install
npm run dev -- --host 0.0.0.0 --port 5174
```
Perintah di atas menjalankan overlay pada `http://localhost:5174`. Sesuaikan port melalui argumen `--port` bila diperlukan dan update URL di OBS.

Tersedia dua route utama:
- `http://localhost:5174/overlay/chat`
- `http://localhost:5174/overlay/alert`

### 5. Aplikasi Desktop (Electron + React)
```bash
cd apps/desktop
npm install
npm run dev   # menjalankan Vite renderer + Electron
```
Aplikasi akan terbuka otomatis. Dashboard menampilkan ringkasan metrik dan sidebar navigasi ke Chat, Produk, Overlay, Analitik, dan Settings.

## Integrasi Overlay dengan OBS
1. Pastikan overlay server aktif (`npm run dev -- --port 5174`).
2. Buka OBS Studio lalu pilih scene yang ingin ditambah overlay.
3. Klik tombol `+` pada panel **Sources**, pilih **Browser Source**, tekan **OK**.
4. Isi kolom URL dengan `http://localhost:5174/overlay/chat`, sesuaikan lebar/tinggi (mis. 400x600), lalu klik **OK**.
5. Ulangi langkah yang sama untuk menambahkan alert dengan URL `http://localhost:5174/overlay/alert`.
6. Atur urutan layer sumber agar overlay berada di atas feed video.

## Contoh Alur Penggunaan
1. Jalankan Docker Compose untuk menyiapkan PostgreSQL, Redis, API, dan gateway.
2. (Opsional) Jalankan FastAPI secara lokal untuk pengembangan sambil tersambung ke database di container.
3. Jalankan overlay React dan masukkan URL ke OBS (Browser Source).
4. Gunakan endpoint gateway `/broadcast` atau integrasi adapter TikTok dummy untuk menyiarkan event ke klien WebSocket.
5. Kerjakan UI/logic lanjutan di aplikasi desktop sesuai kebutuhan.

## Variabel Lingkungan
| Komponen | Variabel | Default | Deskripsi |
|----------|----------|---------|-----------|
| API | `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@db:5432/postgres` | Koneksi database utama |
| API | `REDIS_URL` | `redis://redis:6379/0` | Koneksi Redis (cache/event) |
| API | `JWT_SECRET` | `super-secret-key` | Kunci JWT dummy (ubah di produksi) |
| API | `JWT_ALGORITHM` | `HS256` | Algoritma JWT |
| API | `JWT_EXPIRY_SECONDS` | `3600` | Masa berlaku token dalam detik |
| Gateway | `PORT` | `3000` | Port HTTP & WebSocket |
| Gateway | `REDIS_URL` | `redis://redis:6379/0` | Pub/Sub channel Redis |
| Gateway | `API_URL` | `http://api:8000` | Endpoint API internal (opsional) |
| Overlay | `PORT` (via Vite) | `5174` | Port dev server (override dengan `--port`) |

## Tips Pengembangan
- Gunakan `docker compose down -v` untuk membersihkan volume database/Redis saat ingin reset data.
- Simpan file `.env` di masing-masing service untuk override konfigurasi default tanpa mengubah kode.
- Uji event realtime secara manual:
  ```bash
  curl -X POST http://localhost:3000/broadcast \
    -H "Content-Type: application/json" \
    -d '{"channel":"chat.events","message":{"user":"CLI","text":"Halo dari curl"}}'
  ```
- Gunakan adapter TikTok dummy (`packages/platforms/tiktok`) sebagai referensi untuk menulis adapter platform sebenarnya.

---
Selamat membangun fitur live commerce Anda dengan Live Assistant!
