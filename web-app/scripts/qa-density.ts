// Anggaran kata per halaman. Mencegah teks membengkak lagi setelah dibersihkan.
// Petani membaca sambil berdiri di greenhouse: sedikit kata, satu tindakan jelas.
// Jalankan: npx tsx scripts/qa-density.ts
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { EDU_SECTIONS, FUN_FACTS } from "../src/data/education";

const MAX_WORDS: Record<string, number> = {
  Beranda: 90,
  Tanaman: 130,
  Alat: 110,
  Riwayat: 100,
  Atur: 180,
};
const MAX_SENTENCE_WORDS = 12;

// 1. Cek konten statis tanpa browser.
const longPoints: string[] = [];
for (const section of EDU_SECTIONS) {
  for (const point of [...section.points, section.summary]) {
    // Pisah per kalimat: satu poin boleh dua kalimat pendek.
    for (const sentence of point.split(/(?<=[.:])\s+/)) {
      const words = sentence.trim().split(/\s+/).filter(Boolean).length;
      if (words > MAX_SENTENCE_WORDS) longPoints.push(`${words} kata: ${sentence.trim()}`);
    }
  }
}
for (const fact of FUN_FACTS) {
  const words = fact.split(/\s+/).filter(Boolean).length;
  if (words > MAX_SENTENCE_WORDS) longPoints.push(`${words} kata (fakta): ${fact}`);
}
if (longPoints.length) console.log(longPoints.join("\n"));
assert.equal(longPoints.length, 0, `${longPoints.length} kalimat melebihi ${MAX_SENTENCE_WORDS} kata`);

// 2. Tidak ada fakta yang mengulang isi panduan.
const allPoints = EDU_SECTIONS.flatMap((s) => s.points).join(" ").toLowerCase();
const dupes = FUN_FACTS.filter((fact) => {
  const key = fact.toLowerCase().split(/\s+/).filter((w) => w.length > 6).slice(0, 3);
  return key.length >= 3 && key.every((w) => allPoints.includes(w));
});
assert.equal(dupes.length, 0, `fakta mengulang isi panduan: ${dupes.join(" | ")}`);

// 3. Kepadatan tiap halaman di lebar ponsel.
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(process.env.QA_URL ?? "http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForSelector(".bottom-nav button", { timeout: 20_000 });
await page.waitForTimeout(1200);

const over: string[] = [];
const longOnScreen: string[] = [];
for (const [tab, budget] of Object.entries(MAX_WORDS)) {
  await page.getByRole("button", { name: new RegExp(tab) }).click();
  await page.waitForTimeout(1100);
  const words = (await page.evaluate(
    `document.body.innerText.split(/\\s+/).filter(Boolean).length`,
  )) as number;
  const mark = words > budget ? "LEBIH" : "ok";
  console.log(`  ${tab.padEnd(11)} ${String(words).padStart(4)} / ${budget} kata  ${mark}`);
  if (words > budget) over.push(`${tab}: ${words} > ${budget}`);

  // Kalimat panjang yang benar-benar tampil (termasuk teks di dalam JSX).
  const long = (await page.evaluate(`(function () {
    var out = [];
    var nodes = document.querySelectorAll("p, li");
    for (var i = 0; i < nodes.length; i += 1) {
      var raw = (nodes[i].innerText || "").trim();
      if (!raw) continue;
      var parts = raw.split(/(?<=[.:])\\s+/);
      for (var j = 0; j < parts.length; j += 1) {
        var n = parts[j].trim().split(/\\s+/).filter(Boolean).length;
        if (n > ${MAX_SENTENCE_WORDS}) out.push(n + " kata: " + parts[j].trim());
      }
    }
    return out;
  })()`)) as string[];
  for (const item of long) longOnScreen.push(`${tab} | ${item}`);
}

await browser.close();
if (longOnScreen.length) console.log(longOnScreen.join("\n"));
assert.equal(
  longOnScreen.length,
  0,
  `${longOnScreen.length} kalimat tampil melebihi ${MAX_SENTENCE_WORDS} kata`,
);
assert.equal(over.length, 0, `halaman melebihi anggaran kata: ${over.join(", ")}`);
console.log("qa-density: semua halaman di bawah anggaran kata");
