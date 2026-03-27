import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function assertFirebaseEnv() {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase public env vars: ${missingKeys.join(', ')}`);
  }
}

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirebaseApp() {
  if (firebaseAppInstance) {
    return firebaseAppInstance;
  }

  assertFirebaseEnv();

  firebaseAppInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  return firebaseAppInstance;
}

export function getFirestoreDb() {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  firestoreInstance = getFirestore(getFirebaseApp());

  return firestoreInstance;
}

export const firebaseApp = getFirebaseApp();
export const db = getFirestoreDb();
