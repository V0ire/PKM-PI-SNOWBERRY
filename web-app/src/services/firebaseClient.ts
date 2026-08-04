import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import type { FirebaseEnv } from "./firebaseConfig";

export function getSnowberryFirebaseApp(env: FirebaseEnv): FirebaseApp {
  if (getApps().length) return getApp();
  return initializeApp({
    apiKey: env.apiKey,
    authDomain: env.authDomain,
    projectId: env.projectId,
    appId: env.appId,
  });
}
