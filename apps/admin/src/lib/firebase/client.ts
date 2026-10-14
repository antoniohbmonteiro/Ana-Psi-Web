"use client";

import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, inMemoryPersistence, initializeAuth, type Auth } from "firebase/auth";
import type { PublicAuthConfig } from "./config.server";

let authInstance: Auth | undefined;

// Only public configuration crosses this boundary; credentials and the allowed UID stay on the server.
export function getClientAuth(config: PublicAuthConfig) {
  if (authInstance) return authInstance;
  const name = "ana-admin-client";
  const existing = getApps().find((app) => app.name === name);
  const app = existing ?? initializeApp(config, name);
  authInstance = existing ? getAuth(app) : initializeAuth(app, { persistence: inMemoryPersistence });
  if (config.emulatorUrl) connectAuthEmulator(authInstance, config.emulatorUrl);
  return authInstance;
}
