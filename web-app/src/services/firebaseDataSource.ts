import type { GreenhouseProfile, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";
import type { ManualCommand, SnowberryDataSource } from "./dataSource";
import type { FirebaseEnv } from "./firebaseConfig";
import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore, onSnapshot, setDoc } from "firebase/firestore";
import { normalizeRealtimeStatus, normalizeTelemetry, normalizeThresholdConfig } from "./normalizeFirestore";
import { getSnowberryFirebaseApp } from "./firebaseClient";

// Adapter Firestore sesuai docs/03-technical/api-contract.md.
// Paths: devices/{deviceId}/status/realtime, config/thresholds,
//        config/commands, telemetry/{YYYY-MM-DD}
//

function todayDocId(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function dateDocIds(days: number): string[] {
  const ids: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    ids.push(d.toISOString().slice(0, 10));
  }
  return ids;
}

export async function createFirebaseDataSource(env: FirebaseEnv): Promise<SnowberryDataSource> {
  const app = getSnowberryFirebaseApp(env);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const base = `devices/${env.deviceId}`;
  const deviceRef = doc(db, base);
  const statusRef = doc(db, `${base}/status/realtime`);
  const thresholdsRef = doc(db, `${base}/config/thresholds`);
  const commandsRef = doc(db, `${base}/config/commands`);

  const currentUid = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Silakan masuk sebelum mengubah pengaturan.");
    return uid;
  };

  return {
    kind: "firebase",
    subscribeStatus(cb: (s: RealtimeStatus) => void, onError) {
      return onSnapshot(statusRef, (snap) => {
        if (!snap.exists()) return;
        try { cb(normalizeRealtimeStatus(snap.data())); } catch { onError("Status perangkat tidak dapat dibaca."); }
      }, () => onError("Status perangkat gagal dimuat dari Firebase."));
    },
    subscribeThresholds(cb: (t: ThresholdConfig) => void, onError) {
      return onSnapshot(thresholdsRef, (snap) => {
        if (!snap.exists()) return;
        try { cb(normalizeThresholdConfig(snap.data())); } catch { onError("Pengaturan perangkat tidak dapat dibaca."); }
      }, () => onError("Pengaturan gagal dimuat dari Firebase."));
    },
    async loadTelemetry(days = 1): Promise<TelemetryPoint[]> {
      const ids = days <= 1 ? [todayDocId()] : dateDocIds(days);
      const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, `${base}/telemetry/${id}`))));
      const points: TelemetryPoint[] = [];
      for (const snap of snaps) {
        if (!snap.exists()) continue;
        points.push(...normalizeTelemetry(snap.data()));
      }
      return points.sort((a, b) => a.ts - b.ts);
    },
    subscribeProfile(cb: (profile: GreenhouseProfile | null) => void) {
      return onSnapshot(deviceRef, (snap) => {
        const data = snap.data() as Partial<GreenhouseProfile> | undefined;
        if (!data?.greenhouse_name || !data.plant_phase) return cb(null);
        cb({ greenhouse_name: data.greenhouse_name, plant_phase: data.plant_phase });
      });
    },
    async saveProfile(profile: GreenhouseProfile) {
      await setDoc(deviceRef, profile, { merge: true });
    },
    async saveThresholds(thresholds: ThresholdConfig) {
      await setDoc(
        thresholdsRef,
        { ...thresholds, updated_at: Date.now(), updated_by: currentUid() },
      );
    },
    async sendCommand(cmd: ManualCommand) {
      await setDoc(commandsRef, { ...cmd, issued_by: currentUid() });
    },
  };
}
