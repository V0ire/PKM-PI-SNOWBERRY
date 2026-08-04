import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForSelector(".bottom-nav button", { timeout: 20_000 });
await page.waitForTimeout(1200);

const shots: Array<[string, () => Promise<void>]> = [
  ["1-beranda", async () => {}],
  [
    "2-tanaman",
    async () => {
      await page.getByRole("button", { name: /Tanaman/ }).click();
      await page.waitForSelector(".growth-card");
    },
  ],
  [
    "3-edukasi",
    async () => {
      await page.getByRole("button", { name: /Panduan Lengkap/ }).click();
      await page.waitForSelector(".edu-list");
    },
  ],
  [
    "4-alat",
    async () => {
      await page.getByRole("button", { name: /Alat/ }).click();
      await page.waitForTimeout(900);
    },
  ],
  [
    "5-riwayat",
    async () => {
      await page.getByRole("button", { name: /Riwayat/ }).click();
      await page.waitForSelector(".chart-card");
      await page.waitForTimeout(700);
    },
  ],
  [
    "6-riwayat-30hari",
    async () => {
      await page.getByRole("button", { name: /30 Hari/ }).click();
      await page.waitForTimeout(1500);
    },
  ],
  [
    "7-pengaturan",
    async () => {
      await page.getByRole("button", { name: /Atur/ }).click();
      await page.waitForTimeout(900);
    },
  ],
];

for (const [name, act] of shots) {
  await act();
  await page.screenshot({ path: `/tmp/ui-${name}.png`, fullPage: false });
  console.log(`/tmp/ui-${name}.png`);
}

await browser.close();
