// Buat ikon PNG PWA dari SVG memakai Chromium (Playwright sudah terpasang).
// Jalankan ulang bila desain ikon berubah: npx tsx scripts/make-icons.ts
// ponytail: pakai browser sebagai perender agar tidak menambah dependensi
// (sharp/librsvg). Ganti ke sharp bila nanti butuh banyak ukuran otomatis.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const svg = readFileSync(new URL("../public/snowberry-icon.svg", import.meta.url), "utf-8");
const browser = await chromium.launch();

for (const size of [192, 512]) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<style>html,body{margin:0;padding:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  await page.locator("svg").screenshot({
    path: new URL(`../public/snowberry-icon-${size}.png`, import.meta.url).pathname,
    omitBackground: false,
  });
  await page.close();
  console.log(`public/snowberry-icon-${size}.png`);
}

await browser.close();
