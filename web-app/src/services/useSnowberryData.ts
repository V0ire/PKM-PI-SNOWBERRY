import { useCallback, useEffect, useRef, useState } from "react";
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
  // Auth: null email = belum masuk. authReady false = masih cek sesi lama.
  authEmail: string | null;
  authReady: boolean;
  needsLogin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (profile: GreenhouseProfile) => Promise<void>;
  saveThresholds: (t: ThresholdConfig) => Promise<void>;
  sendCommand: (cmd: ManualCommand) => Promise<void>;
  loadRange: (days: number) => Promise<TelemetryPoint[]>;
  loadDay: (dateId: string) => Promise<TelemetryPoint[]>;
};

const EMPTY_STATUS: RealtimeStatus = {
  ...INITIAL_STATUS,
  device: { ...INITIAL_STATUS.device, online: false },
  last_seen: 0,
};

// Hook tunggal: pilih Firebase jika env terisi, selain itu mock.
// Untuk Firebase, langganan data baru dimulai SETELAH login sukses
// (rules production menuntut pengguna terautentikasi).
export function useSnowberryData(): SnowberryData {
  const [source, setSource] = useState<DataSourceKind>("mock");
  const [statusReady, setStatusReady] = useState(false);
  const [status, setStatus] = useState<RealtimeStatus>(EMPTY_STATUS);
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(HISTORY_POINTS);
  const [profile, setProfile] = useState<GreenhouseProfile | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const dsRef = useRef<SnowberryDataSource | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unStatus = () => {};
    let unThr = () => {};
    let unProfile = () => {};
    let unAuth = () => {};

    const startDataSubscriptions = (ds: SnowberryDataSource) => {
      unStatus = ds.subscribeStatus((next) => {
        setStatus(next);
        setStatusReady(true);
      });
      unThr = ds.subscribeThresholds(setThresholds);
      unProfile = ds.subscribeProfile(setProfile);
      ds.loadTelemetry()
        .then((points) => {
          // Firebase kosong harus tetap kosong; jangan bocorkan data mock sebagai riwayat nyata.
          if (!cancelled) setTelemetry(points);
        })
        .catch((err) => console.warn("[snowberry] Riwayat hari ini gagal dimuat.", err));
    };

    const stopDataSubscriptions = () => {
      unStatus();
      unThr();
      unProfile();
      unStatus = () => {};
      unThr = () => {};
      unProfile = () => {};
    };

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
      if (ds.kind === "firebase") setTelemetry([]);

      if (ds.observeAuth) {
        // Firebase: tunggu hasil cek sesi sebelum memutuskan layar login.
        unAuth = ds.observeAuth((email) => {
          if (cancelled) return;
          setAuthEmail(email);
          setAuthReady(true);
          if (email) startDataSubscriptions(ds);
          else {
            stopDataSubscriptions();
            setStatusReady(false);
            setStatus(EMPTY_STATUS);
            setTelemetry([]);
            setProfile(null);
          }
        });
      } else {
        // Mock: tanpa login.
        setAuthReady(true);
        startDataSubscriptions(ds);
      }
    }
    void boot();

    return () => {
      cancelled = true;
      unStatus();
      unThr();
      unProfile();
      unAuth();
    };
  }, []);

  const loadRange = useCallback(async (days: number) => {
    if (!dsRef.current) return [];
    return dsRef.current.loadTelemetry(days);
  }, []);

  const loadDay = useCallback(async (dateId: string) => {
    if (!dsRef.current?.loadTelemetryDay) return [];
    return dsRef.current.loadTelemetryDay(dateId);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!dsRef.current?.signIn) throw new Error("login_tidak_tersedia");
    await dsRef.current.signIn(email, password);
  }, []);

  const signOut = useCallback(async () => {
    if (dsRef.current?.signOut) await dsRef.current.signOut();
  }, []);

  return {
    source,
    statusReady,
    status,
    thresholds,
    telemetry,
    profile,
    authEmail,
    authReady,
    needsLogin: source === "firebase" && authReady && authEmail === null,
    signIn,
    signOut,
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
    loadDay,
  };
}
