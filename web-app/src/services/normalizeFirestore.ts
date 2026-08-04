import type { RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";

type UnknownRecord = Record<string, unknown>;
const record = (value: unknown, name: string): UnknownRecord => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} tidak valid.`);
  return value as UnknownRecord;
};
const number = (value: unknown, name: string) => {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${name} harus berupa angka.`);
  return value;
};
const string = (value: unknown, name: string) => {
  if (typeof value !== "string") throw new Error(`${name} harus berupa teks.`);
  return value;
};
const boolean = (value: unknown, name: string) => {
  if (typeof value !== "boolean") throw new Error(`${name} harus berupa boolean.`);
  return value;
};
const nullableNumber = (value: unknown, name: string) => value === null ? null : number(value, name);
const timestamp = (value: unknown, name: string): number => {
  if (typeof value === "number") return number(value, name);
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") return number(value.toMillis(), name);
  throw new Error(`${name} harus berupa waktu.`);
};
const exactKeys = (data: UnknownRecord, allowed: readonly string[], name: string) => {
  const extra = Object.keys(data).find((key) => !allowed.includes(key));
  if (extra) throw new Error(`${name}.${extra} tidak dikenal.`);
};
const enumValue = <T extends string>(value: unknown, allowed: readonly T[], name: string): T => {
  if (typeof value !== "string" || !allowed.includes(value as T)) throw new Error(`${name} tidak valid.`);
  return value as T;
};

const CONFIG_KEYS = ["config_id","soil_low","soil_high","rh_low","rh_high","temperature_influence","temp_low","temp_high","humidifier_priority","temperature_failure_fallback","lux_low","lux_high","light_schedule_enabled","light_schedule_start_hour","light_schedule_end_hour","pump_pulse_ms","soak_period_ms","pump_start_limit","pump_window_ms","planting_date","updated_at","updated_by"] as const;
export function normalizeThresholdConfig(value: unknown): ThresholdConfig {
  const d = record(value, "Pengaturan"); exactKeys(d, CONFIG_KEYS, "Pengaturan");
  const out = Object.fromEntries(CONFIG_KEYS.map((key) => [key, d[key]])) as unknown as ThresholdConfig;
  for (const key of ["soil_low","soil_high","rh_low","rh_high","temp_low","temp_high","lux_low","lux_high","light_schedule_start_hour","light_schedule_end_hour","pump_pulse_ms","soak_period_ms","pump_start_limit","pump_window_ms"] as const) out[key] = number(d[key], key);
  out.config_id = string(d.config_id, "config_id"); out.planting_date = string(d.planting_date, "planting_date"); out.updated_by = string(d.updated_by, "updated_by");
  out.temperature_influence = boolean(d.temperature_influence, "temperature_influence"); out.light_schedule_enabled = boolean(d.light_schedule_enabled, "light_schedule_enabled");
  out.humidifier_priority = enumValue(d.humidifier_priority, ["RH","TEMPERATURE"], "humidifier_priority");
  out.temperature_failure_fallback = enumValue(d.temperature_failure_fallback, ["OFF","RH_ONLY"], "temperature_failure_fallback"); out.updated_at = timestamp(d.updated_at, "updated_at");
  return out;
}

export function normalizeRealtimeStatus(value: unknown): RealtimeStatus {
  const d = record(value, "Status"), sensors = record(d.sensors, "sensors"), actuators = record(d.actuators, "actuators"), device = record(d.device, "device"), fault = record(d.fault, "fault");
  exactKeys(actuators, ["growlight","pump","humidifier"], "actuators");
  const normalizeActuator = (key: "growlight"|"pump"|"humidifier") => { const a = record(actuators[key], key); return { mode: enumValue(a.mode,["AUTO","MANUAL"],`${key}.mode`), state: boolean(a.state,`${key}.state`), manual_until: a.manual_until === null ? null : timestamp(a.manual_until,`${key}.manual_until`), ...(typeof a.reason === "string" ? { reason: a.reason } : {}) }; };
  const commandAck = d.command_ack === undefined ? undefined : record(d.command_ack, "command_ack");
  return {
    sensors: { temperature_c: nullableNumber(sensors.temperature_c,"temperature_c"), humidity_pct: nullableNumber(sensors.humidity_pct,"humidity_pct"), lux: nullableNumber(sensors.lux,"lux"), soil_pct: nullableNumber(sensors.soil_pct,"soil_pct"), psu_voltage: nullableNumber(sensors.psu_voltage,"psu_voltage") },
    actuators: { growlight: normalizeActuator("growlight"), pump: normalizeActuator("pump"), humidifier: normalizeActuator("humidifier") },
    device: { online:boolean(device.online,"online"), wifi_rssi:number(device.wifi_rssi,"wifi_rssi"), firmware_version:string(device.firmware_version,"firmware_version"), uptime_seconds:number(device.uptime_seconds,"uptime_seconds"), nvs_synced:boolean(device.nvs_synced,"nvs_synced") },
    fault: { active_code: fault.active_code === null ? null : string(fault.active_code,"active_code"), active_message: fault.active_message === null ? null : string(fault.active_message,"active_message") },
    last_seen: timestamp(d.last_seen,"last_seen"),
    ...(typeof d.applied_config_id === "string" ? { applied_config_id: d.applied_config_id } : {}),
    ...(commandAck ? { command_ack: {
      ack_command_id: string(commandAck.ack_command_id,"ack_command_id"),
      ack_status: enumValue(commandAck.ack_status,["APPLIED","REJECTED_SAFETY","EXPIRED","INVALID"],"ack_status"),
      ack_at: commandAck.ack_at === null ? null : timestamp(commandAck.ack_at,"ack_at"),
      ack_message: string(commandAck.ack_message,"ack_message"),
    } } : {}),
  };
}

export function normalizeTelemetry(value: unknown): TelemetryPoint[] {
  const d = record(value,"Telemetry"), samples = d.samples ?? d.d;
  if (!Array.isArray(samples)) throw new Error("Sampel telemetry tidak valid.");
  return samples.map((item) => { const p=record(item,"Sampel"); return { t:number(p.t,"t"), h:number(p.h,"h"), l:number(p.l,"l"), s:number(p.s,"s"), gl:boolean(p.gl,"gl"), p:boolean(p.p,"p"), m:boolean(p.m,"m"), f: typeof p.f === "boolean" ? p.f : false, ts:timestamp(p.ts,"ts") }; });
}
