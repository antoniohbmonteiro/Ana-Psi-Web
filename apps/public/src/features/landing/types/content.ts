export type SpecialtyIconKey = 'brain' | 'heart' | 'smile' | 'shield' | 'spark' | 'users';
export type ProcessIconKey = 'message' | 'calendar' | 'video' | 'chart';
export type InfoIconKey = 'video' | 'clock' | 'lock' | 'calendar';

export type LandingContent = {
  brand: {
    name: string;
    accent: string;
  };
  professional: {
    fullName: string;
    displayName: string;
    crp: string;
    approach: string;
  };
  contact: {
    whatsapp: string;
    whatsappMessage: string;
    instagram: string;
    email: string;
  };
  hero: {
    title: string;
    highlightWords: string[];
    description: string;
    badge: string;
    ctaLabel: string;
    statValue: string;
    statText: string;
    imageSrc: string;
  };
  about: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    ctaLabel: string;
    imageSrc: string;
  };
  specialties: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: {
      title: string;
      description: string;
      icon: SpecialtyIconKey;
    }[];
  };
  process: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: {
      number: string;
      title: string;
      description: string;
      icon: ProcessIconKey;
    }[];
  };
  infoCards: {
    title: string;
    value: string;
    detail: string;
    icon: InfoIconKey;
  }[];
  faq: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: {
      question: string;
      answer: string;
    }[];
    footerLead: string;
    footerCtaLabel: string;
  };
  finalCta: {
    title: string;
    description: string;
    buttonLabel: string;
    helper: string;
    imageSrc?: string;
  };
  footer: {
    description: string;
    locationLabel: string;
  };
};