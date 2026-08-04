// Cek kesiapan PWA pada build produksi: npx tsx scripts/qa-pwa.ts
import { chromium } from "playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
const failed: string[] = [];
page.on("requestfailed", (r) => failed.push(r.url()));
await page.goto(process.env.QA_URL ?? "http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForSelector(".bottom-nav button", { timeout: 15_000 });

// Service worker harus benar-benar terdaftar dan aktif.
const swState = await page.evaluate(`(function () {
  if (!("serviceWorker" in navigator)) return Promise.resolve("unsupported");
  return navigator.serviceWorker.ready.then(function (reg) {
    return reg.active ? reg.active.state : "no-active";
  });
})()`);
assert.equal(swState, "activated", `service worker tidak aktif: ${swState}`);

const manifest = (await page.evaluate(`fetch("/manifest.webmanifest").then(function (r) { return r.json(); })`)) as {
  name: string;
  start_url: string;
  display: string;
  icons: Array<{ src: string; sizes: string; type: string }>;
};

assert.ok(manifest.name.length > 0, "manifest tanpa nama");
assert.equal(manifest.display, "standalone", `display salah: ${manifest.display}`);
assert.ok(manifest.icons.length > 0, "manifest tanpa ikon");

// Android butuh ikon raster 192px dan 512px untuk prompt "Pasang aplikasi".
const raster = manifest.icons.filter((i) => i.type !== "image/svg+xml");
const sizes = raster.flatMap((i) => i.sizes.split(/\s+/));
const has192 = sizes.some((s) => s.startsWith("192"));
const has512 = sizes.some((s) => s.startsWith("512"));

// Semua ikon harus benar-benar bisa diunduh.
for (const icon of manifest.icons) {
  const status = await page.evaluate(
    `fetch(${JSON.stringify(icon.src)}).then(function (r) { return r.status; })`,
  );
  assert.equal(status, 200, `ikon ${icon.src} tidak ditemukan (${status})`);
}

assert.equal(failed.length, 0, `request gagal: ${failed.join(", ")}`);
await browser.close();

assert.ok(has192 && has512, `manifest belum punya ikon PNG 192 & 512 (ada: ${sizes.join(", ") || "hanya SVG"})`);
console.log(`qa-pwa: service worker aktif, manifest valid, ${manifest.icons.length} ikon OK`);
