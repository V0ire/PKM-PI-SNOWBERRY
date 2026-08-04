// Cek mandiri skala batang sensor. Jalankan: npx tsx src/utils/gaugeScale.check.ts
import assert from "node:assert/strict";
import { gaugeScale } from "./gaugeScale";

// Nilai tepat di tengah batas aman harus jatuh di tengah area hijau.
const tengah = gaugeScale(70, 60, 80, "%");
const hijauTengah = tengah.bandStartPercent + tengah.bandWidthPercent / 2;
assert.ok(Math.abs(tengah.markerPercent - hijauTengah) < 0.01, "nilai tengah tidak di tengah pita");
assert.equal(tengah.bandLabel, "60–80%");

// Area hijau tidak boleh memenuhi seluruh batang: harus ada ruang di kedua sisi.
assert.ok(tengah.bandStartPercent > 5, `pita mepet kiri: ${tengah.bandStartPercent}`);
assert.ok(
  tengah.bandStartPercent + tengah.bandWidthPercent < 95,
  `pita mepet kanan: ${tengah.bandStartPercent + tengah.bandWidthPercent}`,
);

// Nilai di luar batas harus tergambar DI LUAR area hijau — inti perbaikan cincin lama.
const terlaluLembap = gaugeScale(85, 60, 80, "%");
const ujungHijau = terlaluLembap.bandStartPercent + terlaluLembap.bandWidthPercent;
assert.ok(
  terlaluLembap.markerPercent > ujungHijau,
  `85% harus di kanan pita (marker ${terlaluLembap.markerPercent} vs ujung ${ujungHijau})`,
);

const terlaluKering = gaugeScale(45, 60, 80, "%");
assert.ok(
  terlaluKering.markerPercent < terlaluKering.bandStartPercent,
  "45% harus di kiri pita",
);

// Nilai ekstrem tetap masuk batang (0–100), tidak terpotong keluar.
for (const nilai of [0, 5, 200, 1000]) {
  const s = gaugeScale(nilai, 60, 80, "%");
  assert.ok(s.markerPercent >= 0 && s.markerPercent <= 100, `nilai ${nilai} keluar batang: ${s.markerPercent}`);
}

// Data kosong tidak boleh membuat NaN.
const kosong = gaugeScale(null, 60, 80, "%");
assert.equal(kosong.markerPercent, 0);
assert.ok(Number.isFinite(kosong.bandWidthPercent), "lebar pita NaN saat data kosong");

// Batas identik (konfigurasi aneh) tidak boleh membagi nol.
const rusak = gaugeScale(50, 50, 50, "%");
assert.ok(Number.isFinite(rusak.bandWidthPercent), "batas identik menghasilkan NaN");
assert.ok(Number.isFinite(rusak.markerPercent), "batas identik menghasilkan marker NaN");

// Format lux dipendekkan agar muat di layar 360px.
const cahaya = gaugeScale(3000, 2000, 5000, " lux", (n) => (n >= 1000 ? `${Math.round(n / 1000)}rb` : String(n)));
assert.equal(cahaya.bandLabel, "2rb–5rb lux");

console.log("gaugeScale.check: 14 asserts lolos");
