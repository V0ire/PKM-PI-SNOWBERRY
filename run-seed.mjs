import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 1. Load environment variables dari web-app/.env.local
dotenv.config({ path: './web-app/.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importSeed() {
  try {
    // 2. Menyusun path aman secara otomatis ke folder firebase/seed.example.json
    const filePath = path.join(import.meta.dirname, 'firebase', 'seed.example.json');
    console.log(`Membaca file benih dari: ${filePath}`);

    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // 3. Memecah data berdasarkan key di JSON
    const devData = rawData["devices/snowberry-001"];
    const threshData = rawData["devices/snowberry-001/config/thresholds"];
    const realtimeData = rawData["devices/snowberry-001/status/realtime"];

    console.log("Memulai push data terstruktur ke Firestore Cloud...");

    // Langkah A: Set dokumen utama device
    const deviceDocRef = doc(db, "devices", "snowberry-001");
    await setDoc(deviceDocRef, devData);
    console.log("✓ Dokumen utama 'devices/snowberry-001' berhasil dibuat.");

    // Langkah B: Set nested collection 'config' -> dokumen 'thresholds'
    const thresholdsDocRef = doc(db, "devices", "snowberry-001", "config", "thresholds");
    await setDoc(thresholdsDocRef, threshData);
    console.log("✓ Nested sub-collection 'config/thresholds' berhasil dibuat.");

    // Langkah C: Set nested collection 'status' -> dokumen 'realtime'
    const realtimeDocRef = doc(db, "devices", "snowberry-001", "status", "realtime");
    await setDoc(realtimeDocRef, realtimeData);
    console.log("✓ Nested sub-collection 'status/realtime' berhasil dibuat.");

    console.log("🔥 BERHASIL TOTAL! Semua data dan sub-collection otomatis terpasang.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Terjadi kesalahan saat seeding:", error);
    process.exit(1);
  }
}

importSeed();
