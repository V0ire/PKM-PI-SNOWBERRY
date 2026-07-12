// Konfigurasi Firebase dibaca dari environment (Vite). Tidak ada secret di repo.
// Jika env belum diisi, web-app otomatis memakai data mock (lihat dataSource.ts).
//
// Isi lewat web-app/.env.local (JANGAN commit):
//   VITE_FIREBASE_API_KEY=...
//   VITE_FIREBASE_PROJECT_ID=...
//   VITE_FIREBASE_APP_ID=...
//   VITE_FIREBASE_AUTH_DOMAIN=...
//   VITE_SNOWBERRY_DEVICE_ID=snowberry-001

export type FirebaseEnv = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  deviceId: string;
};

export function readFirebaseEnv(): FirebaseEnv | null {
  const env = import.meta.env;
  const apiKey = env.VITE_FIREBASE_API_KEY;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const appId = env.VITE_FIREBASE_APP_ID;
  if (!apiKey || !projectId || !appId) return null;
  return {
    apiKey,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
    projectId,
    appId,
    deviceId: env.VITE_SNOWBERRY_DEVICE_ID ?? "snowberry-001",
  };
}

export const isFirebaseConfigured = () => readFirebaseEnv() !== null;
