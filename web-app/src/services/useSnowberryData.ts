import { useEffect, useRef, useState } from "react";
import type { GreenhouseProfile, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";
import { DEFAULT_THRESHOLDS, HISTORY_POINTS, INITIAL_STATUS } from "../data/mockSnowberry";
import { createMockDataSource } from "./mockDataSource";
import { isFirebaseConfigured, readFirebaseEnv } from "./firebaseConfig";
import type { ManualCommand, SnowberryDataSource } from "./dataSource";

type DataSourceKind = "mock" | "firebase";

export type SnowberryData = {
  source: DataSourceKind;
  statusReady: boolean;
  status: RealtimeStatus;
  thresholds: ThresholdConfig;
  telemetry: TelemetryPoint[];
  profile: GreenhouseProfile | null;
  saveProfile: (profile: GreenhouseProfile) => Promise<void>;
  saveThresholds: (t: ThresholdConfig) => Promise<void>;
  sendCommand: (cmd: ManualCommand) => Promise<void>;
};

// Hook tunggal: pilih Firebase jika env terisi, selain itu mock.
export function useSnowberryData(): SnowberryData {
  const [source, setSource] = useState<DataSourceKind>("mock");
  const [statusReady, setStatusReady] = useState(false);
  const [status, setStatus] = useState<RealtimeStatus>(INITIAL_STATUS);
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(HISTORY_POINTS);
  const [profile, setProfile] = useState<GreenhouseProfile | null>(null);
  const dsRef = useRef<SnowberryDataSource | null>(null);

  useEffect(() => {
    let unStatus = () => {};
    let unThr = () => {};
    let unProfile = () => {};
    let cancelled = false;

    async function boot() {
      let ds: SnowberryDataSource;
      const env = readFirebaseEnv();
      if (env && isFirebaseConfigured()) {
        try {
          const { createFirebaseDataSource } = await import("./firebaseDataSource");
          ds = await createFirebaseDataSource(env);
        } catch (err) {
          console.warn("[snowberry] Firebase gagal, memakai data mock.", err);
          ds = createMockDataSource();
        }
      } else {
        ds = createMockDataSource();
      }
      if (cancelled) return;
      dsRef.current = ds;
      setSource(ds.kind);
      unStatus = ds.subscribeStatus((next) => {
        setStatus(next);
        setStatusReady(true);
      });
      unThr = ds.subscribeThresholds(setThresholds);
      unProfile = ds.subscribeProfile(setProfile);
      ds.loadTelemetry().then((points) => {
        if (!cancelled && points.length) setTelemetry(points);
      });
    }
    boot();

    return () => {
      cancelled = true;
      unStatus();
      unThr();
      unProfile();
    };
  }, []);

  return {
    source,
    statusReady,
    status,
    thresholds,
    telemetry,
    profile,
    saveProfile: async (next) => {
      if (dsRef.current) await dsRef.current.saveProfile(next);
      setProfile(next);
    },
    saveThresholds: async (t) => {
      if (dsRef.current) await dsRef.current.saveThresholds(t);
      setThresholds(t);
    },
    sendCommand: async (cmd) => {
      if (dsRef.current) await dsRef.current.sendCommand(cmd);
    },
  };
}
