import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { ConfirmManualModal } from "./components/ConfirmManualModal";
import { ConfirmRewaterModal } from "./components/ConfirmRewaterModal";
import { LoginScreen } from "./components/LoginScreen";
import { StartupScreen } from "./components/StartupScreen";
import { useSnowberryData } from "./services/useSnowberryData";
import { newCommandId } from "./services/dataSource";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { CheckPage } from "./pages/CheckPage";
import { ThresholdsPage } from "./pages/ThresholdsPage";
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
  const isLoading = false; // skeleton palsu dihapus: konten tampil begitu data siap
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
  const [startupTimedOut, setStartupTimedOut] = useState(false);
  const [checks, setChecks] = useState<import("./types").DailyCheckItem[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (data.statusReady) return;
    const timer = window.setTimeout(() => {
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
  // Tidak ada lagi splash minimum: masuk segera begitu data pertama tiba
  // (fallback 15 detik tetap ada untuk perangkat yang benar-benar mati).
  const canOpenApp = data.statusReady || startupTimedOut;

  const actuators = status.actuators || {};
  const rewaterState = actuators.pump ? actuators.pump.state : false;

  if (!canOpenApp) return <StartupScreen showSetup={false} onSave={() => {}} />;

  // Firebase: cek sesi dulu, lalu minta login sebelum data disentuh.
  if (data.source === "firebase" && !data.authReady) return <StartupScreen showSetup={false} onSave={() => {}} />;
  if (data.needsLogin) return <LoginScreen onSignIn={data.signIn} />;

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
    data.sendCommand({
      command_id: commandId,
      actuator: key,
      mode,
      state,
      manual_duration_ms: mode === "MANUAL" ? remainingDuration : duration,
      manual_until: manualUntil,
      issued_at: Date.now(),
      issued_by: "web_user",
    }).catch(() => {
      // Gagal tulis ke server (mis. koneksi putus): jangan biarkan pengguna
      // menunggu timeout ack 20 detik untuk tahu perintah tidak terkirim.
      if (track) {
        setSendingActuator(null);
        setPendingAck(null);
      }
      setToast("Perintah gagal terkirim. Periksa koneksi internet lalu coba lagi.");
    });
  };

  const activateManual = (key: ActuatorKey) => {
    emitManualCommand(key, status.actuators[key].state, "MANUAL");
  };

  const requestRewater = () => {
    const commandId = newCommandId();
    setSendingActuator("pump");
    setPendingAck({ commandId, actuator: "pump", timeoutAt: Date.now() + 20_000 });
    // Satu siklus siram penuh (pulse 45 s + awal soak). Durasi terlalu pendek
    // membuat firmware menilai perintah EXPIRED sebelum pulse dimulai.
    const manualUntil = Date.now() + 90_000;
    data.sendCommand({
      command_id: commandId,
      actuator: "pump",
      mode: "MANUAL",
      state: true,
      command_type: "REWATER",
      manual_duration_ms: 90_000,
      manual_until: manualUntil,
      issued_at: Date.now(),
      issued_by: "web_user",
    }).catch(() => {
      setSendingActuator(null);
      setPendingAck(null);
      setToast("Perintah gagal terkirim. Periksa koneksi internet lalu coba lagi.");
    });
  };

  return (
    <AppShell
      page={page}
      connection={connection}
      toast={toast}
      onPageChange={setPage}
      accountEmail={data.authEmail}
      onSignOut={() => void data.signOut()}
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

      {page === "history" && (
        <HistoryPage
          history={data.telemetry}
          isLoading={isLoading}
          thresholds={data.thresholds}
          loadRange={data.loadRange}
          loadDay={data.loadDay}
        />
      )}
      {page === "check" && <CheckPage checks={checks} onBack={() => setPage("dashboard")} />}
      {page === "settings" && (
        <ThresholdsPage
          thresholds={thresholds}
          connection={connection}
          isLoading={!data.statusReady}
          onSave={(next) => void data.saveThresholds(next)}
          onToast={setToast}
        />
      )}

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
