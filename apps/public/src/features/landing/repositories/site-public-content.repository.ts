import { doc, getDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase/client';
import type { SitePublicLanding } from '@/features/landing/types/site-public-landing';
import type { SitePublicProfile } from '@/features/landing/types/site-public-profile';

async function getRequiredDocument<T>(path: [string, string], label: string): Promise<T> {
  const snapshot = await getDoc(doc(getFirestoreDb(), ...path));

  if (!snapshot.exists()) {
    throw new Error(`Missing Firestore document: ${label}`);
  }

  return snapshot.data() as T;
}

export function getSitePublicProfile() {
  return getRequiredDocument<SitePublicProfile>(['settings', 'site_public_profile'], 'settings/site_public_profile');
}

export function getSitePublicLanding() {
  return getRequiredDocument<SitePublicLanding>(['settings', 'site_public_landing'], 'settings/site_public_landing');
}
