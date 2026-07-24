# Checklist Pengukuran Lapangan Ciwidey — Snowberry

Tanggal: ____________  Lokasi: ____________  Tim: ____________

## Misi

Mengumpulkan fakta lapangan yang cukup untuk menentukan desain wiring, posisi box IoT, panjang kabel, posisi sensor, posisi alat, dan baseline awal sebelum desain PCB/EasyEDA.

Jangan desain PCB dari ingatan. Ukur greenhouse dulu.

## Aturan Keamanan

- [ ] Jangan mengubah wiring permanen 220VAC saat kunjungan ini.
- [ ] Jangan menjalankan pompa, mist disc, kipas, atau growlight otomatis kecuali rangkaian sudah lolos uji bench.
- [ ] Jauhkan ESP32, laptop, power bank, dan breadboard dari air/kabut.
- [ ] Gunakan prototype sensor-only untuk pembacaan baseline.
- [ ] Ukur panjang kabel mengikuti rute kabel sebenarnya, bukan garis lurus.
- [ ] Tambahkan slack 20-30% untuk setiap panjang kabel.

---

## 1. Alat yang Dibawa

- [ ] Meteran 5-10 m
- [ ] Multimeter
- [ ] Kamera HP
- [ ] Buku catatan / checklist cetak
- [ ] Lakban kertas / masking tape
- [ ] Label atau stiker kecil
- [ ] Power bank / kabel USB
- [ ] Laptop jika memungkinkan
- [ ] Prototype ESP32 sensor-only
- [ ] Kabel jumper cadangan
- [ ] Box plastik / plastik pelindung elektronik
- [ ] Cable ties

---

## 2. Tentukan Titik Referensi Box IoT

Pilih dulu kandidat posisi ESP32/enclosure. Semua pengukuran kabel dimulai dari titik ini.

Kandidat lokasi box IoT: ______________________________________

Cek:

- [ ] Lokasi kering
- [ ] Mudah dijangkau tangan
- [ ] Dekat sumber daya
- [ ] Terlindung dari kabut / hujan / cipratan air
- [ ] Tidak mengganggu pekerja
- [ ] Sinyal WiFi cukup baik
- [ ] Kabel bisa diikat dan dirapikan dengan aman

Nomor foto: ______________________________________

---

## 3. Ukur Layout Greenhouse

Buat sketsa tampak atas di kertas. Tandai bed tanaman, jalan, sumber daya, air, dan box IoT.

| Item | Ukuran | Catatan |
|---|---:|---|
| Panjang greenhouse | ____ m | |
| Lebar greenhouse | ____ m | |
| Tinggi greenhouse | ____ m | |
| Jumlah bed tanaman | ____ | |
| Panjang bed | ____ m | |
| Lebar bed | ____ m | |
| Lebar jalan | ____ m | |
| Jarak pintu masuk ke box IoT | ____ m | ikut rute kabel |
| Jarak sumber listrik ke box IoT | ____ m | ikut rute kabel |
| Jarak sumber air/reservoir ke pompa | ____ m | ikut rute kabel |

Foto wajib:

- [ ] Tampak pintu masuk
- [ ] Tampak panjang greenhouse penuh
- [ ] Close-up bed tanaman
- [ ] Area plafon / area gantung lampu
- [ ] Area sumber listrik
- [ ] Area sumber air / reservoir
- [ ] Kandidat lokasi box IoT
- [ ] Kandidat posisi sensor
- [ ] Kandidat posisi alat/aktuator

---

## 4. Baseline Udara

Ukur suhu udara dan kelembapan relatif di tinggi kanopi tanaman. Tunggu 1-3 menit di setiap titik sebelum mencatat.

Tinggi sensor dari lantai/media: ____ cm

| Titik | Deskripsi Lokasi | Suhu °C | RH % | Stabil? | Catatan |
|---|---|---:|---:|---|---|
| A1 | Luar greenhouse | | | Y/T | |
| A2 | Dekat pintu masuk | | | Y/T | |
| A3 | Tengah bed tanaman | | | Y/T | |
| A4 | Sisi kiri/kanan bed | | | Y/T | |
| A5 | Dekat kandidat kipas/mist | | | Y/T | |
| A6 | Dekat kandidat box IoT | | | Y/T | |
| A7 | Area yang terlihat paling panas | | | Y/T | |
| A8 | Area yang terlihat paling lembap | | | Y/T | |

Catatan angin / kondensasi / daun basah:

__________________________________________________________________

---

## 5. Baseline Cahaya

Ukur lux di tinggi kanopi tanaman. Arahkan sensor cahaya ke atas sesuai arah tanaman menerima cahaya.

Waktu ukur: ____________  Cuaca: cerah / mendung / hujan / campuran

| Titik | Deskripsi Lokasi | Lux | Stabil? | Sumber Bayangan / Catatan |
|---|---|---:|---|---|
| L1 | Luar greenhouse | | Y/T | |
| L2 | Tengah bed tanaman | | Y/T | |
| L3 | Sisi kiri/kanan bed | | Y/T | |
| L4 | Di bawah kandidat growlight | | Y/T | |
| L5 | Area tanaman paling gelap | | Y/T | |
| L6 | Area tanaman paling terang | | Y/T | |

Kandidat posisi growlight:

- Tinggi dari tanaman: ____ cm
- Jumlah lampu rencana: ____
- Estimasi jarak antar lampu: ____ cm
- Rute kabel dari box IoT / SSR ke lampu: ____ m

---

## 6. Baseline Kelembapan Media / Soil Moisture

Catat raw ADC dan kondisi media. Jangan memakai angka default dari internet.

Pin soil sensor: GPIO34. Sensor diberi daya: 3.3V / 5V / lainnya: ______

| Sampel | Kondisi Media | Raw ADC | Estimasi % | Stabil? | Catatan |
|---|---|---:|---:|---|---|
| S1 | Media sangat basah / jenuh air | | | Y/T | baseline basah |
| S2 | Media normal di lapangan | | | Y/T | kondisi tanaman asli |
| S3 | Media kering jika tersedia | | | Y/T | baseline kering |
| S4 | Sampel bed lain | | | Y/T | |
| S5 | Sampel pot/polybag lain | | | Y/T | |

Catatan kalibrasi soil:

- Rata-rata ADC basah: ______
- Rata-rata ADC kering: ______
- Rentang ADC normal lapangan: ______ sampai ______

---

## 7. Survei Sumber Daya

Jangan sambungkan beban final dulu. Ukur dan dokumentasikan saja.

| Item Daya | Lokasi | Tegangan Terukur | Jarak ke Box IoT | Catatan |
|---|---|---:|---:|---|
| Stopkontak 220VAC | | | ____ m | aman dari air? |
| Kandidat adaptor 12V | | | ____ m | untuk pompa/kipas/input LM2596 |
| Kandidat adaptor 24V | | | ____ m | untuk mist disc |
| Rail 5V / USB power | | | ____ m | untuk ESP32 saat tes |

Cek:

- [ ] Stopkontak tidak terkena air/kabut
- [ ] Kabel bisa diarahkan di atas tanah atau diikat aman
- [ ] Lokasi adaptor bisa tetap kering
- [ ] Ada ruang untuk fuse holder/enclosure
- [ ] Rute kabel ekstensi tidak membahayakan jalur pekerja

Nomor foto: ______________________________________

---

## 8. Kandidat Posisi Komponen

Tandai kandidat posisi dengan tape jika diizinkan.

| Komponen | Kandidat Posisi | Tinggi | Alasan | No. Foto |
|---|---|---:|---|---|
| ESP32 / box IoT | | | kering + mudah dijangkau | |
| SHT30 suhu/RH udara | | ____ cm | udara level kanopi | |
| BH1750 sensor cahaya | | ____ cm | cahaya level tanaman | |
| Soil moisture sensor | | ____ cm | media representatif | |
| Growlight | | ____ cm | mencakup bed tanaman | |
| Pompa | | | dekat reservoir | |
| Mist disc | | | jauh dari elektronik | |
| Kipas | | | aliran udara melewati tanaman | |
| Adaptor 12V | | | area listrik kering | |
| Adaptor 24V | | | area listrik kering | |

---

## 9. Jadwal Panjang Kabel

Ukur rute kabel sebenarnya: mengikuti dinding/frame/bed. Tambahkan slack.

Rumus:

```text
panjang final kabel = panjang rute terukur + slack 20-30% + service loop jika perlu
```

| Rute Kabel | Sinyal / Daya | Rute Terukur | Slack | Panjang Final | Jenis Kabel / Catatan |
|---|---|---:|---:|---:|---|
| Box IoT ke SHT30 | sinyal I2C | ____ m | ____ m | ____ m | usahakan pendek |
| Box IoT ke BH1750 | sinyal I2C | ____ m | ____ m | ____ m | bus I2C sama |
| Box IoT ke soil sensor | sinyal analog | ____ m | ____ m | ____ m | jauhkan dari kabel pompa |
| Box IoT ke SSR growlight | kontrol / area AC | ____ m | ____ m | ____ m | jangan wiring AC final besok |
| Box IoT ke relay/pompa | 12V daya/kontrol | ____ m | ____ m | ____ m | kabel power motor lebih tebal |
| Box IoT ke relay/mist disc | 24V daya/kontrol | ____ m | ____ m | ____ m | rail 24V terpisah |
| Box IoT ke relay/kipas | 12V daya/kontrol | ____ m | ____ m | ____ m | channel kipas terpisah |
| Stopkontak ke box IoT | suplai adaptor AC | ____ m | ____ m | ____ m | harus kering dan aman |
| Adaptor 12V ke distribusi 12V | daya 12V | ____ m | ____ m | ____ m | perlu fuse nanti |
| Adaptor 24V ke rail mist | daya 24V | ____ m | ____ m | ____ m | perlu fuse nanti |

Risiko rute kabel:

- [ ] Melewati area basah
- [ ] Melewati jalur pekerja
- [ ] Menyentuh frame tajam
- [ ] Rute I2C terlalu panjang
- [ ] Kabel motor pompa dekat kabel sensor
- [ ] Butuh cable clip / conduit / cable tie

---

## 10. Baseline WiFi / Koneksi

| Titik | Lokasi | Bar WiFi HP | Catatan Sinyal | Firebase bisa diakses? |
|---|---|---:|---|---|
| W1 | Kandidat box IoT | | | Y/T |
| W2 | Tengah bed | | | Y/T |
| W3 | Ujung greenhouse | | | Y/T |
| W4 | Area sumber listrik | | | Y/T |

Lokasi router: ______________________________________

Potensi masalah:

- [ ] Sinyal lemah di box IoT
- [ ] Frame greenhouse menghalangi sinyal
- [ ] Internet tidak stabil
- [ ] Perlu router/repeater/hotspot untuk tes berikutnya

---

## 11. Keputusan Sebelum Pulang

Sebelum meninggalkan lokasi, tulis keputusan sementara terbaik.

Kandidat final lokasi box IoT: ________________________________

Kandidat final posisi sensor:

- SHT30: _________________________________________________________
- BH1750: ________________________________________________________
- Soil sensor: ___________________________________________________

Kandidat final posisi alat:

- Growlight: _____________________________________________________
- Pompa: _________________________________________________________
- Mist disc: _____________________________________________________
- Kipas: _________________________________________________________

Risiko terbesar yang ditemukan:

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

Data yang masih kurang:

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

---

## 12. Output Wajib Setelah Kunjungan

- [ ] Sketsa greenhouse dengan dimensi
- [ ] Folder foto dengan nomor foto
- [ ] Tabel baseline udara terisi
- [ ] Tabel baseline cahaya terisi
- [ ] Tabel baseline ADC soil terisi
- [ ] Survei sumber daya terisi
- [ ] Jadwal panjang kabel terisi
- [ ] Daftar kandidat posisi komponen
- [ ] Daftar risiko sebelum desain PCB/EasyEDA
