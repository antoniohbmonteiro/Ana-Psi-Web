'use client';

import { useState } from 'react';
import { trackWhatsappClick } from '@/features/landing/analytics/track-whatsapp-click';
import type { LandingContent } from '@/features/landing/types/content';
import { buildWhatsappLink } from '@/features/landing/utils/build-whatsapp-link';
import { LandingAbout } from './landing-about';
import { LandingApproach } from './landing-approach';
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
  content: LandingContent;
};

export function LandingPage({ content }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const whatsappHref = buildWhatsappLink(content.contact.whatsapp, content.contact.whatsappMessage);

  return (
    <div className={styles.page}>
      <a
        href="#conteudo-principal"
        style={{
          position: 'absolute',
          left: '16px',
          top: '-48px',
          zIndex: 100,
          padding: '10px 14px',
          borderRadius: '12px',
          background: '#ffffff',
          color: '#0f172a',
          textDecoration: 'none',
          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
          transition: 'top 0.2s ease',
        }}
        onFocus={(event) => {
          event.currentTarget.style.top = '16px';
        }}
        onBlur={(event) => {
          event.currentTarget.style.top = '-48px';
        }}
      >
        Pular para o conteúdo principal
      </a>

      <LandingHeader
        brand={content.brand}
        menuOpen={menuOpen}
        whatsappHref={whatsappHref}
        onWhatsappClick={() => trackWhatsappClick({ location: 'header' })}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onCloseMenu={() => setMenuOpen(false)}
      />

      <main id="conteudo-principal">
        <LandingHero
          professionalDisplayName={content.professional.displayName}
          hero={content.hero}
          whatsappHref={whatsappHref}
          onWhatsappClick={() => trackWhatsappClick({ location: 'hero' })}
        />

        <LandingAbout
          about={content.about}
          professionalDisplayName={content.professional.displayName}
          whatsappHref={whatsappHref}
          onWhatsappClick={() => trackWhatsappClick({ location: 'about' })}
        />

        <LandingApproach approach={content.approach} />

        <LandingSpecialties specialties={content.specialties} />

        <LandingProcess process={content.process} />

        <LandingInfoCards infoCards={content.infoCards} />

        <LandingFaq
          faq={content.faq}
          openFaq={openFaq}
          onToggleFaq={(index: number) => setOpenFaq((current) => (current === index ? null : index))}
          whatsappHref={whatsappHref}
          onWhatsappClick={() => trackWhatsappClick({ location: 'faq' })}
        />

        <LandingFinalCta
          finalCta={content.finalCta}
          whatsappHref={whatsappHref}
          onWhatsappClick={() => trackWhatsappClick({ location: 'final_cta' })}
        />
      </main>

      <LandingFooter
        brand={content.brand}
        contact={content.contact}
        footer={content.footer}
        professional={content.professional}
        onWhatsappClick={() => trackWhatsappClick({ location: 'floating_button' })}
      />
    </div>
  );
}
