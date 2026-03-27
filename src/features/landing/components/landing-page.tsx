'use client';

import { useEffect, useState } from 'react';
import { landingContent } from '@/features/landing/data/content';
import type { LandingContent } from '@/features/landing/types/content';
import { mapSitePublicContentToLandingContent } from '@/features/landing/mappers/map-site-public-content-to-landing-content';
import { getSitePublicContent } from '@/features/landing/services/get-site-public-content';
import { buildWhatsappLink } from '@/features/landing/utils/build-whatsapp-link';
import { LandingAbout } from './landing-about';
import { LandingFaq } from './landing-faq';
import { LandingFinalCta } from './landing-final-cta';
import { LandingFooter } from './landing-footer';
import { LandingHeader } from './landing-header';
import { LandingHero } from './landing-hero';
import { LandingInfoCards } from './landing-info-cards';
import { LandingProcess } from './landing-process';
import { LandingSpecialties } from './landing-specialties';
import styles from './landing-page.module.css';

type LandingPageProps = {
  initialContent?: LandingContent;
};

export function LandingPage({ initialContent = landingContent }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [content, setContent] = useState<LandingContent>(initialContent);

  useEffect(() => {
    let isMounted = true;

    async function loadSitePublicContent() {
      try {
        const sitePublicContent = await getSitePublicContent();

        if (!isMounted) {
          return;
        }

        setContent(mapSitePublicContentToLandingContent(sitePublicContent));
      } catch (error) {
        console.error('Failed to load landing content from Firestore.', error);
      }
    }

    void loadSitePublicContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const whatsappHref = buildWhatsappLink(content.contact.whatsapp, content.contact.whatsappMessage);

  return (
    <div className={styles.page}>
      <LandingHeader
        brand={content.brand}
        menuOpen={menuOpen}
        whatsappHref={whatsappHref}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onCloseMenu={() => setMenuOpen(false)}
      />

      <main id="top">
        <LandingHero
          professionalDisplayName={content.professional.displayName}
          hero={content.hero}
          whatsappHref={whatsappHref}
        />

        <LandingAbout
          about={content.about}
          professionalDisplayName={content.professional.displayName}
          whatsappHref={whatsappHref}
        />

        <LandingSpecialties specialties={content.specialties} />

        <LandingProcess process={content.process} />

        <LandingInfoCards infoCards={content.infoCards} />

        <LandingFaq faq={content.faq} whatsappHref={whatsappHref} />

        <LandingFinalCta finalCta={content.finalCta} whatsappHref={whatsappHref} />
      </main>

      <LandingFooter
        brand={content.brand}
        contact={content.contact}
        footer={content.footer}
        professional={content.professional}
      />
    </div>
  );
}
