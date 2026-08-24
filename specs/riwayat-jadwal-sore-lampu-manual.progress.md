# Progress Ledger — riwayat-jadwal-sore-lampu-manual

Status akhir: SEMUA REQ PASS (iterasi 1 dari budget 3; reviewer independen verdict PASS semua setelah 1 must-fix diperbaiki).

- [x] REQ-1: Firmware menulis telemetry | PASS — appendTelemetry buffer 10 + commit arrayUnion (firebase_sync.cpp), format api-contract §5 (status_json.cpp), wired 60 s (network_worker.cpp); guard truncation CAP=320.
- [x] REQ-2: Web riwayat fluktuasi + harian | PASS — downsample.ts bands min/max/avg; MetricChart polygon .chart-band; HistoryPage "Riwayat Harian"; npm run check 39 assertions; npm run build sukses.
- [x] REQ-3: Pompa auto hanya 15–18 WIB | PASS — control.cpp gate + WATER_WINDOW_WAIT; test_control 5 kasus; simulator contract.js window sore.
- [x] REQ-4: Lampu auto hanya 18–20 WIB | PASS — validate() lock 18/20; growlight PHOTOPERIOD_LIMIT di luar jendela; defaults seed/mock/simulator 18/20/2; test_control 6 kasus.
- [x] REQ-5: Manual mode instan | PASS — fetchCommand dedupe + TLS persisten + poll 2 s (firmware & simulator); publishAck masked; full status via buildStatus; REWATER 90 s fix; sending-note pulse.

## Bukti verifikasi (exit code)
- bash firmware/test/run_host_tests.sh → exit 0, ALL PASSED ×2, FAIL 0
- pio run -e esp32dev → exit 0
- cd web-app && npm run check → 4 file lulus (8+10+9+12 assertions)
- cd web-app && npm run build → sukses
- node simulator/index.js --check → lulus

## Review independen (subagent, konteks baru)
- Verdict REQ-1..REQ-5: PASS semua.
- Must-fix ditemukan & diperbaiki: simulator growlight window melonggar saat NTP mati → kini timeSynced wajib (contract.js).
- Minor ikut diperbaiki: ack pompa manual kini cek kesegaran soil ≤15 s (network_worker.cpp).
- Minor notes ditutup tanpa perubahan (dokumentasi): dedupe command RAM-only setelah reboot; publishAck menunggu NTP; web belum merender field reason; hari kosong pakai empty-state global; asumsi bands.length==values.length pada caller saat ini; simulator telemetry read-modify-write (demo-only).

## Limitasi diketahui (di luar scope iterasi ini)
- status_json::writeActuator masih menulis mode "AUTO" statis — saran lanjutan: modeOf(key) turunan reasonOf==MANUAL_OVERRIDE.
- Firmware belum mengirim ack EXPIRED (ditangani kontrol lokal sebagai fault).
