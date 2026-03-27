'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
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

function normalizeHeroWord(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '');
}

function renderHeroTitle(title: string, highlightWords: readonly string[]) {
  const normalizedTitle = title.replace(/\\n/g, '\n');

  const lines = normalizedTitle
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const highlightSet = new Set(highlightWords.map(normalizeHeroWord));

  return lines.map((line, lineIndex) => {
    const tokens = line.split(/(\s+)/);

    return (
      <span key={`${line}-${lineIndex}`} className={styles.heroTitleLine}>
        {tokens.map((token, tokenIndex) => {
          if (/^\s+$/.test(token)) {
            return <Fragment key={`${lineIndex}-space-${tokenIndex}`}>{token}</Fragment>;
          }

          const isHighlighted = highlightSet.has(normalizeHeroWord(token));

          if (!isHighlighted) {
            return <Fragment key={`${lineIndex}-token-${tokenIndex}`}>{token}</Fragment>;
          }

          return (
            <span key={`${lineIndex}-highlight-${tokenIndex}`} className={styles.heroHighlight}>
              {token}
            </span>
          );
        })}
      </span>
    );
  });
}

export function LandingPage({ initialContent = landingContent }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
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

  const renderedHeroTitle = useMemo(
    () => renderHeroTitle(content.hero.title, content.hero.highlightWords),
    [content.hero.title, content.hero.highlightWords]
  );

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
          renderedHeroTitle={renderedHeroTitle}
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
          whatsappHref={whatsappHref}
          onToggleFaq={(index) => setOpenFaq((current) => (current === index ? null : index))}
        />

        <LandingFinalCta finalCta={content.finalCta} whatsappHref={whatsappHref} />
      </main>

      <LandingFooter
        brand={content.brand}
        professional={content.professional}
        contact={content.contact}
        footer={content.footer}
      />

      <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.floatButton}>
        <span aria-hidden="true">💬</span>
        <span>Fale comigo</span>
        <span className={styles.floatDot} />
      </a>
    </div>
  );
}
