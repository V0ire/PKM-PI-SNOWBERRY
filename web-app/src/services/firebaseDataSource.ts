import type { GreenhouseProfile, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";
import type { ManualCommand, SnowberryDataSource } from "./dataSource";
import type { FirebaseEnv } from "./firebaseConfig";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore, onSnapshot, setDoc } from "firebase/firestore";

// Adapter Firestore sesuai docs/03-technical/api-contract.md.
// Paths: devices/{deviceId}/status/realtime, config/thresholds,
//        config/commands, telemetry/{YYYY-MM-DD}
//

function todayDocId(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export async function createFirebaseDataSource(env: FirebaseEnv): Promise<SnowberryDataSource> {
  const app = initializeApp({
    apiKey: env.apiKey,
    authDomain: env.authDomain,
    projectId: env.projectId,
    appId: env.appId,
  });
  const auth = getAuth(app);
  const db = getFirestore(app);

  const base = `devices/${env.deviceId}`;
  const deviceRef = doc(db, base);
  const statusRef = doc(db, `${base}/status/realtime`);
  const thresholdsRef = doc(db, `${base}/config/thresholds`);
  const commandsRef = doc(db, `${base}/config/commands`);

  const currentUid = () => auth.currentUser?.uid ?? "web_user";

  return {
    kind: "firebase",
    subscribeStatus(cb: (s: RealtimeStatus) => void) {
      return onSnapshot(statusRef, (snap) => {
        if (snap.exists()) cb(snap.data() as RealtimeStatus);
      });
    },
    subscribeThresholds(cb: (t: ThresholdConfig) => void) {
      return onSnapshot(thresholdsRef, (snap) => {
        if (snap.exists()) cb(snap.data() as ThresholdConfig);
      });
    },
    async loadTelemetry(): Promise<TelemetryPoint[]> {
      const ref = doc(db, `${base}/telemetry/${todayDocId()}`);
      const snap = await getDoc(ref);
      if (!snap.exists()) return [];
      const data = snap.data() as { d?: TelemetryPoint[]; samples?: TelemetryPoint[] };
      return data.d ?? data.samples ?? [];
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
        { merge: true },
      );
    },
    async sendCommand(cmd: ManualCommand) {
      await setDoc(commandsRef, { ...cmd, issued_by: currentUid() });
    },
  };
}
