Ikuti AGENTS.md.

Gunakan skill repo internet yang relevan kalau tersedia:
- create-plan untuk rencana kerja kecil
- webapp-testing untuk validasi frontend
- theme-factory jika perlu menerapkan design system
- ponytail untuk menghindari over-engineering
- caveman untuk jawaban ringkas

Tugas pertama:
Kerjakan hanya di folder `web-app/`.

Buat frontend mock Snowberry Smart Greenhouse untuk petani stroberi putih Ciwidey.

Wajib baca dan ikuti:
1. `docs/02-frontend/DESIGN-starbucks.md` untuk color palette, font, spacing, card style, layout, dan visual direction.
2. `docs/00-antigravity/UI_UX_SNOWBERRY_PETANI_ID.md` untuk bahasa UI petani.
3. `docs/01-product/ux-flow.md` untuk struktur halaman.
4. `docs/03-technical/api-contract.md` hanya untuk bentuk mock data, belum integrasi Firebase.

Untuk tahap pertama, jangan integrasi Firebase dulu.
Gunakan mock data lokal.

Yang harus dibuat dulu:
1. Setup web app React + Vite + TypeScript jika belum ada.
2. Dashboard mobile-first.
3. Kartu sensor:
   - Suhu Udara
   - Kelembapan Udara
   - Cahaya
   - Kelembapan Tanah
4. Kartu alat:
   - Lampu Tanam
   - Pompa Air
   - Kabut
   - Kipas
5. Status:
   - Aman
   - Perlu Perhatian
   - Bahaya
   - Offline
6. Navigasi sederhana:
   - Dashboard
   - Batas Otomatis
   - Riwayat
   - Fase Tanam
7. Halaman Batas Otomatis pakai form mock.
8. Halaman Riwayat pakai grafik/placeholder data dummy.
9. Halaman Fase Tanam menampilkan HST dan fase tanaman.
10. Loading, empty state, dan error state dalam Bahasa Indonesia.

Batasan:
- Jangan buat backend.
- Jangan buat Firebase integration.
- Jangan buat admin panel.
- Jangan buat multi-farm SaaS.
- Jangan buat AI diagnosis.
- Jangan ubah isi `docs/`.
- Jangan over-engineering.
- Setelah selesai, jalankan `npm run build` jika tersedia dan laporkan hasilnya.

Output yang saya mau:
1. Sebutkan file yang dibuat/diubah.
2. Jelaskan singkat struktur komponen.
3. Jelaskan cara menjalankan web app.
4. Sebutkan apakah build berhasil.
