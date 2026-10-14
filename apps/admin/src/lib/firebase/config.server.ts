import "server-only";
import { AdminAuthError } from "../auth/errors";

export const DEMO_PROJECT_ID = "demo-ana-psi";

export type PublicAuthConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  emulatorUrl?: string;
};

export type AdminConfig = {
  environment: "local" | "ci" | "development" | "production";
  local: boolean;
  secure: boolean;
  origin: string;
  allowedUid: string;
  projectId: string;
  authEmulatorHost?: string;
  demoAppointments: boolean;
  publicAuth: PublicAuthConfig;
};

function invalid(): never {
  throw new AdminAuthError(503, "ADMIN_CONFIG_INVALID");
}

function required(env: NodeJS.ProcessEnv, name: string) {
  const value = env[name];
  if (!value || value.trim() !== value) invalid();
  return value;
}

export function isLoopbackHost(value: string) {
  return value === "127.0.0.1" || value === "localhost" || value === "[::1]";
}

function localHostPort(value: string) {
  try {
    const url = new URL(`http://${value}`);
    return isLoopbackHost(url.hostname) && /^\d+$/.test(url.port)
      && url.origin === `http://${value}` && url.pathname === "/"
      && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

// Validation is lazy: importing a module or compiling Next never initializes Firebase.
export function parseAdminConfig(env: NodeJS.ProcessEnv): AdminConfig {
  const environment = required(env, "ADMIN_ENV");
  if (!["local", "ci", "development", "production"].includes(environment)) invalid();
  const local = environment === "local" || environment === "ci";
  const projectId = required(env, "FIREBASE_PROJECT_ID");
  const allowedUid = required(env, "ADMIN_ALLOWED_UID");
  if (allowedUid.length > 128) invalid();
  const origin = required(env, "ADMIN_ORIGIN");
  let originUrl: URL;
  try { originUrl = new URL(origin); } catch { invalid(); }
  if (originUrl.origin !== origin || originUrl.username || originUrl.password) invalid();
  const publicAuth: PublicAuthConfig = {
    apiKey: required(env, "NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: required(env, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: required(env, "NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    appId: required(env, "NEXT_PUBLIC_FIREBASE_APP_ID"),
  };
  if (publicAuth.projectId !== projectId) invalid();
  const emulatorFlag = required(env, "NEXT_PUBLIC_FIREBASE_USE_EMULATORS");
  if (emulatorFlag !== "true" && emulatorFlag !== "false") invalid();
  const demo = env.ADMIN_ENABLE_DEMO_APPOINTMENTS;
  if (demo !== undefined && demo !== "true" && demo !== "false") invalid();

  if (local) {
    const authHost = required(env, "FIREBASE_AUTH_EMULATOR_HOST");
    const emulatorUrl = required(env, "NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL");
    if (projectId !== DEMO_PROJECT_ID || emulatorFlag !== "true"
      || !isLoopbackHost(originUrl.hostname) || !["http:", "https:"].includes(originUrl.protocol)
      || !localHostPort(authHost) || emulatorUrl !== `http://${authHost}`
      || (env.FIRESTORE_EMULATOR_HOST && !localHostPort(env.FIRESTORE_EMULATOR_HOST))) invalid();
    publicAuth.emulatorUrl = emulatorUrl;
  } else {
    if (projectId.startsWith("demo-") || emulatorFlag !== "false" || originUrl.protocol !== "https:"
      || env.FIREBASE_AUTH_EMULATOR_HOST !== undefined || env.FIRESTORE_EMULATOR_HOST !== undefined
      || env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL !== undefined || demo === "true") invalid();
  }
  return {
    environment: environment as AdminConfig["environment"], local,
    secure: originUrl.protocol === "https:", origin, allowedUid, projectId,
    authEmulatorHost: local ? env.FIREBASE_AUTH_EMULATOR_HOST : undefined,
    demoAppointments: local && demo === "true", publicAuth,
  };
}

export function getAdminConfig() {
  return parseAdminConfig(process.env);
}
