export type SitePublicLanding = {
  hero: {
    title: string;
    highlightWords: string[];
    description: string;
    badgePrefix: string;
    ctaLabel: string;
    statValue: string;
    statText: string;
    imageSrc: string;
  };
  about: {
    eyebrow: string;
    title: string;
    body: string;
    ctaLabel: string;
    imageSrc: string;
  };
  specialties: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{
      title: string;
      description: string;
      icon: 'brain' | 'heart' | 'smile' | 'shield' | 'spark' | 'users';
    }>;
  };
  process: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{
      number: string;
      title: string;
      description: string;
      icon: 'message' | 'calendar' | 'video' | 'chart';
    }>;
  };
  infoCards: Array<{
    title: string;
    value: string;
    detail: string;
    icon: 'video' | 'clock' | 'lock' | 'calendar';
  }>;
  faq: {
    eyebrow: string;
    title: string;
    subtitle: string;
    footerLead: string;
    footerCtaLabel: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
  finalCta: {
    title: string;
    description: string;
    buttonLabel: string;
    responseTimeText: string;
    imageSrc?: string;
  };
  footer: {
    description: string;
    locationLabel: string;
  };
};
