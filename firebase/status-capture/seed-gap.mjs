#!/usr/bin/env node
// ============================================================================
// Snowberry Seed Gap — isi jendela waktu yang datanya hilang sebelum capture
// berjalan. Data dihasilkan dari pola harian realistis greenhouse stroberi
// Ciwidey (mengikuti rentang nyata 17–23 Agu) dan DITANDAI src:"backfill"
// agar jelas terpisah dari data sensor asli.
//
// Pemakaian: node seed-gap.mjs <YYYY-MM-DD> <jamMulai> <jamSelesai>
// Contoh:    node seed-gap.mjs 2026-08-24 0 24
//            node seed-gap.mjs 2026-08-25 0 10
// ============================================================================

import { readFileSync } from "node:fs";

const CONFIG_PATH = process.argv[2] ?? new URL("./config.local.json", import.meta.url).pathname;
const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
const [date, startH, endH] = [process.argv[3], Number(process.argv[4]), Number(process.argv[5])];

if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || Number.isNaN(startH) || Number.isNaN(endH)) {
  console.error("Pemakaian: node seed-gap.mjs <config.local.json> <YYYY-MM-DD> <jamMulai> <jamSelesai>");
  process.exit(1);
}

const STEP_MIN = 5; // grid 5 menit, konsisten dengan hari-hari sehat (±288 sampel/hari)
// Jendela yang sudah terisi (data asli firmware / backfill sebelumnya / capture
// live) — dilewati agar tidak ada sampel kembar.
const SKIP_RANGES = [
  { date: "2026-08-24", fromMin: 14 * 60 + 15, toMin: 15 * 60 + 15 }, // 49 sampel asli firmware lama
  { date: "2026-08-25", fromMin: 0, toMin: 10 * 60 + 5 },             // backfill pagi + sampel capture 10:30
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function signIn() {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${cfg.apiKey}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: cfg.email, password: cfg.password, returnSecureToken: true }),
  });
  if (!res.ok) throw new Error(`auth gagal ${res.status}`);
  return (await res.json()).idToken;
}

// ---- Model kurva harian (interpolasi antar titik jam) ----------------------
function interp(anchors, hour) {
  for (let i = 0; i < anchors.length - 1; i++) {
    const [h0, v0] = anchors[i];
    const [h1, v1] = anchors[i + 1];
    if (hour >= h0 && hour <= h1) return v0 + ((v1 - v0) * (hour - h0)) / (h1 - h0);
  }
  return anchors[anchors.length - 1][1];
}

const TEMP = [[0, 18.5], [4, 17.8], [6, 19.5], [8, 23], [10, 26], [12, 27.5], [13.5, 28], [16, 26.5], [18, 23], [20, 21], [22, 19.5], [24, 18.5]];
const RH = [[0, 88], [4, 91], [6, 86], [8, 76], [10, 71], [12, 68], [13.5, 66], [16, 69], [18, 74], [20, 80], [22, 85], [24, 88]];
const SOIL = [[0, 64], [6, 58], [10, 50], [14, 46], [15, 45], [16, 52], [18, 55], [22, 61], [24, 64]];
const LUX = [[0, 0], [5.7, 0], [6, 150], [7, 600], [8, 1400], [9, 2200], [10, 2900], [11, 3400], [12, 3800], [13, 3600], [14, 3200], [15, 2600], [16, 1800], [17, 900], [17.8, 100], [18.2, 0], [24, 0]];

function generateDay() {
  const samples = [];
  for (let min = startH * 60; min < endH * 60; min += STEP_MIN) {
    if (SKIP_RANGES.some((r) => r.date === date && min >= r.fromMin && min < r.toMin)) continue;
    const hour = min / 60;
    const ts = Date.parse(`${date}T${String(Math.floor(hour)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}:00+07:00`);
    const t = interp(TEMP, hour) + (Math.random() - 0.5) * 0.8;
    const h = Math.min(97, Math.max(55, interp(RH, hour) + (Math.random() - 0.5) * 3));
    const s = Math.min(70, Math.max(29, interp(SOIL, hour) + (Math.random() - 0.5) * 1.6));
    const cloud = 0.75 + Math.sin(min / 47) * 0.2 + (Math.random() - 0.5) * 0.15;
    const l = Math.max(0, Math.round(interp(LUX, hour) * cloud));
    // Kipas menyala saat malam lembap; pengabut & pompa idle di luar pola siram.
    const f = l === 0 && h > 87;
    samples.push({
      t: { doubleValue: Math.round(t * 10) / 10 },
      h: { doubleValue: Math.round(h * 10) / 10 },
      l: { integerValue: String(l) },
      s: { doubleValue: Math.round(s * 10) / 10 },
      gl: { booleanValue: false },
      p: { booleanValue: false },
      m: { booleanValue: false },
      f: { booleanValue: f },
      ts: { integerValue: String(ts) },
      src: { stringValue: "backfill" },
    });
  }
  return samples;
}

async function commitSamples(samples, dateId) {
  const doc = `projects/${cfg.projectId}/databases/(default)/documents/devices/${cfg.deviceId}/telemetry/${dateId}`;
  const body = {
    writes: [
      {
        update: { name: doc, fields: { device_id: { stringValue: cfg.deviceId }, date: { stringValue: dateId } } },
        updateMask: { fieldPaths: ["device_id", "date"] },
      },
      {
        transform: {
          document: doc,
          fieldTransforms: [{
            fieldPath: "d",
            appendMissingElements: { values: samples.map((fields) => ({ mapValue: { fields } })) },
          }],
        },
      },
    ],
  };
  const token = await signIn();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents:commit`,
    { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`commit gagal ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

const samples = generateDay();
if (samples.length === 0) {
  console.log("tidak ada slot pada jendela itu.");
  process.exit(0);
}
console.log(`seed ${date} ${startH}:00–${endH}:00 -> ${samples.length} sampel (src=backfill)...`);
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    await commitSamples(samples, date);
    console.log("OK, tersimpan.");
    process.exit(0);
  } catch (err) {
    console.error(`percobaan ${attempt} gagal:`, err.message);
    if (attempt < 3) await sleep(5000);
  }
}
process.exit(1);
