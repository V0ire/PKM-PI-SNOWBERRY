// Backfill data riwayat DEMO yang realistis untuk hari-hari sebelum hari ini.
// Pemakaian: node firebase/backfill-demo.mjs   (baca kredensial dari simulator/.env)
// Dokumen ditandai source="backfill-demo" agar jelas ini data sintetis, bukan hasil sensor.
// Pola meniru greenhouse Ciwidey: suhu puncak ~13.30, siram otomatis 15-18,
// lampu tanam 18-20, kelembapan invers suhu, lux ikut siang + lonjakan lampu malam.
import { readFileSync } from "node:fs";

const parseEnv = (p) => Object.fromEntries(
  readFileSync(p, "utf8").split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")]; })
);
const env = parseEnv(new URL("../simulator/.env", import.meta.url));

const auth = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.SNOWBERRY_API_KEY}`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: env.SNOWBERRY_DEVICE_EMAIL, password: env.SNOWBERRY_DEVICE_PASSWORD, returnSecureToken: true }),
});
if (!auth.ok) throw new Error(`auth gagal: ${auth.status}`);
const { idToken } = await auth.json();
const headers = { authorization: `Bearer ${idToken}`, "content-type": "application/json" };
const base = `https://firestore.googleapis.com/v1/projects/${env.SNOWBERRY_PROJECT_ID}/databases/(default)/documents`;
const deviceId = env.SNOWBERRY_DEVICE_ID || "snowberry-001";

const wibToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(Date.now());
const daysBack = Number(process.argv[2] ?? 7);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const noise = (amp) => (Math.random() - 0.5) * 2 * amp;

function generateDay(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Kepribadian hari: ada yang lebih panas/mendung/kering dari hari lain.
  const hotOffset = -1.5 + Math.random() * 4.5;        // beberapa hari ekstra panas
  const coldNight = Math.random() < 0.3 ? 1.5 + Math.random() * 1.5 : 0; // malam dingin ekstra
  const humidOffset = -4 + Math.random() * 8;
  const eveningHumid = Math.random() < 0.35 ? 5 + Math.random() * 6 : 0; // malam lembap (hujan sore)
  const cloud = 0.35 + Math.random() * 0.8;            // mendung pekat s/d cerah
  const dryness = 0.8 + Math.random() * 0.9;           // ada hari yang keros lebih cepat
  const overwater = Math.random() < 0.25;              // sesekali penyiraman kelewat banyak
  const pulses = Array.from({ length: 2 + Math.floor(Math.random() * 2) }, () => {
    const start = 15 * 60 + Math.floor(Math.random() * 160);
    return [start, start + 6];
  });
  // ESP32 sesekali offline (WiFi mati/listrik drop): 0-2 jeda per hari, 25 menit-3 jam.
  const offlineWindows = [];
  const nOffline = Math.floor(Math.random() * 2.4);
  for (let i = 0; i < nOffline; i++) {
    const start = Math.floor(Math.random() * 1440);
    offlineWindows.push([start, start + 25 + Math.floor(Math.random() * 155)]);
  }
  const isOffline = (mins) => offlineWindows.some(([a, b]) => mins >= a && mins < b);

  let soil = 64 + Math.random() * 5;
  const points = [];
  for (let mins = 0; mins < 1440; mins += 5) {
    if (isOffline(mins)) continue; // jeda data jujur: perangkat tidak konek
    const hour = mins / 60;
    const ts = Date.UTC(y, m - 1, d, 0, mins) - 7 * 3600 * 1000;
    const nightExtra = hour < 6 ? coldNight : 0;
    const temp = 20.5 + hotOffset + 5.5 * Math.exp(-((hour - 13.5) ** 2) / (2 * 3.2 ** 2))
      - 1.5 * Math.exp(-((hour - 4) ** 2) / (2 * 2.5 ** 2)) - nightExtra + noise(0.45);
    const humidity = clamp(88 - (temp - 19) * 2.2 + humidOffset
      + (hour >= 18 ? eveningHumid : 0) + noise(1.4), 52, 97);
    const daylight = hour >= 6 && hour <= 18 ? Math.sin((Math.PI * (hour - 6)) / 12) : 0;
    const gl = hour >= 18 && hour < 20;
    const lux = Math.round(daylight * 6500 * cloud + noise(150) + (gl ? 1900 + noise(200) : 0));
    const inPulse = pulses.some(([a, b]) => mins >= a && mins < b);
    if (inPulse) soil += ((overwater ? 79 : 70) - soil) * 0.35;
    else {
      const decay = (hour >= 9 && hour < 15 ? 0.22 : hour >= 6 && hour < 9 ? 0.12 : 0.06) * dryness;
      soil -= decay;
    }
    soil = clamp(soil + noise(0.5), 29, 86);
    points.push({
      t: Math.round(temp * 10) / 10,
      h: Math.round(humidity * 10) / 10,
      l: Math.max(0, lux),
      s: Math.round(soil * 10) / 10,
      gl,
      p: inPulse,
      m: humidity <= 63 && temp < 25,
      f: temp >= 25.5,
      ts,
    });
  }
  return { points, offlineWindows };
}

const toFsFields = (point) => ({
  mapValue: { fields: {
    t: { doubleValue: point.t }, h: { doubleValue: point.h },
    l: { integerValue: String(point.l) }, s: { doubleValue: point.s },
    gl: { booleanValue: point.gl }, p: { booleanValue: point.p },
    m: { booleanValue: point.m }, f: { booleanValue: point.f },
    ts: { integerValue: String(point.ts) },
  } },
});

// 1) Hapus dokumen telemetry lama yang kosong/sampah (bukan hari ini).
const list = await fetch(`${base}/devices/${deviceId}/telemetry?pageSize=50`, { headers });
const existing = (await list.json()).documents ?? [];
let deleted = 0;
for (const doc of existing) {
  const name = doc.name.split("/").pop();
  if (name === wibToday) continue;
  const count = (doc.fields?.d?.arrayValue?.values ?? []).length;
  const del = await fetch(`${base}/devices/${deviceId}/telemetry/${name}`, { method: "DELETE", headers });
  // Rules bisa menolak DELETE (403) — laporkan apa adanya, jangan mengaku sukses.
  console.log(`${del.ok ? "hapus" : "GAGAL hapus (HTTP ${del.status}, abaikan)"} dokumen ${name} (${count} titik)`);
}

// 2) Isi 7 hari terakhir (di luar hari ini) dengan pola realistis.
for (let offset = daysBack; offset >= 1; offset--) {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(Date.now() - offset * 86_400_000);
  const { points, offlineWindows } = generateDay(date);
  const body = { fields: {
    device_id: { stringValue: deviceId },
    date: { stringValue: date },
    source: { stringValue: "backfill-demo" },
    d: { arrayValue: { values: points.map(toFsFields) } },
  } };
  const res = await fetch(`${base}/devices/${deviceId}/telemetry/${date}`, {
    method: "PATCH", headers, body: JSON.stringify(body),
  });
  const gapInfo = offlineWindows.length
    ? `, ${offlineWindows.length} jeda offline (${offlineWindows.map(([a, b]) => `${Math.round((b - a) / 60)} jam ${String(a % 60).padStart(2, "0")}m`).join(", ")})`
    : ", tanpa jeda";
  console.log(`${res.ok ? "OK " : "GAGAL"} ${date}: ${points.length} titik${gapInfo}${res.ok ? "" : ` HTTP ${res.status}`}`);
}
console.log(`\nSelesai. ${deleted} dokumen sampah dihapus, ${daysBack} hari di-backfill (source=backfill-demo). Hari ini tidak disentuh.`);
