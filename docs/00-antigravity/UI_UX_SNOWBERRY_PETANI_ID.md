# UI/UX Snowberry — Versi Petani Ciwidey

## 1. Tujuan UX

Snowberry harus terasa seperti alat bantu petani, bukan panel engineer. Pengguna cukup tahu:

1. Greenhouse aman atau tidak.
2. Masalahnya di suhu, kelembapan, cahaya, atau media tanam.
3. Alat mana yang sedang menyala.
4. Kapan boleh intervensi manual.
5. Apa yang harus dilakukan selanjutnya.

---

## 2. Prinsip Desain

### Mobile-first

Petani kemungkinan besar membuka aplikasi dari HP. Semua tampilan harus nyaman di layar 360px.

### Bahasa sederhana

Hindari istilah teknis sebagai label utama. Istilah teknis boleh muncul sebagai teks kecil atau bantuan.

Contoh:

- Pakai `Kelembapan Udara`, bukan `RH`.
- Pakai `Kelembapan Media`, bukan `Soil Moisture`.
- Pakai `Batas Otomatis`, bukan `Threshold`.
- Pakai `Perangkat Tidak Terhubung`, bukan `Offline` saja.

### Status harus langsung terlihat

Gunakan pola:

- Hijau: `Aman`
- Kuning: `Perlu Cek`
- Merah: `Bahaya`
- Abu-abu: `Belum Ada Data`

Setiap status harus punya teks penjelasan. Jangan hanya warna.

---

## 3. Dashboard Mobile

### Urutan tampilan

1. Header status greenhouse
2. Ringkasan kondisi
3. Kartu sensor
4. Kartu alat
5. Tombol cepat
6. Masalah terbaru

---

## 4. Header Status Greenhouse

Contoh tampilan:

```text
Snowberry
Greenhouse Ciwidey

Status: Terhubung
Diperbarui 1 menit lalu

Semua kondisi aman
```

Jika offline:

```text
Snowberry
Greenhouse Ciwidey

Status: Perangkat Tidak Terhubung
Terakhir terhubung 8 menit lalu

Kontrol otomatis di perangkat tetap berjalan, tetapi data di aplikasi belum terbaru.
```

---

## 5. Kartu Sensor

### Suhu

Label:

`Suhu`

Unit:

`°C`

Contoh normal:

```text
Suhu
23,4 °C
Aman
Suhu masih sesuai untuk stroberi putih.
```

Contoh tinggi:

```text
Suhu
30,8 °C
Bahaya
Suhu terlalu tinggi. Bunga dan buah bisa terganggu jika kondisi ini berlangsung lama.
```

### Kelembapan Udara

Label:

`Kelembapan Udara`

Unit:

`%`

Contoh:

```text
Kelembapan Udara
84 %
Perlu Cek
Udara mulai terlalu lembap. Risiko jamur meningkat.
```

### Cahaya

Label:

`Cahaya`

Unit:

`lux`

Contoh:

```text
Cahaya
1.850 lux
Perlu Cek
Cahaya kurang. Lampu tanam dapat membantu tanaman tetap mendapat cahaya cukup.
```

### Kelembapan Media

Label:

`Kelembapan Media`

Unit:

`%`

Contoh:

```text
Kelembapan Media
38 %
Perlu Cek
Media mulai kering. Pompa akan menyiram jika mode otomatis aktif.
```

---

## 6. Kartu Alat / Aktuator

### Lampu Tanam

```text
Lampu Tanam
Mati
Mode: Otomatis
Lampu akan menyala jika cahaya kurang.
```

### Pompa Air

```text
Pompa Air
Menyala
Mode: Otomatis
Pompa sedang menyiram bertahap agar media tidak terlalu basah.
```

### Pengabut

```text
Pengabut
Mati
Mode: Otomatis
Pengabut akan menyala jika udara terlalu kering.
```

### Kipas

```text
Kipas
Menyala
Mode: Otomatis
Kipas membantu menurunkan suhu atau kelembapan berlebih.
```

---

## 7. Kontrol Manual

### Tombol awal

`Ubah ke Manual`

### Modal konfirmasi

```text
Aktifkan Kontrol Manual?

Pompa Air tidak akan mengikuti sensor sementara waktu. Mode manual akan otomatis berhenti setelah 30 menit.

[Batal] [Aktifkan Manual]
```

### Saat mode manual aktif

```text
Pompa Air
Mati
Mode: Manual
Sisa waktu manual: 26:12

[Nyalakan]
[Tambah 30 Menit]
[Kembalikan ke Otomatis]
```

### Toast

Manual aktif:

`Kontrol manual aktif selama 30 menit.`

Manual selesai otomatis:

`Pompa Air kembali ke mode otomatis.`

Manual dikembalikan pengguna:

`Pompa Air sekarang mengikuti sensor lagi.`

---

## 8. Halaman Batas Otomatis

### Judul

`Batas Otomatis`

### Subjudul

`Atur kapan alat menyala dan mati secara otomatis. Gunakan nilai aman yang sudah disarankan jika belum yakin.`

### Grup: Udara Greenhouse

Field:

- `Suhu minimum`
- `Suhu maksimum`
- `Kelembapan minimum`
- `Kelembapan maksimum`

Helper text:

`Jika suhu atau kelembapan keluar dari batas ini, kipas atau pengabut akan membantu menstabilkan kondisi.`

### Grup: Media Tanam

Field:

- `Media dianggap kering di bawah`
- `Pompa berhenti jika media mencapai`
- `Lama pompa menyala sekali siram`
- `Jeda agar air meresap`

Helper text:

`Penyiraman dibuat bertahap agar akar stroberi tidak tergenang.`

### Grup: Cahaya

Field:

- `Lampu menyala jika cahaya di bawah`
- `Lampu mati jika cahaya di atas`

### Grup: Tanaman

Field:

- `Tanggal tanam`

Helper text:

`Tanggal ini dipakai untuk menghitung HST dan fase pertumbuhan tanaman.`

---

## 9. Pesan Validasi

| Kondisi | Pesan |
|---|---|
| Minimum lebih besar dari maksimum | `Nilai minimum harus lebih kecil dari nilai maksimum.` |
| Durasi pompa terlalu lama | `Lama pompa menyala tidak boleh lebih lama dari jeda resap.` |
| Field kosong | `Bagian ini wajib diisi.` |
| Gagal simpan | `Pengaturan belum tersimpan. Periksa koneksi internet lalu coba lagi.` |
| Berhasil simpan | `Batas otomatis disimpan.` |

---

## 10. Halaman Riwayat

### Judul

`Riwayat Greenhouse`

### Filter

- `Hari Ini`
- `7 Hari`
- `30 Hari`

### Ringkasan

Contoh:

```text
Ringkasan Hari Ini
Suhu paling tinggi terjadi sekitar pukul 13.00.
Kelembapan media sempat rendah pada sore hari.
```

### Empty state

```text
Belum ada riwayat data.
Data akan muncul setelah perangkat mengirim pembacaan sensor.
```

---

## 11. Halaman Fase Tanam

### Judul

`Fase Tanam`

### Contoh tampilan

```text
Hari ke-37 setelah tanam
Fase Berbunga

Tanaman mulai membentuk bunga. Jaga kelembapan agar tidak terlalu tinggi supaya penyerbukan tidak terganggu.
```

### CTA

`Ubah Tanggal Tanam`

---

## 12. Halaman Masalah / Fault

### Jika tidak ada masalah

```text
Tidak ada masalah aktif.
Perangkat dan sensor terlihat normal.
```

### Jika ada masalah

```text
Masalah Aktif
Sensor suhu tidak terbaca.

Dampak:
Kontrol otomatis yang bergantung pada suhu mungkin dihentikan sementara demi keamanan.

Yang bisa dicek:
1. Pastikan kabel sensor tidak longgar.
2. Pastikan area sensor tidak terkena air langsung.
3. Restart perangkat jika kabel sudah benar.
```

---

## 13. Empty State dan Error State

### Data sensor belum ada

`Data sensor belum tersedia. Pastikan perangkat Snowberry sudah menyala.`

### Perangkat belum dipasangkan

`Belum ada perangkat yang terhubung. Hubungkan perangkat Snowberry terlebih dahulu.`

### Koneksi internet hilang

`Aplikasi tidak terhubung ke internet. Kontrol otomatis di perangkat tetap berjalan.`

### Firebase permission error

`Akun ini belum punya akses ke perangkat tersebut.`

---

## 14. Checklist UX

Sebelum dianggap selesai, pastikan:

- Semua teks utama berbahasa Indonesia.
- Semua tombol penting bisa ditekan nyaman di HP.
- Status aman / perlu cek / bahaya terlihat jelas.
- Manual mode tidak bisa aktif permanen.
- Petani bisa tahu kondisi greenhouse dalam 5 detik pertama membuka dashboard.
- Tidak ada istilah teknis yang dibiarkan tanpa penjelasan.

