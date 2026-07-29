import type { ActuatorKey, GreenhouseProfile, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";
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

function normalizeStatus(data: Partial<RealtimeStatus>): RealtimeStatus {
  const actuator = (key: ActuatorKey) => ({
    mode: data.actuators?.[key]?.mode ?? "AUTO",
    state: data.actuators?.[key]?.state ?? false,
    manual_until: data.actuators?.[key]?.manual_until ?? null,
    reason: data.actuators?.[key]?.reason,
  });

  return {
    sensors: {
      temperature_c: data.sensors?.temperature_c ?? null,
      humidity_pct: data.sensors?.humidity_pct ?? null,
      lux: data.sensors?.lux ?? null,
      soil_pct: data.sensors?.soil_pct ?? null,
      soil_raw_adc: data.sensors?.soil_raw_adc ?? null,
      psu_voltage: data.sensors?.psu_voltage ?? null,
    },
    actuators: {
      growlight: actuator("growlight"),
      pump: actuator("pump"),
      mist: actuator("mist"),
      fan: actuator("fan"),
    },
    device: {
      online: data.device?.online ?? false,
      wifi_rssi: data.device?.wifi_rssi ?? 0,
      firmware_version: data.device?.firmware_version ?? "",
      ip_address: data.device?.ip_address,
      uptime_seconds: data.device?.uptime_seconds ?? 0,
      free_heap_bytes: data.device?.free_heap_bytes,
      nvs_synced: data.device?.nvs_synced ?? false,
      time_synced: data.device?.time_synced,
    },
    command_ack: {
      ack_command_id: data.command_ack?.ack_command_id ?? "",
      ack_status: data.command_ack?.ack_status ?? "",
      ack_at: data.command_ack?.ack_at ?? null,
      ack_message: data.command_ack?.ack_message ?? "",
    },
    fault: {
      active_code: data.fault?.active_code ?? null,
      active_message: data.fault?.active_message ?? null,
      last_fault_code: data.fault?.last_fault_code ?? null,
      last_fault_at: data.fault?.last_fault_at ?? null,
    },
    last_seen: typeof data.last_seen === "number" ? data.last_seen : 0,
  };
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
        if (snap.exists()) cb(normalizeStatus(snap.data() as Partial<RealtimeStatus>));
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
