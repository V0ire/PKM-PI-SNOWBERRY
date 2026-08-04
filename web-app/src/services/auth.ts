import type { FirebaseApp } from "firebase/app";
import { browserLocalPersistence, createUserWithEmailAndPassword, getAuth, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";

export function createSnowberryAuth(app: FirebaseApp) {
  const auth = getAuth(app);
  void setPersistence(auth, browserLocalPersistence);
  return {
    subscribe: (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback),
    login: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    register: (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password),
    logout: () => signOut(auth),
    currentUid: () => auth.currentUser?.uid ?? null,
  };
}

export function authErrorMessage(code?: string): string {
  if (code === "auth/invalid-credential") return "Email atau kata sandi tidak sesuai.";
  if (code === "auth/email-already-in-use") return "Alamat email ini sudah terdaftar.";
  if (code === "auth/too-many-requests") return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  if (code === "auth/network-request-failed") return "Aplikasi tidak terhubung ke internet. Periksa koneksi lalu coba lagi.";
  return "Akun belum dapat dibuka. Coba lagi.";
}
