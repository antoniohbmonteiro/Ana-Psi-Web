export const DEMO_PROJECT_ID = "demo-ana-psi";
export const AUTH_HOST = "127.0.0.1:9099";
export const ADMIN_UID = "local-admin-ana";
export const ADMIN_EMAIL = "ana.admin@example.invalid";
export const LOCAL_PASSWORD = "LocalOnly-123456!";

export function localEnvironment(origin = "http://127.0.0.1:3100") {
  // Retain runtime/OS paths, not the caller's Firebase credentials or application configuration.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    /^(path|pathext|systemroot|windir|comspec|temp|tmp|home|userprofile|appdata|localappdata|java_home|npm_config_cache)$/i.test(key)));
  return {
    ...env, CI: "true", FIREBASE_CLI_DISABLE_UPDATE_CHECK: "true",
    ADMIN_ENV: "ci", ADMIN_ORIGIN: origin, ADMIN_ALLOWED_UID: ADMIN_UID,
    ADMIN_ENABLE_DEMO_APPOINTMENTS: "true",
    FIREBASE_PROJECT_ID: DEMO_PROJECT_ID, GCLOUD_PROJECT: DEMO_PROJECT_ID,
    FIREBASE_AUTH_EMULATOR_HOST: AUTH_HOST, FIRESTORE_EMULATOR_HOST: "",
    NEXT_PUBLIC_FIREBASE_API_KEY: "fake-api-key", NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: `${DEMO_PROJECT_ID}.firebaseapp.com`,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: DEMO_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app",
    NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "true", NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: `http://${AUTH_HOST}`,
    // Explicit empty values also prevent Next's .env.local from filling these credentials.
    GOOGLE_APPLICATION_CREDENTIALS: "", FIREBASE_SERVICE_ACCOUNT_JSON: "", FIREBASE_TOKEN: "",
    NEXT_TELEMETRY_DISABLED: "1",
  };
}

export function assertLocalEmulatorEnvironment(env = process.env) {
  if (!["local", "ci"].includes(env.ADMIN_ENV) || env.FIREBASE_PROJECT_ID !== DEMO_PROJECT_ID
    || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== DEMO_PROJECT_ID || env.FIREBASE_AUTH_EMULATOR_HOST !== AUTH_HOST
    || env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS !== "true"
    || env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL !== `http://${AUTH_HOST}`) {
    throw new Error("Este comando exige o projeto demo-ana-psi e o Auth Emulator local em 127.0.0.1:9099.");
  }
}
