# Snowberry — Firebase

Kontrak data: `docs/03-technical/api-contract.md`. Jangan pakai path di luar kontrak.

## Struktur
- `firestore.rules` — aturan akses: user web vs device writer.
- `seed.example.json` — contoh dokumen awal (impor manual, ganti UID/deviceId).

## Path resmi
- `devices/{deviceId}/status/realtime` — ditulis device, dibaca web.
- `devices/{deviceId}/config/thresholds` — ditulis web, dibaca device.
- `devices/{deviceId}/config/commands` — ditulis web, dibaca device.
- `devices/{deviceId}/telemetry/{YYYY-MM-DD}` — ditulis device, dibaca web.
- `users/{uid}` — kepemilikan device.

## Auth MVP
- User web: Firebase Auth biasa. `users/{uid}.devices` = daftar deviceId miliknya.
- Device ESP32: akun Firebase Auth email/password khusus device.
  - `users/{uid}.role = "device"`, `users/{uid}.deviceId = "<deviceId>"`.
  - Credential device DISIMPAN DI NVS saat provisioning. JANGAN commit ke repo.
- Production nanti: custom token / provisioning backend.

## Budget Spark (1 device)
- status write ~60s, telemetry write ~60s, command poll ~10s, threshold poll ~60s.
- Telemetry: 1 dokumen per hari (`samples[]`), bukan 1 dokumen per sensor.

## Deploy rules
```
firebase deploy --only firestore:rules
```

## Jangan
- Jangan simpan API key/secret device di repo.
- Jangan pakai koleksi `sensorLog` atau 1 dokumen per sensor per menit.
