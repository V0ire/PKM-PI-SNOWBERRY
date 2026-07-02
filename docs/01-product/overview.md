# Snowberry — Master Architecture (design.md)

**Status:** Final — semua item terkonfirmasi, siap lanjut ke Fase 2
**Sumber:** Project brief awal → audit hardware (verifikasi datasheet G3MB-202P & SHT3x) → Claude Opus 4.8 Phase 1 brainstorming → keputusan tim lanjutan (channel humidifier) → verifikasi beban growlight (§9)
**Dokumen terkait (Fase 2, belum dibuat):** `design-visual.md` (token visual getdesign.md/Starbucks), `prd.md`, `api-contract.md`, `ux-flow.md`, `content.md`, `device-pairing.md`

---

## 1. Ringkasan Proyek

Smart Greenhouse 4-in-1 berbasis IoT untuk budidaya Stroberi Putih (White Strawberry), PKM PI. Pendekatan Operational Technology — prioritas stabilitas mikroklimat, keamanan kelistrikan, reliabilitas jangka panjang di atas kecanggihan algoritma.

## 2. Bill of Materials (Final)

**MCU & Sensor**
- ESP32 DevkitC V4 (WROOM-32D)
- SHT30-D suhu/kelembapan (I2C) — punya heater bawaan, lihat §4
- BH1750FVI/GY-302 cahaya (I2C)
- Capacitive Soil Moisture V2.0

**Kontrol & Switching**
- SSR G3MB-202P 2ch — AC growlight. Channel 1 dipakai, channel 2 cadangan.
- Relay Hi-Lo Optocoupler 2ch — DC: pompa (ch1) + ultrasonic mist disc 24V (ch2)
- **[BARU]** Relay Hi-Lo Optocoupler 1ch — DC: kipas humidifier 12V, dedicated. Spek harus sama (opto-isolated, low-level trigger kompatibel 3.3V) — cek datasheet/listing sebelum beli, jangan asumsi semua modul generik otomatis jalan di 3.3V.
- BC547 NPN (stok) — driver koil relay DC

**Daya & Proteksi**
- LM2596 step-down adjustable + voltmeter, 3-rail 24V/12V/5V (matematika beban tervalidasi)
- Fuse holder ×2 terpisah (dikonfirmasi): 1A di jalur 24V mist-maker, 7A di jalur 12V/8A utama
- Dioda 10A10 — flyback dedicated di terminal pompa (upgrade dari 1N4007, pompa inrush 3-5A)
- Dioda 1N4148 — clamp/reverse-protection minor jalur sinyal logic (bukan flyback, arusnya cuma 200mA)
- Resistor 20kΩ+10kΩ — voltage divider monitoring rail 12V/24V via ADC spare (dikonfirmasi: fault detection "adaptor lepas")

**Konektivitas & Mekanikal**
- Terminal Screw Block 8.5mm, pin header, DC female socket 3P, spacer PCB
- Kabel NYA 0.5mm — **hanya untuk wiring sinyal/kontrol**, bukan jalur daya aktuator (butuh gauge lebih tebal, sourcing terpisah)
- Breadboard 830 & 400 point

**Stok tambahan:** Elco 470µF/25V, keramik 100nF (proteksi brownout rail 5V/3.3V), resistor 1k/4.7k/330/200Ω, KokoCoat conformal coating

---

## 3. Arsitektur Edge Device

### 3.1 Strategi Kontrol — Bang-Bang + Hysteresis (bukan PID)

Ketiga aktuator (SSR growlight, relay pompa, relay disc) adalah switching ON/OFF diskrit, bukan output kontinu — PID butuh actuation proporsional untuk sinyal error-nya berguna, kalau tidak ada, PID otomatis terdegradasi jadi bang-bang juga tapi dengan overhead tuning Kp/Ki/Kd yang sia-sia. Growlight dan pompa juga tidak punya thermal lag besar yang butuh predictive/derivative term.

**Pompa — pulsed watering, bukan bang-bang naif:** air butuh waktu meresap ke medium tanam sebelum sensor "melihat" kenaikannya. Kalau pompa nyala sampai sensor baca tinggi, berisiko overwater karena air yang sudah disalurkan belum sepenuhnya terbaca.
- Threshold bawah tersentuh → nyalakan pompa durasi tetap (30-60 detik)
- **Soak period wajib** (5-10 menit) sebelum sistem cek ulang sensor dan putuskan pulsa berikutnya
- Kritis untuk stroberi yang sensitif ke akar tergenang

### 3.2 Skema Reliabilitas

- **Watchdog:** Task Watchdog Timer (TWDT) bawaan ESP32 (`esp_task_wdt`), feed tiap iterasi loop utama. Tidak perlu IC eksternal.
- **I2C bus recovery routine:** toggle manual pin SCL beberapa kali saat startup/deteksi bus stuck — praktik OT standar untuk sensor I2C yang rawan macet di lapangan (skenario paling realistis: salah satu sensor nge-stuck menahan SDA low).
- **Fail-safe per sensor:** kalau pembacaan gagal (NACK/timeout/nilai di luar rentang fisik masuk akal) >60 detik, aktuator terkait wajib jatuh ke default OFF — terutama pompa.
- **Logging strategy:** NVS aman untuk konstanta kalibrasi (jarang ditulis, ada wear leveling internal). **Jangan** log data historis ke flash lokal terus-menerus (write cycle numpuk dalam hitungan bulan). ESP32 simpan buffer pendek di RAM (10-20 pembacaan terakhir) untuk jaga-jaga WiFi putus, flush ke cloud begitu koneksi balik.

### 3.3 Pemetaan BOM → Peran Sistem

| Komponen | Peran | Rail/Channel | Proteksi |
|---|---|---|---|
| ESP32 WROOM-32D | Otak sistem — I2C master, ADC soil, GPIO aktuator | ELCO 470µF + keramik 100nF (brownout) |
| SSR G3MB-202P ch1 | Switching AC growlight (bohlam 9W, total <100W) | AC, zero-cross | Trigger langsung GPIO (opto built-in modul); beban ≈0.45A vs rating 2A — headroom ~4.4×, lihat §9 |
| SSR G3MB-202P ch2 | Cadangan | AC | — |
| Relay Hi-Lo 2ch — ch1 | Switching pompa | 12V DC | PC817 → BC547 driver koil; flyback 10A10 |
| Relay Hi-Lo 2ch — ch2 | Switching ultrasonic mist disc | 24V DC | PC817 → BC547 driver koil |
| Relay Hi-Lo 1ch (baru) | Switching kipas humidifier | 12V DC | Opsional 1N4148 clamp (fan low-inductance, biasanya sudah ada suppression internal jika brushless) |
| Fuse 1A | Proteksi jalur 24V mist-maker | 24V | Holder terpisah #1 |
| Fuse 7A | Proteksi jalur 12V/8A utama | 12V | Holder terpisah #2 |
| Resistor 20k+10k | Voltage divider monitoring rail | ADC spare | Fault detection adaptor lepas |
| LM2596 + voltmeter | Step-down 3-rail, bantu commissioning tanpa multimeter | 24V→12V→5V | — |

---

## 4. Protokol Kalibrasi & Commissioning

**SOP kalibrasi soil sensor:**
1. Rendam sensor penuh air → rata-rata raw ADC → titik "basah" (jangan asumsikan angka pasti, ini alasan kalibrasi per unit)
2. Keringkan total, biarkan stabil → raw ADC → titik "kering"
3. Simpan `adc_wet`/`adc_dry` ke NVS (`Preferences`, namespace `"soil_cal"`)
4. Runtime: `moisture_percent = constrain(map(raw_adc, adc_dry, adc_wet, 0, 100), 0, 100)`
5. Wajib ada re-kalibrasi lapangan tanpa re-flash (hold tombol saat boot / trigger dari app)

**Tuning threshold:** semua nilai (`soil_low/high`, `lux_low/high`, `rh_low/high`, durasi pulsa & soak period) NVS-persisted, bisa diubah dari app tanpa re-flash. Fallback commissioning awal (sebelum WiFi greenhouse settle): local web config portal via ESP32 (pattern WiFiManager), diakses browser HP tanpa internet.

**Anti-kondensasi:** SHT30-D punya heater bawaan (satu keluarga chip dengan SHT31/35, beda cuma grade akurasi) — pertimbangkan heater pulse berkala sebagai opsi mengatasi kondensasi di lingkungan greenhouse lembap tinggi.

**Rentang mikroklimat ideal stroberi putih** (RH/lux/soil moisture spesifik) belum diriset — di luar cakupan brainstorming elektro murni, perlu sesi terpisah sebelum tuning lapangan final.

---

## 5. Arsitektur Firmware ESP32

**Framework:** Arduino-ESP32 (bukan raw ESP-IDF) — tetap dapat FreeRTOS task, NVS via `Preferences.h`, watchdog via `esp_task_wdt.h`, kurva belajar lebih ramah untuk timeline PKM.

**Struktur modul:**
- `main.ino` — setup()/loop(), orkestrasi, feed watchdog
- `config.h` — pin definition, default threshold fallback
- `sensors.cpp/.h` — wrapper baca BH1750/SHT30/soil + deteksi fault/timeout
- `actuators.cpp/.h` — hysteresis + min on/off + pulsed watering (`growlight_update()`, `pump_update()`, `humidifier_update()`)
- `calibration.cpp/.h` — baca/tulis NVS kalibrasi + threshold
- `network.cpp/.h` — WiFi connect/reconnect, client backend
- `failsafe.cpp/.h` — watchdog setup, stale-data detection, paksa safe-state

**Alur WiFi provisioning (pattern WiFiManager):**
1. Boot pertama / long-press reset → ESP32 AP mode, broadcast hotspot sendiri
2. HP connect ke hotspot → captive portal → pilih SSID + password greenhouse
3. Kredensial ke NVS, reboot ke STA mode
4. Gagal connect N percobaan → otomatis balik ke AP mode
5. **Prinsip inti:** control loop lokal (sensor + bang-bang) jalan independen dari status WiFi — cloud cuma untuk monitoring/remote-config, bukan dependency logic inti
6. Reset kredensial via hold tombol lama (greenhouse pindah lokasi/ganti router)

---

## 6. Arsitektur Backend & Database

**Keputusan: Firebase Firestore (Spark/free tier)**, bukan MQTT+InfluxDB+Grafana.

Kuota Spark: 20.000 write + 50.000 read/hari gratis, FCM push notification gratis unlimited. Logging tiap 1 menit (semua sensor+status digabung 1 dokumen/siklus) ≈ 1.440 write/hari — jauh di bawah limit; interval 30 detik pun masih aman.

Alasan menang vs self-host:
- Zero maintenance server (InfluxDB/Grafana/Mosquitto butuh uptime 24/7 — VPS/RPi + port forwarding, beban operasional gak match timeline tim mahasiswa)
- Android SDK native (Firebase Auth+Firestore+FCM satu ekosistem, MQTT gak punya native push, ujung-ujungnya tetap butuh FCM juga)
- Skala 1 device — keunggulan InfluxDB (time-series query banyak device) gak kepakai maksimal

Firebase baru masuk akal diganti kalau scale ke banyak unit greenhouse komersial.

---

## 7. Arsitektur Aplikasi (Web App Responsif, Petani-Friendly)

Framework belum final, arah web app responsif — kandidat stack Tailwind (selaras dengan token visual `getdesign.md`/Starbucks yang sudah dipilih untuk visual, dan konsisten dengan pola stack proyek lain di tim: vanilla JS/Tailwind/FastAPI).

**Fitur kontrol inti:**
- Dashboard live: lux, RH/suhu, soil moisture %, status ON/OFF tiap aktuator (termasuk kipas humidifier terpisah)
- Toggle **AUTO vs MANUAL** per aktuator — override manual untuk maintenance/testing, balik AUTO resume logic bang-bang
- Setting threshold dengan **guardrail UI** (min/max clamp, cegah kombinasi merusak pompa misalnya min-off-time = 0)
- Notifikasi push (FCM) untuk fault: sensor disconnect, WiFi lost
- Riwayat/grafik tren — query langsung Firestore

**UX presentasional (non-safety-critical, aman dikerjakan belakangan kalau waktu mepet):**
- Loading screen: rotasi fakta singkat budidaya stroberi putih
- Growth visualization: input tanggal tanam sekali → app hitung Hari Setelah Tanam (HST) → tampilkan fase (vegetatif/berbunga/berbuah)
- Modul edukasi: konten statis, tidak butuh backend dinamis

---

## 8. Tahapan Pembangunan

1. Breadboard sensor individual — checkpoint: 3 sensor stabil >30 menit, tanpa I2C hang
2. Breadboard driver aktuator pakai LED pengganti — checkpoint: relay/SSR klik sesuai logic dengan sensor di-force di kode
3. Breadboard full loop dengan aktuator asli (diawasi) — checkpoint: siklus auto penuh tanpa brownout/chattering, flyback+fuse terverifikasi
4. Kalibrasi & tuning threshold posisi mendekati final — checkpoint: trial run 24-48 jam tanpa false trigger
5. Hardening firmware — watchdog, fail-safe, provisioning WiFi, uji cabut router paksa
6. Desain & fabrikasi PCB — ikuti persis rangkaian breadboard tervalidasi, AC 220V tetap di modul terpisah, pesan 1-2 pcs dulu
7. Assembly & re-validasi PCB — ulangi checkpoint 1-4 di board jadi, conformal coating setelah semua tervalidasi
8. Deployment & burn-in di greenhouse asli — pantau kondensasi, korosi konektor, sinyal WiFi riil beberapa hari-minggu

---

## 9. Verifikasi Beban Growlight (Resolved)

**Konfirmasi tim:** bohlam 9W, total beban growlight di bawah 100W.

**Perhitungan:** 100W / 220VAC ≈ 0.45A. Rating SSR G3MB-202P: 2A kontinu @ 100–240VAC → headroom ~4.4× (beban aktual cuma ~23% dari rating). Bahkan dengan skenario derating terburuk dari datasheet Omron (kurangi arus setengahnya kalau ventilasi terbatas/dipasang berkelompok dengan modul relay DC di enclosure sama), kapasitas efektif masih ~1A (220W) — tetap >2× di atas beban aktual.

**Kesimpulan:** SSR ch1 aman untuk beban growlight ini, tidak perlu upgrade channel/rating. Tidak ada item terbuka lagi.

---

## 10. Log Keputusan & Asumsi Terkonfirmasi

- ✅ SSR tidak bisa switching DC (TRIAC butuh zero-crossing untuk commutate off) — AC growlight only, DC pakai relay mekanik/opto
- ✅ Flyback 10A10 upgrade tepat sasaran di terminal pompa
- ✅ PSU 3-rail 24V/12V/5V — matematika beban konsisten
- ✅ BC547+PC817 bukan redundan — khusus driver relay DC, SSR trigger langsung GPIO
- ✅ SHT30-D punya heater (satu keluarga chip dengan SHT31/35)
- ✅ Fuse holder: 2 unit terpisah (1A jalur 24V, 7A jalur 12V)
- ✅ Resistor 20k+10k: voltage divider monitoring rail, fault detection adaptor lepas
- ✅ Channel humidifier: fan (12V) dan disc (24V) **tidak** digabung 1 channel (beda rail tegangan, bukan soal kapasitas arus) — solusi final beli relay 1ch dedicated untuk fan, bukan wiring permanen
- ✅ Beban growlight: bohlam 9W, total <100W → SSR ch1 aman dengan headroom ~4.4× dari rating 2A (lihat §9)

---

## 11. Langkah Selanjutnya (Fase 2)

Semua item §9 sudah terisi — dokumen ini closed sebagai basis generate:
- `prd.md` — spesifikasi fungsional per layar
- `api-contract.md` — endpoint FastAPI/Firestore, skema payload
- `ux-flow.md` — peta navigasi & state (loading/error/offline)
- `content.md` — copy edukasi/insight botani
- `device-pairing.md` — spek handshake ESP32↔app (detail dari §5)
