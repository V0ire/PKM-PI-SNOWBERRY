// QA visual otomatis di 360px (viewport petani). Jalankan saat preview aktif:
//   npx tsx scripts/qa-history.ts
import { chromium } from "playwright";
import assert from "node:assert/strict";

const URL = process.env.QA_URL ?? "http://127.0.0.1:5173/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector(".bottom-nav button", { timeout: 15_000 });

// --- Nav: 5 tab satu baris, target sentuh >= 44px ---
const nav = await page.evaluate(() => {
  const bar = document.querySelector(".bottom-nav")!;
  const btns = Array.from(bar.querySelectorAll("button"));
  const tops = new Set(btns.map((b) => Math.round(b.getBoundingClientRect().top)));
  return {
    count: btns.length,
    rows: tops.size,
    labels: btns.map((b) => b.textContent!.trim()),
    minHeight: Math.min(...btns.map((b) => b.getBoundingClientRect().height)),
    overflows: btns.some((b) => b.scrollWidth > b.clientWidth + 1),
    position: getComputedStyle(bar).position,
  };
});
assert.equal(nav.count, 5, `nav punya ${nav.count} tab`);
assert.equal(nav.rows, 1, `nav pecah jadi ${nav.rows} baris di 360px`);
assert.ok(!nav.overflows, "label nav terpotong di 360px");
assert.ok(nav.minHeight >= 44, `tinggi tombol nav ${nav.minHeight}px < 44px`);
assert.equal(nav.position, "fixed");

// Kartu sensor: angka tidak boleh pecah dua baris dan batang harus sejajar
// per baris grid. Dulu "1.850 lux" terpotong sehingga batangnya turun sendiri.
const gauges = (await page.evaluate(`(() => {
  return Array.from(document.querySelectorAll(".sensor-gauge")).map((c) => {
    const v = c.querySelector(".gauge-value");
    const track = c.querySelector(".band-track");
    const label = c.querySelector(".gauge-label");
    return {
      label: label ? label.textContent.trim() : "",
      valueHeight: Math.round(v.getBoundingClientRect().height),
      lineHeight: parseFloat(getComputedStyle(v).lineHeight),
      cardTop: Math.round(c.getBoundingClientRect().top),
      barTop: track ? Math.round(track.getBoundingClientRect().top) : null,
    };
  });
})()`)) as Array<{
  label: string;
  valueHeight: number;
  lineHeight: number;
  cardTop: number;
  barTop: number | null;
}>;
assert.ok(gauges.length >= 4, `kartu sensor hanya ${gauges.length}`);
for (const g of gauges) {
  assert.ok(
    g.valueHeight <= Math.ceil(g.lineHeight) + 2,
    `angka ${g.label} pecah ${Math.round(g.valueHeight / g.lineHeight)} baris`,
  );
  assert.ok(g.barTop !== null, `batang rentang hilang di ${g.label}`);
}
// Kartu sebaris (cardTop sama) harus punya batang pada tinggi yang sama.
const rowTops = Array.from(new Set(gauges.map((g) => g.cardTop)));
for (const top of rowTops) {
  const bars = gauges.filter((g) => g.cardTop === top).map((g) => g.barTop!);
  const spread = Math.max(...bars) - Math.min(...bars);
  assert.ok(spread <= 2, `batang tidak sejajar di baris y=${top} (selisih ${spread}px)`);
}

// Teks "Diperbarui ..." ada di hero gelap: harus kontras, bukan token teks gelap.
// Catatan: dievaluasi sebagai string, bukan arrow function — tsx menyuntik
// helper __name ke fungsi bersarang dan itu tidak ada di dalam browser.
const heroUpdated = await page.evaluate(`(() => {
  const el = document.querySelector(".hero-updated");
  if (!el) return null;
  const parse = (c) => c.match(/[\\d.]+/g).slice(0, 3).map(Number);
  const lum = (rgb) => {
    const v = rgb.map((n) => {
      const s = n / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  let node = el;
  let bg = "rgba(0, 0, 0, 0)";
  while (node) {
    const s = getComputedStyle(node);
    // Hero memakai gradient, jadi backgroundColor-nya transparan.
    // Ambil warna pertama dari background-image bila ada.
    const img = s.backgroundImage;
    if (img && img !== "none") {
      const m = img.match(/rgba?\\([^)]+\\)|#[0-9a-f]{3,8}/i);
      if (m) { bg = m[0]; break; }
    }
    const c = s.backgroundColor;
    if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") { bg = c; break; }
    node = node.parentElement;
  }
  const parseAny = (c) => {
    if (c.charAt(0) === "#") {
      let h = c.slice(1);
      if (h.length === 3) h = h.split("").map((x) => x + x).join("");
      return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
    }
    return parse(c);
  };
  // Alpha bisa datang dari opacity ATAU dari rgba() pada color.
  const colorRaw = getComputedStyle(el).color;
  const colorParts = colorRaw.match(/[\\d.]+/g).map(Number);
  const colorAlpha = colorParts.length > 3 ? colorParts[3] : 1;
  const alpha = (parseFloat(getComputedStyle(el).opacity) || 1) * colorAlpha;
  const fg = colorParts.slice(0, 3);
  const bgRgb = parseAny(bg);
  // Perhitungkan opacity: teks putih 75% di atas hijau tua.
  const blended = fg.map((v, i) => v * alpha + bgRgb[i] * (1 - alpha));
  const l1 = lum(blended);
  const l2 = lum(bgRgb);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return { ratio: Math.round(ratio * 100) / 100, text: el.textContent.trim(), bg: bg };
})()`) as { ratio: number; text: string; bg: string } | null;
assert.ok(heroUpdated, "teks 'Diperbarui' hilang dari hero");
assert.ok(
  heroUpdated!.ratio >= 4.5,
  `"${heroUpdated!.text}" kontras ${heroUpdated!.ratio}:1 di hero (min 4.5:1)`,
);


// --- Teks di kartu gelap harus terang: cek kontras nyata terhadap latar induk ---
// Regresi nyata: label "Berbunga" pernah memakai token teks gelap di atas
// kartu hijau tua yang sewarna, jadi praktis tidak terlihat.
const CONTRAST_PROBE = (sel: string) => `((sel) => {
  const els = Array.from(document.querySelectorAll(sel));
  const parse = (c) => c.match(/[\\d.]+/g).map(Number);
  const lum = (rgb) => {
    const v = rgb.slice(0, 3).map((n) => {
      const s = n / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  const solidBg = (start) => {
    let n = start;
    while (n) {
      const s = getComputedStyle(n);
      const img = s.backgroundImage;
      if (img && img !== "none") {
        const m = img.match(/rgba?\\([^)]+\\)|#[0-9a-f]{3,8}/i);
        if (m) return m[0];
      }
      const c = s.backgroundColor;
      if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") {
        const p = parse(c);
        if (p.length < 4 || p[3] > 0.9) return c;
      }
      n = n.parentElement;
    }
    return "rgb(255, 255, 255)";
  };
  const toRgb = (c) => {
    if (c.charAt(0) === "#") {
      let h = c.slice(1);
      if (h.length === 3) h = h.split("").map((x) => x + x).join("");
      return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
    }
    return parse(c);
  };
  return els.map((el) => {
    const s = getComputedStyle(el);
    const fgParts = parse(s.color);
    const a = (parseFloat(s.opacity) || 1) * (fgParts.length > 3 ? fgParts[3] : 1);
    const bg = toRgb(solidBg(el));
    const blended = fgParts.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
    const l1 = lum(blended);
    const l2 = lum(bg);
    return {
      text: el.textContent.trim().slice(0, 40),
      ratio: Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100,
    };
  });
})(${JSON.stringify(sel)})`;

await page.getByRole("button", { name: /Tanaman/ }).click();
await page.waitForSelector(".phase-timeline");
const phaseLabels = (await page.evaluate(CONTRAST_PROBE(".phase-name"))) as Array<{
  text: string;
  ratio: number;
}>;
assert.equal(phaseLabels.length, 3, `label fase harus 3, dapat ${phaseLabels.length}`);
for (const l of phaseLabels) {
  assert.ok(l.ratio >= 4.5, `label fase "${l.text}" kontras ${l.ratio}:1 (min 4.5:1)`);
}

// Tidak ada bar persen /90 hari yang menyiratkan tanam selesai.
const hasProgress = await page.evaluate(
  `document.querySelectorAll(".growth-card .progress-bar, .growth-card progress").length`,
);
assert.equal(hasProgress, 0, "bar persen masih ada di kartu fase");

await page.getByRole("button", { name: /Beranda/ }).click();
await page.waitForSelector(".sensor-gauge");

// --- Tidak ada overflow horizontal di 360px ---
const overflow = await page.evaluate(() => ({
  doc: document.documentElement.scrollWidth,
  win: window.innerWidth,
}));
assert.ok(overflow.doc <= overflow.win + 1, `overflow horizontal: ${overflow.doc} > ${overflow.win}`);

// --- Riwayat: 3 rentang, downsample, pita batas ---
await page.getByRole("button", { name: /Riwayat/ }).click();
await page.waitForSelector(".segmented button");

const ranges = await page.$$eval(".segmented button", (bs) => bs.map((b) => b.textContent!.trim()));
assert.deepEqual(ranges, ["Hari Ini", "7 Hari", "30 Hari"]);

async function readRange(label: string) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.waitForTimeout(1200);
  return page.evaluate(() => {
    const rect = document.querySelector("svg .chart-band") as SVGRectElement | null;
    const card = document.querySelector(".chart-card")!.getBoundingClientRect();
    const summary = document.querySelector(".history-summary")!.getBoundingClientRect();
    const y = rect ? +rect.getAttribute("y")! : 0;
    const h = rect ? +rect.getAttribute("height")! : 0;
    return {
      points: (document.querySelector(".chart-card svg polyline")?.getAttribute("points") ?? "")
        .split(" ").filter(Boolean).length,
      dots: document.querySelectorAll(".chart-card svg circle").length,
      edges: document.querySelectorAll("svg .chart-band-edge").length,
      bandTop: y,
      bandHeight: h,
      heading: document.querySelector(".history-summary h2")?.textContent?.trim() ?? "",
      note: document.querySelector(".chart-band-note")?.textContent?.trim() ?? "",
      axis: Array.from(document.querySelectorAll(".chart-axis span")).map((s) => s.textContent!.trim()),
      cardWidth: Math.round(card.width),
      summaryWidth: Math.round(summary.width),
    };
  });
}

const today = await readRange("Hari Ini");
const d7 = await readRange("7 Hari");
const d30 = await readRange("30 Hari");

// Downsample benar-benar mengurangi titik, bukan sekadar slice.
assert.ok(d30.points <= 121, `30 hari menggambar ${d30.points} titik`);
assert.ok(d30.points > 20, `30 hari hanya ${d30.points} titik`);
assert.ok(d7.points > today.points, "7 hari harus punya lebih banyak titik dari hari ini");

// Titik bulat hanya untuk data pendek.
assert.ok(today.dots > 0, "hari ini harus menampilkan titik");
assert.equal(d30.dots, 0, "30 hari tidak boleh menggambar ratusan titik");

// Sumbu berubah jadi tanggal untuk rentang multi-hari.
assert.ok(/^\d{2}\.\d{2}$/.test(today.axis[0]), `sumbu hari ini bukan jam: ${today.axis[0]}`);
assert.ok(/[A-Za-z]/.test(d30.axis[0]), `sumbu 30 hari bukan tanggal: ${d30.axis[0]}`);

// Pita batas tampil, tidak memenuhi seluruh tinggi plot, punya 2 garis tepi.
for (const [name, r] of [["hari ini", today], ["7 hari", d7], ["30 hari", d30]] as const) {
  assert.ok(r.bandHeight > 0, `pita batas hilang di ${name}`);
  assert.ok(r.bandHeight <= 68, `pita batas memenuhi plot di ${name} (${r.bandHeight})`);
  assert.ok(r.bandTop > 16, `pita batas menempel tepi atas di ${name} (${r.bandTop})`);
  assert.equal(r.edges, 2, `garis tepi batas kurang di ${name}`);
  // Catatan pita harus menyebut rentang nyaman (kata "nyaman" menggantikan "batas aman").
  assert.ok(r.note.includes("nyaman"), `catatan batas hilang di ${name}: ${r.note}`);
}

// Kartu grafik selebar kartu lain (regresi grid 2 kolom).
assert.ok(
  Math.abs(d30.cardWidth - d30.summaryWidth) <= 4,
  `lebar kartu grafik ${d30.cardWidth} != ringkasan ${d30.summaryWidth}`,
);

// Deteksi masalah dari data mentah: rentang lebih panjang tidak boleh
// mendadak "aman" saat rentang pendek bermasalah.
if (today.heading.includes("perlu perhatian")) {
  assert.ok(
    d30.heading.includes("perlu perhatian"),
    `30 hari bilang "${d30.heading}" padahal hari ini bermasalah — rata-rata bucket menyembunyikan lonjakan`,
  );
}

// --- Tanaman: fase tumbuh (FR-06) ---
await page.getByRole("button", { name: /Tanaman/ }).click();
await page.waitForSelector(".growth-card", { timeout: 10_000 });

const growth = await page.evaluate(() => {
  const card = document.querySelector(".growth-card")!;
  return {
    heading: document.querySelector("h1")?.textContent?.trim() ?? "",
    hstLine: card.querySelector(".eyebrow")?.textContent?.trim() ?? "",
    phaseTitle: card.querySelector("h2")?.textContent?.trim() ?? "",
    // Garis waktu fase menggantikan bar /90 hari.
    timelineSteps: document.querySelectorAll(".phase-timeline li").length,
    currentSteps: document.querySelectorAll(".phase-timeline li.current").length,
    // Batas kondisi HANYA di Pengaturan: kartu target tidak boleh ada di sini.
    hasTargetCard: !!document.querySelector(".target-card"),
    hasAdvice: !!document.querySelector(".phase-advice-card"),
    hasRisk: !!document.querySelector(".phase-risk"),
    // Fase disebut sekali saja: hitung berapa kali "Hari ke-" muncul.
    hstMentions: (card.textContent!.match(/Hari ke-/g) ?? []).length,
    journalButtons: Array.from(document.querySelectorAll(".journal-actions button")).map((b) =>
      b.textContent!.trim(),
    ),
  };
});

assert.equal(growth.heading, "Fase Tanam", `judul Tanaman salah: ${growth.heading}`);
assert.ok(/Hari ke-\d+/.test(growth.hstLine), `HST tidak tampil: ${growth.hstLine}`);
assert.equal(growth.hstMentions, 1, `umur tanaman disebut ${growth.hstMentions} kali, harus 1`);
assert.ok(growth.phaseTitle.length > 0, "judul fase kosong");
assert.equal(growth.timelineSteps, 3, `garis waktu fase harus 3 tahap, dapat ${growth.timelineSteps}`);
assert.equal(growth.currentSteps, 1, `tahap aktif harus tepat 1, dapat ${growth.currentSteps}`);
assert.equal(growth.hasTargetCard, false, "kartu Target Kondisi masih ada (batas hanya di Pengaturan)");
assert.ok(growth.hasAdvice && growth.hasRisk, "panduan/risiko fase hilang");
assert.deepEqual(growth.journalButtons, ["Tanam", "Panen"]);

// Jurnal panen: masuk daftar TANPA mereset umur tanaman.
// Dulu panen selalu mereset HST ke 0 diam-diam — petani kehilangan umur tanaman
// hanya karena mencatat hasil panen. Sekarang reset harus dipilih sadar.
const hstBefore = Number(growth.hstLine.match(/\d+/)![0]);
await page.getByRole("button", { name: "Panen", exact: true }).click();
await page.waitForSelector('[role="dialog"]');

// Untuk Panen, kotak "mulai siklus baru" harus MATI secara bawaan.
const harvestToggle = await page.evaluate(
  () => (document.querySelector('.checkbox-field input') as HTMLInputElement).checked,
);
assert.equal(harvestToggle, false, "panen tidak boleh mereset siklus secara bawaan");

await page.getByRole("button", { name: /Simpan Panen/ }).click();
await page.waitForTimeout(1200);

const afterJournal = await page.evaluate(() => ({
  dialogOpen: !!document.querySelector('[role="dialog"]'),
  entries: document.querySelectorAll(".journal-list article").length,
  hstLine: document.querySelector(".growth-card .eyebrow")?.textContent?.trim() ?? "",
}));
assert.ok(!afterJournal.dialogOpen, "dialog jurnal tidak tertutup setelah simpan");
assert.equal(afterJournal.entries, 1, `jurnal berisi ${afterJournal.entries} catatan`);
const hstAfter = Number(afterJournal.hstLine.match(/\d+/)![0]);
assert.equal(hstAfter, hstBefore, `panen mereset HST tanpa diminta: ${hstBefore} -> ${hstAfter}`);

// Tanam: kotak siklus baru HARUS hidup secara bawaan, dan HST kembali ke 0.
await page.getByRole("button", { name: "Tanam", exact: true }).click();
await page.waitForSelector('[role="dialog"]');
const plantToggle = await page.evaluate(
  () => (document.querySelector('.checkbox-field input') as HTMLInputElement).checked,
);
assert.equal(plantToggle, true, "tanam harus memulai siklus baru secara bawaan");
await page.getByRole("button", { name: /Simpan Tanam/ }).click();
await page.waitForTimeout(1200);
const afterPlanting = await page.evaluate(
  () => document.querySelector(".growth-card .eyebrow")?.textContent?.trim() ?? "",
);
assert.equal(
  Number(afterPlanting.match(/\d+/)![0]),
  0,
  `HST tidak direset setelah tanam: ${afterPlanting}`,
);

// Nav benar-benar fixed dan tidak menutupi judul kartu saat scroll penuh.
const navTopBefore = await page.evaluate(
  () => document.querySelector(".bottom-nav")!.getBoundingClientRect().top,
);
await page.evaluate(() => window.scrollBy(0, 300));
await page.waitForTimeout(400);
const navTopAfter = await page.evaluate(
  () => document.querySelector(".bottom-nav")!.getBoundingClientRect().top,
);
assert.ok(
  Math.abs(navTopBefore - navTopAfter) < 2,
  `nav ikut scroll (geser ${Math.abs(navTopBefore - navTopAfter)}px) — bukan fixed`,
);

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(400);
const coveredHeadings = await page.evaluate(() => {
  const nav = document.querySelector(".bottom-nav")!.getBoundingClientRect();
  return Array.from(document.querySelectorAll(".page-stack h2, .page-stack h3"))
    .filter((h) => {
      const r = h.getBoundingClientRect();
      return r.bottom > nav.top && r.top < nav.bottom;
    })
    .map((h) => h.textContent!.trim());
});
assert.equal(
  coveredHeadings.length,
  0,
  `judul tertutup nav di dasar halaman: ${coveredHeadings.join(", ")}`,
);

// --- Edukasi (FR-07) ---
await page.getByRole("button", { name: /Tanaman/ }).click();
await page.waitForSelector(".growth-card");
await page.getByRole("button", { name: /Panduan Lengkap/ }).click();
await page.waitForSelector(".edu-list", { timeout: 10_000 });

const edu = await page.evaluate(() => {
  const toggles = Array.from(document.querySelectorAll(".edu-toggle"));
  return {
    heading: document.querySelector("h1")?.textContent?.trim() ?? "",
    sections: toggles.length,
    titles: toggles.map((t) => t.querySelector("strong")!.textContent!.trim()),
    expanded: toggles.filter((t) => t.getAttribute("aria-expanded") === "true").length,
    openPoints: document.querySelectorAll(".edu-item.open li").length,
    minToggleHeight: Math.min(...toggles.map((t) => t.getBoundingClientRect().height)),
    navActive: document.querySelector(".bottom-nav button.active")?.textContent?.trim() ?? "",
  };
});

assert.equal(edu.heading, "Panduan Stroberi Putih", `judul edukasi salah: ${edu.heading}`);
assert.equal(edu.sections, 5, `bagian edukasi ada ${edu.sections}, PRD minta 5`);
assert.equal(edu.expanded, 1, "harus tepat satu bagian terbuka");
assert.ok(edu.openPoints >= 4, `bagian terbuka hanya ${edu.openPoints} poin`);
assert.ok(edu.minToggleHeight >= 44, `tombol accordion ${edu.minToggleHeight}px < 44px`);
assert.ok(edu.navActive.includes("Tanaman"), `nav aktif salah saat di Edukasi: ${edu.navActive}`);

// Accordion benar-benar buka/tutup.
await page.getByRole("button", { name: /Tanda Siap Panen/ }).click();
await page.waitForTimeout(400);
const afterToggle = await page.evaluate(() => {
  const open = document.querySelector(".edu-item.open .edu-toggle strong")?.textContent?.trim() ?? "";
  return { open, openCount: document.querySelectorAll(".edu-item.open").length };
});
assert.equal(afterToggle.openCount, 1, "lebih dari satu bagian terbuka");
assert.ok(afterToggle.open.includes("Panen"), `bagian yang terbuka salah: ${afterToggle.open}`);

// Tombol kembali mengembalikan ke halaman Tanaman.
await page.getByRole("button", { name: /Kembali ke Tanaman/ }).click();
await page.waitForSelector(".growth-card", { timeout: 5_000 });

// Tab Alat tetap punya isinya sendiri (tidak ikut kebawa GrowthPhasePage).
await page.getByRole("button", { name: /Alat/ }).click();
await page.waitForTimeout(900);
const toolsHasGrowth = await page.evaluate(() => !!document.querySelector(".growth-card"));
assert.ok(!toolsHasGrowth, "tab Alat ikut menampilkan kartu fase tanam");

await browser.close();
console.log(
  `qa-history: semua cek lolos @360px (titik: hari ini ${today.points}, 7h ${d7.points}, 30h ${d30.points})`,
);
