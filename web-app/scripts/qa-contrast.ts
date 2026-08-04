// Cek kontras WCAG AA pada teks kecil: npx tsx scripts/qa-contrast.ts
import { chromium } from "playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
await page.goto(process.env.QA_URL ?? "http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForSelector(".bottom-nav button", { timeout: 15_000 });
await page.getByRole("button", { name: /Tanaman/ }).click();
await page.waitForSelector(".growth-card");
await page.getByRole("button", { name: /Panduan Lengkap/ }).click();
await page.waitForSelector(".edu-list");

// Dijalankan sebagai string: esbuild (tsx) menyuntik __name ke closure bersarang
// dan itu tidak ada di dalam browser.
const SELECTOR = ".edu-toggle strong, .edu-toggle em, .edu-item li, .edu-footer p, .bottom-nav span";
const failures = (await page.evaluate(`(function () {
  function parse(c) { return c.match(/[\\d.]+/g).map(Number); }
  function lum(rgb) {
    var out = [];
    for (var i = 0; i < 3; i += 1) {
      var s = rgb[i] / 255;
      out.push(s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4));
    }
    return 0.2126 * out[0] + 0.7152 * out[1] + 0.0722 * out[2];
  }
  function bgOf(el) {
    var node = el;
    while (node) {
      var bg = parse(getComputedStyle(node).backgroundColor);
      if (bg.length < 4 || bg[3] > 0) return bg;
      node = node.parentElement;
    }
    return [255, 255, 255];
  }

  var out = [];
  var nodes = document.querySelectorAll(${JSON.stringify(SELECTOR)});
  for (var i = 0; i < nodes.length; i += 1) {
    var el = nodes[i];
    var cs = getComputedStyle(el);
    var size = parseFloat(cs.fontSize);
    var bold = Number(cs.fontWeight) >= 700;
    var large = size >= 24 || (size >= 18.66 && bold);
    var l1 = lum(parse(cs.color));
    var l2 = lum(bgOf(el));
    var ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (ratio < (large ? 3 : 4.5)) {
      out.push({
        text: (el.textContent || "").trim().slice(0, 45),
        ratio: Math.round(ratio * 100) / 100,
        size: size,
        cls: el.className || el.tagName
      });
    }
  }
  return out;
})()`)) as Array<{ text: string; ratio: number; size: number; cls: string }>;

await browser.close();

if (failures.length) console.log(JSON.stringify(failures, null, 1));
assert.equal(failures.length, 0, `${failures.length} teks gagal kontras WCAG AA`);
console.log("qa-contrast: semua teks halaman Edukasi lolos WCAG AA");
