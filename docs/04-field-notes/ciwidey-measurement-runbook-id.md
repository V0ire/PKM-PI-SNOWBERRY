# Runbook Pengukuran Lapangan Ciwidey — Snowberry

Gunakan dokumen ini di lokasi. Ikuti urutan. Jangan lompat kecuali bagian sudah lulus.

## Tujuan Hari Ini

Mengambil data baseline dan data layout lapangan untuk desain Snowberry:

- suhu udara
- kelembapan udara
- cahaya/lux
- raw ADC soil moisture
- posisi box IoT
- posisi sensor
- posisi alat
- panjang kabel mengikuti rute asli
- catatan foto dan risiko lokasi

Firmware yang dipakai adalah **measurement mode**, bukan firmware kontrol final.

Measurement mode:

- membaca SHT30, BH1750, soil sensor
- menjaga semua aktuator OFF
- menyediakan API lokal dari ESP32
- web-app laptop/HP membaca API itu
- data tersimpan lokal di browser + bisa export JSON
- tidak pakai Firebase

---

## Arsitektur yang Dipakai

```text
Router WiFi/LAN MIMIN
├─ PC/Laptop: menjalankan web-app Vite di port 5173
├─ HP: membuka web-app dari browser
└─ ESP32: connect ke WiFi MIMIN, menyediakan API HTTP lokal
```

Alur data:

```text
ESP32 sensor-only
  └─ GET /api/live
       ↓
Web-app halaman Ukur
  ├─ tampilkan data live
  ├─ tombol Simpan Pengukuran
  ├─ simpan ke localStorage browser
  ├─ kirim salinan ke RAM ESP32
  └─ export JSON sebelum pulang
```

Data utama ada di browser. ESP32 RAM hanya backup kedua. Jika ESP32 mati, export lokal browser tetap aman selama browser tidak dihapus.

---

## Aturan Keamanan

- Jangan wiring final 220VAC di lokasi.
- Jangan sambungkan growlight AC ke SSR saat sesi pengukuran.
- Jangan jalankan pompa, mist disc, fan, atau growlight otomatis.
- ESP32 measurement mode harus tetap membuat semua aktuator OFF.
- Jauhkan ESP32, breadboard, laptop, dan power bank dari air/kabut.
- Sensor boleh masuk media; modul elektronik sensor jangan sampai terendam.
- Untuk soil sensor, ukur raw ADC dulu. Persen soil belum valid sebelum kalibrasi wet/dry.

---

## Barang yang Harus Dibawa

### Elektronik

- [ ] ESP32 DevKit
- [ ] SHT30
- [ ] BH1750/GY-302
- [ ] Capacitive Soil Moisture Sensor V2.0
- [ ] Breadboard
- [ ] Kabel jumper cadangan
- [ ] Kabel USB data untuk ESP32
- [ ] Laptop
- [ ] Charger laptop
- [ ] Power bank
- [ ] Plastik/box pelindung elektronik

### Alat Lapangan

- [ ] Meteran 5-10 m
- [ ] Multimeter
- [ ] HP untuk foto
- [ ] Masking tape / lakban kertas
- [ ] Spidol
- [ ] Label/stiker kecil
- [ ] Cable ties
- [ ] Buku catatan atau print checklist

### File yang Dibuka

- [ ] `docs/04-field-notes/ciwidey-measurement-checklist-id.md`
- [ ] `docs/04-field-notes/ciwidey-task-and-iot-assembly-guide.md`
- [ ] dokumen ini

---

## Sebelum Berangkat

### 1. Pastikan Firmware Measurement Build

Di laptop:

```bash
cd "/home/caradhina/Project/PKM real/firmware"
pio run -e measurement
```

Harus keluar:

```text
[SUCCESS]
```

### 2. Pastikan Konfigurasi WiFi Lokal

Measurement firmware membaca file lokal yang tidak masuk git:

```text
firmware/include/measurement_config.local.h
```

Isi harus sesuai WiFi lokasi. Untuk sesi router sekarang:

```text
MEASUREMENT_WIFI_SSID = "MIMIN"
MEASUREMENT_WIFI_PASSWORD = disimpan di file lokal ignored
```

Jangan tulis password ke dokumen tracked.

### 3. Upload Firmware ke ESP32

Colok ESP32 ke laptop.

```bash
cd "/home/caradhina/Project/PKM real/firmware"
pio run -e measurement -t upload
```

Jika upload gagal, coba port eksplisit:

```bash
pio device list
pio run -e measurement -t upload --upload-port /dev/ttyUSB0
```

Jika stuck di `Connecting.....`:

1. tahan tombol `BOOT`
2. jalankan upload
3. lepas `BOOT` setelah chip terdeteksi

### 4. Buka Serial Monitor

```bash
pio device monitor --baud 115200
```

Tekan tombol `EN/RESET` ESP32.

Harus terlihat:

```text
[boot] Semua aktuator OFF (safe-state).
[boot] Masuk mode pengukuran: aktuator tetap OFF, API lokal aktif.
[measurement] Connecting WiFi SSID=MIMIN
[measurement] Open API from laptop/phone: http://192.168.x.x/
```

Catat URL ESP32:

```text
URL API ESP32 = http://________________
```

### 5. Jalankan Web-App

Terminal baru:

```bash
cd "/home/caradhina/Project/PKM real/web-app"
npm run dev
```

Output biasanya:

```text
Local:   http://localhost:5173/
Network: http://192.168.x.y:5173/
```

Catat URL web-app network:

```text
URL Web-App = http://________________:5173
```

Jika tidak muncul network IP, cari IP laptop:

```bash
hostname -I
```

Gunakan IP yang satu jaringan dengan ESP32.

---

## Wiring Sensor

### I2C SHT30 + BH1750 Daisy Chain

I2C boleh dipakai bersama. Semua SDA gabung, semua SCL gabung.

```text
ESP32 3V3    → SHT30 VCC  → BH1750 VCC
ESP32 GND    → SHT30 GND  → BH1750 GND
ESP32 GPIO21 → SHT30 SDA  → BH1750 SDA
ESP32 GPIO22 → SHT30 SCL  → BH1750 SCL
```

Jika BH1750 punya pin `ADDR`:

```text
BH1750 ADDR → GND
```

Alamat sensor:

```text
SHT30  = 0x44
BH1750 = 0x23
```

### Soil Sensor

```text
ESP32 3V3    → Soil VCC
ESP32 GND    → Soil GND
ESP32 GPIO34 → Soil AO/AOUT/SIG
```

Gunakan pin analog `AO/AOUT/SIG`, bukan `DO`.

### Pin yang Tidak Dipakai Saat Measurement

Tetap OFF, jangan sambung ke beban final:

```text
GPIO16 = growlight SSR
GPIO17 = pump relay
GPIO18 = mist relay
GPIO19 = fan relay
GPIO25 = spare SSR
```

---

## Tes Sensor Sebelum Ukur

Lihat Serial Monitor.

Contoh sehat:

```text
[40s] T=27.4 RH=54.7 Lux=56 Soil=0.0(3284) PSU=0.00 | GL=0 P=0 M=0 F=0 | fault=SOIL_CALIBRATION_MISSING
```

Arti:

- `T=27.4` suhu OK
- `RH=54.7` kelembapan OK
- `Lux=56` sensor cahaya OK
- `Soil=0.0(3284)` raw ADC soil = `3284`
- `SOIL_CALIBRATION_MISSING` normal sebelum kalibrasi wet/dry
- `GL=0 P=0 M=0 F=0` semua aktuator OFF

### Jika `fault=I2C_BUS_STUCK`

SHT30/BH1750 gagal. Cek:

```text
GPIO21 = SDA
GPIO22 = SCL
3V3 = VCC
GND = GND
```

Tes satu sensor dulu:

1. cabut BH1750, sisakan SHT30
2. reboot
3. jika suhu/RH muncul, tambah BH1750 lagi

### Jika `Soil=0.0(raw)`

Tidak masalah. Pakai raw ADC dalam kurung.

Contoh:

```text
Soil=0.0(3284)
```

Data yang dicatat:

```text
soil_raw_adc = 3284
```

### Jika PSU Aneh

Contoh:

```text
PSU=0.00
PSU=2.87
PSU=6.55
```

Abaikan jika voltage divider GPIO35 belum dipasang.

---

## Buka Halaman Ukur

### Dari Laptop

Buka:

```text
http://localhost:5173
```

Klik tab:

```text
Ukur
```

### Dari HP

Pastikan HP ada di WiFi/router yang sama.

Buka URL network dari Vite:

```text
http://<IP-LAPTOP>:5173
```

Contoh:

```text
http://192.168.1.20:5173
```

Di halaman `Ukur`, isi field:

```text
URL API ESP32 = http://<IP-ESP32>
```

Contoh:

```text
http://192.168.1.31
```

Jika benar, kartu live akan tampil:

```text
Suhu
Udara
Cahaya
Soil ADC
```

---

## Tes API ESP32 Manual

Di browser, buka:

```text
http://<IP-ESP32>/api/live
```

Contoh:

```text
http://192.168.1.31/api/live
```

Harus keluar JSON:

```json
{
  "ok": true,
  "measurement_mode": true,
  "readings": {
    "temperature_c": 27.4,
    "humidity_pct": 54.7,
    "lux": 56,
    "soil_raw_adc": 3284
  }
}
```

Jika tidak bisa dibuka:

- laptop/HP tidak satu jaringan dengan ESP32
- ESP32 belum connect WiFi
- IP salah
- router mengisolasi client WiFi
- firewall laptop menghalangi web-app ke ESP32

---

## Urutan Pengukuran di Lokasi

### Fase 1 — Foto dan Sketsa Awal

- [ ] Foto pintu masuk greenhouse
- [ ] Foto seluruh panjang greenhouse
- [ ] Foto bed tanaman
- [ ] Foto area listrik
- [ ] Foto area air/reservoir
- [ ] Foto kandidat box IoT
- [ ] Buat sketsa kasar tampak atas

Catat:

```text
Panjang greenhouse = ____ m
Lebar greenhouse   = ____ m
Tinggi greenhouse  = ____ m
Jumlah bed         = ____
Lebar jalan        = ____ m
```

### Fase 2 — Tentukan Titik Referensi Box IoT

Pilih lokasi sementara box IoT.

Syarat:

- kering
- mudah dijangkau
- dekat power
- tidak kena kabut
- tidak mengganggu pekerja
- sinyal WiFi cukup

Tandai dengan tape:

```text
BOX IOT
```

Semua panjang kabel diukur dari titik ini.

### Fase 3 — Pengukuran Udara

Di halaman `Ukur`, pilih titik:

```text
A1 Luar greenhouse
A2 Dekat pintu masuk
A3 Tengah bed tanaman
A4 Sisi bed kiri/kanan
A5 Area paling panas
A6 Area paling lembap
```

Untuk setiap titik:

1. taruh SHT30 di tinggi kanopi tanaman
2. tunggu 1-3 menit
3. isi tinggi sensor
4. isi nomor foto
5. isi catatan kondisi
6. tekan `Simpan Pengukuran`
7. pastikan muncul di daftar data tersimpan

Catatan penting:

- jangan pegang sensor terlalu dekat dengan tangan lama-lama
- jangan tiup sensor
- jangan letakkan sensor kena air langsung

### Fase 4 — Pengukuran Cahaya

Di halaman `Ukur`, pilih:

```text
L1 Cahaya luar greenhouse
L2 Cahaya tengah bed
L3 Area tanaman tergelap
L4 Area kandidat growlight
```

Untuk setiap titik:

1. arahkan BH1750 ke atas
2. posisikan di tinggi kanopi tanaman
3. catat cuaca: cerah/mendung/hujan
4. isi tinggi sensor
5. isi nomor foto
6. tekan `Simpan Pengukuran`

Catatan:

- lux berubah cepat karena awan
- tulis waktu dan cuaca di catatan

### Fase 5 — Pengukuran Soil Raw ADC

Di halaman `Ukur`, pilih:

```text
S1 Media sangat basah
S2 Media normal lapangan
S3 Media kering jika tersedia
```

Untuk setiap sampel:

1. masukkan probe soil sensor ke media
2. kedalaman harus konsisten
3. tunggu angka ADC stabil
4. catat kondisi media di catatan
5. isi nomor foto
6. tekan `Simpan Pengukuran`

Yang dipakai:

```text
soil_raw_adc
```

Bukan persen soil.

Contoh catatan:

```text
Sensor masuk 5 cm, media normal dekat tanaman tengah bed, tidak baru disiram.
```

### Fase 6 — Pengukuran Kabel

Pakai titik referensi `BOX IOT`.

Di halaman `Ukur`, pilih titik kabel:

```text
P1 Sumber listrik ke box IoT
C1 Box IoT ke SHT30/BH1750
C2 Box IoT ke soil sensor
C3 Box IoT ke pompa
C4 Box IoT ke mist disc
C5 Box IoT ke kipas
C6 Box IoT ke growlight
```

Untuk setiap rute:

1. ukur rute kabel sebenarnya, bukan garis lurus
2. ikuti dinding/frame/jalur aman
3. masukkan panjang di field `Panjang kabel (m)`
4. tambah catatan rute dan risiko
5. foto rute jika penting
6. tekan `Simpan Pengukuran`

Rumus setelah pulang:

```text
panjang final = rute terukur + 20-30% slack + service loop
```

Patokan slack:

```text
sensor cable   +0.3 sampai 0.5 m
actuator cable +0.5 sampai 1.0 m
power cable    +1.0 m jika rute belum pasti
```

---

## Export Data Sebelum Pulang

Ini wajib.

Di halaman `Ukur`:

1. scroll ke `Data Tersimpan`
2. cek jumlah data
3. tekan `Export JSON Lokal`
4. simpan file
5. kirim file ke diri sendiri jika bisa: Telegram/WhatsApp/Drive/email

Nama file default:

```text
snowberry-ciwidey-measurements.json
```

Backup tambahan:

- [ ] screenshot halaman data tersimpan
- [ ] foto checklist kertas jika ada
- [ ] folder foto jangan dihapus

Jangan matikan laptop/HP sebelum export berhasil.

---

## Setelah Pulang

Simpan hasil ke folder project:

```text
field-data/ciwidey-YYYY-MM-DD/
├─ snowberry-ciwidey-measurements.json
├─ photos/
└─ sketch.jpg
```

Lalu buat ringkasan:

```text
wet ADC = ____
dry ADC = ____
normal ADC range = ____ sampai ____
RH range = ____ sampai ____
temperature range = ____ sampai ____
lux range = ____ sampai ____
longest cable route = ____ m
biggest risk = ____
```

Baru setelah itu desain EasyEDA/PCB.

---

## Troubleshooting Cepat

### Upload gagal setelah `Changing baud rate`

Penyebab umum: upload speed terlalu tinggi. Measurement env sudah diset 115200.

Coba:

```bash
pio run -e measurement -t upload --upload-port /dev/ttyUSB0
```

### Permission denied `/dev/ttyUSB0`

Sementara:

```bash
sudo chmod a+rw /dev/ttyUSB0
```

Permanen:

```bash
sudo usermod -aG uucp,dialout "$USER"
```

Logout/login setelah itu.

### ESP32 tidak connect WiFi

Cek Serial Monitor:

```text
[measurement] Retrying WiFi...
```

Solusi:

- pastikan SSID benar
- pastikan password di `measurement_config.local.h` benar
- pastikan router 2.4GHz aktif
- ESP32 biasanya tidak bisa 5GHz
- dekatkan ESP32 ke router

### HP tidak bisa buka web-app

Cek:

- HP dan laptop satu router
- pakai URL `Network` dari Vite, bukan `localhost`
- firewall laptop tidak blokir port 5173
- coba buka dari laptop dulu

### Web-app tidak bisa baca ESP32

Cek:

- field `URL API ESP32` sudah `http://IP-ESP32`
- jangan pakai `https`
- buka `http://IP-ESP32/api/live` manual
- PC/HP dan ESP32 harus satu jaringan

### Sensor suhu/cahaya 0 semua

Kemungkinan I2C salah.

Cek:

```text
GPIO21 → SDA
GPIO22 → SCL
3V3 → VCC
GND → GND
```

Tes SHT30 sendiri dulu, lalu tambah BH1750.

### Soil percent 0 tapi raw ADC ada

Normal sebelum kalibrasi.

Pakai angka dalam kurung / `soil_raw_adc`.

### `fault=SOIL_CALIBRATION_MISSING`

Normal untuk baseline. Bukan blocker.

### `PSU=0.00` atau aneh

Abaikan jika voltage divider GPIO35 belum dipasang.

### Data sudah disimpan tapi sync ESP32 gagal

Tidak masalah. Data lokal browser tetap aman.

Tetap export JSON lokal sebelum pulang.

---

## Checklist Akhir Sebelum Pulang

- [ ] Semua titik A selesai
- [ ] Semua titik L selesai
- [ ] Semua titik S selesai
- [ ] Semua titik kabel penting selesai
- [ ] Foto tiap lokasi penting ada
- [ ] Sketsa greenhouse ada
- [ ] JSON lokal sudah export
- [ ] File JSON sudah dibackup ke HP/cloud/chat
- [ ] ESP32/laptop baru dimatikan setelah export

Jika hanya satu hal yang harus diingat:

```text
Export JSON sebelum pulang.
```
