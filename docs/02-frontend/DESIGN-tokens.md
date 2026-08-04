# Design Tokens Snowberry

Sumber kebenaran visual untuk `web-app/`. Dokumen ini menggantikan `DESIGN-starbucks.md`
sebagai acuan implementasi. Isinya hanya token yang benar-benar dipakai di
`web-app/src/styles.css`.

Aturan: kalau nilai visual tidak ada di sini, jangan mengarangnya. Tambahkan token dulu.

---

## 1. Prinsip

1. **Petani dulu, bukan engineer.** Label berupa kalimat, bukan istilah teknis.
2. **Mobile-first 360px.** Semua layout wajib enak dipakai di layar 360px.
3. **Status tidak pernah hanya warna.** Selalu ada teks penjelasan.
4. **Tenang, bukan ramai.** Satu aksen hijau, kartu putih, kanvas krem.
5. **Tanpa dekorasi tanpa fungsi.** Tidak ada gradien, animasi, atau ikon hiasan.

---

## 2. Warna

### Hijau merek

| Token | Nilai | Peran |
|---|---|---|
| `--color-green` | `#006241` | Judul utama, identitas merek |
| `--color-green-action` | `#00754a` | Tombol utama, border status aman |
| `--color-green-dark` | `#1e3932` | Panel gelap, kartu ringkasan, toast |
| `--color-green-light` | `#d4e9e2` | Latar status aman, tint lembut |

### Kanvas dan permukaan

| Token | Nilai | Peran |
|---|---|---|
| `--color-cream` | `#f2f0eb` | Latar halaman |
| `--color-ceramic` | `#edebe9` | Pemisah zona, latar status belum ada data |
| `--color-card` | `#fffefd` | Permukaan kartu |
| `--color-card-soft` | `#f8f6f2` | Kartu bertingkat di dalam kartu |
| `--color-input` | `#ffffff` | Latar field input |
| `--color-nav` | `#ffffff` | Latar navigasi bawah |

### Teks dan garis

| Token | Nilai | Peran |
|---|---|---|
| `--color-text` | `rgba(0,0,0,0.87)` | Teks utama |
| `--color-text-soft` | `rgba(0,0,0,0.58)` | Teks sekunder, metadata |
| `--color-border` | `rgba(0,0,0,0.12)` | Garis kartu dan field |

### Status

Empat status wajib, sesuai `UI_UX_SNOWBERRY_PETANI_ID.md`.

| Status | Latar | Teks | Border | Arti |
|---|---|---|---|---|
| Aman | `--status-safe-bg` | `--status-safe-text` | `--status-safe-border` | Kondisi normal |
| Perlu Cek | `--status-warning-bg` | `--status-warning-text` | `--status-warning-border` | Mulai keluar batas |
| Bahaya | `--status-danger-bg` | `--status-danger-text` | `--status-danger-border` | Perlu tindakan |
| Belum Ada Data | `--status-unknown-bg` | `--status-unknown-text` | `--status-unknown-border` | Sensor/perangkat diam |

`--color-gold` (`#cba258`) hanya untuk penanda fase panen. Bukan aksen umum.

---

## 3. Tipografi

Font: `"Nunito Sans", "Helvetica Neue", Helvetica, Arial, sans-serif`.
Satu keluarga font untuk seluruh aplikasi. Tidak ada serif, tidak ada script.

| Peran | Ukuran | Bobot |
|---|---|---|
| Angka sensor besar | 36px | 800 |
| Judul halaman (h1) | 24px | 700 |
| Judul kartu (h2) | 17-18px | 700 |
| Isi teks | 16px | 400 |
| Label field | 14px | 600 |
| Eyebrow / caption | 13px | 700, uppercase |
| Label navigasi | 11px | 600 |

Aturan:

- Isi teks minimal 16px. Jangan pernah di bawah 13px.
- Angka desimal pakai koma: `24,8 °C`. Ribuan pakai titik: `1.850 lux`.
- Satuan selalu terpisah dari angka input, ditampilkan sebagai suffix field.

---

## 4. Bentuk dan Kedalaman

| Token | Nilai | Peran |
|---|---|---|
| `--radius-card` | `20px` | Semua kartu dan modal |
| `--radius-pill` | `50px` | Tombol, pill status, navigasi bawah |
| `--shadow-card` | 3 lapis halus | Kartu |
| `--shadow-float` | 2 lapis | Modal, toast |

Hanya dua level kedalaman: kartu dan mengapung. Tidak ada level ketiga.

---

## 5. Spasi

Kelipatan 4px. Yang dipakai: `4 6 8 10 12 14 16 20 24 32`.

- Padding kartu: `16px` (kecil) atau `20px` (utama)
- Jarak antar kartu: `16px`
- Padding halaman: `16px`, turun ke `12px` di bawah 380px

---

## 6. Aturan Mobile

- **Target sentuh minimal 44x44px.** Termasuk tombol ikon.
- Tinggi navigasi bawah: `--bottom-nav-height` = `64px`. Isi halaman wajib punya
  padding bawah `bottom-nav-height + 52px` agar tidak tertutup.
- Navigasi bawah maksimal 5 tab, satu baris. Kalau butuh tab ke-6, pindahkan
  ke dalam halaman, jangan tambah kolom.
- Breakpoint: `max-width: 379px` (HP kecil), `min-width: 720px` (tablet),
  `min-width: 1024px` (desktop). Default CSS adalah tampilan HP.
- Tidak boleh ada scroll horizontal di 360px.

---

## 7. Aksesibilitas

- Kontras teks minimal 4.5:1, atau 3:1 untuk teks 24px ke atas.
- Modal wajib `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
- Perubahan yang memengaruhi perangkat wajib lewat dialog konfirmasi yang
  menampilkan nilai sebelum dan sesudah.
- Tombol simpan mati saat form belum diubah atau masih ada error.

---

## 8. Catatan Riwayat

`DESIGN-starbucks.md` sebelumnya menjadi acuan visual. Dokumen itu menjelaskan
sistem desain ritel Starbucks lengkap: font SoDoSans, tingkatan Gold Rewards,
tombol "Frap", fotografi gift card. Bagian tersebut tidak pernah dipakai dan
tidak relevan untuk alat greenhouse.

Yang diambil dan tetap berlaku: palet hijau, kanvas krem, tombol pill, dan
bayangan lembut. Semuanya sudah dicatat di dokumen ini.

`DESIGN-starbucks.md` disimpan sebagai referensi asal-usul saja, bukan acuan kerja.
