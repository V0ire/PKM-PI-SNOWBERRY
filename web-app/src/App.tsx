import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { ConfirmManualModal } from "./components/ConfirmManualModal";
import { ConfirmRewaterModal } from "./components/ConfirmRewaterModal";
import { StartupScreen } from "./components/StartupScreen";
import { useSnowberryData } from "./services/useSnowberryData";
import { newCommandId } from "./services/dataSource";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { CheckPage } from "./pages/CheckPage";
import type { ActuatorKey, Page } from "./types";
import { getConnectionState } from "./utils/status";

function ackFallbackMessage(status: string) {
  if (status === "APPLIED") return "Perintah alat diterapkan.";
  if (status === "REJECTED_SAFETY") return "Perintah ditolak demi keamanan alat.";
  if (status === "EXPIRED") return "Perintah sudah kedaluwarsa.";
  if (status === "INVALID") return "Perintah tidak valid.";
  return "Status perintah diperbarui.";
}

export default function App() {
  const data = useSnowberryData();
  const [page, setPage] = useState<Page>("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [thresholds, setThresholds] = useState(data.thresholds);
  const [status, setStatus] = useState(data.status);
  const [manualCandidate, setManualCandidate] = useState<ActuatorKey | null>(null);
  const [rewaterCandidate, setRewaterCandidate] = useState(false);
  const [sendingActuator, setSendingActuator] = useState<ActuatorKey | null>(null);
  const [pendingAck, setPendingAck] = useState<{ commandId: string; actuator: ActuatorKey; timeoutAt: number } | null>(
    null,
  );
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(Date.now());
  const [startupElapsed, setStartupElapsed] = useState(false);
  const [startupTimedOut, setStartupTimedOut] = useState(false);
  const [checks, setChecks] = useState<import("./types").DailyCheckItem[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setStartupElapsed(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (data.statusReady) return;
    const timer = window.setTimeout(() => {
      setStartupElapsed(true);
      setStartupTimedOut(true);
      setToast("Data greenhouse belum masuk. Cek listrik box Snowberry dan koneksi Wi-Fi. Hubungi tim teknis jika masalah berlanjut.");
    }, 15_000);
    return () => window.clearTimeout(timer);
  }, [data.statusReady]);

  useEffect(() => {
    setStatus(data.status);
  }, [data.status]);

  // Kontrak A4: ack_status APPLIED/REJECTED_SAFETY/EXPIRED/INVALID menentukan toast.
  // Selama menunggu, tombol tetap "Mengirim..." dan status aktuator TIDAK ditebak
  // secara optimis — angka yang tampil selalu berasal dari data.status (device asli).
  useEffect(() => {
    if (!pendingAck || !status.command_ack) return;
    const ack = status.command_ack;
    if (ack.ack_command_id !== pendingAck.commandId) return;
    setSendingActuator(null);
    setPendingAck(null);
    setToast(ack.ack_message || ackFallbackMessage(ack.ack_status));
  }, [status.command_ack, pendingAck]);

  useEffect(() => {
    if (!pendingAck) return;
    if (now < pendingAck.timeoutAt) return;
    setSendingActuator(null);
    setPendingAck(null);
    setToast("Gagal mengirim perintah. Sinyal ke perangkat belum diterima, coba lagi.");
  }, [now, pendingAck]);

  useEffect(() => {
    setThresholds(data.thresholds);
  }, [data.thresholds]);

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, [page]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setStatus((current) => {
      let changed = false;
      const actuators = { ...current.actuators };

      (Object.keys(actuators) as ActuatorKey[]).forEach((key) => {
        const actuator = actuators[key];
        if (actuator.mode === "MANUAL" && actuator.manual_until && actuator.manual_until <= now) {
          changed = true;
          actuators[key] = { ...actuator, mode: "AUTO", manual_until: null };
        }
      });

      return changed ? { ...current, actuators } : current;
    });
  }, [now]);

  const connection = getConnectionState(status, now);
  const canOpenApp = startupElapsed && (data.statusReady || startupTimedOut);

  const actuators = status.actuators || {};
  const rewaterState = actuators.pump ? actuators.pump.state : false;

  if (!canOpenApp) return <StartupScreen showSetup={false} onSave={() => {}} />;

  if (data.statusReady && !data.profile) {
    return <StartupScreen showSetup onSave={(profile) => void data.saveProfile(profile)} />;
  }

  // Kirim command lewat data source lalu tunggu ack (A3/A4). Dipakai untuk titik
  // masuk/keluar Kontrol Manual Sementara, bukan untuk toggle di dalam mode manual
  // (lihat catatan onToggle/onExtend di bawah).
  const emitManualCommand = (
    key: ActuatorKey,
    state: boolean,
    mode: "AUTO" | "MANUAL",
    manualUntilOverride?: number,
    track = true,
  ) => {
    const duration = 30 * 60_000;
    const manualUntil = manualUntilOverride ?? Date.now() + duration;
    const remainingDuration = Math.max(1, manualUntil - Date.now());
    const commandId = newCommandId();
    if (track) {
      setSendingActuator(key);
      setPendingAck({ commandId, actuator: key, timeoutAt: Date.now() + 20_000 });
    }
    void data.sendCommand({
      command_id: commandId,
      actuator: key,
      mode,
      state,
      manual_duration_ms: mode === "MANUAL" ? remainingDuration : duration,
      manual_until: manualUntil,
      issued_at: Date.now(),
      issued_by: "web_user",
    });
  };

  const activateManual = (key: ActuatorKey) => {
    emitManualCommand(key, status.actuators[key].state, "MANUAL");
  };

  const requestRewater = () => {
    const commandId = newCommandId();
    setSendingActuator("pump");
    setPendingAck({ commandId, actuator: "pump", timeoutAt: Date.now() + 20_000 });
    void data.sendCommand({
      command_id: commandId,
      actuator: "pump",
      mode: "MANUAL",
      state: true,
      command_type: "REWATER",
      manual_duration_ms: 1,
      manual_until: null,
      issued_at: Date.now(),
      issued_by: "web_user",
    });
  };

  return (
    <AppShell
      page={page}
      connection={connection}
      toast={toast}
      onPageChange={setPage}
    >
      {page === "dashboard" && (
        <DashboardPage
          status={status}
          thresholds={thresholds}
          history={data.telemetry}
          now={now}
          connection={connection}
          isLoading={isLoading}
          sendingActuator={sendingActuator}
          onManualRequest={(key) => {
            if (connection !== "offline") setManualCandidate(key);
          }}
          onToggle={(key) => {
            const act = actuators[key];
            if (!act) return;
            const nextState = !act.state;
            const manualUntil = act.manual_until ?? Date.now() + 30 * 60_000;
            emitManualCommand(key, nextState, "MANUAL", manualUntil);
          }}
          onExtend={(key) => {
            const act = actuators[key];
            if (!act) return;
            const manualUntil = Date.now() + 30 * 60_000;
            emitManualCommand(key, act.state, "MANUAL", manualUntil);
          }}
          onAuto={(key) => {
            emitManualCommand(key, false, "AUTO");
          }}
           onRewaterRequest={() => setRewaterCandidate(true)}
           onOpenChecks={(next) => {
             setChecks(next);
             setPage("check");
           }}
          initialTab="today"
        />
      )}

      {(page === "plants" || page === "tools") && (
        <DashboardPage
          status={status}
          thresholds={thresholds}
          history={data.telemetry}
          now={now}
          connection={connection}
          isLoading={isLoading}
          sendingActuator={sendingActuator}
          onManualRequest={(key) => {
            if (connection !== "offline") setManualCandidate(key);
          }}
          onToggle={(key) => {
            const act = actuators[key];
            if (!act) return;
            emitManualCommand(key, !act.state, "MANUAL", act.manual_until ?? Date.now() + 30 * 60_000);
          }}
          onExtend={(key) => {
            const act = actuators[key];
            if (!act) return;
            emitManualCommand(key, act.state, "MANUAL", Date.now() + 30 * 60_000);
          }}
          onAuto={(key) => emitManualCommand(key, false, "AUTO")}
          onRewaterRequest={() => setRewaterCandidate(true)}
          onOpenChecks={(next) => {
            setChecks(next);
            setPage("check");
          }}
          initialTab={page}
        />
      )}

      {page === "history" && <HistoryPage history={data.telemetry} isLoading={isLoading} />}
      {page === "check" && <CheckPage checks={checks} onBack={() => setPage("dashboard")} />}

      {rewaterCandidate && (
        <ConfirmRewaterModal
          onCancel={() => setRewaterCandidate(false)}
          onConfirm={() => {
            requestRewater();
            setRewaterCandidate(false);
          }}
        />
      )}

      {manualCandidate && (
        <ConfirmManualModal
          actuatorKey={manualCandidate}
          onCancel={() => setManualCandidate(null)}
          onConfirm={() => {
            activateManual(manualCandidate);
            setManualCandidate(null);
          }}
        />
      )}
    </AppShell>
  );
}
