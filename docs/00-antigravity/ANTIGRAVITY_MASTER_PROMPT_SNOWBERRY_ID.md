# Antigravity Master Prompt — Snowberry Smart Greenhouse

## 0. Cara Pakai Dokumen Ini

Gunakan dokumen ini sebagai prompt utama di Antigravity sebelum mulai generate aplikasi. Dokumen teknis lain tetap dipakai sebagai referensi:

- `design.md` / master architecture
- `prd.md`
- `api-contract.md`
- `ux-flow.md`
- `content.md`
- `wiring-schematic.md`

Tujuan prompt ini adalah mengarahkan Antigravity agar hasil implementasi tidak terlalu generik, tidak kebanyakan fitur, dan cocok untuk petani stroberi putih di Ciwidey yang memakai HP sebagai alat utama monitoring.

---

## 1. Identitas Proyek

**Nama produk:** Snowberry Smart Greenhouse  
**Konteks:** IoT greenhouse 4-in-1 untuk budidaya stroberi putih di Ciwidey  
**Pengguna utama:** Petani / operator greenhouse non-teknis  
**Peran aplikasi:** Monitoring, kontrol manual terbatas, tuning ambang batas, edukasi fase pertumbuhan, dan notifikasi masalah  
**Prinsip utama:** Sistem harus tetap aman dan berjalan otomatis dari ESP32 walaupun WiFi atau Firebase bermasalah.

---

## 2. Scope yang Harus Dibangun

Bangun responsive web app berbasis Firebase untuk satu unit greenhouse.

### Fitur wajib v1

1. Login dan registrasi memakai Firebase Authentication.
2. Pairing satu perangkat Snowberry dengan akun pengguna.
3. Dashboard real-time untuk:
   - Suhu udara
   - Kelembapan udara
   - Intensitas cahaya
   - Kelembapan media tanam
   - Status growlight
   - Status pompa air
   - Status mist disc / pengabut
   - Status kipas
4. Kontrol `AUTO` / `MANUAL` per aktuator.
5. Manual override maksimal 30 menit, lalu kembali otomatis ke `AUTO`.
6. Pengaturan ambang batas:
   - Suhu rendah / tinggi
   - Kelembapan rendah / tinggi
   - Kelembapan media rendah / tinggi
   - Cahaya rendah / tinggi
   - Durasi pulsa pompa
   - Jeda resap media setelah pompa menyala
   - Tanggal tanam
7. Riwayat grafik harian / mingguan / bulanan.
8. Halaman fase pertumbuhan berdasarkan HST.
9. Halaman status perangkat dan masalah.
10. Semua teks UI dalam Bahasa Indonesia.

### Fitur yang jangan dibangun di v1

- Multi-device dashboard.
- Role multi-user.
- Kamera / computer vision.
- Machine learning.
- OTA firmware update.
- Marketplace, billing, atau monetisasi.
- Integrasi sensor pH, EC, CO2.
- Sistem rekomendasi berbasis AI yang mengubah aktuator secara otomatis.

---

## 3. Prinsip UI/UX

Aplikasi ini bukan untuk engineer. Aplikasi ini untuk petani dan operator lapangan.

### Karakter UI

- Mobile-first.
- Teks jelas, tidak teknis, dan langsung menjawab kondisi greenhouse.
- Tombol besar, mudah ditekan saat di lapangan.
- Status harus terbaca cepat dengan warna, ikon, dan label.
- Jangan mengandalkan warna saja; selalu sertakan teks seperti `Aman`, `Perlu Cek`, atau `Bahaya`.
- Gunakan Bahasa Indonesia natural, bukan terjemahan kaku.

### Gaya bahasa

Gunakan istilah berikut:

| Istilah teknis | Teks UI yang dipakai |
|---|---|
| Temperature | Suhu |
| Relative Humidity | Kelembapan Udara |
| Soil Moisture | Kelembapan Media |
| Light Intensity | Cahaya |
| Growlight | Lampu Tanam |
| Water Pump | Pompa Air |
| Mist Disc | Pengabut |
| Cooling Fan | Kipas |
| Threshold | Batas Otomatis |
| Manual Override | Kontrol Manual Sementara |
| Realtime | Langsung / Terkini |
| Fault | Masalah |
| Device offline | Perangkat Tidak Terhubung |

---

## 4. Struktur Navigasi

Gunakan rute berikut:

| Rute | Nama Halaman | Fungsi |
|---|---|---|
| `/` | Pembuka | Logo, loading, fakta singkat stroberi putih |
| `/login` | Masuk | Login dan daftar akun |
| `/pair` | Hubungkan Perangkat | Pairing perangkat Snowberry pertama kali |
| `/dashboard` | Dasbor | Monitoring dan kontrol utama |
| `/thresholds` | Batas Otomatis | Ubah batas kerja otomatis |
| `/history` | Riwayat | Grafik data sensor |
| `/growth` | Fase Tanam | HST dan panduan fase pertumbuhan |
| `/profile` | Pengaturan | Akun, notifikasi, perangkat, keluar |

---

## 5. Dashboard — Spesifikasi UI

Dashboard harus menjadi halaman paling penting. Saat petani membuka aplikasi, mereka harus langsung tahu apakah greenhouse aman.

### Header dashboard

Tampilkan:

- Nama aplikasi: `Snowberry`
- Status perangkat:
  - `Terhubung` jika `last_seen` masih baru
  - `Tidak terhubung` jika `last_seen` lebih dari 5 menit
- Teks waktu update: `Diperbarui 1 menit lalu`
- Ringkasan kondisi:
  - `Semua kondisi aman`
  - `Ada kondisi yang perlu dicek`
  - `Ada masalah penting`

### Kartu sensor

Buat 4 kartu sensor:

1. Suhu
2. Kelembapan Udara
3. Cahaya
4. Kelembapan Media

Setiap kartu berisi:

- Nama sensor
- Nilai besar
- Unit
- Status:
  - `Aman`
  - `Perlu Cek`
  - `Bahaya`
- Kalimat pendek penyebab status, contoh:
  - `Suhu masih dalam batas aman.`
  - `Kelembapan terlalu tinggi, risiko jamur meningkat.`
  - `Media terlalu kering, pompa mungkin perlu menyala.`

### Kartu aktuator

Buat 4 kartu aktuator:

1. Lampu Tanam
2. Pompa Air
3. Pengabut
4. Kipas

Setiap kartu berisi:

- Nama aktuator
- Status `Menyala` atau `Mati`
- Mode `Otomatis` atau `Manual`
- Penjelasan singkat:
  - `Dikendalikan otomatis oleh sensor.`
  - `Sedang dikontrol manual sementara.`
- Tombol:
  - `Ubah ke Manual`
  - `Kembalikan ke Otomatis`
  - `Nyalakan`
  - `Matikan`
  - `Tambah 30 Menit`

---

## 6. Manual Override — UX Wajib

Manual mode harus terasa aman, bukan seperti saklar bebas.

Saat pengguna memilih manual, tampilkan modal konfirmasi.

### Modal konfirmasi

Judul:

`Aktifkan Kontrol Manual?`

Isi:

`{nama_aktuator} tidak akan mengikuti sensor sementara waktu. Mode manual akan otomatis berhenti setelah 30 menit.`

Tombol:

- `Batal`
- `Aktifkan Manual`

Setelah aktif:

- Tampilkan countdown `Sisa waktu manual: 29:45`.
- Manual mode otomatis habis pada `manual_until`.
- Sediakan tombol `Tambah 30 Menit`.
- Sediakan tombol `Kembalikan ke Otomatis`.

Jangan pernah membuat manual mode permanen.

---

## 7. Halaman Batas Otomatis

Halaman ini harus mudah dipahami. Jangan menampilkan field mentah sebagai pengalaman utama.

### Struktur halaman

Kelompokkan pengaturan berdasarkan kebutuhan petani:

1. **Udara Greenhouse**
   - Suhu minimum
   - Suhu maksimum
   - Kelembapan minimum
   - Kelembapan maksimum
2. **Media Tanam**
   - Media terlalu kering di bawah berapa persen
   - Media cukup basah di atas berapa persen
   - Lama pompa menyala sekali siram
   - Lama jeda agar air meresap
3. **Cahaya**
   - Lampu menyala jika cahaya di bawah berapa lux
   - Lampu mati jika cahaya sudah di atas berapa lux
4. **Tanaman**
   - Tanggal tanam

### Validasi wajib

- Suhu minimum harus lebih kecil dari suhu maksimum.
- Kelembapan minimum harus lebih kecil dari kelembapan maksimum.
- Kelembapan media minimum harus lebih kecil dari maksimum.
- Cahaya minimum harus lebih kecil dari maksimum.
- Lama pompa menyala tidak boleh lebih lama dari jeda resap.

### Teks tombol

- `Simpan Batas Otomatis`
- `Batal`
- `Kembalikan ke Nilai Awal`

### Toast sukses

`Batas otomatis disimpan. Perangkat akan memakai pengaturan baru setelah tersinkron.`

---

## 8. Halaman Riwayat

Tujuan halaman riwayat adalah membantu petani melihat pola, bukan membaca data mentah.

### Komponen

- Filter tanggal:
  - `Hari Ini`
  - `7 Hari`
  - `30 Hari`
- Grafik:
  - Suhu
  - Kelembapan udara
  - Cahaya
  - Kelembapan media
- Ringkasan otomatis sederhana:
  - `Suhu sering tinggi pada siang hari.`
  - `Media sering kering sebelum sore.`
  - `Kelembapan malam terlalu tinggi.`

Jangan tampilkan tabel panjang sebagai tampilan utama. Data mentah boleh menjadi bagian lanjutan atau ekspor, bukan UI utama.

---

## 9. Halaman Fase Tanam

Gunakan tanggal tanam dari Firestore `planting_date`.

Hitung HST = hari sejak tanggal tanam.

### Fase

| HST | Fase | Fokus |
|---|---|---|
| 0–30 | Vegetatif | Akar, daun, crown |
| 31–60 | Berbunga | Bunga dan penyerbukan |
| 61+ | Berbuah | Pembesaran dan kualitas buah |

### Tampilan

Tampilkan:

- `Hari ke-{n} setelah tanam`
- Nama fase
- Penjelasan singkat fase
- Target kondisi greenhouse
- Saran tindakan sederhana

Contoh copy:

`Tanaman sedang masuk fase berbunga. Jaga kelembapan agar tidak terlalu tinggi karena bunga stroberi mudah gagal terbentuk jika udara terlalu lembap.`

---

## 10. Firebase Data Contract

Gunakan struktur Firestore berikut.

### Realtime status

Path:

`devices/{deviceId}/status/realtime`

Field penting:

```json
{
  "sensors": {
    "temperature_c": 23.4,
    "humidity_pct": 67.2,
    "lux": 3450,
    "soil_pct": 55.8,
    "psu_voltage": 12.1
  },
  "actuators": {
    "growlight": { "mode": "AUTO", "state": false, "manual_until": null },
    "pump": { "mode": "AUTO", "state": false, "manual_until": null },
    "mist": { "mode": "AUTO", "state": false, "manual_until": null },
    "fan": { "mode": "AUTO", "state": false, "manual_until": null }
  },
  "device": {
    "online": true,
    "wifi_rssi": -52,
    "firmware_version": "1.0.0",
    "uptime_seconds": 86423,
    "nvs_synced": true
  },
  "fault": {
    "active_code": null,
    "active_message": null
  },
  "last_seen": 1751457540000
}
```

### Threshold config

Path:

`devices/{deviceId}/config/thresholds`

Field:

```json
{
  "temp_low": 18.0,
  "temp_high": 26.0,
  "rh_low": 60.0,
  "rh_high": 80.0,
  "soil_low": 40.0,
  "soil_high": 70.0,
  "lux_low": 2000,
  "lux_high": 5000,
  "pump_pulse_ms": 5000,
  "soak_period_ms": 60000,
  "planting_date": "2026-06-01",
  "updated_at": 1751457600000,
  "updated_by": "uid_abc123"
}
```

### Manual command

Path:

`devices/{deviceId}/config/commands`

Field:

```json
{
  "actuator": "pump",
  "mode": "MANUAL",
  "state": true,
  "manual_until": 1751457600000,
  "issued_at": 1751455800000,
  "issued_by": "uid_abc123"
}
```

---

## 11. Aturan Implementasi Frontend

Gunakan stack:

- React atau Next.js
- Tailwind CSS
- Firebase Auth
- Firestore realtime listener
- Chart library ringan untuk grafik

### State management

- Gunakan Firestore `onSnapshot` untuk dashboard realtime.
- Jangan polling dashboard dari frontend.
- Hitung status online dari `Date.now() - last_seen`.
- Format angka sensor dengan 1 desimal untuk suhu, kelembapan, dan media.
- Lux boleh tanpa desimal.

### Loading dan error state

Setiap halaman harus punya:

- Loading state
- Empty state
- Error state
- Offline warning

Contoh error:

`Data belum tersedia. Pastikan perangkat Snowberry sudah menyala dan terhubung ke WiFi.`

---

## 12. Definition of Done

Implementasi dianggap selesai jika:

- Semua halaman utama bisa dibuka di mobile 360px.
- Semua teks utama berbahasa Indonesia.
- Dashboard membaca `status/realtime` secara realtime.
- Threshold bisa disimpan ke Firestore dengan validasi.
- Manual mode menulis command dengan `manual_until` maksimal 30 menit.
- Perangkat offline ditandai jika `last_seen` lebih dari 5 menit.
- Tidak ada fitur di luar scope v1.
- UI tetap bisa dipahami tanpa membaca dokumentasi teknis.

