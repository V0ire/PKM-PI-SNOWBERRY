// Cek fakta pembuka benar-benar acak: npx tsx scripts/qa-facts.ts
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { FUN_FACTS } from "../src/data/education";

const browser = await chromium.launch();
const seen = new Set<string>();
const URL = process.env.QA_URL ?? "http://127.0.0.1:5173/";

for (let i = 0; i < 12; i += 1) {
  const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await page.goto(URL);
  await page.waitForSelector(".startup-screen p:last-of-type");
  const text = await page.evaluate(
    () => document.querySelector(".startup-screen p:last-of-type")!.textContent!.trim(),
  );
  seen.add(text.replace("Tahukah Anda? ", ""));
  await page.close();
}

await browser.close();

// Semua fakta yang muncul harus berasal dari pool PRD.
for (const fact of seen) {
  assert.ok(FUN_FACTS.includes(fact), `fakta di luar pool: ${fact}`);
}
assert.ok(seen.size >= 3, `fakta tidak acak, hanya ${seen.size} variasi dalam 12 muat ulang`);

console.log(`qa-facts: ${seen.size} fakta berbeda dari ${FUN_FACTS.length} pool (12x muat ulang)`);
