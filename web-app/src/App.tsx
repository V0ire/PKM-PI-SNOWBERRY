import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { ConfirmManualModal } from "./components/ConfirmManualModal";
import { useSnowberryData } from "./services/useSnowberryData";
import { newCommandId } from "./services/dataSource";
import { DashboardPage } from "./pages/DashboardPage";
import { GrowthPhasePage } from "./pages/GrowthPhasePage";
import { HistoryPage } from "./pages/HistoryPage";
import { ThresholdsPage } from "./pages/ThresholdsPage";
import type { ActuatorKey, FarmJournalEntry, Page } from "./types";
import { getConnectionState } from "./utils/status";

function todayInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export default function App() {
  const data = useSnowberryData();
  const [page, setPage] = useState<Page>("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [thresholds, setThresholds] = useState(data.thresholds);
  const [status, setStatus] = useState(data.status);
  const [manualCandidate, setManualCandidate] = useState<ActuatorKey | null>(null);
  const [sendingActuator, setSendingActuator] = useState<ActuatorKey | null>(null);
  const [journalEntries, setJournalEntries] = useState<FarmJournalEntry[]>([]);
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setStatus(data.status);
  }, [data.status]);

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

  const sendActuatorChange = (key: ActuatorKey, change: () => void, message: string) => {
    if (connection === "offline") return;
    setSendingActuator(key);
    window.setTimeout(() => {
      change();
      setSendingActuator(null);
      setToast(message);
    }, 350);
  };

  const emitManualCommand = (key: ActuatorKey, state: boolean, mode: "AUTO" | "MANUAL") => {
    const duration = 30 * 60_000;
    void data.sendCommand({
      command_id: newCommandId(),
      actuator: key,
      mode,
      state,
      manual_duration_ms: duration,
      manual_until: Date.now() + duration,
      issued_at: Date.now(),
      issued_by: "web_user",
    });
  };

  const activateManual = (key: ActuatorKey) => {
    emitManualCommand(key, status.actuators[key].state, "MANUAL");
    sendActuatorChange(
      key,
      () =>
        setStatus((current) => {
          const manualUntil = Date.now() + 30 * 60_000;
          if (key === "mist") {
            return {
              ...current,
              actuators: {
                ...current.actuators,
                mist: { ...current.actuators.mist, mode: "MANUAL", manual_until: manualUntil },
                fan: { ...current.actuators.fan, mode: "MANUAL", manual_until: manualUntil },
              },
            };
          }

          return {
            ...current,
            actuators: {
              ...current.actuators,
              [key]: {
                ...current.actuators[key],
                mode: "MANUAL",
                manual_until: manualUntil,
              },
            },
          };
        }),
      "Kontrol manual aktif selama 30 menit.",
    );
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
          onToggle={(key) =>
            sendActuatorChange(
              key,
              () =>
                setStatus((current) => {
                  if (key === "mist") {
                    const nextState = !(current.actuators.mist.state && current.actuators.fan.state);
                    return {
                      ...current,
                      actuators: {
                        ...current.actuators,
                        mist: { ...current.actuators.mist, state: nextState },
                        fan: { ...current.actuators.fan, state: nextState },
                      },
                    };
                  }

                  return {
                    ...current,
                    actuators: {
                      ...current.actuators,
                      [key]: { ...current.actuators[key], state: !current.actuators[key].state },
                    },
                  };
                }),
              key === "mist" ? "Pengatur kelembapan diperbarui." : "Perintah alat diperbarui.",
            )
          }
          onExtend={(key) =>
            sendActuatorChange(
              key,
              () =>
                setStatus((current) => {
                  const manualUntil = Date.now() + 30 * 60_000;
                  if (key === "mist") {
                    return {
                      ...current,
                      actuators: {
                        ...current.actuators,
                        mist: { ...current.actuators.mist, manual_until: manualUntil },
                        fan: { ...current.actuators.fan, manual_until: manualUntil },
                      },
                    };
                  }

                  return {
                    ...current,
                    actuators: {
                      ...current.actuators,
                      [key]: { ...current.actuators[key], manual_until: manualUntil },
                    },
                  };
                }),
              key === "mist" ? "Pengatur kelembapan diperpanjang 30 menit." : "Kontrol manual diperpanjang 30 menit.",
            )
          }
          onAuto={(key) => {
            emitManualCommand(key, false, "AUTO");
            sendActuatorChange(
              key,
              () =>
                setStatus((current) => {
                  if (key === "mist") {
                    return {
                      ...current,
                      actuators: {
                        ...current.actuators,
                        mist: { ...current.actuators.mist, mode: "AUTO", manual_until: null },
                        fan: { ...current.actuators.fan, mode: "AUTO", manual_until: null },
                      },
                    };
                  }

                  return {
                    ...current,
                    actuators: {
                      ...current.actuators,
                      [key]: { ...current.actuators[key], mode: "AUTO", manual_until: null },
                    },
                  };
                }),
              key === "mist" ? "Pengatur kelembapan kembali otomatis." : "Alat sekarang mengikuti sensor lagi.",
            );
          }}
        />
      )}

      {page === "thresholds" && (
        <ThresholdsPage
          thresholds={thresholds}
          connection={connection}
          isLoading={isLoading}
          onSave={(next) => {
            setThresholds(next);
            void data.saveThresholds(next);
          }}
          onToast={setToast}
        />
      )}

      {page === "history" && <HistoryPage history={data.telemetry} isLoading={isLoading} />}

      {page === "growth" && (
        <GrowthPhasePage
          thresholds={thresholds}
          isLoading={isLoading}
          journalEntries={journalEntries}
          onEditDate={() => setPage("thresholds")}
          onJournalAdd={(entry) => setJournalEntries((current) => [entry, ...current])}
          onResetPlantingDate={() => {
            const today = todayInputValue();
            setThresholds((current) => ({
              ...current,
              planting_date: today,
              updated_at: Date.now(),
              updated_by: "uid_mock_petani",
            }));
            setToast("Tanggal tanam direset ke hari ini.");
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
