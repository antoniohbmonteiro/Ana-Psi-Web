import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { sitePublicLanding, sitePublicProfile } from "./site-public-content.seed.mjs";

function resolveServiceAccount() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (inline) {
    return JSON.parse(inline);
  }

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!filePath) {
    return null;
  }

  const absolutePath = path.resolve(process.cwd(), filePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
}

const serviceAccount = resolveServiceAccount();

initializeApp(
  serviceAccount
    ? {
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id ?? process.env.FIREBASE_PROJECT_ID
      }
    : {
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
      }
);

const db = getFirestore();

async function seed() {
  await db.doc("settings/site_public_profile").set(sitePublicProfile, { merge: true });
  await db.doc("settings/site_public_landing").set(sitePublicLanding, { merge: true });

  console.log("✅ Seed concluído:");
  console.log(" - settings/site_public_profile");
  console.log(" - settings/site_public_landing");
}

seed().catch((error) => {
  console.error("❌ Erro ao executar seed do conteúdo público:", error);
  process.exitCode = 1;
});
