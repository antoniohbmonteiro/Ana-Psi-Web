import type { SitePublicContent } from '@/features/landing/types/site-public-content';
import type { LandingUiContent } from '@/features/landing/types/landing-ui-content';

function parseParagraphBody(body: string) {
  return body
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'));
}

export function mapSitePublicContentToLandingContent(content: SitePublicContent): LandingUiContent {
  const { profile, landing } = content;

  const [brandName = 'Ana', brandAccent = 'Psicologia'] = profile.shortBrand
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    brand: {
      name: brandName,
      accent: brandAccent,
    },
    professional: {
      fullName: profile.professionalName,
      displayName: profile.displayName,
      crp: profile.crp,
      approach: profile.approach,
    },
    contact: {
      whatsapp: profile.whatsappNumber,
      whatsappMessage: profile.whatsappMessage,
      instagram: profile.instagram ?? '@placeholder',
      email: profile.email ?? 'contato@placeholder.com',
    },
    hero: {
      title: landing.hero.title,
      highlight: landing.hero.highlight,
      suffix: landing.hero.suffix,
      description: landing.hero.description,
      badge: `${landing.hero.badgePrefix} | CRP ${profile.crp}`,
      ctaLabel: landing.hero.ctaLabel,
      statValue: landing.hero.statValue,
      statText: landing.hero.statText,
      imageSrc: landing.hero.imageSrc,
    },
    about: {
      eyebrow: landing.about.eyebrow,
      title: landing.about.title,
      paragraphs: parseParagraphBody(landing.about.body),
      ctaLabel: landing.about.ctaLabel,
      imageSrc: landing.about.imageSrc,
    },
    specialties: landing.specialties,
    process: landing.process,
    infoCards: landing.infoCards,
    faq: {
      eyebrow: landing.faq.eyebrow,
      title: landing.faq.title,
      subtitle: landing.faq.subtitle,
      items: landing.faq.items,
      footerLead: landing.faq.footerLead,
      footerCtaLabel: landing.faq.footerCtaLabel,
    },
    finalCta: {
      title: landing.finalCta.title,
      description: landing.finalCta.description,
      buttonLabel: landing.finalCta.buttonLabel,
      helper: landing.finalCta.responseTimeText,
      imageSrc: landing.finalCta.imageSrc ?? '/images/landing/final-cta-room.jpg',
    },
    footer: {
      description: landing.footer.description,
      locationLabel: landing.footer.locationLabel,
    },
  };
}
