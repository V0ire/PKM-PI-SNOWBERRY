#!/usr/bin/env node
// ============================================================================
// Snowberry Seed Gap v2 — ANCHORED backfill
// ----------------------------------------------------------------------------
// Berbeda dari v1: kurva tidak lagi generik. Setiap tanggal punya JANGKAR
// (anchor) dari sampel ASLI yang benar-benar terekam, dan seluruh kurva
// diinterpolasi melewati titik-titik itu. Sampel asli dipertahankan apa
// adanya; hanya slot kosong yang diisi (ditandai src:"backfill").
//
// Pemakaian: node seed-gap.mjs <config.local.json> <YYYY-MM-DD> [tanggal lain...]
// ============================================================================

import { readFileSync } from "node:fs";

const CONFIG_PATH = process.argv[2] ?? new URL("./config.local.json", import.meta.url).pathname;
const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
const DATES = process.argv.slice(3);
if (DATES.length === 0) {
  console.error("Pemakaian: node seed-gap.mjs <config> <YYYY-MM-DD> [tanggal lain...]");
  process.exit(1);
}

const STEP_MIN = 5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function signIn() {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${cfg.apiKey}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: cfg.email, password: cfg.password, returnSecureToken: true }),
  });
  if (!res.ok) throw new Error(`auth gagal ${res.status}`);
  return (await res.json()).idToken;
}

async function getDoc(token, dateId) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/devices/${cfg.deviceId}/telemetry/${dateId}`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`baca ${dateId} gagal ${res.status}`);
  return res.json();
}

function numOf(f) {
  if (!f) return null;
  if ("doubleValue" in f && Number.isFinite(Number(f.doubleValue))) return Number(f.doubleValue);
  if ("integerValue" in f && Number.isFinite(Number(f.integerValue))) return Number(f.integerValue);
  return null;
}

const wibHour = (ts) => {
  const w = Number(ts) + 7 * 3600_000;
  return ((w % 86_400_000) / 3600_000);
};
const tsFor = (dateId, hour) => Date.parse(`${dateId}T00:00:00+07:00`) + hour * 3600_000;

function interp(anchors, hour) {
  if (hour <= anchors[0][0]) return anchors[0][1];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [h0, v0] = anchors[i];
    const [h1, v1] = anchors[i + 1];
    if (hour >= h0 && hour <= h1) return v0 + ((v1 - v0) * (hour - h0)) / (h1 - h0);
  }
  return anchors[anchors.length - 1][1];
}

// ---- Jangkar per tanggal (dari sampel ASLI + fisika greenhouse Ciwidey) -----
// Format: [jamDesimal, nilai]. Titik yang berasal langsung dari data asli
// ditandai komentar "ASLI".
const DAY_ANCHORS = {
  // Cerah ekstrem; jangkar ASLI: 14.21–15.09 -> T 25.4–25.9, RH 71–78, lux 12.3–16.1rb, soil ~50
  "2026-08-24": {
    t: [[0, 18], [3, 17.4], [5.5, 17.8], [6.5, 19.2], [8, 21.8], [10, 24.2], [12, 25.8], [13.5, 26.4], [14.35, 25.7] /*ASLI*/, [15.25, 24.1] /*ASLI*/, [16.5, 24.8], [18, 23], [20, 21], [22, 19.4], [24, 18]],
    h: [[0, 87], [3, 89], [5.5, 88], [7, 84], [9, 79], [11, 74], [13, 71.5], [14.5, 72.8] /*ASLI*/, [15.1, 76.5] /*ASLI*/, [17, 74], [19, 78], [21, 83], [24, 87]],
    l: [[0, 0], [5.6, 0], [6.2, 400], [7.2, 2600], [8.2, 6000], [9.2, 9300], [10.2, 11900], [11.2, 14800], [12.4, 16800], [13.5, 16500], [14.5, 15600] /*ASLI*/, [15.2, 12800] /*ASLI*/, [16.2, 10200], [17.2, 4800], [18, 900], [18.5, 0], [24, 0]],
    s: [[0, 62], [6, 57], [10, 51], [13, 47], [14.5, 49] /*ASLI*/, [15.2, 51] /*ASLI*/, [16, 54], [18, 57], [21, 60], [24, 62]],
  },
  // Mendung hangat & kering; jangkar ASLI: 10.30 -> T 25.6, RH 51.3, lux 2497, soil 95.9
  "2026-08-25": {
    t: [[0, 20.2], [3, 19.6], [5.5, 19.8], [7, 21.6], [9, 24], [10.5, 25.6] /*ASLI*/, [12, 26.8], [13.5, 27.4], [15.5, 26.4], [18, 23.8], [20.5, 21.8], [23, 20.6], [24, 20.2]],
    h: [[0, 66], [3, 68], [5.5, 65], [7, 59], [9, 53], [10.5, 51.3] /*ASLI*/, [12, 49], [13.5, 48], [16, 51], [18, 56], [20.5, 61], [23, 65], [24, 66]],
    l: [[0, 0], [5.6, 0], [6.2, 120], [7.2, 650], [8.2, 1250], [9.2, 1900], [10.5, 2497] /*ASLI*/, [12, 3800], [13, 4400], [14, 4100], [15.5, 3100], [16.5, 2100], [17.5, 800], [18.2, 0], [24, 0]],
    s: [[0, 94.5], [6, 94], [10.5, 95.9] /*ASLI*/, [13, 94.5], [16, 93.5], [19, 94], [24, 94.5]],
  },
  // Gerimis dingin; jangkar ASLI: 09.23–09.58 -> T 19.3, RH 86.8, lux 743, soil 96.9
  "2026-08-26": {
    t: [[0, 17.8], [3, 17.2], [5.5, 17.4], [7, 18.2], [9.4, 19.3] /*ASLI*/, [11, 20.2], [13, 21.4], [14.5, 21.8], [16.5, 20.8], [18.5, 19.6], [21, 18.6], [24, 17.9]],
    h: [[0, 91], [3, 92], [5.5, 91], [7, 89], [9.4, 86.8] /*ASLI*/, [12, 82], [14, 80], [16.5, 83], [19, 87], [21.5, 89.5], [24, 91]],
    l: [[0, 0], [5.6, 0], [6.2, 60], [7.2, 280], [8.2, 520], [9.4, 743] /*ASLI*/, [11, 1050], [12.5, 1400], [14, 1250], [15.5, 1000], [17, 450], [18, 80], [18.5, 0], [24, 0]],
    s: [[0, 96.6], [9.4, 96.9] /*ASLI*/, [14, 96.4], [19, 96.8], [24, 96.6]],
  },
};

function generateDay(dateId, realSamples) {
  const A = DAY_ANCHORS[dateId];
  if (!A) throw new Error(`tidak ada jangkar untuk ${dateId}`);
  // Slot yang dekat sampel asli tidak digenerate (jaga kemurnian data asli).
  const realTs = realSamples.map((x) => Number(x.ts.integerValue));
  const nearReal = (ts) => realTs.some((r) => Math.abs(r - ts) < 4 * 60_000);

  const out = [];
  for (let min = 0; min < 1440; min += STEP_MIN) {
    const hour = min / 60;
    const ts = tsFor(dateId, hour);
    if (ts > Date.now()) continue; // JANGAN pernah men-seed masa depan.
    if (nearReal(ts)) continue;
    out.push({
      t: { doubleValue: Math.round(interp(A.t, hour) * 10 + (Math.random() - 0.5) * 3) / 10 },
      h: { doubleValue: Math.round(Math.min(97, Math.max(40, interp(A.h, hour) + (Math.random() - 0.5) * 2)) * 10) / 10 },
      l: { integerValue: String(Math.max(0, Math.round(interp(A.l, hour) * (0.94 + Math.random() * 0.12)))) },
      s: { doubleValue: Math.round(interp(A.s, hour) * 10 + (Math.random() - 0.5) * 4) / 10 },
      gl: { booleanValue: false },
      p: { booleanValue: false },
      m: { booleanValue: false },
      f: { booleanValue: interp(A.h, hour) > 85 && interp(A.l, hour) < 50 },
      ts: { integerValue: String(ts) },
      src: { stringValue: "backfill" },
    });
  }
  return out;
}

async function commitFullDoc(token, dateId, allFields) {
  const doc = `projects/${cfg.projectId}/databases/(default)/documents/devices/${cfg.deviceId}/telemetry/${dateId}`;
  const body = {
    writes: [{
      update: {
        name: doc,
        fields: {
          device_id: { stringValue: cfg.deviceId },
          date: { stringValue: dateId },
          d: { arrayValue: { values: allFields.map((fields) => ({ mapValue: { fields } })) } },
        },
      },
    }],
  };
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents:commit`,
    { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`commit ${dateId} gagal ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

const token = await signIn();
for (const dateId of DATES) {
  try {
    const docJson = await getDoc(token, dateId);
    const arr = (docJson?.fields?.d?.arrayValue?.values || []).map((v) => v.mapValue?.fields).filter(Boolean);
    const real = arr.filter((x) => x.src?.stringValue !== "backfill");
    const generated = generateDay(dateId, real);
    const merged = [...real, ...generated].sort((a, b) => Number(a.ts.integerValue) - Number(b.ts.integerValue));
    await commitFullDoc(token, dateId, merged);
    console.log(`${dateId}: asli ${real.length} dipertahankan + backfill ${generated.length} = total ${merged.length} ✅`);
  } catch (err) {
    console.error(`${dateId} ERROR:`, err.message);
  }
  await sleep(1500);
}
