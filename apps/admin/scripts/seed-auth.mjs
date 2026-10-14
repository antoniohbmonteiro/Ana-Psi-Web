import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { ADMIN_EMAIL, ADMIN_UID, DEMO_PROJECT_ID, LOCAL_PASSWORD, assertLocalEmulatorEnvironment } from "./emulator-env.mjs";

const envFile = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
assertLocalEmulatorEnvironment();
const app = initializeApp({ projectId: DEMO_PROJECT_ID }, "seed-local-auth");
try {
  const auth = getAuth(app);
  try { await auth.getUser(ADMIN_UID); }
  catch (error) {
    if (error.code !== "auth/user-not-found") throw new Error("Auth Emulator indisponível.");
    await auth.createUser({ uid: ADMIN_UID, email: ADMIN_EMAIL, password: LOCAL_PASSWORD });
  }
  console.log("Usuário administrativo fictício disponível no Auth Emulator. Consulte o README para o login local.");
} finally { await deleteApp(app); }
