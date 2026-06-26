# SysLog Monitor — Kelompok 9 Paralel 2

Aplikasi web monitoring log aktivitas aplikasi berbasis React + Vite.
Port dari program C++ Kelompok 9 (Struktur Data, IPB University).

## Fitur

- **Insert Log** — tambah log manual atau bulk random (sampai 1 juta)
- **Search** — cari log berdasarkan Time Range (Binary Search), Level, atau Source (Linear Search)
- **Delete Old Logs** — hapus log lama berdasarkan threshold timestamp
- **Dashboard & Statistik** — pie chart distribusi level, timeline bar chart per jam
- **Benchmark** — uji performa Insert/Search/Delete pada berbagai ukuran data (1 – 1.000.000), ekspor CSV
- **Export CSV** — download semua log sebagai CSV
- **Persistent** — data disimpan di localStorage browser

## Struktur Data

Implementasi di-port dari C++ ke JavaScript:
- Semua operasi menggunakan array JS (setara `std::vector`)
- Binary search (`lower_bound`) untuk search by time dan delete old logs
- Linear search untuk search by level/source
- Waktu eksekusi diukur dengan `performance.now()` (setara `<chrono>`)

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka http://localhost:5173

## Deploy ke Vercel

### Cara 1 — Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

### Cara 2 — GitHub + Vercel Dashboard
1. Push repo ini ke GitHub
2. Buka https://vercel.com/new
3. Import repository → framework otomatis terdeteksi sebagai Vite
4. Klik **Deploy**

Tidak perlu konfigurasi tambahan — `vercel.json` sudah ada.

## Tim

| Nama | NIM |
|------|-----|
| Hauzan Ziyadatul Khoir | M0403241002 |
| Dolisy Febriani Yurni | M0403241081 |
| Ananta Sakha Pramodya | M0403241139 |
| Fatihza Raj Sandy Tanjung | M0403241167 |

Mata Kuliah Struktur Data — Departemen Ilmu Komputer, IPB University
