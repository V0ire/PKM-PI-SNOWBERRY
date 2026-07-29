# Snowberry — Firmware ESP32 (local-first)

Kontrol utama ada di ESP32. WiFi/Firebase hanya untuk monitoring, pengaturan,
dan, setelah device auth diprovisikan, Kontrol Manual Sementara. Build ini
menolak operasi Firestore tanpa auth. Jika WiFi/Firebase mati, ESP32 tetap bekerja
memakai threshold terakhir di NVS.

Sumber kebenaran Rev B:
- Pin & fail-safe: `docs/07-finalization/HARDWARE_FIRMWARE_CONTRACT.md`
- Kontrak data: `docs/03-technical/api-contract.md`

## Struktur
- `include/config.h` — pin map, polaritas, timing (dari wiring-schematic).
- `include/types.h` — Thresholds, SensorReading, ActuatorState, Fault.
- `src/actuators.cpp` — safe-state boot (menulis OFF level sebelum pinMode), polaritas HIGH/LOW, min ON/OFF time.
- `src/control.cpp` — logika inti (bang-bang + hysteresis + pulse/soak).
- `src/sensors.cpp` — SHT30, BH1750, soil ADC, freshness/stuck checks, I2C recovery.
- `src/storage.cpp` — NVS threshold, kalibrasi soil, pump budget, boot count.
- `src/status_json.cpp` — builder JSON status/telemetry (kontrak Firestore).
- `include/firebase_sync.h` — seam integrasi Firebase (non-blocking).
- `src/main.cpp` — orkestrasi loop.

## Decision Priority (control::step)
1. Boot safe-state (semua aktuator OFF sebelum WiFi/Firebase/sensor)
2. Fault / hardware safety OFF
3. Sensor invalid safety OFF
4. Manual override valid & aman (hard-safety tetap menang)
5. Auto control lokal
6. Default OFF

## Logika kontrol
- **Humidifier**: RH <= rh_low menyalakan mist 1, fan 1, mist 2, fan 2 bersama.
  RH >= rh_high mematikan semua; invalid/stale RH selalu mematikan semua.
- **Pump**: pulse 10 detik + soak 10 menit. Maksimal dua start per rolling lima jam,
  termasuk request manual; reservasi disimpan sebelum GPIO17 ON. Fault jujur:
  `PUMP_NO_EFFECT` (periksa air/selang/nozzle/sensor — TIDAK klaim relay),
  `PUMP_MAX_CYCLE_REACHED`. Pump OFF jika soil invalid / belum kalibrasi.
- **Growlight**: lux < lux_low DAN waktu sinkron, dalam light_window, DAN belum lewat
  max_light_hours_per_day. Cegah "hari panjang" tak sengaja (photoperiod).
  Jika lux invalid/stale atau waktu belum sinkron: selalu OFF.

## Kalibrasi soil
GPIO33 calibration entry disabled in field build so held/shorted button cannot
block safety control. Provision calibration through controlled service build.
Calibration helper retains two-minute stage deadlines. Nilai `adc_dry`/`adc_wet` disimpan ke NVS.
Sebelum kalibrasi ada, soil dianggap invalid dan pump AUTO OFF.

## Uji di host (tanpa hardware)
```
bash firmware/test/run_host_tests.sh
```
Menguji logika kontrol & timing manual (27 cek), urutan boot safe-state (1 cek), dan builder JSON kontrak (11 cek) memakai
mock Arduino layer.

## Build ke ESP32
```
pio run                 # butuh PlatformIO + koneksi internet untuk lib
pio run -t upload
pio device monitor
```

## Integrasi Firebase
Field build saat ini sengaja menonaktifkan remote Firestore sampai akun device
terautentikasi tersedia. Wi-Fi/NTP tetap non-blocking; kontrol lokal tetap aktif.
`include/firebase_sync.h` adalah seam provisioning berikut:
- Login device (email/password khusus device, credential dari NVS — bukan hardcode).
- `fetchThresholds` -> validasi -> simpan NVS.
- `publishStatus` (status_json) tiap ~60s / saat perubahan.
- `pollCommand` tiap ~10s -> isi control::ManualCommand -> `publishAck`.
- `appendTelemetry` -> flush 1 dokumen/hari.
Tidak ada HTTPS/TLS sinkron di safety loop.

## Catatan hardware
- GPIO35 tidak digunakan pada Rev B.
- Semua output Rev B GPIO16,25,17,18,19,23,32 aktif-HIGH dan diinisialisasi LOW.
- Tidak pakai RTC; growlight fail-OFF sampai NTP sinkron.
