import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { DEMO_PROJECT_ID, assertLocalFirestoreEnvironment } from "./emulator-env.mjs";
import { fictitiousPatients, putFictitiousAppointments, putFictitiousPatients } from "./appointment-fixtures.mjs";

const envFile = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
assertLocalFirestoreEnvironment();
const app = initializeApp({ projectId: DEMO_PROJECT_ID }, "seed-local-appointments");
const db = getFirestore(app);
try {
  const appointments = await putFictitiousAppointments(db);
  await putFictitiousPatients(db, fictitiousPatients(appointments));
  console.log("Consultas e pacientes fictícios preparados explicitamente no Firestore Emulator. Nenhum outro documento foi removido.");
} finally { await db.terminate(); await deleteApp(app); }
