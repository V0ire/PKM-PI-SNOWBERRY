# Copywriting Frontend Snowberry

**Status:** Sumber copy UI Bahasa Indonesia untuk `web-app/`
**Cakupan:** Seluruh halaman, komponen, status, dialog, formulir, toast, notifikasi, empty state, dan error state
**Pengguna:** Petani/operator greenhouse stroberi putih di Ciwidey
**Nada:** Tenang, jelas, jujur, dan mudah ditindaklanjuti

---

## 1. Aturan penulisan

### 1.1 Tujuan setiap pesan

Setiap pesan harus membantu pengguna memahami paling sedikit satu hal:

1. Apa kondisi greenhouse saat ini?
2. Apa dampaknya bagi tanaman?
3. Apa yang sedang diperintahkan kepada alat?
4. Apa yang harus dilakukan berikutnya?
5. Apakah perubahan sudah diterapkan oleh perangkat?

Jangan menambah kalimat yang tidak membantu keputusan pengguna.

### 1.2 Istilah utama

| Istilah teknis | Copy UI |
|---|---|
| Dashboard | Beranda |
| Realtime | Kondisi Sekarang |
| Threshold | Batas Otomatis |
| Manual override | Kontrol Manual Sementara |
| Actuator | Alat |
| Device | Perangkat |
| Fault | Masalah |
| Configuration | Pengaturan |
| Relative humidity / RH | Kelembapan Udara |
| Soil moisture | Kelembapan Media |
| Growlight | Lampu Tanam |
| Humidifier | Pelembap Udara |
| Water pump | Pompa Air |
| Offline | Perangkat Tidak Terhubung |
| Stale data | Data Belum Terbaru |
| Sync | Diterapkan ke Perangkat |
| Hysteresis | Dua batas nyala dan mati |
| Rolling window | Periode pembatas |
| Pulse | Satu kali penyiraman |
| Soak period | Jeda resap |

Istilah teknis boleh muncul pada halaman diagnostik sebagai teks tambahan, bukan label utama.

### 1.3 Status kondisi

Gunakan empat status ini secara konsisten:

| Status | Arti | Copy pendek |
|---|---|---|
| Aman | Kondisi berada dalam batas | `Aman` |
| Perlu Cek | Kondisi mulai keluar batas | `Perlu Cek` |
| Bahaya | Kondisi jauh di luar batas atau ada masalah penting | `Bahaya` |
| Belum Ada Data | Nilai tidak tersedia atau tidak dapat dipercaya | `Belum Ada Data` |

Jangan memakai `Normal`, `Warning`, `Critical`, atau `Unknown` sebagai label utama.

### 1.4 Status alat

Snowberry tidak memiliki sensor umpan balik untuk memastikan air mengalir, kabut keluar, kipas berputar, atau lampu menyala secara fisik. Karena itu:

- Kartu ringkas boleh menampilkan `Menyala` dan `Mati`.
- Detail status harus menjelaskan bahwa nilai tersebut merupakan perintah perangkat.
- Jangan memakai `Berhasil menyiram`, `Kabut bekerja normal`, atau klaim fisik lain tanpa sensor pendukung.

Copy detail:

> Status ini menunjukkan perintah dari Snowberry. Aplikasi belum dapat memastikan kerja alat secara fisik.

### 1.5 Format angka dan waktu

- Desimal: `24,8 °C`
- Ribuan: `1.850 lux`
- Persen: `65%`
- Jam: `06.00`
- Countdown: `29:45`
- Durasi: `45 detik`, `15 menit`, `5 jam`
- Tanggal: `3 Agustus 2026`
- HST: `Hari ke-37 setelah tanam`

---

## 2. Identitas aplikasi dan navigasi

### 2.1 Metadata aplikasi

| Elemen | Copy |
|---|---|
| Nama aplikasi | `Snowberry` |
| Judul browser | `Snowberry - Kontrol Greenhouse` |
| Deskripsi | `Pantau dan atur greenhouse stroberi putih dari satu tempat.` |
| Nama aplikasi terpasang | `Snowberry` |
| Nama pendek | `Snowberry` |

### 2.2 Header

```text
Snowberry
{nama_greenhouse}
{status_koneksi}
```

Nama awal jika belum diubah:

> Greenhouse Ciwidey

### 2.3 Navigasi bawah

| Tujuan | Label |
|---|---|
| Dashboard | `Beranda` |
| Fase dan jurnal | `Tanaman` |
| Kontrol alat | `Alat` |
| Grafik | `Riwayat` |
| Pengaturan otomatis | `Atur` |

Label aksesibilitas navigasi:

> Navigasi utama

---

## 3. Layar pembuka

### 3.1 Memuat aplikasi

Eyebrow:

> Snowberry

Judul:

> Menyiapkan kondisi greenhouse

Teks berganti:

> Tahukah Anda? {fakta}

Jika proses lebih lama dari 15 detik:

**Judul**

> Data greenhouse belum masuk

**Isi**

> Snowberry belum menerima data dari perangkat. Periksa listrik box Snowberry dan koneksi Wi-Fi greenhouse.

**Tindakan**

> Coba Lagi

### 3.2 Fakta singkat

Gunakan fakta pendek berikut. Jangan membuat klaim medis atau angka penjualan tanpa sumber yang disetujui.

1. `Stroberi putih pertama dibudidayakan secara komersial di Jepang.`
2. `Warna buah tetap pucat karena kandungan pigmen merahnya rendah.`
3. `Aroma stroberi putih sering mengingatkan pada nanas.`
4. `Setiap titik di permukaan stroberi adalah satu buah kecil.`
5. `Bunga yang terserbuki merata menghasilkan bentuk buah lebih baik.`
6. `Kelembapan tinggi saat berbunga dapat mengganggu penyerbukan.`
7. `Penyiraman bertahap membantu menjaga udara di sekitar akar.`
8. `Snowberry tetap mengatur alat secara lokal saat internet terputus.`

---

## 4. Masuk dan pendaftaran

### 4.1 Halaman masuk

Eyebrow:

> Akun Snowberry

Judul:

> Masuk untuk melihat greenhouse

Subjudul:

> Gunakan akun yang terhubung dengan perangkat Snowberry Anda.

Field:

- `Alamat email`
- `Kata sandi`

Placeholder:

- `nama@email.com`
- `Masukkan kata sandi`

Tombol utama:

> Masuk

Saat memproses:

> Sedang masuk...

Tautan pendaftaran:

> Belum punya akun? Daftar

### 4.2 Halaman pendaftaran

Eyebrow:

> Akun Baru

Judul:

> Buat akun Snowberry

Subjudul:

> Akun ini dipakai untuk mengakses satu greenhouse Snowberry.

Field:

- `Nama`
- `Alamat email`
- `Kata sandi`
- `Ulangi kata sandi`

Tombol utama:

> Buat Akun

Saat memproses:

> Membuat akun...

Tautan masuk:

> Sudah punya akun? Masuk

### 4.3 Validasi autentikasi

| Kondisi | Copy |
|---|---|
| Email kosong | `Alamat email wajib diisi.` |
| Email tidak valid | `Masukkan alamat email yang benar.` |
| Kata sandi kosong | `Kata sandi wajib diisi.` |
| Kata sandi terlalu pendek | `Kata sandi minimal 6 karakter.` |
| Konfirmasi berbeda | `Kata sandi belum sama.` |
| Kredensial salah | `Email atau kata sandi tidak sesuai.` |
| Email sudah dipakai | `Alamat email ini sudah terdaftar.` |
| Terlalu banyak percobaan | `Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.` |
| Internet terputus | `Aplikasi tidak terhubung ke internet. Periksa koneksi lalu coba lagi.` |
| Izin ditolak | `Akun ini belum punya akses ke perangkat tersebut.` |
| Kesalahan umum | `Akun belum dapat dibuka. Coba lagi.` |

### 4.4 Keluar akun

Dialog:

**Judul**

> Keluar dari akun?

**Isi**

> Anda perlu masuk lagi untuk melihat dan mengatur greenhouse.

**Tombol**

- `Batal`
- `Keluar`

Toast:

> Anda sudah keluar dari akun.

---

## 5. Pengaturan awal greenhouse

### 5.1 Langkah pertama

Eyebrow:

> Pengaturan Awal

Judul:

> Kenali greenhouse Anda

Subjudul:

> Isi sekali agar informasi tanaman sesuai kondisi saat ini.

Progres:

> 1 dari 2

Field:

> Nama Greenhouse

Nilai awal:

> Greenhouse Ciwidey

Tombol:

> Berikutnya

Validasi:

> Nama greenhouse wajib diisi.

### 5.2 Langkah kedua

Progres:

> 2 dari 2

Field:

> Tahap Tanaman Saat Ini

Pilihan:

- `Vegetatif`
- `Berbunga`
- `Berbuah`

Tombol:

- `Simpan dan Mulai Pantau`
- `Sebelumnya`

Toast sukses:

> Greenhouse siap dipantau.

### 5.3 Perangkat belum terhubung

**Judul**

> Belum ada perangkat yang terhubung

**Isi**

> Hubungkan perangkat Snowberry agar aplikasi dapat menampilkan kondisi greenhouse.

**Tombol**

> Hubungkan Perangkat

### 5.4 Hubungkan perangkat

Eyebrow:

> Perangkat

Judul:

> Hubungkan Snowberry

Subjudul:

> Masukkan kode perangkat yang diberikan bersama box Snowberry.

Field:

> Kode Perangkat

Placeholder:

> Contoh: SNOWBERRY-001

Tombol:

> Hubungkan

Saat memproses:

> Menghubungkan perangkat...

Hasil:

- `Perangkat berhasil dihubungkan.`
- `Kode perangkat tidak ditemukan.`
- `Perangkat ini sudah terhubung dengan akun lain.`
- `Perangkat belum dapat dihubungkan. Coba lagi.`

---

## 6. Status koneksi dan sinkronisasi

### 6.1 Perangkat terhubung

Label:

> Terhubung

Pesan:

> Perangkat terhubung dan data masih baru.

Metadata:

> Diperbarui {waktu_lalu}

### 6.2 Data belum terbaru

Label:

> Data Belum Terbaru

Pesan:

> Data terakhir masuk {waktu_lalu}. Kondisi greenhouse mungkin sudah berubah.

Tindakan:

> Tunggu data baru atau periksa koneksi perangkat.

### 6.3 Perangkat tidak terhubung

Label:

> Perangkat Tidak Terhubung

Pesan:

> Data terbaru belum masuk. Periksa listrik box Snowberry dan koneksi Wi-Fi greenhouse.

Penjelasan wajib:

> Jika listrik box masih menyala, kontrol otomatis di perangkat tetap berjalan menggunakan pengaturan terakhir. Jika listrik padam, kontrol berhenti sampai listrik kembali.

### 6.4 Aplikasi kehilangan koneksi cloud

Label:

> Aplikasi Tidak Terhubung

Pesan:

> Aplikasi tidak dapat terhubung ke Firebase. Data yang tampil mungkin sudah lama.

Dampak:

> Kontrol manual dan penyimpanan pengaturan dinonaktifkan sampai koneksi kembali.

Penjelasan wajib:

> Kontrol otomatis di perangkat tetap berjalan.

### 6.5 Sinkronisasi pengaturan

| Status | Label | Pesan |
|---|---|---|
| Belum dikirim | `Belum Disimpan` | `Perubahan hanya ada di formulir ini.` |
| Tersimpan di cloud | `Belum Diterapkan` | `Pengaturan tersimpan dan menunggu perangkat.` |
| Sedang diterapkan | `Sedang Diterapkan` | `Perangkat sedang memeriksa pengaturan baru.` |
| Cocok | `Sudah Diterapkan` | `Perangkat sudah memakai pengaturan ini.` |
| Ditolak perangkat | `Gagal Diterapkan` | `Perangkat menolak pengaturan. Periksa nilai lalu coba lagi.` |

Jika perangkat offline setelah penyimpanan:

> Tersimpan di aplikasi, menunggu perangkat tersambung.

---

## 7. Beranda

### 7.1 Beranda aman

Judul:

> Greenhouse aman untuk stroberi putih

Detail:

> Semua kondisi utama masih nyaman untuk fase {fase}.

Tindakan:

> Tidak ada tindakan mendesak saat ini.

Footer alat:

- Jika tidak ada alat aktif: `Semua alat standby`
- Jika ada: `Alat aktif: {daftar_alat}`

### 7.2 Ada kondisi yang perlu dicek

Judul:

> Perlu dicek: {ringkasan_masalah}

Detail berdasarkan fase:

- Vegetatif: `Fase vegetatif perlu media lembap stabil agar akar dan daun kuat.`
- Berbunga: `Fase berbunga lebih sensitif terhadap kelembapan tinggi dan cahaya kurang.`
- Berbuah: `Fase berbuah perlu media stabil agar buah tidak pecah dan tidak mudah berjamur.`

Tombol:

> Lihat semua yang perlu dicek ({jumlah})

### 7.3 Bahaya

Judul:

> Masalah penting: {ringkasan_masalah}

Detail:

> Periksa kondisi ini sesegera mungkin agar tanaman tidak terganggu lebih lama.

### 7.4 Masalah perangkat

Banner:

**Judul**

> Masalah Aktif

**Isi**

> {pesan_masalah}

Hero:

**Judul**

> Ada masalah pada perangkat

**Detail**

> {pesan_masalah}

**Tindakan**

> Periksa kabel, daya, atau posisi sensor sebelum mengubah Batas Otomatis.

### 7.5 Loading dan empty state

Loading:

> Menyiapkan kondisi greenhouse.

Belum ada sensor:

**Judul**

> Data sensor belum tersedia

**Isi**

> Pastikan perangkat Snowberry sudah menyala dan terhubung ke Wi-Fi.

---

## 8. Kartu sensor dan panduan kondisi

### 8.1 Suhu udara

Label panjang:

> Suhu Udara

Label ringkas:

> Suhu

#### Aman

> Suhu masih nyaman untuk fase {fase}.

Tindakan:

> Pantau perubahan suhu pada siang dan malam hari.

#### Tinggi, fase vegetatif

> Suhu mulai tinggi. Daun dan akar bisa stres jika kondisi ini berlangsung lama.

#### Tinggi, fase berbunga

> Suhu mulai tinggi untuk bunga. Kuncup dan penyerbukan bisa terganggu jika berlangsung lama.

#### Tinggi, fase berbuah

> Suhu mulai tinggi. Buah bisa lebih cepat lunak dan rasa manis berkurang.

Tindakan suhu tinggi:

> Periksa sirkulasi udara dan sumber panas di greenhouse.

#### Rendah

> Suhu mulai rendah. Pertumbuhan bisa melambat jika kondisi ini berlangsung lama.

Tindakan:

> Pantau suhu malam dan pastikan tanaman tidak terkena aliran udara dingin langsung.

#### Tidak ada data

> Data suhu belum tersedia.

Tindakan:

> Periksa sensor suhu dan kabelnya.

### 8.2 Kelembapan udara

Label panjang:

> Kelembapan Udara

Label ringkas:

> Udara

#### Aman

> Kelembapan udara masih aman untuk fase {fase}.

#### Terlalu tinggi, fase vegetatif

> Udara terlalu lembap. Risiko jamur pada daun meningkat.

#### Terlalu tinggi, fase berbunga

> Udara terlalu lembap untuk bunga. Serbuk sari bisa menggumpal dan risiko jamur meningkat.

#### Terlalu tinggi, fase berbuah

> Udara terlalu lembap. Buah lebih mudah terkena jamur jika kondisi ini berlangsung lama.

Tindakan kelembapan tinggi:

> Periksa permukaan daun, bunga, dan buah yang terlalu basah.

#### Terlalu rendah

> Udara mulai kering. Pelembap Udara dapat membantu menaikkan kelembapan.

Tindakan:

> Pastikan Pelembap Udara tersedia dan memiliki cukup air.

#### Tidak ada data

> Data kelembapan udara belum tersedia.

Tindakan:

> Periksa sensor suhu dan kelembapan beserta kabelnya.

### 8.3 Cahaya

Label:

> Cahaya

#### Aman

> Cahaya cukup untuk mendukung fase {fase}.

#### Kurang, fase vegetatif

> Cahaya kurang. Pertumbuhan daun bisa melambat.

#### Kurang, fase berbunga

> Cahaya kurang untuk bunga. Tangkai bunga bisa melemah jika kondisi ini sering terjadi.

#### Kurang, fase berbuah

> Cahaya kurang. Pembentukan rasa manis buah bisa melambat.

Tindakan:

> Lampu Tanam dapat membantu saat cahaya alami kurang.

#### Terlalu tinggi

> Cahaya sedang tinggi. Pantau suhu greenhouse agar tidak ikut meningkat.

#### Tidak ada data

> Data cahaya belum tersedia.

Tindakan:

> Periksa sensor cahaya dan pastikan permukaannya tidak tertutup.

Panduan DLI:

> Estimasi DLI alami: {nilai} dari target {target} DLI

Catatan:

> Perkiraan ini berasal dari cahaya alami. Durasi Lampu Tanam dicatat terpisah.

### 8.4 Kelembapan media

Label panjang:

> Kelembapan Media

Label ringkas:

> Media

#### Aman

> Media tanam cukup lembap untuk fase {fase}.

#### Terlalu kering

> Media mulai kering. Pompa dapat menyiram jika semua syarat keselamatan terpenuhi.

Tindakan:

> Periksa persediaan air dan tunggu keputusan penyiraman perangkat.

Jangan memakai `Pompa akan menyala`, karena pompa mungkin sedang dalam Jeda Resap atau sudah mencapai Batas Jumlah Penyiraman.

#### Terlalu basah, fase vegetatif/berbunga

> Media terlalu basah. Akar membutuhkan waktu agar air meresap.

#### Terlalu basah, fase berbuah

> Media terlalu basah. Buah lebih mudah pecah jika tanaman menerima terlalu banyak air.

Tindakan:

> Jangan menambah siraman. Periksa drainase dan beri waktu agar media mengering.

#### Tidak ada data

> Data kelembapan media belum tersedia.

Tindakan:

> Periksa sensor media dan status kalibrasinya.

### 8.5 Status kalibrasi media

#### Nilai awal

Label:

> Kalibrasi Awal

Pesan:

> Persentase media memakai nilai awal perangkat: kering 3500 dan basah 1500.

#### Sudah dikalibrasi

Label:

> Sudah Dikalibrasi

Pesan:

> Persentase media memakai hasil kalibrasi langsung dari sensor ini.

#### Kalibrasi bermasalah

Label:

> Kalibrasi Perlu Diulang

Pesan:

> Nilai kering dan basah belum cukup berbeda. Pompa otomatis dihentikan sampai kalibrasi berhasil.

---

## 9. Halaman Tanaman: penjelasan sensor

Header:

```text
Kondisi Tanaman
Tanaman
Lihat arti setiap kondisi satu per satu.
```

Progres:

> {urutan} dari 4

Status gabungan:

> {status} · {masalah_atau_nyaman}

Jika aman:

> Aman · Nyaman

Tombol:

- `Sebelumnya`
- `Berikutnya`

---

## 10. Halaman Alat

Header:

**Judul**

> Alat yang Membantu

**Isi**

> Kontrol manual berlaku sementara, lalu kembali ke mode otomatis.

Status mode:

- `Mode: Otomatis`
- `Mode: Manual Sementara`

Status perintah:

- `Menyala`
- `Mati`

Catatan detail:

> Status ini menunjukkan perintah dari Snowberry. Aplikasi belum dapat memastikan kerja alat secara fisik.

### 10.1 Lampu Tanam

Peran:

> Menambah cahaya saat cahaya alami belum mencukupi.

AUTO mati:

> Lampu menyala saat cahaya kurang dan jadwal mengizinkan.

AUTO menyala:

> Lampu diperintahkan menyala untuk menambah cahaya.

Alasan umum:

- `Cahaya berada di bawah batas nyala.`
- `Cahaya sudah mencapai batas mati.`
- `Saat ini berada di luar jadwal lampu.`
- `Waktu perangkat belum tersedia.`
- `Data cahaya tidak tersedia.`

### 10.2 Pompa Air

Peran:

> Menjaga media tetap lembap melalui penyiraman bertahap.

AUTO mati:

> Pompa menunggu media kering dan semua syarat penyiraman terpenuhi.

AUTO menyala:

> Pompa diperintahkan menyala untuk satu kali penyiraman.

Alasan umum:

- `Media berada di bawah batas kering.`
- `Media sudah cukup basah.`
- `Pompa masih dalam Jeda Resap.`
- `Batas Jumlah Penyiraman sudah tercapai.`
- `Data media tidak tersedia.`
- `Kalibrasi media belum dapat digunakan.`
- `Pompa dikunci sementara setelah perangkat dinyalakan ulang.`

Tombol manual utama:

> Siram Sekali Sekarang

Jangan tampilkan toggle ON/OFF berkelanjutan untuk pompa.

### 10.3 Pelembap Udara

Peran:

> Membantu menyesuaikan kelembapan udara berdasarkan batas yang dipilih.

AUTO mati:

> Pelembap menunggu kelembapan atau suhu mencapai batas nyala.

AUTO menyala:

> Pelembap diperintahkan menyala untuk membantu kondisi udara.

Alasan umum:

- `Kelembapan berada di bawah batas nyala.`
- `Kelembapan sudah mencapai batas mati.`
- `Suhu berada di atas batas nyala.`
- `Suhu sudah turun ke batas mati.`
- `Kelembapan dipilih sebagai prioritas.`
- `Suhu dipilih sebagai prioritas.`
- `Data kelembapan tidak tersedia.`
- `Data suhu tidak tersedia. Kontrol dilanjutkan berdasarkan kelembapan.`
- `Data suhu tidak tersedia. Pelembap otomatis dimatikan.`

### 10.4 Ketersediaan kontrol

| Kondisi | Label | Pesan |
|---|---|---|
| Siap | `Siap` | `Kontrol manual siap dikirim.` |
| Mengirim | `Mengirim` | `Perintah sedang dikirim.` |
| Perangkat offline | `Tidak Tersedia` | `Perangkat tidak terhubung. Kontrol manual belum dapat dikirim.` |
| Cloud offline | `Tidak Tersedia` | `Aplikasi tidak terhubung. Kontrol manual belum dapat dikirim.` |
| Gagal | `Gagal` | `Perintah belum diterapkan. Coba lagi.` |

Tombol umum:

- `Buka Kontrol Manual`
- `Nyalakan`
- `Matikan`
- `Tambah 30 Menit`
- `Kembalikan ke Otomatis`

Countdown:

> Sisa waktu manual: {MM:SS}

---

## 11. Kontrol manual

### 11.1 Lampu atau pelembap, sensor tersedia

Eyebrow:

> Kontrol Manual Sementara

Judul:

> Aktifkan kontrol manual untuk {nama_alat}?

Isi:

> {nama_alat} tidak akan mengikuti Batas Otomatis sementara waktu. Kontrol manual berakhir setelah maksimal 30 menit.

Tombol:

- `Batal`
- `Aktifkan 30 Menit`

### 11.2 Lampu atau pelembap, sensor tidak tersedia

Judul:

> Nyalakan tanpa perlindungan sensor?

Isi:

> Data sensor tidak tersedia. {nama_alat} akan dinyalakan tanpa perlindungan sensor selama maksimal 30 menit.

Teks tambahan:

> Periksa kondisi greenhouse secara langsung selama kontrol manual aktif.

Tombol:

- `Batal`
- `Tetap Nyalakan`

### 11.3 Perpanjang kontrol manual

Sensor tersedia:

**Judul**

> Tambah 30 menit?

**Isi**

> Waktu Kontrol Manual Sementara akan dihitung ulang dari sekarang.

Sensor belum tersedia:

**Judul**

> Sensor masih belum tersedia

**Isi**

> {nama_alat} masih bekerja tanpa perlindungan sensor. Lanjutkan selama 30 menit lagi?

Tombol:

- `Batal`
- `Tambah 30 Menit`

### 11.4 Kembali ke otomatis

Toast:

> {nama_alat} sekarang mengikuti Batas Otomatis lagi.

### 11.5 Manual berakhir

Toast:

> Kontrol manual {nama_alat} selesai. Perangkat kembali ke mode otomatis.

### 11.6 Pompa manual

Eyebrow:

> Penyiraman Manual

Judul:

> Siram media sekarang?

Isi:

> Pompa akan menyala satu kali selama {durasi}. Jika kondisi belum aman untuk menyiram, perangkat akan menolak perintah.

Tombol:

- `Batal`
- `Siram Sekarang`

Hasil ditolak:

- `Pompa tidak dinyalakan karena data media belum tersedia.`
- `Pompa tidak dinyalakan karena kalibrasi media belum dapat digunakan.`
- `Pompa masih dalam Jeda Resap. Coba lagi setelah {sisa_waktu}.`
- `Batas Jumlah Penyiraman sudah tercapai.`
- `Pompa masih dikunci setelah perangkat dinyalakan ulang.`

Hasil diterima:

> Perintah penyiraman diterapkan.

### 11.7 Status pengiriman perintah

| Ack | Toast |
|---|---|
| APPLIED | `Perintah alat diterapkan.` |
| REJECTED_SAFETY | `Perintah ditolak untuk menjaga keamanan alat dan tanaman.` |
| EXPIRED | `Perintah sudah kedaluwarsa. Kirim perintah baru jika masih diperlukan.` |
| INVALID | `Perintah tidak dapat dibaca oleh perangkat.` |
| Timeout | `Perangkat belum menjawab. Periksa koneksi lalu coba lagi.` |

Jangan mengubah status alat secara optimistis sebelum perangkat mengirim status atau acknowledgement yang sesuai.

---

## 12. Batas Otomatis

### 12.1 Header

Eyebrow:

> Pengaturan

Judul:

> Batas Otomatis

Subjudul:

> Atur cara Snowberry menjaga kondisi greenhouse. Perubahan diperiksa sebelum dikirim ke perangkat.

Panduan pengguna baru:

> Belum yakin? Gunakan nilai yang disarankan terlebih dahulu.

### 12.2 Status formulir

| Kondisi | Label | Pesan |
|---|---|---|
| Bersih | `Belum Diubah` | `Belum ada perubahan.` |
| Berubah | `Ada Perubahan` | `Periksa nilai sebelum menyimpan.` |
| Tidak valid | `Perlu Diperbaiki` | `Ada nilai yang belum sesuai.` |
| Menyimpan | `Menyimpan` | `Pengaturan sedang disimpan.` |
| Tersimpan | `Tersimpan` | `Pengaturan sudah disimpan ke aplikasi.` |
| Gagal | `Gagal` | `Pengaturan belum tersimpan.` |

### 12.3 Pelembap: kelembapan udara

Judul grup:

> Pelembap - Kelembapan Udara

Penjelasan:

> Atur kapan Pelembap Udara meminta menyala dan mati berdasarkan kelembapan.

Field:

- `Pelembap menyala jika kelembapan di bawah`
- `Pelembap mati jika kelembapan di atas`

Helper:

> Dua batas mencegah alat terlalu sering hidup dan mati.

Rentang firmware:

> Nilai yang dapat digunakan: 20-95%.

### 12.4 Pelembap: pengaruh suhu

Judul grup:

> Pelembap - Pengaruh Suhu

Toggle:

> Gunakan suhu untuk mengendalikan pelembap

Saat mati:

> Pelembap hanya mengikuti kelembapan udara.

Saat aktif:

> Suhu dan kelembapan dipakai bersama untuk menentukan kerja pelembap.

Field:

- `Pelembap menyala jika suhu mencapai`
- `Pelembap mati jika suhu turun sampai`

Rentang firmware:

> Nilai yang dapat digunakan: 5-45 °C.

### 12.5 Prioritas pelembap

Label:

> Jika suhu dan kelembapan memberi perintah berbeda

Pilihan:

- `Utamakan kelembapan udara`
- `Utamakan suhu`

Penjelasan:

> Contoh: suhu meminta pelembap menyala, tetapi kelembapan meminta mati. Pilihan ini menentukan kondisi yang diikuti.

### 12.6 Data suhu gagal

Label:

> Jika data suhu tidak tersedia

Pilihan:

- `Matikan pelembap`
- `Lanjutkan berdasarkan kelembapan udara`

Penjelasan pilihan pertama:

> Pelembap otomatis dimatikan sampai data suhu kembali.

Penjelasan pilihan kedua:

> Snowberry mengabaikan suhu sementara dan tetap mengikuti kelembapan udara.

Catatan tetap:

> Jika data kelembapan udara tidak tersedia, Pelembap Udara otomatis dimatikan.

### 12.7 Media dan pompa

Judul grup:

> Media dan Pompa

Penjelasan:

> Penyiraman dibuat bertahap agar air sempat meresap dan akar tidak tergenang.

Field:

- `Media dianggap kering di bawah`
- `Penyiraman berhenti jika media mencapai`
- `Lama satu kali penyiraman`
- `Jeda Resap`
- `Batas Jumlah Penyiraman`
- `Lama periode pembatas`

Helper pulse:

> Pompa menyala selama durasi ini pada setiap penyiraman.

Helper soak:

> Pompa tidak dapat menyiram lagi selama jeda ini.

Helper limit:

> Penyiraman otomatis dan manual memakai batas jumlah yang sama.

Rentang:

- `Durasi penyiraman: 1-120 detik.`
- `Jeda Resap: 1-120 menit.`
- `Batas Jumlah Penyiraman: 1-12 kali.`
- `Periode pembatas: 1-24 jam.`

### 12.8 Lampu Tanam

Judul grup:

> Lampu Tanam

Penjelasan:

> Lampu membantu saat cahaya alami berada di bawah batas yang dipilih.

Field:

- `Lampu menyala jika cahaya di bawah`
- `Lampu mati jika cahaya di atas`

Rentang:

> Nilai yang dapat digunakan: 0-100.000 lux.

Toggle:

> Gunakan jadwal lampu

Saat mati:

> Lampu mengikuti kondisi cahaya selama 24 jam.

Saat aktif:

> Lampu otomatis hanya dapat menyala di dalam jadwal ini.

Field jadwal:

- `Mulai jadwal`
- `Selesai jadwal`

Helper:

> Jadwal menggunakan waktu perangkat dan hanya dapat diatur per jam.

Jadwal melewati tengah malam:

> Jadwal melewati tengah malam. Lampu dapat bekerja dari pukul {mulai} sampai {selesai} hari berikutnya.

### 12.9 Tanaman

Judul grup:

> Tanaman

Field:

> Tanggal tanam

Helper:

> Tanggal ini dipakai untuk menghitung HST dan fase pertumbuhan tanaman.

### 12.10 Validasi formulir

| Kondisi | Copy |
|---|---|
| Kosong | `Bagian ini wajib diisi.` |
| Bukan angka | `Masukkan angka yang benar.` |
| Di luar rentang | `Gunakan nilai antara {minimum} dan {maksimum}.` |
| Low >= high | `Batas nyala harus lebih kecil dari batas mati.` |
| Pulse >= soak | `Lama penyiraman harus lebih pendek daripada Jeda Resap.` |
| Jadwal sama | `Jam mulai dan selesai tidak boleh sama.` |
| Prioritas belum dipilih | `Pilih kondisi yang harus diutamakan.` |
| Tindakan saat data suhu gagal belum dipilih | `Pilih tindakan saat data suhu tidak tersedia.` |
| Nilai agresif | `Nilai ini masih dapat digunakan, tetapi berada di luar kisaran yang disarankan untuk stroberi putih.` |

### 12.11 Tombol

- `Batalkan Perubahan`
- `Simpan {jumlah} Perubahan`
- `Pakai Nilai Awal`

Saat menyimpan:

> Menyimpan...

### 12.12 Konfirmasi perubahan

Eyebrow:

> Periksa Pengaturan

Judul:

> Simpan perubahan Batas Otomatis?

Isi:

> Periksa perubahan berikut sebelum dikirim ke perangkat.

Format perubahan:

```text
{nama_pengaturan}
{nilai_lama} menjadi {nilai_baru}
```

Contoh:

```text
Prioritas Pelembap
Kelembapan Udara menjadi Suhu

Lama Satu Kali Penyiraman
45 detik menjadi 60 detik
```

Tombol:

- `Batal`
- `Simpan Perubahan`

### 12.13 Pakai nilai awal

Judul:

> Pakai nilai awal?

Isi:

> Semua Batas Otomatis kembali ke nilai awal. Tanggal tanam tidak berubah.

Tombol:

- `Batal`
- `Pakai Nilai Awal`

### 12.14 Hasil penyimpanan

Cloud tersimpan, perangkat online:

> Pengaturan tersimpan dan sedang diperiksa perangkat.

Cloud tersimpan, perangkat offline:

> Tersimpan di aplikasi, menunggu perangkat tersambung.

Diterapkan:

> Perangkat sudah memakai Batas Otomatis terbaru.

Gagal cloud:

> Pengaturan belum tersimpan. Periksa koneksi internet lalu coba lagi.

Ditolak perangkat:

> Perangkat menolak pengaturan ini. Periksa nilai yang ditandai lalu simpan kembali.

---

## 13. Riwayat Greenhouse

### 13.1 Header

Eyebrow:

> Pola Greenhouse

Judul:

> Riwayat Greenhouse

Subjudul:

> Lihat perubahan kondisi greenhouse dari waktu ke waktu.

Loading:

> Menyiapkan grafik kondisi greenhouse.

### 13.2 Rentang

- `Hari Ini`
- `7 Hari`
- `30 Hari`

### 13.3 Pilihan grafik

- `Suhu`
- `Udara`
- `Cahaya`
- `Media`

Judul grafik:

- `Suhu Udara`
- `Kelembapan Udara`
- `Cahaya Alami`
- `Kelembapan Media`

### 13.4 Ringkasan aman

Judul:

> Kondisi {rentang} aman

Isi:

> Semua kondisi berada di dalam Batas Otomatis pada rentang ini.

### 13.5 Ringkasan perlu perhatian

Judul:

> {Rentang} perlu perhatian

Pola pesan:

- `Kelembapan udara di luar batas {jumlah} kali.`
- `Kejadian paling lama berlangsung {durasi}, sekitar pukul {waktu}.`
- `Kelembapan media di luar batas {jumlah} kali.`
- `Suhu di luar batas {jumlah} kali.`
- `Cahaya di luar batas {jumlah} kali.`

Jangan menyebut `media kering` jika pelanggaran sebenarnya berada di atas `soil_high`.

### 13.6 Grafik

Keterangan pita:

> Hijau menunjukkan rentang Batas Otomatis: {batas_bawah}-{batas_atas} {unit}.

Jika ada pelanggaran:

> Kuning menunjukkan waktu saat kondisi berada di luar batas.

Jika aman:

> Semua data berada di dalam batas.

Tren:

- `Naik`
- `Turun`
- `Stabil`

Lampu:

> Lampu Tanam diperintahkan menyala sekitar {durasi} menit.

### 13.7 Empty dan error state

Kosong:

**Judul**

> Belum ada data untuk {rentang}

**Isi**

> Data akan muncul setelah perangkat mengirim pembacaan sensor.

Gagal memuat:

**Judul**

> Riwayat belum dapat dimuat

**Isi**

> Periksa koneksi internet lalu coba lagi.

**Tombol**

> Coba Lagi

---

## 14. Fase Tanam

### 14.1 Header

Eyebrow:

> Tanaman

Judul:

> Fase Tanam

Subjudul:

> Panduan harian berdasarkan umur tanaman stroberi putih.

Loading:

> Menyiapkan umur tanam dan panduan hari ini.

### 14.2 Vegetatif, HST 0-30

Label:

> Fase Vegetatif - Hari ke-{hst}

Judul:

> Akar kuat menentukan hasil nanti

Deskripsi:

> Tanaman sedang memperkuat akar, daun, dan pangkal tanaman sebelum masuk masa bunga.

Fokus:

> Jaga media tetap lembap tanpa membuat akar tergenang.

Risiko:

> Media terlalu basah dapat membuat akar mudah busuk, terutama saat udara juga lembap.

Tindakan:

> Periksa daun rusak dan pastikan penyiraman tetap bertahap.

### 14.3 Berbunga, HST 31-60

Label:

> Fase Berbunga - Hari ke-{hst}

Judul:

> Bunga menentukan jumlah buah

Deskripsi:

> Tanaman mulai membentuk bunga. Kelembapan dan cahaya perlu lebih dijaga.

Fokus:

> Jaga udara tidak terlalu lembap agar penyerbukan berjalan baik.

Risiko:

> Udara terlalu lembap dapat membuat serbuk sari menggumpal.

Tindakan:

> Pantau kelembapan malam dan periksa bunga yang terlalu basah.

### 14.4 Berbuah, HST 61+

Label:

> Fase Berbuah - Hari ke-{hst}

Judul:

> Buah matang membutuhkan kondisi stabil

Deskripsi:

> Buah mulai membesar. Media perlu stabil agar buah tidak pecah atau terlalu berair.

Fokus:

> Jaga media tidak becek dan udara tidak terlalu lembap.

Risiko:

> Media terlalu basah dapat membuat buah pecah, sedangkan udara lembap memudahkan jamur berkembang.

Tindakan:

> Panen buah matang, buang buah rusak, dan hindari penyiraman berlebih.

### 14.5 Komponen fase

Judul kartu:

> Panduan Hari Ini

Label risiko:

> Yang perlu dihindari

Tombol:

- `Ubah Tanggal Tanam`
- `Panduan Lengkap`

Timeline:

- `Vegetatif`
- `Berbunga`
- `Berbuah`

### 14.6 Tanggal tanam belum tersedia

**Judul**

> Tanggal tanam belum diisi

**Isi**

> Isi tanggal tanam agar Snowberry dapat menghitung umur dan fase tanaman.

**Tombol**

> Isi Tanggal Tanam

### 14.7 Tanggal tanam di masa depan

> Tanggal tanam tidak boleh melewati hari ini.

---

## 15. Jurnal Kebun

### 15.1 Kartu jurnal

Judul:

> Jurnal Kebun

Isi:

> Catat kegiatan tanam dan panen tanpa formulir panjang.

Tombol:

- `Tanam`
- `Panen`

Empty state:

> Belum ada catatan tanam atau panen.

### 15.2 Catat tanam

Judul:

> Catat tanam hari ini?

Isi:

> Catatan tanam akan disimpan di Jurnal Kebun.

Field:

- `Jumlah bibit (opsional)`
- `Catatan singkat (opsional)`

Placeholder:

> Contoh: bibit baru dari bedeng timur

Pilihan:

> Mulai siklus tanam baru dan hitung umur tanaman dari hari ini

Tombol:

- `Batal`
- `Simpan Tanam`

Toast:

> Catatan tanam tersimpan.

Jika siklus baru:

> Catatan tanam tersimpan. Umur tanaman dihitung ulang dari hari ini.

### 15.3 Catat panen

Judul:

> Catat panen hari ini?

Isi:

> Catatan panen akan disimpan di Jurnal Kebun.

Field:

- `Hasil panen (opsional)`
- `Catatan singkat (opsional)`

Placeholder:

> Contoh: buah matang bagus

Pilihan default mati:

> Mulai siklus tanam baru setelah panen

Tombol:

- `Batal`
- `Simpan Panen`

Toast:

> Catatan panen tersimpan.

### 15.4 Validasi jurnal

- `Masukkan angka lebih dari 0.`
- `Catatan terlalu panjang. Gunakan maksimal 200 karakter.`

Format daftar:

```text
{Tanam|Panen} - {tanggal}
{jumlah dan unit | Tanpa jumlah}
{catatan jika ada}
```

---

## 16. Panduan Stroberi Putih

### 16.1 Header

Eyebrow:

> Edukasi

Judul:

> Panduan Stroberi Putih

Subjudul:

> Bacaan singkat untuk membantu perawatan sehari-hari.

Footer:

> Batas pada aplikasi mengikuti pengaturan greenhouse Anda.

Tombol:

> Kembali ke Tanaman

### 16.2 Mengenal stroberi putih

Ringkasan:

> Kenali warna, aroma, dan tanda matangnya.

Poin:

- `Buah matang berwarna putih krem dengan biji kemerahan.`
- `Aromanya sering mengingatkan pada nanas.`
- `Warna pucat berasal dari rendahnya pigmen merah.`
- `Gunakan aroma, tekstur, dan warna biji untuk menilai kematangan.`

### 16.3 Kondisi tumbuh

Ringkasan:

> Gunakan Batas Otomatis sesuai kondisi greenhouse.

Poin:

- `Suhu tinggi dapat mengganggu bunga dan rasa buah.`
- `Udara terlalu lembap meningkatkan risiko jamur.`
- `Media terlalu basah dapat merusak akar.`
- `Cahaya cukup membantu pertumbuhan dan pembentukan rasa.`
- `Gunakan saran fase sebagai panduan, bukan batas mutlak.`

### 16.4 Hama dan penyakit

Ringkasan:

> Kenali tanda awal sebelum masalah menyebar.

Poin:

- `Buah berbulu abu-abu: pisahkan dan buang buah yang sakit.`
- `Daun berbintik kuning dan berjaring: periksa bagian bawah daun.`
- `Pucuk keriting dan lengket: periksa kutu daun dan semut.`
- `Lapisan putih pada daun: kurangi kelembapan berlebih.`
- `Buang bagian sakit dan jaga area tanaman tetap bersih.`

### 16.5 Cara menyiram

Ringkasan:

> Siram bertahap dan beri waktu air meresap.

Poin:

- `Gunakan penyiraman singkat dengan jeda resap.`
- `Jangan menambah siraman saat media masih terlalu basah.`
- `Daun bawah menguning dapat menandakan kelebihan air.`
- `Tanaman layu dapat menandakan kekurangan air atau akar bermasalah.`
- `Periksa media dan tanaman, jangan hanya melihat satu sensor.`

### 16.6 Tanda siap panen

Ringkasan:

> Periksa warna, tekstur, dan aroma buah.

Poin:

- `Warna buah berubah menjadi putih krem.`
- `Biji pada permukaan mulai kemerahan.`
- `Buah terasa padat tetapi tidak keras.`
- `Aroma manis mulai tercium jelas.`
- `Sisakan sedikit tangkai saat memetik.`

---

## 17. Halaman Yang Perlu Dilakukan

Header:

```text
Kondisi Perlu Dicek
Yang perlu dilakukan
Ikuti satu per satu agar kondisi greenhouse kembali stabil.
```

### 17.1 Masalah perangkat

Judul:

> Cek masalah perangkat

Isi:

> {pesan_masalah}

Tindakan:

> Periksa kabel, daya, atau posisi sensor sebelum mengubah Batas Otomatis.

### 17.2 Perangkat offline

Judul:

> Sambungkan perangkat terlebih dahulu

Isi:

> Data terakhir diterima {waktu_lalu}. Angka di aplikasi belum menunjukkan kondisi terbaru.

Tindakan:

> Periksa listrik box Snowberry dan koneksi Wi-Fi greenhouse.

### 17.3 Data lama

Judul:

> Pastikan data sudah terbaru

Isi:

> Data terakhir masuk {waktu_lalu}. Kondisi greenhouse mungkin sudah berubah.

Tindakan:

> Tunggu pembaruan atau periksa koneksi perangkat.

### 17.4 Sensor

Pola judul:

> Cek {nama_kondisi}

Isi:

> {arti_kondisi}

Tindakan:

> {tindakan_sensor}

### 17.5 Tidak ada masalah

Judul:

> Tidak ada hal mendesak

Isi:

> Kondisi utama masih nyaman untuk fase {fase}.

Tindakan:

> Lanjutkan pemeriksaan rutin pagi dan sore.

Tombol:

> Kembali ke Beranda

---

## 18. Diagnostik perangkat

Halaman ini untuk pengguna ahli. Tetap gunakan Bahasa Indonesia dengan istilah teknis sebagai detail.

### 18.1 Header

Eyebrow:

> Perangkat

Judul:

> Diagnostik Snowberry

Subjudul:

> Informasi teknis untuk memeriksa koneksi, sensor, dan kerja perangkat.

### 18.2 Informasi sistem

| Label | Format/copy |
|---|---|
| Versi firmware | `Versi Firmware` |
| Lama menyala | `Perangkat Menyala Selama` |
| Alasan restart | `Penyebab Restart Terakhir` |
| Tahap inisialisasi | `Tahap Persiapan Perangkat` |
| Heap saat ini | `Memori Tersedia Saat Ini` |
| Heap minimum | `Memori Tersedia Terendah` |
| Loop maksimum | `Waktu Proses Terlama` |
| Overrun | `Proses Melewati Batas Waktu` |
| Wi-Fi | `Status Wi-Fi` |
| IP | `Alamat Jaringan` |
| NTP | `Status Waktu Perangkat` |
| Operasi jaringan | `Aktivitas Jaringan Terakhir` |
| Konfigurasi | `Pengaturan yang Diterapkan` |

### 18.3 Status sensor

- `Terbaca dan masih baru`
- `Terbaca, tetapi datanya sudah lama`
- `Tidak terbaca`
- `Nilai di luar rentang yang dapat dipercaya`
- `Sedang mencoba menghubungkan sensor kembali`

### 18.4 Status alat

Label:

> Perintah Alat

Penjelasan:

> Status ini menunjukkan perintah dari Snowberry. Aplikasi belum dapat memastikan kerja alat secara fisik. Pada halaman ini, perintah tersebut berasal dari GPIO perangkat.

Alasan blokir:

- `Diblokir karena data sensor tidak tersedia.`
- `Diblokir karena kalibrasi belum dapat digunakan.`
- `Diblokir karena masih dalam Jeda Resap.`
- `Diblokir karena Batas Jumlah Penyiraman sudah tercapai.`
- `Diblokir karena waktu perangkat belum tersedia.`
- `Diblokir karena berada di luar jadwal.`
- `Diblokir sementara setelah perangkat dinyalakan ulang.`

### 18.5 Copy tindakan diagnostik

- `Salin Informasi Diagnostik`
- `Informasi diagnostik disalin.`
- `Coba Hubungkan Sensor Kembali`
- `Periksa Pembaruan Data`

Jangan menyediakan tombol perubahan GPIO, polaritas, kalibrasi ADC, atau hard safety ceiling dari web.

---

## 19. Profil dan perangkat

### 19.1 Halaman profil

Eyebrow:

> Akun dan Perangkat

Judul:

> Pengaturan Akun

Bagian:

- `Nama Pengguna`
- `Alamat Email`
- `Nama Greenhouse`
- `Perangkat Terhubung`
- `Notifikasi`

Tombol:

- `Simpan Profil`
- `Lihat Diagnostik`
- `Keluar`

### 19.2 Notifikasi

Judul:

> Notifikasi Masalah

Penjelasan:

> Izinkan notifikasi agar Snowberry dapat memberi tahu saat perangkat atau sensor bermasalah.

Tombol:

- `Aktifkan Notifikasi`
- `Notifikasi Sudah Aktif`
- `Buka Pengaturan Browser`

Status ditolak:

> Notifikasi diblokir oleh browser. Buka pengaturan browser untuk mengaktifkannya.

### 19.3 Ganti perangkat

Dialog:

**Judul**

> Ganti perangkat yang terhubung?

**Isi**

> Data aplikasi akan beralih ke perangkat baru setelah kode berhasil diperiksa.

**Tombol**

- `Batal`
- `Ganti Perangkat`

---

## 20. Toast lengkap

### 20.1 Akun

- `Akun berhasil dibuat.`
- `Anda sudah masuk.`
- `Profil tersimpan.`
- `Anda sudah keluar dari akun.`

### 20.2 Perangkat

- `Perangkat berhasil dihubungkan.`
- `Nama greenhouse tersimpan.`
- `Perangkat kembali terhubung.`
- `Data terbaru sudah masuk.`

### 20.3 Batas Otomatis

- `Pengaturan tersimpan dan sedang diperiksa perangkat.`
- `Tersimpan di aplikasi, menunggu perangkat tersambung.`
- `Perangkat sudah memakai Batas Otomatis terbaru.`
- `Pengaturan belum tersimpan. Periksa koneksi lalu coba lagi.`
- `Perangkat menolak pengaturan. Periksa nilai lalu coba lagi.`

### 20.4 Kontrol manual

- `Kontrol manual {alat} aktif selama 30 menit.`
- `{alat} diperintahkan menyala.`
- `{alat} diperintahkan mati.`
- `Waktu kontrol manual ditambah 30 menit.`
- `{alat} sekarang mengikuti Batas Otomatis lagi.`
- `Kontrol manual {alat} selesai.`
- `Perintah alat diterapkan.`
- `Perintah ditolak untuk menjaga keamanan alat dan tanaman.`
- `Perintah sudah kedaluwarsa.`
- `Perangkat belum menjawab. Periksa koneksi lalu coba lagi.`

### 20.5 Jurnal

- `Catatan tanam tersimpan.`
- `Catatan panen tersimpan.`
- `Umur tanaman dihitung ulang dari hari ini.`

### 20.6 Sistem

- `Informasi diagnostik disalin.`
- `Notifikasi berhasil diaktifkan.`
- `Koneksi aplikasi kembali normal.`

---

## 21. Error dan empty state global

| Kondisi | Judul | Isi | Tindakan |
|---|---|---|---|
| Firebase gagal | `Aplikasi belum dapat terhubung` | `Periksa koneksi internet lalu coba lagi.` | `Coba Lagi` |
| Izin Firestore | `Akses perangkat ditolak` | `Akun ini belum punya akses ke perangkat tersebut.` | `Kembali` |
| Data status kosong | `Data greenhouse belum tersedia` | `Perangkat belum mengirim kondisi terbaru.` | `Periksa Perangkat` |
| Config kosong | `Batas Otomatis belum tersedia` | `Gunakan nilai awal atau tunggu perangkat terhubung.` | `Pakai Nilai Awal` |
| Telemetry kosong | `Riwayat belum tersedia` | `Data akan muncul setelah perangkat mengirim pembacaan sensor.` | Tidak ada |
| Profil kosong | `Greenhouse belum disiapkan` | `Isi nama greenhouse dan tahap tanaman untuk mulai.` | `Mulai Pengaturan` |
| Perangkat kosong | `Belum ada perangkat` | `Hubungkan perangkat Snowberry terlebih dahulu.` | `Hubungkan Perangkat` |
| Kesalahan tak dikenal | `Terjadi masalah` | `Aplikasi belum dapat menyelesaikan tindakan ini.` | `Coba Lagi` |

Jangan tampilkan pesan Firebase, HTTP, exception, atau stack trace mentah kepada petani.

---

## 22. Notifikasi browser

### 22.1 Perangkat offline

Judul:

> Snowberry - Perangkat Tidak Terhubung

Isi:

> Data belum masuk lebih dari 5 menit. Periksa listrik box Snowberry dan Wi-Fi greenhouse.

### 22.2 Sensor suhu/kelembapan

Judul:

> Snowberry - Sensor Udara Bermasalah

Isi:

> Data suhu atau kelembapan udara tidak tersedia. Periksa sensor dan kabelnya.

### 22.3 Sensor cahaya

Judul:

> Snowberry - Sensor Cahaya Bermasalah

Isi:

> Data cahaya tidak tersedia. Lampu otomatis dapat dihentikan sementara.

### 22.4 Sensor media

Judul:

> Snowberry - Sensor Media Bermasalah

Isi:

> Data kelembapan media tidak tersedia. Pompa otomatis dihentikan sementara.

### 22.5 Kalibrasi

Judul:

> Snowberry - Kalibrasi Media Perlu Dicek

Isi:

> Pompa otomatis dihentikan karena kalibrasi media belum dapat digunakan.

### 22.6 Batas Jumlah Penyiraman

Judul:

> Snowberry - Batas Jumlah Penyiraman Tercapai

Isi:

> Pompa sudah mencapai Batas Jumlah Penyiraman pada periode ini.

### 22.7 Pengaturan diterapkan

Judul:

> Snowberry - Pengaturan Diterapkan

Isi:

> Perangkat sudah memakai Batas Otomatis terbaru.

---

## 23. Copy aksesibilitas

Gunakan label berikut:

- `Navigasi utama`
- `Kondisi utama`
- `Grafik {nama_sensor}`
- `Pilih rentang riwayat`
- `Pilih kondisi riwayat`
- `Buka penjelasan {nama_sensor}`
- `Status {nama_sensor}: {status}`
- `Tutup dialog`
- `Informasi {nama_bagian}`
- `Tahap pertumbuhan`
- `Kontrol {nama_alat}`

Toast memakai `role="status"` dan `aria-live="polite"`. Masalah bahaya memakai `role="alert"`. Jangan memasukkan informasi penting hanya ke tooltip atau warna.

---

## 24. Copy yang dilarang

Jangan gunakan:

- `Aktuator berhasil bekerja.`
- `Pompa pasti menyala.`
- `Penyiraman berhasil.`
- `Kabut keluar normal.`
- `Kipas berputar.`
- `Lampu fisik menyala.`
- `Perangkat sudah memakai pengaturan baru.` sebelum `applied_config_id` cocok.
- `Aman` jika data sensor tidak tersedia atau sudah kedaluwarsa.
- `Offline` tanpa penjelasan bahwa kontrol lokal tetap berjalan.
- `Superadmin` sebagai label halaman.
- `Threshold`, `fault`, `actuator`, `config`, atau `manual override` sebagai label utama.
- Pesan teknis mentah seperti `permission-denied`, `deadline-exceeded`, `NACK`, atau `HTTP 403` pada UI petani.
- Klaim bahwa stroberi putih aman bagi orang yang alergi. Klaim tersebut terlalu luas untuk copy perawatan.

---

## 25. Checklist penerapan copy

Sebelum frontend dianggap selesai:

- [ ] Semua halaman utama memakai Bahasa Indonesia.
- [ ] Istilah mengikuti tabel pada dokumen ini.
- [ ] Setiap status memiliki label teks.
- [ ] Data tidak tersedia tidak pernah disebut aman.
- [ ] Status alat dibedakan dari bukti kerja fisik.
- [ ] Penyimpanan cloud dibedakan dari penerapan perangkat.
- [ ] Copy pompa menyebut pulsa, jeda, dan batas keselamatan dengan benar.
- [ ] Manual lampu/pelembap saat sensor gagal menampilkan peringatan khusus.
- [ ] Kontrol manual pompa tidak pernah disebut menyala selama 30 menit.
- [ ] Perangkat tidak terhubung dan aplikasi tidak terhubung memiliki pesan berbeda.
- [ ] Nilai agresif diberi peringatan, tetapi tetap dapat disimpan dalam batas firmware.
- [ ] Error teknis mentah tidak tampil kepada petani.
- [ ] Tombol memakai kata kerja yang menjelaskan hasil tindakan.
- [ ] Dialog perubahan alat atau pengaturan menjelaskan dampaknya.
- [ ] Copy nyaman dibaca di layar 360 px tanpa paragraf panjang.
