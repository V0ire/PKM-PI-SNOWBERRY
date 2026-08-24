# Spec: Riwayat Harian + Jadwal Siram Sore + Lampu Malam + Manual Responsif

Tanggal: 2026-08-24 · Iteration budget: 3 loop build→review · Prioritas: REQ-1 > lainnya

## Objective

1. Riwayat harian benar-benar ada (firmware menulis telemetry) dan menampilkan fluktuasi (min–max), bukan hanya rata-rata.
2. Penyiraman otomatis HANYA pada jendela sore 15:00–18:00 WIB.
3. Lampu tanam otomatis HANYA 18:00–20:00 WIB.
4. Kontrol Manual Sementara terasa instan (round trip ≤ ~3 detik, feedback UI langsung).

Sumber kebenaran: docs/03-technical/api-contract.md (schema), docs/03-technical/wiring-schematic.md (safety),
UI ikut DESIGN-starbucks.md + istilah petani. Kontrol lokal ESP32 tetap sumber utama; cloud mati ≠ kontrol mati.

## Keputusan produk (dikonfirmasi user)

- Scope riwayat: firmware + web-app.
- Jendela siram sore: 15:00–18:00 WIB. Di luar jam: tunggu sore; Kontrol Manual tetap boleh kapan saja.
- Tampilan fluktuasi: grafik pita min–max + ringkasan harian (terendah/tertinggi/rata-rata).
- Lampu: 18:00–20:00 WIB; manual override tetap boleh kapan saja.

## Requirements

### REQ-1 — Firmware menulis telemetry (PRIORITAS TERTINGGI)
- Implementasi `fbsync::appendTelemetry(sampleJson, nowMs)` (sekarang stub kosong di
  `firmware/src/firebase_sync.cpp:170`) + wiring pemanggil di network task.
- Buffer RAM ring maksimum 10 sample; flush tiap 60 s saat WiFi+auth+waktu-NTP valid.
- Path: `devices/{deviceId}/telemetry/{YYYY-MM-DD}` — tanggal WIB (configTime UTC+7 sudah ada).
- Format sample PERSIS api-contract §5: `{"t":num,"h":num,"l":num,"s":num,"gl":bool,"p":bool,"m":bool,"f":bool,"ts":epochMs}`.
  `status_json::buildTelemetrySample` diganti ke format ini (signature pakai epochMs, bukan hhmm);
  `test_json.cpp` di-update.
- Append atomik via Firestore REST `documents:commit` + transform `appendMissingElements` (arrayUnion)
  + update masked `[device_id,date]` agar dokumen harian tercipta tanpa menimpa array `d`.
  Payload per flush kecil (bukan kirim ulang seluruh array).
- Sample dilewati (gap jujur) bila ada sensor invalid (`temp/rh/lux/soil_valid` false).
- Non-blocking: semua HTTP di network task; kontrol lokal tidak boleh terganggu; offline → skip, tanpa crash.
- Edge: rollover tanggal WIB otomatis (hitung date string tiap flush); auth token refresh dipakai ulang.

### REQ-2 — Web riwayat harian + fluktuasi
- `downsample.ts`: bucket menghasilkan min/max/avg per metrik (t,h,l,s) + majority boolean; type baru untuk bucket.
- `MetricChart`: gambar pita min–max (area) + garis rata-rata; 1 titik dalam bucket → min=max=avg.
- `HistoryPage`: section "Riwayat Harian" — per hari (7d/30d) tampil terendah/tertinggi/rata-rata
  suhu, udara, media, cahaya dalam Bahasa Indonesia petani; Hari Ini juga punya ringkasan serupa.
- Istilah wajib: Batas Otomatis, dsb. (snowberry-ui-petani). Gaya visual DESIGN-starbucks.
- `npm run check` (3 file .check.ts) tetap lulus; ditambah kasus min/max.

### REQ-3 — Penyiraman otomatis hanya sore (15–18 WIB)
- `config.h`: `WATER_WINDOW_START_HOUR=15`, `WATER_WINDOW_END_HOUR=18`.
- `control.cpp::pump()`: auto start HANYA bila `time.synced && hour∈[15,18)`.
  Di luar jendela dengan soil rendah → pompa OFF, reason baru `WATER_WINDOW_WAIT`
  ("menunggu_jadwal_siram", pesan Indonesia: menunggu jadwal siram sore).
- Pulse yang sedang berjalan diselesaikan (tidak dipotong di tengah pulse); siklus BARU tidak dimulai di luar jendela.
- Manual pompa tetap jalan kapan saja (jalur existing, termasuk REWATER). Tanpa NTP → tidak ada auto siram.
- `simulator/contract.js::evaluateAuto`: pump auto hanya bila hour∈[15,18).
- `test_control.cpp`: kasus luar-window/dalam-window/tanpa-sync/manual-luar-window.

### REQ-4 — Lampu tanam hanya 18:00–20:00 WIB
- `types.h` default: `light_window_start=18`, `light_window_end=20`, `max_light_hours_per_day=2`.
- `control.cpp::validate()`: kunci window ke 18/20 (immutable, pola sama seperti pump params).
- `control.cpp::growlight()`: auto ON/OFF (histeresis lux) hanya dalam jendela; di luar jendela → OFF
  reason `PHOTOPERIOD_LIMIT` (string sudah ada). Manual kapan saja. Tanpa NTP → OFF (existing).
- Simulator `DEFAULT_THRESHOLDS`: light_window 18→20, max_light_hours_per_day=2.
- `firebase/seed.example.json` + `web-app/src/data/mockSnowberry.ts`: light_window 18/20.
- `test_control.cpp`: kasus jendela.

### REQ-5 — Kontrol Manual terasa instan
Fakta: firmware snapshot ini TIDAK PERNAH membaca `config/commands` (manual_control::submit tanpa pemanggil);
simulator polling 10 s + TLS handshake baru tiap request → lambat.
- Firmware: implementasi fetch command di network task tiap 2 s (`COMMAND_POLL_MS=2000`),
  koneksi TLS persisten keep-alive ke firestore.googleapis.com (reconnect saat gagal) — hindari handshake per poll.
  Parse `command_id/actuator/mode/state/manual_duration_ms/manual_until/command_type`,
  dedupe by `command_id`, dorong ke `manual_control::submit()`.
- Firmware: `publishAck(...)` diimplementasi (PATCH `command_ack` ke realtime) dan
  `updateLiveSensors` dinaikkan menjadi full-status JSON via `status_json::buildStatus`
  (sensors+actuators+device+fault+last_seen) agar kartu web & status Online hidup.
- Nama fungsi TIDAK boleh mengandung string "pollCommand" (dicek check_architecture.py) → gunakan "fetchCommand".
- Simulator: interval poll command 10 s → 2 s.
- Web: saat `pendingAck` aktif, kartu aktuator memberi feedback instan (spinner + teks jujur
  "Menghubungkan alat…"), nilai state TETAP dari device sampai ack (prinsip A4 dipertahankan).
- Target round trip tap→aksi alat ≤ ~3 s pada simulator & firmware.

## Edge cases

- Soil kering 14:59 → siklus mulai otomatis begitu masuk 15:00 (step kontrol berikutnya).
- Soil kering 17:58 → siklus terakhir boleh menyusul pulse/soak hingga selesai; tidak ada siklus baru ≥18:00.
- Lampu menyala 19:59 → dipaksa OFF pada 20:00 (reason photoperiod_limit).
- WiFi/NTP mati → auto siram & lampu tidak jalan tanpa waktu valid; manual tetap bisa; telemetry pause.
- Bucket riwayat berisi 1 titik → min=max=avg; hari tanpa data → baris "belum ada data".

## Definition of Done (checkable)

- [ ] REQ-1: kode appendTelemetry terimplementasi + dipanggil; host tests lulus; pio build lulus.
- [ ] REQ-2: pita min–max tampak pada chart 7d/30d; ringkasan harian tampil; `npm run check` + `npm run build` lulus.
- [ ] REQ-3: test host membuktikan pompa hanya auto di [15,18); simulator --check lulus.
- [ ] REQ-4: test host membuktikan lampu hanya auto di [18,20); seed/mock/simulator default 18–20.
- [ ] REQ-5: firmware fetch command 2 s + ack; simulator poll 2 s; UI feedback instan; build lulus.
- [ ] Semua verifikasi lulus (exit code 0):
      `bash firmware/test/run_host_tests.sh`
      `pio run -e esp32dev`
      `cd web-app && npm run build && npm run check`
      `node simulator/index.js --check`

## Verification commands

```bash
bash firmware/test/run_host_tests.sh
pio run -e esp32dev
cd web-app && npm run build && npm run check
node simulator/index.js --check
```

## Approval gates

Tidak ada deploy hosting, commit/push, migrasi data, atau penyentuhan secret.
Semua pekerjaan lokal; file kredensial (`firebase_config.local.h`, `.env.local`) tidak dibaca/diubah.
