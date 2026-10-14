import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { DEMO_PROJECT_ID, assertLocalFirestoreEnvironment } from "./emulator-env.mjs";
import { putFictitiousAppointments } from "./appointment-fixtures.mjs";

const envFile = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
assertLocalFirestoreEnvironment();
const app = initializeApp({ projectId: DEMO_PROJECT_ID }, "seed-local-appointments");
const db = getFirestore(app);
try {
  await putFictitiousAppointments(db);
  console.log("Consultas fictícias preparadas explicitamente no Firestore Emulator. Nenhum outro documento foi removido.");
} finally { await db.terminate(); await deleteApp(app); }
