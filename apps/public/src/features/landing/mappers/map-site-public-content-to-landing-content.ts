import { landingContent } from '@/features/landing/data/content';
import type { LandingContent } from '@/features/landing/types/content';
import type { SitePublicContent } from '@/features/landing/types/site-public-content';

function parseParagraphBody(body: string) {
  return body
    .split(/\r?\n\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'));
}

export function mapSitePublicContentToLandingContent(content: SitePublicContent): LandingContent {
  const { profile, landing } = content;

  return {
    ...landingContent,
    brand: {
      name: profile.shortBrand.split('|')[0]?.trim() || landingContent.brand.name,
      accent: profile.shortBrand.split('|')[1]?.trim() || landingContent.brand.accent,
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
      instagram: profile.instagram ?? landingContent.contact.instagram,
      email: profile.email ?? landingContent.contact.email,
    },
    hero: {
      title: landing.hero.title,
      highlightWords: landing.hero.highlightWords,
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
    approach: landing.approach,
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
      imageSrc: landing.finalCta.imageSrc,
    },
    footer: {
      description: landing.footer.description,
      locationLabel: landing.footer.locationLabel,
    },
  };
}
