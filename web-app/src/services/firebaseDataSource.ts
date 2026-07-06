import type { RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";
import type { ManualCommand, SnowberryDataSource } from "./dataSource";
import type { FirebaseEnv } from "./firebaseConfig";

// Adapter Firestore sesuai docs/03-technical/api-contract.md.
// Paths: devices/{deviceId}/status/realtime, config/thresholds,
//        config/commands, telemetry/{YYYY-MM-DD}
//
// Firebase SDK dimuat lewat dynamic import agar bundel mock tidak menariknya.
// Jalankan `npm install firebase` sebelum memakai mode ini.

function todayDocId(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// Loader dinamis. Specifier disamarkan agar tsc tidak wajib punya types
// saat paket belum terpasang (mode mock tetap jalan tanpa firebase).
const dynImport = (m: string): Promise<any> =>
  (new Function("m", "return import(/* @vite-ignore */ m)") as (m: string) => Promise<any>)(m);

async function loadFirebase() {
  const [appMod, authMod, fsMod] = await Promise.all([
    dynImport("firebase/app"),
    dynImport("firebase/auth"),
    dynImport("firebase/firestore"),
  ]);
  return { appMod, authMod, fsMod };
}

export async function createFirebaseDataSource(env: FirebaseEnv): Promise<SnowberryDataSource> {
  const { appMod, authMod, fsMod } = await loadFirebase();

  const app = appMod.initializeApp({
    apiKey: env.apiKey,
    authDomain: env.authDomain,
    projectId: env.projectId,
    appId: env.appId,
  });
  const auth = authMod.getAuth(app);
  const db = fsMod.getFirestore(app);

  const base = `devices/${env.deviceId}`;
  const statusRef = fsMod.doc(db, `${base}/status/realtime`);
  const thresholdsRef = fsMod.doc(db, `${base}/config/thresholds`);
  const commandsRef = fsMod.doc(db, `${base}/config/commands`);

  const currentUid = () => auth.currentUser?.uid ?? "web_user";

  return {
    kind: "firebase",
    subscribeStatus(cb: (s: RealtimeStatus) => void) {
      return fsMod.onSnapshot(statusRef, (snap: any) => {
        if (snap.exists()) cb(snap.data() as RealtimeStatus);
      });
    },
    subscribeThresholds(cb: (t: ThresholdConfig) => void) {
      return fsMod.onSnapshot(thresholdsRef, (snap: any) => {
        if (snap.exists()) cb(snap.data() as ThresholdConfig);
      });
    },
    async loadTelemetry(): Promise<TelemetryPoint[]> {
      const ref = fsMod.doc(db, `${base}/telemetry/${todayDocId()}`);
      const snap = await fsMod.getDoc(ref);
      if (!snap.exists()) return [];
      const data = snap.data() as { d?: TelemetryPoint[]; samples?: TelemetryPoint[] };
      return data.d ?? data.samples ?? [];
    },
    async saveThresholds(thresholds: ThresholdConfig) {
      await fsMod.setDoc(
        thresholdsRef,
        { ...thresholds, updated_at: Date.now(), updated_by: currentUid() },
        { merge: true },
      );
    },
    async sendCommand(cmd: ManualCommand) {
      await fsMod.setDoc(commandsRef, { ...cmd, issued_by: currentUid() });
    },
  };
}
