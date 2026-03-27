'use client';

import { useEffect, useState } from 'react';
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

type LoadState = 'loading' | 'ready' | 'error';

export function LandingPage({ initialContent }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [content, setContent] = useState<LandingContent | null>(initialContent ?? null);
  const [loadState, setLoadState] = useState<LoadState>(initialContent ? 'ready' : 'loading');

  useEffect(() => {
    if (initialContent) {
      return;
    }

    let isMounted = true;

    async function loadSitePublicContent() {
      try {
        setLoadState('loading');

        const sitePublicContent = await getSitePublicContent();

        if (!isMounted) {
          return;
        }

        setContent(mapSitePublicContentToLandingContent(sitePublicContent));
        setLoadState('ready');
      } catch (error) {
        console.error('Failed to load landing content from Firestore.', error);

        if (!isMounted) {
          return;
        }

        setLoadState('error');
      }
    }

    void loadSitePublicContent();

    return () => {
      isMounted = false;
    };
  }, [initialContent]);

  if (loadState === 'loading' || !content) {
    return (
      <div className={styles.page}>
        <main className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div className={styles.eyebrow}>Carregando</div>
              <h1 className={styles.sectionTitleCenter}>Preparando o site...</h1>
              <p className={styles.sectionLead}>Aguarde um instante.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className={styles.page}>
        <main className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div className={styles.eyebrow}>Erro ao carregar</div>
              <h1 className={styles.sectionTitleCenter}>Não foi possível carregar o conteúdo do site.</h1>
              <p className={styles.sectionLead}>Verifique a conexão, as regras do Firestore e tente novamente.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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

        <LandingFaq
          faq={content.faq}
          openFaq={openFaq}
          onToggleFaq={(index) => setOpenFaq((current) => (current === index ? null : index))}
          whatsappHref={whatsappHref}
        />

        <LandingFinalCta finalCta={content.finalCta} whatsappHref={whatsappHref} />
      </main>

      <LandingFooter
        brand={content.brand}
        contact={content.contact}
        footer={content.footer}
        professional={content.professional}
      />

      <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.floatButton}>
        <span>Fale comigo</span>
        <span className={styles.floatDot} />
      </a>
    </div>
  );
}
