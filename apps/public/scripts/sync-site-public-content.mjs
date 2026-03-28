import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const appRoot = process.cwd();
const snapshotPath = resolve(appRoot, 'src/features/landing/data/site-public-content.snapshot.json');
const envCandidates = [
  resolve(appRoot, '.env.local'),
  resolve(appRoot, '../../.env.local'),
];

loadEnvFiles(envCandidates);

const result = await syncSnapshot();

if (!result.ok) {
  if (existsSync(snapshotPath)) {
    console.warn(`⚠️  ${result.message}`);
    console.warn('⚠️  Mantendo o snapshot existente para o build continuar.');
    process.exit(0);
  }

  console.error(`❌ ${result.message}`);
  process.exit(1);
}

mkdirSync(dirname(snapshotPath), { recursive: true });
writeFileSync(snapshotPath, `${JSON.stringify(result.data, null, 2)}\n`, 'utf-8');
console.log(`✅ Snapshot atualizado em ${snapshotPath}`);

async function syncSnapshot() {
  try {
    const data =
      (await tryFetchWithAdminSdk()) ??
      (await tryFetchWithWebSdk());

    if (!data) {
      return {
        ok: false,
        message:
          'Não encontrei credenciais válidas nem configuração pública suficiente para buscar o Firestore.',
      };
    }

    validateSitePublicContent(data);

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Falha desconhecida ao sincronizar snapshot.',
    };
  }
}

async function tryFetchWithAdminSdk() {
  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    return null;
  }

  try {
    const { cert, getApps, initializeApp } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert(serviceAccount),
        projectId:
          serviceAccount.project_id ??
          process.env.FIREBASE_PROJECT_ID ??
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });

    const db = getFirestore(app);

    const [profileSnapshot, landingSnapshot] = await Promise.all([
      db.doc('settings/site_public_profile').get(),
      db.doc('settings/site_public_landing').get(),
    ]);

    if (!profileSnapshot.exists || !landingSnapshot.exists) {
      throw new Error(
        'Os documentos settings/site_public_profile ou settings/site_public_landing não existem no Firestore.',
      );
    }

    return {
      profile: profileSnapshot.data(),
      landing: landingSnapshot.data(),
    };
  } catch (error) {
    console.warn('⚠️  Firebase Admin SDK indisponível ou falhou. Tentando Web SDK...');
    console.warn(String(error));
    return null;
  }
}

async function tryFetchWithWebSdk() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const missingKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    return null;
  }

  const { getApp, getApps, initializeApp } = await import('firebase/app');
  const { doc, getDoc, getFirestore } = await import('firebase/firestore');

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const [profileSnapshot, landingSnapshot] = await Promise.all([
    getDoc(doc(db, 'settings', 'site_public_profile')),
    getDoc(doc(db, 'settings', 'site_public_landing')),
  ]);

  if (!profileSnapshot.exists() || !landingSnapshot.exists()) {
    throw new Error(
      'Os documentos settings/site_public_profile ou settings/site_public_landing não existem no Firestore.',
    );
  }

  return {
    profile: profileSnapshot.data(),
    landing: landingSnapshot.data(),
  };
}

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const candidatePaths = [
    configuredPath ? resolve(appRoot, configuredPath) : null,
    resolve(appRoot, '../../service-account.json'),
    resolve(appRoot, 'service-account.json'),
  ].filter(Boolean);

  for (const candidatePath of candidatePaths) {
    if (!existsSync(candidatePath)) {
      continue;
    }

    return JSON.parse(readFileSync(candidatePath, 'utf-8'));
  }

  return null;
}

function loadEnvFiles(paths) {
  for (const filePath of paths) {
    if (!existsSync(filePath)) {
      continue;
    }

    const source = readFileSync(filePath, 'utf-8');

    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith('#')) {
        continue;
      }

      const separatorIndex = line.indexOf('=');

      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

function validateSitePublicContent(value) {
  if (!value || typeof value !== 'object') {
    throw new Error('Snapshot inválido: objeto raiz ausente.');
  }

  if (!value.profile || !value.landing) {
    throw new Error('Snapshot inválido: expected profile e landing.');
  }
}
