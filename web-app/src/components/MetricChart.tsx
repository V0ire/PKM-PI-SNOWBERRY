import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { formatDecimal, formatInteger } from "../utils/date";
import { historyAxisLabel, historyFullLabel } from "../utils/historyData";
import { Card } from "./Card";

const HEIGHT = 190;
const PAD_L = 10;
const PAD_R = 48;
const PAD_T = 14;
const PAD_B = 10;

function valueLabel(value: number, unit: string) {
  return `${unit === "lux" ? formatInteger(value) : formatDecimal(value)} ${unit}`;
}

// Label sumbu ringkas: 6500 lux -> "6,5rb", sisanya angka bulat.
function tickLabel(value: number, unit: string) {
  if (unit === "lux" && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1).replace(".", ",")}rb`;
  }
  return formatInteger(Math.round(value));
}

// Ticks "rapi" ala dashboard keuangan: 1/2/5×10^n, tidak ngasal.
function niceTicks(min: number, max: number, count = 4): number[] {
  const span = Math.max(1e-6, max - min);
  const rawStep = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + 1e-9; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return ticks;
}

type Window = { start: number; end: number };

export function MetricChart({
  title,
  unit,
  values,
  times = [],
  showDates = false,
  thresholdLow,
  thresholdHigh,
  bands,
}: {
  title: string;
  unit: string;
  values: number[];
  times?: number[];
  showDates?: boolean;
  thresholdLow?: number;
  thresholdHigh?: number;
  // Pita fluktuasi min–max per titik (opsional). Panjang sama dengan values.
  bands?: Array<{ min: number; max: number }>;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(320);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // Jendela tampilan (indeks pecahan) + skala vertikal. null = muat semua.
  const [view, setView] = useState<Window | null>(null);
  const [yZoom, setYZoom] = useState(1);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const lastPairRef = useRef<Array<{ x: number; y: number }> | null>(null);

  const count = values.length;

  useEffect(() => {
    setActiveIndex(null);
    setView(null);
    setYZoom(1);
    pointersRef.current.clear();
    lastPairRef.current = null;
  }, [count, times[0]]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 40) setWidth(w);
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width || 320);
    return () => observer.disconnect();
  }, []);

  const plotW = Math.max(40, width - PAD_L - PAD_R);
  const plotH = HEIGHT - PAD_T - PAD_B;

  // --- Jendela tampilan -----------------------------------------------------
  const minSpan = Math.min(4, Math.max(1, count - 1));
  const fullWindow: Window = { start: 0, end: Math.max(0, count - 1) };
  const win = view ?? fullWindow;
  const zoomed = view !== null && win.end - win.start < count - 1 - 1e-9;

  const clampWindow = (w: Window): Window => {
    let span = Math.min(Math.max(w.end - w.start, minSpan), Math.max(minSpan, count - 1));
    let start = Math.min(Math.max(w.start, 0), count - 1 - span);
    return { start, end: start + span };
  };

  const zoomAround = (anchor: number, factor: number) => {
    if (count < 3) return;
    const span = win.end - win.start;
    const nextSpan = Math.min(Math.max(span * factor, minSpan), count - 1);
    const ratio = nextSpan / span;
    setView(clampWindow({ start: anchor - (anchor - win.start) * ratio, end: anchor + (win.end - anchor) * ratio }));
  };

  const panBy = (deltaIndex: number) => {
    setView(clampWindow({ start: win.start + deltaIndex, end: win.end + deltaIndex }));
  };

  const resetView = () => {
    setView(null);
    setYZoom(1);
    setActiveIndex(null);
  };

  // --- Domain nilai ---------------------------------------------------------
  const iStart = Math.max(0, Math.floor(win.start));
  const iEnd = Math.min(count - 1, Math.ceil(win.end));
  const visibleValues = values.slice(iStart, iEnd + 1);
  const visibleBands = bands?.slice(iStart, iEnd + 1);

  const bandMin = visibleBands?.length ? Math.min(...visibleBands.map((b) => b.min)) : Infinity;
  const bandMax = visibleBands?.length ? Math.max(...visibleBands.map((b) => b.max)) : -Infinity;
  const dataMin = Math.min(...visibleValues, bandMin);
  const dataMax = Math.max(...visibleValues, bandMax);

  const baseDomain = useMemo(() => {
    let lo = Math.min(dataMin, thresholdLow ?? dataMin);
    let hi = Math.max(dataMax, thresholdHigh ?? dataMax);
    const pad = Math.max(0.5, (hi - lo) * 0.1);
    lo -= pad;
    hi += pad;
    return { lo, hi };
  }, [dataMin, dataMax, thresholdLow, thresholdHigh]);

  // Skala vertikal: 1 = pas otomatis; membesar = "zoom out" vertikal.
  const yHalf = Math.max(1e-6, ((baseDomain.hi - baseDomain.lo) / 2) * yZoom);
  const yMid = (baseDomain.hi + baseDomain.lo) / 2;
  const domain = { lo: yMid - yHalf, hi: yMid + yHalf };

  const span = Math.max(1e-6, domain.hi - domain.lo);
  const yOf = (v: number) => PAD_T + (1 - (v - domain.lo) / span) * plotH;
  const winSpan = Math.max(1e-6, win.end - win.start);
  const xOf = (i: number) => PAD_L + ((i - win.start) / winSpan) * plotW;

  const idx = Array.from({ length: iEnd - iStart + 1 }, (_, k) => iStart + k);
  const linePoints = idx.map((i) => `${xOf(i).toFixed(2)},${yOf(values[i]).toFixed(2)}`).join(" ");
  const bandArea = visibleBands && visibleBands.length > 1
    ? idx
        .map((i, k) => `${xOf(i).toFixed(2)},${yOf(visibleBands[k].max).toFixed(2)}`)
        .concat(
          idx
            .map((i, k) => `${xOf(i).toFixed(2)},${yOf(visibleBands[k].min).toFixed(2)}`)
            .reverse(),
        )
        .join(" ")
    : null;
  // Area lembut di bawah garis untuk tampilan titik mentah (Hari Ini).
  const areaPath = !bandArea && idx.length > 1
    ? `M ${xOf(idx[0]).toFixed(2)},${(PAD_T + plotH).toFixed(2)} `
      + idx.map((i) => `L ${xOf(i).toFixed(2)},${yOf(values[i]).toFixed(2)}`).join(" ")
      + ` L ${xOf(idx[idx.length - 1]).toFixed(2)},${(PAD_T + plotH).toFixed(2)} Z`
    : null;

  const ticks = niceTicks(domain.lo, domain.hi, 4);
  const gradId = `grad-${title.replace(/[^a-z]/gi, "")}`;
  const first = visibleValues[0];
  const latest = visibleValues[visibleValues.length - 1];
  const delta = latest - first;
  const trend = Math.abs(delta) < 0.1 ? "Stabil" : delta > 0 ? "Naik" : "Turun";
  const visibleTimes = times.slice(iStart, iEnd + 1);
  const midIndex = Math.floor((visibleTimes.length - 1) / 2);

  const indexFromClientX = (clientX: number): number | null => {
    if (count === 0) return null;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const frac = Math.min(1, Math.max(0, (clientX - rect.left - PAD_L) / plotW));
    return Math.round(win.start + frac * winSpan);
  };

  const activePoint = activeIndex !== null ? values[activeIndex] : undefined;
  const activeBand = activeIndex !== null && activeIndex >= iStart && activeIndex <= iEnd
    ? bands?.[activeIndex]
    : undefined;
  const activeTime = activeIndex !== null ? times[activeIndex] : undefined;
  const activeReadout = activeBand && activeBand.min !== activeBand.max
    ? `${formatDecimal(activeBand.min)}–${formatDecimal(activeBand.max)} ${unit}`
    : activePoint !== undefined
      ? valueLabel(activePoint, unit)
      : "";

  // --- Interaksi pointer: tap = baca nilai, geser = geser jendela, cubit = zoom ---
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 1) setActiveIndex(indexFromClientX(event.clientX));
    if (pointersRef.current.size === 2) {
      lastPairRef.current = [...pointersRef.current.values()];
      setActiveIndex(null);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointers = pointersRef.current;
    const stored = pointers.get(event.pointerId);
    if (!stored) return;
    const prev = { ...stored };
    stored.x = event.clientX;
    stored.y = event.clientY;

    if (pointers.size === 2 && lastPairRef.current?.length === 2) {
      const [a, b] = [...pointers.values()];
      const [pa, pb] = lastPairRef.current;
      lastPairRef.current = [{ ...a }, { ...b }];
      const distX = Math.abs(a.x - b.x);
      const distY = Math.abs(a.y - b.y);
      const prevDistX = Math.max(1, Math.abs(pa.x - pb.x));
      const prevDistY = Math.max(1, Math.abs(pa.y - pb.y));
      // Cubit horizontal = rentang waktu; cubit vertikal = skala nilai.
      const anchor = win.start + ((a.x + b.x) / 2 - (wrapRef.current?.getBoundingClientRect().left ?? 0) - PAD_L) / plotW * winSpan;
      zoomAround(anchor, prevDistX / Math.max(1, distX));
      setYZoom((z) => Math.min(25, Math.max(1, z * (distY / prevDistY))));
      return;
    }

    if (pointers.size === 1 && zoomed) {
      const dx = event.clientX - prev.x;
      if (Math.abs(dx) > 0) {
        panBy(-(dx / plotW) * winSpan);
        setActiveIndex(indexFromClientX(event.clientX));
      }
      return;
    }

    if (pointers.size === 1 && !zoomed && event.buttons > 0) {
      setActiveIndex(indexFromClientX(event.clientX));
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) lastPairRef.current = null;
  };

  // Roda: gulir = zoom waktu di sekitar kursor; Ctrl/trackpad-pinch = skala Y.
  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (count < 3) return;
    event.preventDefault();
    if (event.ctrlKey) {
      setYZoom((z) => Math.min(25, Math.max(1, z * Math.exp(event.deltaY * 0.002))));
      return;
    }
    const anchor = indexFromClientX(event.clientX);
    if (anchor === null) return;
    zoomAround(anchor, Math.exp(event.deltaY * 0.002));
  };

  return (
    <Card className="chart-card">
      <div className="card-topline">
        <h3>{title}</h3>
        <span className="chart-current" role="status">
          {activePoint !== undefined && activeTime !== undefined
            ? `${historyFullLabel(activeTime)} · ${activeReadout}`
            : valueLabel(latest, unit)}
        </span>
      </div>
      <div className="chart-stats" aria-label={`Ringkasan ${title}`}>
        <span>Rendah {valueLabel(Math.min(...visibleValues), unit)}</span>
        <span>Tinggi {valueLabel(Math.max(...visibleValues), unit)}</span>
        <span>{trend}</span>
      </div>
      <div className="chart-toolbar">
        <button className="chart-tool-btn" type="button" aria-label="Perbesar rentang waktu" disabled={count < 3 || zoomed} onClick={() => zoomAround((win.start + win.end) / 2, 0.6)}>
          <ZoomIn size={16} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <button className="chart-tool-btn" type="button" aria-label="Perkecil rentang waktu" disabled={view === null} onClick={() => zoomAround((win.start + win.end) / 2, 1 / 0.6)}>
          <ZoomOut size={16} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <button className="chart-tool-btn" type="button" aria-label="Tampilkan semua data" disabled={!zoomed && yZoom === 1} onClick={resetView}>
          <RotateCcw size={16} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <span className="chart-hint">{zoomed ? "Geser untuk menjelajah" : "Cubit atau gulir untuk memperbesar"}</span>
      </div>
      <div
        ref={wrapRef}
        className="chart-plot"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={resetView}
      >
        <svg width={width} height={HEIGHT} role="img" aria-label={`Grafik ${title}. Tekan atau geser untuk melihat nilai, cubit untuk memperbesar.`}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-green-action)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--color-green-action)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Gridline + label nilai di kanan (gaya dashboard keuangan). */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line className="chart-grid-line" x1={PAD_L} y1={yOf(tick)} x2={PAD_L + plotW} y2={yOf(tick)} />
              <text className="chart-tick-label" x={PAD_L + plotW + 6} y={yOf(tick) + 3.5}>
                {tickLabel(tick, unit)}
              </text>
            </g>
          ))}

          {/* Batas otomatis: sengat halus, tetap ada karena konsep inti produk. */}
          {thresholdLow !== undefined && (
            <line className="chart-threshold-line" x1={PAD_L} y1={yOf(thresholdLow)} x2={PAD_L + plotW} y2={yOf(thresholdLow)} />
          )}
          {thresholdHigh !== undefined && (
            <line className="chart-threshold-line" x1={PAD_L} y1={yOf(thresholdHigh)} x2={PAD_L + plotW} y2={yOf(thresholdHigh)} />
          )}

          {bandArea && <polygon className="chart-band" points={bandArea} />}
          {areaPath && <path className="chart-area" d={areaPath} fill={`url(#${gradId})`} />}
          <polyline className="chart-line" points={linePoints} />

          {/* Crosshair inspeksi: garis vertikal tipis + satu titik sorot. */}
          {activeIndex !== null && values[activeIndex] !== undefined && activeIndex >= iStart && activeIndex <= iEnd && (
            <g className="chart-cursor">
              <line x1={xOf(activeIndex)} y1={PAD_T} x2={xOf(activeIndex)} y2={PAD_T + plotH} />
              {activeBand && activeBand.min !== activeBand.max && (
                <line
                  className="chart-cursor-span"
                  x1={xOf(activeIndex)}
                  y1={yOf(activeBand.min)}
                  x2={xOf(activeIndex)}
                  y2={yOf(activeBand.max)}
                />
              )}
              <circle cx={xOf(activeIndex)} cy={yOf(values[activeIndex])} r="4" />
            </g>
          )}
        </svg>
      </div>
      <div className="chart-axis" aria-hidden="true">
        <span>{visibleTimes[0] === undefined ? "" : historyAxisLabel(visibleTimes[0], showDates)}</span>
        <span>{visibleTimes[midIndex] === undefined ? "" : historyAxisLabel(visibleTimes[midIndex], showDates)}</span>
        <span>{visibleTimes[visibleTimes.length - 1] === undefined ? "" : historyAxisLabel(visibleTimes[visibleTimes.length - 1], showDates)}</span>
      </div>
    </Card>
  );
}
