# Snowberry — Data Source (web-app)

Web-app membaca/menulis Firestore lewat abstraksi tunggal.

- `useSnowberryData()` — hook utama dipakai `App.tsx`.
- Firebase dipakai jika env terisi (`VITE_FIREBASE_*`), selain itu **mock**.
- `firebaseDataSource.ts` dimuat lazy (code-split), jadi mode mock tidak
  menarik SDK Firebase.

## Aktifkan Firebase
1. `npm install firebase` (butuh internet).
2. Salin `web-app/.env.example` -> `web-app/.env.local`, isi dari Firebase Console.
3. Jalankan `npm run dev`. Header akan memakai data realtime Firestore.

## Path (ikuti api-contract.md)
- Baca: `status/realtime`, `config/thresholds`, `telemetry/{YYYY-MM-DD}`
- Tulis: `config/thresholds`, `config/commands`

JANGAN commit `.env.local` atau secret Firebase.
