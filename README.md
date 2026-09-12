# Tugas Deadline

Struktur:
- `index.html` — halaman aplikasi
- `sw.js` — Service Worker untuk notifikasi
- `worker.js` — Cloudflare Worker/API
- `schema.sql` — struktur database D1
- `wrangler.toml.example` — contoh konfigurasi Worker

## Upload ke GitHub
Upload semua file dalam folder ini ke repository GitHub.

## Catatan penting
Web Push tidak bisa dibuat benar-benar aktif hanya dengan upload ke GitHub. Cloudflare Worker membutuhkan:
- D1 binding `DB`
- VAPID public/private key sebagai secret
- Cron Trigger
- konfigurasi deployment/static assets

`index.html` sengaja memakai placeholder `REPLACE_WITH_VAPID_PUBLIC_KEY` agar tidak memasukkan secret ke repository.

Untuk produksi, jangan pernah memasukkan VAPID private key atau secret lain ke GitHub.
