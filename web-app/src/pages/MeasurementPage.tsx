import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";

const API_KEY = "snowberry.measurement.apiBase";
const RECORDS_KEY = "snowberry.measurement.records";

type ReadingValue = number | null;

type LivePayload = {
  ok: boolean;
  hostname?: string;
  ip?: string;
  wifi_connected?: boolean;
  wifi_rssi?: number;
  uptime_ms?: number;
  saved_count?: number;
  readings?: {
    temperature_c: ReadingValue;
    humidity_pct: ReadingValue;
    lux: ReadingValue;
    soil_raw_adc: number;
    soil_pct: ReadingValue;
    psu_voltage: ReadingValue;
  };
};

type MeasurementPoint = {
  id: string;
  label: string;
  category: "air" | "light" | "soil" | "power" | "cable";
  guide: string;
  defaultHeightCm?: string;
  needsCable?: boolean;
};

type SavedMeasurement = {
  id: string;
  point_id: string;
  label: string;
  category: MeasurementPoint["category"];
  sensor_height_cm: string;
  notes: string;
  photo_ref: string;
  cable_length_m: string;
  saved_at: string;
  sync_status: "local" | "esp32" | "failed";
  readings: NonNullable<LivePayload["readings"]>;
};

const POINTS: MeasurementPoint[] = [
  { id: "A1", label: "Luar greenhouse", category: "air", guide: "Ukur suhu/RH di luar sebagai pembanding.", defaultHeightCm: "80" },
  { id: "A2", label: "Dekat pintu masuk", category: "air", guide: "Tunggu 1-3 menit sampai suhu/RH stabil.", defaultHeightCm: "80" },
  { id: "A3", label: "Tengah bed tanaman", category: "air", guide: "Pegang sensor setinggi kanopi tanaman.", defaultHeightCm: "80" },
  { id: "A4", label: "Sisi bed kiri/kanan", category: "air", guide: "Bandingkan area pinggir dengan tengah bed.", defaultHeightCm: "80" },
  { id: "A5", label: "Area paling panas", category: "air", guide: "Cari titik yang terasa paling panas.", defaultHeightCm: "80" },
  { id: "A6", label: "Area paling lembap", category: "air", guide: "Cari titik dekat kondensasi/daun basah.", defaultHeightCm: "80" },
  { id: "L1", label: "Cahaya luar greenhouse", category: "light", guide: "Arahkan BH1750 ke atas, catat cuaca.", defaultHeightCm: "80" },
  { id: "L2", label: "Cahaya tengah bed", category: "light", guide: "Ukur lux di level kanopi tanaman.", defaultHeightCm: "80" },
  { id: "L3", label: "Area tanaman tergelap", category: "light", guide: "Pakai untuk rencana posisi growlight.", defaultHeightCm: "80" },
  { id: "L4", label: "Area kandidat growlight", category: "light", guide: "Foto area gantung lampu dan ukur tinggi.", defaultHeightCm: "80", needsCable: true },
  { id: "S1", label: "Media sangat basah", category: "soil", guide: "Baseline basah. Catat raw ADC, jangan asumsi dari internet." },
  { id: "S2", label: "Media normal lapangan", category: "soil", guide: "Masukkan sensor konsisten; catat kedalaman pada catatan." },
  { id: "S3", label: "Media kering jika tersedia", category: "soil", guide: "Baseline kering. Jika tidak ada, tulis tidak tersedia." },
  { id: "P1", label: "Sumber listrik ke box IoT", category: "power", guide: "Ukur rute aman stopkontak ke kandidat box IoT.", needsCable: true },
  { id: "C1", label: "Box IoT ke SHT30/BH1750", category: "cable", guide: "Ukur rute sensor I2C, usahakan pendek.", needsCable: true },
  { id: "C2", label: "Box IoT ke soil sensor", category: "cable", guide: "Jauhkan dari kabel power pompa.", needsCable: true },
  { id: "C3", label: "Box IoT ke pompa", category: "cable", guide: "Ukur rute 12V power/control. Butuh kabel motor lebih tebal.", needsCable: true },
  { id: "C4", label: "Box IoT ke mist disc", category: "cable", guide: "Ukur rute 24V terpisah, jauhkan elektronik dari kabut.", needsCable: true },
  { id: "C5", label: "Box IoT ke kipas", category: "cable", guide: "Ukur rute channel kipas 12V terpisah.", needsCable: true },
  { id: "C6", label: "Box IoT ke growlight", category: "cable", guide: "Ukur rute saja. Jangan wiring AC final di lapangan.", needsCable: true },
];

function loadRecords(): SavedMeasurement[] {
  try {
    return JSON.parse(window.localStorage.getItem(RECORDS_KEY) || "[]") as SavedMeasurement[];
  } catch {
    return [];
  }
}

function numberText(value: ReadingValue, unit = "") {
  if (value === null || value === undefined) return "-";
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value)}${unit ? ` ${unit}` : ""}`;
}

function cleanBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function MeasurementPage() {
  const [apiBase, setApiBase] = useState(() => window.localStorage.getItem(API_KEY) || "http://192.168.43.");
  const [live, setLive] = useState<LivePayload | null>(null);
  const [status, setStatus] = useState("Masukkan IP ESP32, lalu tes koneksi.");
  const [records, setRecords] = useState<SavedMeasurement[]>(loadRecords);
  const [selectedId, setSelectedId] = useState(POINTS[0].id);
  const [sensorHeightCm, setSensorHeightCm] = useState(POINTS[0].defaultHeightCm || "");
  const [notes, setNotes] = useState("");
  const [photoRef, setPhotoRef] = useState("");
  const [cableLengthM, setCableLengthM] = useState("");

  const apiReady = /^https?:\/\/[^\s]+$/.test(cleanBaseUrl(apiBase));
  const selectedPoint = useMemo(() => POINTS.find((point) => point.id === selectedId) || POINTS[0], [selectedId]);
  const savedIds = useMemo(() => new Set(records.map((record) => record.point_id)), [records]);

  useEffect(() => {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    window.localStorage.setItem(API_KEY, apiBase);
  }, [apiBase]);

  useEffect(() => {
    const point = POINTS.find((item) => item.id === selectedId) || POINTS[0];
    setSensorHeightCm(point.defaultHeightCm || "");
    setNotes("");
    setPhotoRef("");
    setCableLengthM("");
  }, [selectedId]);

  useEffect(() => {
    if (!apiReady) return;
    let cancelled = false;
    const base = cleanBaseUrl(apiBase);

    async function fetchLive() {
      try {
        const response = await fetch(`${base}/api/live`, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as LivePayload;
        if (!cancelled) {
          setLive(payload);
          setStatus(`Terhubung ke ESP32 ${payload.ip || base}.`);
        }
      } catch (error) {
        if (!cancelled) setStatus(`Belum terhubung ke ESP32: ${error instanceof Error ? error.message : "gagal"}`);
      }
    }

    void fetchLive();
    const timer = window.setInterval(fetchLive, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [apiBase, apiReady]);

  async function saveMeasurement() {
    if (!live?.readings) {
      setStatus("Data live belum ada. Tunggu ESP32 terbaca dulu.");
      return;
    }

    const record: SavedMeasurement = {
      id: `${selectedPoint.id}-${Date.now()}`,
      point_id: selectedPoint.id,
      label: selectedPoint.label,
      category: selectedPoint.category,
      sensor_height_cm: sensorHeightCm,
      notes,
      photo_ref: photoRef,
      cable_length_m: cableLengthM,
      saved_at: new Date().toISOString(),
      sync_status: "local",
      readings: live.readings,
    };

    setRecords((current) => [record, ...current]);
    setStatus(`${selectedPoint.id} tersimpan lokal.`);

    if (!apiReady) return;
    try {
      const body = new URLSearchParams({
        point_id: selectedPoint.id,
        label: selectedPoint.label,
        category: selectedPoint.category,
        sensor_height_cm: sensorHeightCm,
        notes,
        photo_ref: photoRef,
        cable_length_m: cableLengthM,
      });
      const response = await fetch(`${cleanBaseUrl(apiBase)}/api/save`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, sync_status: "esp32" } : item)));
      setStatus(`${selectedPoint.id} tersimpan lokal dan di ESP32.`);
    } catch (error) {
      setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, sync_status: "failed" } : item)));
      setStatus(`Data lokal aman. Sync ESP32 gagal: ${error instanceof Error ? error.message : "gagal"}`);
    }
  }

  function selectNextOpenPoint() {
    const next = POINTS.find((point) => !savedIds.has(point.id));
    if (next) setSelectedId(next.id);
  }

  const reading = live?.readings;

  return (
    <div className="page-stack measurement-page">
      <section className="section-hero">
        <p className="eyebrow">Mode Pengukuran Lapangan</p>
        <h1>Ambil baseline Ciwidey dari HP.</h1>
        <p>
          Laptop menjalankan web-app. ESP32 hanya memberi API lokal. Data tetap tersimpan di browser HP walau sync ESP32 gagal.
        </p>
      </section>

      <Card className="measurement-connection-card">
        <div className="section-heading">
          <h2>Koneksi ESP32</h2>
          <p>Masukkan IP dari Serial Monitor firmware measurement.</p>
        </div>
        <label className="field">
          URL API ESP32
          <input value={apiBase} onChange={(event) => setApiBase(event.target.value)} placeholder="http://192.168.43.123" />
        </label>
        <p className="mode-line">{status}</p>
      </Card>

      <section className="measurement-live-grid" aria-label="Data sensor sekarang">
        <Card className="metric-mini-card">
          <span>Suhu</span>
          <strong>{numberText(reading?.temperature_c ?? null, "°C")}</strong>
        </Card>
        <Card className="metric-mini-card">
          <span>Udara</span>
          <strong>{numberText(reading?.humidity_pct ?? null, "%")}</strong>
        </Card>
        <Card className="metric-mini-card">
          <span>Cahaya</span>
          <strong>{numberText(reading?.lux ?? null, "lux")}</strong>
        </Card>
        <Card className="metric-mini-card">
          <span>Soil ADC</span>
          <strong>{reading ? reading.soil_raw_adc : "-"}</strong>
        </Card>
      </section>

      <Card className="measurement-card">
        <div className="section-heading">
          <h2>Titik Ukur</h2>
          <p>{selectedPoint.guide}</p>
        </div>

        <label className="field">
          Pilih titik
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {POINTS.map((point) => (
              <option key={point.id} value={point.id}>
                {savedIds.has(point.id) ? "✓ " : ""}{point.id} — {point.label}
              </option>
            ))}
          </select>
        </label>

        <div className="measurement-form-grid">
          <label className="field">
            Tinggi sensor (cm)
            <input value={sensorHeightCm} onChange={(event) => setSensorHeightCm(event.target.value)} inputMode="decimal" />
          </label>
          <label className="field">
            Nomor foto
            <input value={photoRef} onChange={(event) => setPhotoRef(event.target.value)} placeholder="IMG_0012" />
          </label>
          <label className="field">
            Panjang kabel (m)
            <input
              value={cableLengthM}
              onChange={(event) => setCableLengthM(event.target.value)}
              inputMode="decimal"
              placeholder={selectedPoint.needsCable ? "isi setelah ukur rute" : "opsional"}
            />
          </label>
        </div>

        <label className="field">
          Catatan
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="cuaca, posisi, kedalaman sensor, kondisi media" />
        </label>

        <div className="button-row">
          <button className="btn primary" type="button" onClick={saveMeasurement} disabled={!reading}>
            Simpan Pengukuran
          </button>
          <button className="btn outline" type="button" onClick={selectNextOpenPoint}>
            Titik Belum Diukur
          </button>
        </div>
      </Card>

      <Card className="measurement-card">
        <div className="section-heading">
          <h2>Data Tersimpan ({records.length}/{POINTS.length})</h2>
          <p>Export sebelum ESP32 atau laptop dimatikan.</p>
        </div>
        <div className="button-row">
          <button className="btn primary" type="button" onClick={() => downloadJson("snowberry-ciwidey-measurements.json", records)} disabled={records.length === 0}>
            Export JSON Lokal
          </button>
          <button
            className="btn outline"
            type="button"
            onClick={() => {
              if (window.confirm("Hapus semua data pengukuran lokal? Export dulu jika belum.")) setRecords([]);
            }}
            disabled={records.length === 0}
          >
            Hapus Data Lokal
          </button>
        </div>
        <div className="measurement-record-list">
          {records.length === 0 ? (
            <p>Belum ada data tersimpan.</p>
          ) : (
            records.map((record) => (
              <article key={record.id} className="measurement-record">
                <strong>{record.point_id} — {record.label}</strong>
                <span>{record.sync_status === "esp32" ? "lokal + ESP32" : record.sync_status === "failed" ? "lokal, sync gagal" : "lokal"}</span>
                <p>
                  {numberText(record.readings.temperature_c, "°C")} · {numberText(record.readings.humidity_pct, "%")} · {numberText(record.readings.lux, "lux")} · ADC {record.readings.soil_raw_adc}
                </p>
              </article>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
