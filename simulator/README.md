# Snowberry Device Simulator

Simulator ini meniru ESP32 terhadap kontrak `docs/03-technical/integration-contract.md` tanpa hardware.

## Setup

1. Aktifkan Firebase Auth email/password dan Firestore.
2. Buat akun device terpisah.
3. Seed Firestore:
   - `users/{device_uid}` = `{ "role": "device", "deviceId": "snowberry-001" }`
   - `users/{owner_uid}` = `{ "role": "farmer", "devices": ["snowberry-001"] }`
4. Salin `simulator/.env.example` ke `simulator/.env`, lalu isi nilainya.

## Perintah

```bash
cd simulator
npm run check
npm start -- --scenario=normal
```

Skenario tersedia:

| Scenario | Perilaku |
| --- | --- |
| `normal` | Publish status realtime, poll command 10 detik, telemetry 60 detik. |
| `offline` | Setelah 3 menit, simulator berhenti menulis 5 menit lalu resume. |
| `no-ntp` | `device.time_synced=false`, `last_seen=0`, telemetry diskip, manual expiry pakai fallback monotonic. |
| `fault-soil` | `soil_pct=null`, fault `SOIL_SENSOR_ERROR`, command pump ON ditolak. |
| `fault-psu` | `psu_voltage=9.5`, fault `PSU_VOLTAGE_LOW`. |
| `config-invalid` | Dipakai bersama threshold invalid di Firestore untuk menguji `CONFIG_INVALID`. |

## Jalur Kontrak

- Status: `devices/{deviceId}/status/realtime`
- Commands: `devices/{deviceId}/config/commands`
- Thresholds: `devices/{deviceId}/config/thresholds`
- Telemetry: `devices/{deviceId}/telemetry/{YYYY-MM-DD}` dengan array `d`

Tidak ada koleksi baru. Simulator sengaja memakai REST + `fetch` bawaan Node 18 agar tidak butuh dependency tambahan.
