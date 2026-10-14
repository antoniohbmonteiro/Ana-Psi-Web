import "server-only";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getAdminConfig } from "./config.server";

export function getAdminAuth() {
  const config = getAdminConfig();
  const name = `ana-admin-${config.environment}-${config.projectId}`;
  const existing = getApps().find((app) => app.name === name);
  const app = existing ?? initializeApp({
    projectId: config.projectId,
    // Local mode never consults inherited ADC or service-account credentials.
    ...(config.local ? {} : { credential: applicationDefault() }),
  }, name);
  return getAuth(app);
}
