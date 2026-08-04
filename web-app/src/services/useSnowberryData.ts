import { useCallback, useEffect, useRef, useState } from "react";
import type { GreenhouseProfile, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";
import { DEFAULT_THRESHOLDS, HISTORY_POINTS, INITIAL_STATUS } from "../data/mockSnowberry";
import { createMockDataSource } from "./mockDataSource";
import { isFirebaseConfigured, readFirebaseEnv } from "./firebaseConfig";
import type { ManualCommand, SnowberryDataSource } from "./dataSource";
import { createSnowberryAuth } from "./auth";
import { getSnowberryFirebaseApp } from "./firebaseClient";

type DataSourceKind = "mock" | "firebase";

export type SnowberryData = {
  source: DataSourceKind;
  statusReady: boolean;
  status: RealtimeStatus;
  thresholds: ThresholdConfig;
  telemetry: TelemetryPoint[];
  profile: GreenhouseProfile | null;
  authReady: boolean;
  currentUid: string | null;
  cloudOnline: boolean;
  error: string | null;
  saveProfile: (profile: GreenhouseProfile) => Promise<void>;
  saveThresholds: (t: ThresholdConfig) => Promise<void>;
  sendCommand: (cmd: ManualCommand) => Promise<void>;
  loadRange: (days: number) => Promise<TelemetryPoint[]>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

// Hook tunggal: pilih Firebase jika env terisi, selain itu mock.
export function useSnowberryData(): SnowberryData {
  const [source, setSource] = useState<DataSourceKind>("firebase");
  const [cloudOnline, setCloudOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusReady, setStatusReady] = useState(false);
  const [status, setStatus] = useState<RealtimeStatus>(INITIAL_STATUS);
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(HISTORY_POINTS);
  const [profile, setProfile] = useState<GreenhouseProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const dsRef = useRef<SnowberryDataSource | null>(null);
  const authRef = useRef<ReturnType<typeof createSnowberryAuth> | null>(null);

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
          const auth = createSnowberryAuth(getSnowberryFirebaseApp(env));
          authRef.current = auth;
          const user = await new Promise<import("firebase/auth").User | null>((resolve) => {
            const unsubscribe = auth.subscribe((next) => { unsubscribe(); resolve(next); });
          });
          if (cancelled) return;
          setAuthReady(true);
          setCurrentUid(user?.uid ?? null);
          if (!user) return;
          const { createFirebaseDataSource } = await import("./firebaseDataSource");
          ds = await createFirebaseDataSource(env);
        } catch {
          setCloudOnline(false);
          setError("Aplikasi tidak dapat terhubung ke Firebase. Data langsung tidak tersedia.");
          setAuthReady(true);
          return;
        }
      } else if (import.meta.env.DEV && import.meta.env.VITE_SNOWBERRY_DEMO === "true") {
        ds = createMockDataSource();
        setAuthReady(true);
        setCurrentUid("demo-user");
      } else {
        setCloudOnline(false);
        setError("Firebase belum dikonfigurasi. Data demo tidak digunakan pada aplikasi produksi.");
        setAuthReady(true);
        return;
      }
      if (cancelled) return;
      dsRef.current = ds;
      setSource(ds.kind);
      const listenerError = (message: string) => { setCloudOnline(false); setError(message); };
      unStatus = ds.subscribeStatus((next) => {
        setStatus(next);
        setStatusReady(true);
        setCloudOnline(true);
      }, listenerError);
      unThr = ds.subscribeThresholds(setThresholds, listenerError);
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

  // Identitas stabil: HistoryPage memakai ini sebagai dependency useEffect.
  const loadRange = useCallback(async (days: number) => {
    if (!dsRef.current) return [];
    return dsRef.current.loadTelemetry(days);
  }, []);

  return {
    source,
    statusReady,
    status,
    thresholds,
    telemetry,
    profile,
    authReady,
    currentUid,
    cloudOnline,
    error,
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
    loadRange,
    login: async (email, password) => { if (!authRef.current) throw new Error("Firebase belum dikonfigurasi."); await authRef.current.login(email, password); window.location.reload(); },
    register: async (email, password) => { if (!authRef.current) throw new Error("Firebase belum dikonfigurasi."); await authRef.current.register(email, password); window.location.reload(); },
    logout: async () => { if (authRef.current) await authRef.current.logout(); window.location.reload(); },
  };
}
