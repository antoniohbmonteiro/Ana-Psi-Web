import { LandingPage } from '@/features/landing/components/landing-page';
import { mapSitePublicContentToLandingContent } from '@/features/landing/mappers/map-site-public-content-to-landing-content';
import type { SitePublicContent } from '@/features/landing/types/site-public-content';
import snapshot from '@/features/landing/data/site-public-content.snapshot.json';

const initialContent = mapSitePublicContentToLandingContent(snapshot as SitePublicContent);

export default function HomePage() {
  return <LandingPage initialContent={initialContent} />;
}
