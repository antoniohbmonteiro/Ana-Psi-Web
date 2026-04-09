import type { Analytics } from 'firebase/analytics';
import { getFirebaseApp } from '@/lib/firebase/client';

let analyticsPromise: Promise<Analytics | null> | null = null;

async function loadAnalytics() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
    return null;
  }

  const { isSupported, getAnalytics } = await import('firebase/analytics');

  const supported = await isSupported().catch(() => false);

  if (!supported) {
    return null;
  }

  return getAnalytics(getFirebaseApp());
}

export function getAnalyticsInstance() {
  if (!analyticsPromise) {
    analyticsPromise = loadAnalytics();
  }

  return analyticsPromise;
}
