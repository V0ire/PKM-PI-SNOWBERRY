import { useEffect, useRef } from "react";
import type { ConnectionState, RealtimeStatus } from "../types";

// ponytail: notifikasi lokal via Notification API. Upgrade ke FCM (Cloud Function
// + VAPID) saat perangkat produksi butuh push ketika app tertutup.
export function useFaultNotifications(status: RealtimeStatus, connection: ConnectionState) {
  const lastFault = useRef<string | null>(null);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const code = status.fault.active_code;
    if (code && code !== lastFault.current) {
      new Notification("Snowberry — Masalah Terdeteksi", {
        body: status.fault.active_message ?? `Kode masalah: ${code}`,
        icon: "/snowberry-icon.svg",
        tag: `fault-${code}`,
      });
    }
    lastFault.current = code;
  }, [status.fault.active_code, status.fault.active_message]);

  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    if (connection === "offline" && !wasOffline.current) {
      new Notification("Snowberry — Perangkat Tidak Terhubung", {
        body: "Data belum masuk lebih dari 5 menit. Cek listrik box Snowberry dan Wi-Fi greenhouse.",
        icon: "/snowberry-icon.svg",
        tag: "device-offline",
      });
    }
    wasOffline.current = connection === "offline";
  }, [connection]);
}
