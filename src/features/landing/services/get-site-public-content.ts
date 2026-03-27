import {
  getSitePublicLanding,
  getSitePublicProfile,
} from '@/features/landing/repositories/site-public-content.repository';
import type { SitePublicContent } from '@/features/landing/types/site-public-content';

export async function getSitePublicContent(): Promise<SitePublicContent> {
  const [profile, landing] = await Promise.all([
    getSitePublicProfile(),
    getSitePublicLanding(),
  ]);

  return {
    profile,
    landing,
  };
}
