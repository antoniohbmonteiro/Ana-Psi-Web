import type { SitePublicLanding } from './site-public-landing';
import type { SitePublicProfile } from './site-public-profile';

export type SitePublicContent = {
  profile: SitePublicProfile;
  landing: SitePublicLanding;
};
