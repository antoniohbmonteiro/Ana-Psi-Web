import { LandingPage } from '@/features/landing/components/landing-page';
import snapshot from '@/features/landing/data/site-public-content.snapshot.json';
import { mapSitePublicContentToLandingContent } from '@/features/landing/mappers/map-site-public-content-to-landing-content';
import type { SitePublicContent } from '@/features/landing/types/site-public-content';

export default function HomePage() {
  const content = mapSitePublicContentToLandingContent(snapshot as SitePublicContent);

  return <LandingPage content={content} />;
}