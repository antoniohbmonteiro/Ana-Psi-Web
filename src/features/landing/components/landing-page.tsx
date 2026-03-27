'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Brain,
  Calendar,
  ChartNoAxesColumn,
  Clock3,
  Heart,
  Instagram,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Shield,
  Smile,
  Sparkles,
  Users,
  Video,
  X,
} from 'lucide-react';
import { landingContent } from '@/features/landing/data/content';
import type { LandingContent } from '@/features/landing/types/content';
import { mapSitePublicContentToLandingContent } from '@/features/landing/mappers/map-site-public-content-to-landing-content';
import { getSitePublicContent } from '@/features/landing/services/get-site-public-content';
import { buildWhatsappLink } from '@/features/landing/utils/build-whatsapp-link';
import styles from './landing-page.module.css';

const specialtyIcons = {
  brain: Brain,
  heart: Heart,
  smile: Smile,
  shield: Shield,
  spark: Sparkles,
  users: Users,
} as const;

const processIcons = {
  message: MessageCircle,
  calendar: Calendar,
  video: Video,
  chart: ChartNoAxesColumn,
} as const;

const infoIcons = {
  video: Video,
  clock: Clock3,
  lock: Lock,
  calendar: Calendar,
} as const;

type LandingPageProps = {
  initialContent?: LandingContent;
};

type SpecialtyItem = {
  title: string;
  description: string;
  icon: keyof typeof specialtyIcons;
};

type ProcessItem = {
  number: string;
  title: string;
  description: string;
  icon: keyof typeof processIcons;
};

type InfoCardItem = {
  title: string;
  value: string;
  detail: string;
  icon: keyof typeof infoIcons;
};

type FaqItem = {
  question: string;
  answer: string;
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

  const specialtyItems = (content.specialties.items ?? []) as SpecialtyItem[];
  const processItems = (content.process.items ?? []) as ProcessItem[];
  const infoCardItems = (content.infoCards ?? []) as InfoCardItem[];
  const faqItems = (content.faq.items ?? []) as FaqItem[];

  const faqWithExtras = content.faq as LandingContent['faq'] & {
    footerLead?: string;
    footerCtaLabel?: string;
  };

  const finalCtaWithExtras = content.finalCta as LandingContent['finalCta'] & {
    imageSrc?: string;
  };

  const footerWithExtras = content.footer as LandingContent['footer'] & {
    locationLabel?: string;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerInner}>
            <a href="#top" className={styles.brand}>
              <span>{content.brand.name}</span>
              <span className={styles.brandDivider}>|</span>
              <span className={styles.brandAccent}>{content.brand.accent}</span>
            </a>

            <nav className={styles.nav}>
              <a href="#sobre" className={styles.navLink}>
                Sobre
              </a>
              <a href="#como-funciona" className={styles.navLink}>
                Como funciona
              </a>
              <a href="#faq" className={styles.navLink}>
                FAQ
              </a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.headerButton}>
                Contato
              </a>
            </nav>

            <button
              type="button"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              className={styles.mobileMenuButton}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {menuOpen ? (
            <div className={styles.mobileMenu}>
              <a href="#sobre" onClick={() => setMenuOpen(false)}>
                Sobre
              </a>
              <a href="#como-funciona" onClick={() => setMenuOpen(false)}>
                Como funciona
              </a>
              <a href="#faq" onClick={() => setMenuOpen(false)}>
                FAQ
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMenuOpen(false)}
                className={styles.headerButton}
              >
                Contato
              </a>
            </div>
          ) : null}
        </div>
      </header>

      <main id="top">
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div>
                <h1 className={styles.heroTitle}>{renderedHeroTitle}</h1>

                <div className={styles.badge}>{content.hero.badge}</div>

                <p className={styles.heroDescription}>{content.hero.description}</p>

                <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.primaryButton}>
                  <MessageCircle size={22} />
                  {content.hero.ctaLabel}
                </a>
              </div>

              <div className={styles.heroVisual}>
                <div className={styles.heroImageFrame}>
                  <img
                    src={content.hero.imageSrc}
                    alt={content.professional.displayName}
                    className={styles.heroImage}
                  />
                </div>

                <div className={styles.heroStat}>
                  <div className={styles.heroStatValue}>{content.hero.statValue}</div>
                  <div className={styles.heroStatText}>{content.hero.statText}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="sobre" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.aboutGrid}>
              <div className={styles.aboutImageWrap}>
                <img
                  src={content.about.imageSrc}
                  alt={content.professional.displayName}
                  className={styles.aboutImage}
                />
              </div>

              <div>
                <div className={styles.eyebrow}>{content.about.eyebrow}</div>
                <h2 className={styles.cardTitle}>{content.about.title}</h2>

                <div className={styles.aboutText}>
                  {content.about.paragraphs.map((paragraph: string, index: number) => (
                    <p
                      key={`${index}-${paragraph.slice(0, 24)}`}
                      dangerouslySetInnerHTML={{ __html: paragraph }}
                    />
                  ))}
                </div>

                <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.linkCta}>
                  {content.about.ctaLabel}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.finalCtaSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div className={styles.eyebrow}>{content.specialties.eyebrow}</div>
              <h2 className={styles.sectionTitleCenter}>{content.specialties.title}</h2>
              <p className={styles.sectionLead}>{content.specialties.subtitle}</p>
            </div>

            <div className={styles.cardsGrid}>
              {specialtyItems.map((item: SpecialtyItem, index: number) => {
                const Icon = specialtyIcons[item.icon];

                return (
                  <article key={`${item.title}-${index}`} className={styles.card}>
                    <div className={styles.iconWrap}>
                      <Icon size={24} />
                    </div>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardDescription}>{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="como-funciona" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div className={styles.eyebrow}>{content.process.eyebrow}</div>
              <h2 className={styles.sectionTitleCenter}>{content.process.title}</h2>
              <p className={styles.sectionLead}>{content.process.subtitle}</p>
            </div>

            <div className={styles.processGrid}>
              {processItems.map((item: ProcessItem, index: number) => {
                const Icon = processIcons[item.icon];

                return (
                  <article key={`${item.number}-${index}`} className={styles.processCard}>
                    <div className={styles.processTop}>
                      <div className={styles.iconWrap}>
                        <Icon size={24} />
                      </div>

                      <div>
                        <div className={styles.processNumber}>{item.number}</div>
                        <h3 className={styles.cardTitle}>{item.title}</h3>
                        <p className={styles.cardDescription}>{item.description}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.sectionSoft}>
          <div className={styles.container}>
            <div className={styles.infoGrid}>
              {infoCardItems.map((item: InfoCardItem, index: number) => {
                const Icon = infoIcons[item.icon];

                return (
                  <article key={`${item.title}-${index}`} className={styles.infoCard}>
                    <div className={styles.iconWrap}>
                      <Icon size={22} />
                    </div>
                    <div className={styles.infoLabel}>{item.title}</div>
                    <div className={styles.infoValue}>{item.value}</div>
                    <div className={styles.infoDetail}>{item.detail}</div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="faq" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div className={styles.eyebrow}>{content.faq.eyebrow}</div>
              <h2 className={styles.sectionTitleCenter}>{content.faq.title}</h2>
              <p className={styles.sectionLead}>{content.faq.subtitle}</p>
            </div>

            <div className={styles.faqWrap}>
              <div className={styles.faqList}>
                {faqItems.map((item: FaqItem, index: number) => {
                  const isOpen = openFaq === index;

                  return (
                    <article
                      key={`${item.question}-${index}`}
                      className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
                    >
                      <button
                        type="button"
                        className={styles.faqTrigger}
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                      >
                        <span className={styles.faqQuestion}>{item.question}</span>
                        <Plus
                          className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ''}`}
                          size={20}
                        />
                      </button>

                      <div
                        className={`${styles.faqAnswerWrap} ${isOpen ? styles.faqAnswerWrapOpen : ''}`}
                      >
                        <div className={styles.faqAnswer}>
                          <div className={styles.faqAnswerInner}>{item.answer}</div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className={styles.faqFooter}>
                <p
                  style={{
                    margin: '0 0 12px',
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: '#475569',
                  }}
                >
                  {faqWithExtras.footerLead ?? 'Ainda tem dúvidas?'}
                </p>

                <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.linkCta}>
                  {faqWithExtras.footerCtaLabel ?? 'Falar comigo no WhatsApp →'}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.sectionSoft}>
          <div className={styles.container}>
            <div className={styles.finalCtaCard}>
              <div className={styles.finalCtaContent}>
                <h2 className={styles.finalCtaTitle}>{content.finalCta.title}</h2>
                <p className={styles.finalCtaDescription}>{content.finalCta.description}</p>

                <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.secondaryButton}>
                  <MessageCircle size={22} />
                  {content.finalCta.buttonLabel}
                </a>

                <div className={styles.finalHelper}>
                  <ArrowRight size={16} />
                  {content.finalCta.helper}
                </div>
              </div>

              <div className={styles.finalCtaVisual} aria-hidden="true">
                <img
                  src={finalCtaWithExtras.imageSrc ?? '/images/landing/final-cta-room.jpg'}
                  alt=""
                  className={styles.finalCtaImage}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerColumn}>
              <div className={styles.footerBrand}>
                <span>{content.brand.name}</span>
                <span className={styles.brandDivider}>|</span>
                <span>{content.brand.accent}</span>
              </div>

              <p className={styles.footerText}>{content.footer.description}</p>
            </div>

            <div className={styles.footerColumn}>
              <div className={styles.footerSectionTitle}>Links rápidos</div>
              <a href="#sobre" className={styles.footerLink}>
                Sobre
              </a>
              <a href="#como-funciona" className={styles.footerLink}>
                Como funciona
              </a>
              <a href="#faq" className={styles.footerLink}>
                FAQ
              </a>
            </div>

            <div className={styles.footerColumn}>
              <div className={styles.footerSectionTitle}>Contato</div>

              <a href={`mailto:${content.contact.email}`} className={styles.footerContact}>
                <Mail size={16} /> {content.contact.email}
              </a>

              <a
                href={`https://instagram.com/${content.contact.instagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className={styles.footerContact}
              >
                <Instagram size={16} /> {content.contact.instagram}
              </a>

              <div className={styles.footerContact}>
                <MapPin size={16} />{' '}
                {footerWithExtras.locationLabel ?? 'Atendimento online | Contagem, BH e região'}
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            © {new Date().getFullYear()} {content.professional.displayName}. CRP {content.professional.crp}. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.floatButton}>
        <MessageCircle size={20} />
        <span>Fale comigo</span>
        <span className={styles.floatDot} />
      </a>
    </div>
  );
}