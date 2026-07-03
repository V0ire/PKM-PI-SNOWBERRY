# Snowberry — Firmware ESP32 (local-first)

Kontrol utama ada di ESP32. WiFi/Firebase hanya untuk monitoring, pengaturan,
dan Kontrol Manual Sementara. Jika WiFi/Firebase mati, ESP32 tetap bekerja
memakai threshold terakhir di NVS.

Sumber kebenaran:
- Pin & fail-safe: `docs/03-technical/wiring-schematic.md`
- Kontrak data: `docs/03-technical/api-contract.md`

## Struktur
- `include/config.h` — pin map, polaritas, timing (dari wiring-schematic).
- `include/types.h` — Thresholds, SensorReading, ActuatorState, Fault.
- `src/actuators.cpp` — safe-state boot (menulis OFF level sebelum pinMode), polaritas HIGH/LOW, min ON/OFF time.
- `src/control.cpp` — logika inti (bang-bang + hysteresis + pulse/soak).
- `src/sensors.cpp` — SHT30, BH1750, soil ADC, PSU divider, I2C recovery.
- `src/storage.cpp` — NVS threshold + kalibrasi soil.
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
- **Fan**: ON jika suhu >= temp_high ATAU RH >= rh_high. OFF saat suhu & RH turun
  di bawah ambang atas (histeresis), bukan menunggu temp_low/rh_low.
- **Mist**: ON saat RH <= rh_low. OFF saat RH naik / RH tinggi / fault.
- **Konflik fan-mist**: RH tinggi -> mist OFF, fan ON. RH rendah + suhu tinggi ->
  suhu prioritas: fan ON, mist ditahan (fan mempercepat penguapan).
- **Pump**: pulse (pump_pulse_ms) + soak (soak_period_ms). Batas per jam
  (max_pump_cycles_per_hour, max_total_pump_on_ms_per_hour). Fault jujur:
  `PUMP_NO_EFFECT` (periksa air/selang/nozzle/sensor — TIDAK klaim relay),
  `PUMP_MAX_CYCLE_REACHED`. Pump OFF jika soil invalid / belum kalibrasi.
- **Growlight**: lux < lux_low DAN dalam light_window DAN belum lewat
  max_light_hours_per_day. Cegah "hari panjang" tak sengaja (photoperiod).
  Jika waktu belum sinkron: mode konservatif (tidak agresif menambah jam terang).

## Kalibrasi soil
Tahan tombol (GPIO 4) saat boot atau tekan saat runtime:
kering -> tekan, basahi -> tekan. Nilai `adc_dry`/`adc_wet` disimpan ke NVS.
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

## Integrasi Firebase (tahap deploy)
`include/firebase_sync.h` adalah seam yang harus diimplementasi saat deploy:
- Login device (email/password khusus device, credential dari NVS — bukan hardcode).
- `fetchThresholds` -> validasi -> simpan NVS.
- `publishStatus` (status_json) tiap ~60s / saat perubahan.
- `pollCommand` tiap ~10s -> isi control::ManualCommand -> `publishAck`.
- `appendTelemetry` -> flush 1 dokumen/hari.
Semua non-blocking; kegagalan jaringan tidak menghentikan control loop.

## Catatan hardware
- Voltage divider 12V rail 30k+10k + clamp 1N4148 sudah aman (wiring §C.4).
- Tidak ada monitor rail 24V; tidak pakai RTC (photoperiod pakai NTP + fallback).
