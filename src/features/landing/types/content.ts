export type LandingNavItem = {
  label: string;
  href: string;
};

export type LandingFaqItem = {
  question: string;
  answer: string;
};

export type LandingSpecialtyItem = {
  title: string;
  description: string;
  icon: "brain" | "heart" | "smile" | "shield" | "lightbulb" | "users";
};

export type LandingPrincipleItem = {
  title: string;
  description: string;
  icon: "heart" | "users" | "lightbulb" | "target";
};

export type LandingProcessItem = {
  number: string;
  title: string;
  description: string;
  icon: "message-circle" | "calendar" | "video" | "trending-up";
};

export type LandingInfoItem = {
  title: string;
  value: string;
  detail: string;
  icon: "video" | "clock" | "lock" | "calendar";
};

export type LandingContent = {
  brand: {
    name: string;
    accent: string;
  };
  professional: {
    fullName: string;
    displayName: string;
    crp: string;
    city: string;
    state: string;
    audience: string[];
    approach: string;
    modalities: string[];
  };
  contact: {
    whatsapp: string;
    whatsappMessage: string;
    whatsappFloatMessage: string;
    instagram: string;
    email: string;
  };
  nav: LandingNavItem[];
  hero: {
    badge: string;
    title: string;
    highlight: string;
    description: string;
    ctaLabel: string;
    statValue: string;
    statText: string;
    imageSrc: string;
  };
  about: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    linkLabel: string;
    imageSrc: string;
  };
  approach: {
    badge: string;
    title: string;
    highlight: string;
    paragraphs: string[];
    principles: LandingPrincipleItem[];
  };
  specialties: {
    eyebrow: string;
    title: string;
    description: string;
    items: LandingSpecialtyItem[];
  };
  process: {
    eyebrow: string;
    title: string;
    description: string;
    items: LandingProcessItem[];
  };
  info: LandingInfoItem[];
  faq: {
    eyebrow: string;
    title: string;
    description: string;
    items: LandingFaqItem[];
  };
  finalCta: {
    title: string;
    description: string;
    ctaLabel: string;
    helper: string;
  };
  footer: {
    description: string;
    quickLinks: LandingNavItem[];
    contactMode: string;
    copyright: string;
  };
};
