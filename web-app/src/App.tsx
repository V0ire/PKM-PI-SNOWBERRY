import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { ConfirmManualModal } from "./components/ConfirmManualModal";
import { DEFAULT_THRESHOLDS, HISTORY_POINTS, INITIAL_STATUS } from "./data/mockSnowberry";
import { DashboardPage } from "./pages/DashboardPage";
import { GrowthPhasePage } from "./pages/GrowthPhasePage";
import { HistoryPage } from "./pages/HistoryPage";
import { ThresholdsPage } from "./pages/ThresholdsPage";
import type { ActuatorKey, Page, ThemeMode } from "./types";
import { getConnectionState } from "./utils/status";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem("snowberry-theme");
    return stored === "dark" ? "dark" : "light";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [status, setStatus] = useState(INITIAL_STATUS);
  const [manualCandidate, setManualCandidate] = useState<ActuatorKey | null>(null);
  const [sendingActuator, setSendingActuator] = useState<ActuatorKey | null>(null);
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("snowberry-theme", theme);
  }, [theme]);

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

  const activateManual = (key: ActuatorKey) => {
    sendActuatorChange(
      key,
      () =>
        setStatus((current) => ({
          ...current,
          actuators: {
            ...current.actuators,
            [key]: {
              ...current.actuators[key],
              mode: "MANUAL",
              manual_until: Date.now() + 30 * 60_000,
            },
          },
        })),
      "Kontrol manual aktif selama 30 menit.",
    );
  };

  return (
    <AppShell
      page={page}
      connection={connection}
      theme={theme}
      toast={toast}
      onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      onPageChange={setPage}
    >
      {page === "dashboard" && (
        <DashboardPage
          status={status}
          thresholds={thresholds}
          history={HISTORY_POINTS}
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
                setStatus((current) => ({
                  ...current,
                  actuators: {
                    ...current.actuators,
                    [key]: { ...current.actuators[key], state: !current.actuators[key].state },
                  },
                })),
              "Perintah alat diperbarui.",
            )
          }
          onExtend={(key) =>
            sendActuatorChange(
              key,
              () =>
                setStatus((current) => ({
                  ...current,
                  actuators: {
                    ...current.actuators,
                    [key]: { ...current.actuators[key], manual_until: Date.now() + 30 * 60_000 },
                  },
                })),
              "Kontrol manual diperpanjang 30 menit.",
            )
          }
          onAuto={(key) =>
            sendActuatorChange(
              key,
              () =>
                setStatus((current) => ({
                  ...current,
                  actuators: {
                    ...current.actuators,
                    [key]: { ...current.actuators[key], mode: "AUTO", manual_until: null },
                  },
                })),
              "Alat sekarang mengikuti sensor lagi.",
            )
          }
        />
      )}

      {page === "thresholds" && (
        <ThresholdsPage
          thresholds={thresholds}
          connection={connection}
          isLoading={isLoading}
          onSave={setThresholds}
          onToast={setToast}
        />
      )}

      {page === "history" && <HistoryPage history={HISTORY_POINTS} isLoading={isLoading} />}

      {page === "growth" && (
        <GrowthPhasePage thresholds={thresholds} isLoading={isLoading} onEditDate={() => setPage("thresholds")} />
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
