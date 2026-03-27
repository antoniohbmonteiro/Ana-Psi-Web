'use client';

import { useEffect, useState } from 'react';
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
import { landingContent, type LandingContent } from '@/features/landing/data/content';
import { mapSitePublicContentToLandingContent } from '@/features/landing/mappers/map-site-public-content-to-landing-content';
import { getSitePublicContent } from '@/features/landing/services/get-site-public-content';
import { buildWhatsappLink } from '@/features/landing/utils/build-whatsapp-link';
import styles from './landing-page.module.css';

const specialtyIcons = { brain: Brain, heart: Heart, smile: Smile, shield: Shield, spark: Sparkles, users: Users } as const;
const processIcons = { message: MessageCircle, calendar: Calendar, video: Video, chart: ChartNoAxesColumn } as const;
const infoIcons = { video: Video, clock: Clock3, lock: Lock, calendar: Calendar } as const;

type LandingPageProps = {
  initialContent?: LandingContent;
};

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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerInner}>
            <a href="#top" className={styles.brand}><span>{content.brand.name}</span><span className={styles.brandDivider}>|</span><span className={styles.brandAccent}>{content.brand.accent}</span></a>
            <nav className={styles.nav}>
              <a href="#sobre" className={styles.navLink}>Sobre</a>
              <a href="#como-funciona" className={styles.navLink}>Como funciona</a>
              <a href="#faq" className={styles.navLink}>FAQ</a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.headerButton}>Contato</a>
            </nav>
            <button type="button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} className={styles.mobileMenuButton} onClick={() => setMenuOpen((v) => !v)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
          {menuOpen ? (
            <div className={styles.mobileMenu}>
              <a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
              <a href="#como-funciona" onClick={() => setMenuOpen(false)}>Como funciona</a>
              <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)} className={styles.headerButton}>Contato</a>
            </div>
          ) : null}
        </div>
      </header>

      <main id="top">
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div>
                {(() => {
                  const [highlightTop = content.hero.highlight, highlightBottom = ''] = content.hero.highlight.split(' ');
                  const suffixWords = content.hero.suffix.split(' ');
                  const middleWord = suffixWords[0] ?? '';
                  const lowerLines = suffixWords.slice(1);

                  return (
                    <h1 className={styles.heroTitle}>
                      <span className={styles.heroTitleLine}>
                        {content.hero.title} <span className={styles.heroHighlight}>{highlightTop}</span>
                      </span>
                      <span className={styles.heroTitleLine}>
                        <span className={styles.heroHighlight}>{highlightBottom}</span>{highlightBottom ? ' ' : ''}{middleWord}
                      </span>
                      {lowerLines.map((line) => (
                        <span key={line} className={styles.heroTitleLine}>{line}</span>
                      ))}
                    </h1>
                  );
                })()}
                <div className={styles.badge}>{content.hero.badge}</div>
                <p className={styles.heroDescription}>{content.hero.description}</p>
                <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.primaryButton}><MessageCircle size={22} />{content.hero.ctaLabel}</a>
              </div>
              <div className={styles.heroVisual}>
                <div className={styles.heroImageFrame}><img src={content.hero.imageSrc} alt={content.professional.displayName} className={styles.heroImage} /></div>
                <div className={styles.heroStat}><div className={styles.heroStatValue}>{content.hero.statValue}</div><div className={styles.heroStatText}>{content.hero.statText}</div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="sobre" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.aboutGrid}>
              <div className={styles.aboutImageWrap}><img src={content.about.imageSrc} alt={content.professional.displayName} className={styles.aboutImage} /></div>
              <div>
                <div className={styles.eyebrow}>{content.about.eyebrow}</div>
                <h2 className={styles.cardTitle}>{content.about.title}</h2>
                <div className={styles.aboutText}>{content.about.paragraphs.map((paragraph) => <p key={paragraph} dangerouslySetInnerHTML={{ __html: paragraph }} />)}</div>
                <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.linkCta}>{content.about.ctaLabel}</a>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.finalCtaSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}><div className={styles.eyebrow}>{content.specialties.eyebrow}</div><h2 className={styles.sectionTitleCenter}>{content.specialties.title}</h2><p className={styles.sectionLead}>{content.specialties.subtitle}</p></div>
            <div className={styles.cardsGrid}>{content.specialties.items.map((item) => { const Icon = specialtyIcons[item.icon]; return <article key={item.title} className={styles.card}><div className={styles.iconWrap}><Icon size={24} /></div><h3 className={styles.cardTitle}>{item.title}</h3><p className={styles.cardDescription}>{item.description}</p></article>; })}</div>
          </div>
        </section>

        <section id="como-funciona" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}><div className={styles.eyebrow}>{content.process.eyebrow}</div><h2 className={styles.sectionTitleCenter}>{content.process.title}</h2><p className={styles.sectionLead}>{content.process.subtitle}</p></div>
            <div className={styles.processGrid}>{content.process.items.map((item) => { const Icon = processIcons[item.icon]; return <article key={item.number} className={styles.processCard}><div className={styles.processTop}><div className={styles.iconWrap}><Icon size={24} /></div><div><div className={styles.processNumber}>{item.number}</div><h3 className={styles.cardTitle}>{item.title}</h3><p className={styles.cardDescription}>{item.description}</p></div></div></article>; })}</div>
          </div>
        </section>

        <section className={styles.sectionSoft}>
          <div className={styles.container}><div className={styles.infoGrid}>{content.infoCards.map((item) => { const Icon = infoIcons[item.icon]; return <article key={item.title} className={styles.infoCard}><div className={styles.iconWrap}><Icon size={22} /></div><div className={styles.infoLabel}>{item.title}</div><div className={styles.infoValue}>{item.value}</div><div className={styles.infoDetail}>{item.detail}</div></article>; })}</div></div>
        </section>

        <section id="faq" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}><div className={styles.eyebrow}>{content.faq.eyebrow}</div><h2 className={styles.sectionTitleCenter}>{content.faq.title}</h2><p className={styles.sectionLead}>{content.faq.subtitle}</p></div>
            <div className={styles.faqWrap}><div className={styles.faqList}>{content.faq.items.map((item, index) => { const isOpen = openFaq === index; return <article key={item.question} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}><button type="button" className={styles.faqTrigger} aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? null : index)}><span className={styles.faqQuestion}>{item.question}</span><Plus className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ''}`} size={20} /></button><div className={`${styles.faqAnswerWrap} ${isOpen ? styles.faqAnswerWrapOpen : ''}`}><div className={styles.faqAnswer}><div className={styles.faqAnswerInner}>{item.answer}</div></div></div></article>; })}</div><div className={styles.faqFooter}><p style={{ margin: '0 0 12px', fontSize: '16px', lineHeight: '24px', color: '#475569' }}>{content.faq.footerLead}</p><a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.linkCta}>{content.faq.footerCtaLabel}</a></div></div>
          </div>
        </section>

        <section className={styles.sectionSoft}>
          <div className={styles.container}><div className={styles.finalCtaCard}><div className={styles.finalCtaContent}><h2 className={styles.finalCtaTitle}>{content.finalCta.title}</h2><p className={styles.finalCtaDescription}>{content.finalCta.description}</p><a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.secondaryButton}><MessageCircle size={22} />{content.finalCta.buttonLabel}</a><div className={styles.finalHelper}><ArrowRight size={16} />{content.finalCta.helper}</div></div><div className={styles.finalCtaVisual} aria-hidden="true"><img src={content.finalCta.imageSrc} alt="" className={styles.finalCtaImage} /></div></div></div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}><div className={styles.footerGrid}><div className={styles.footerColumn}><div className={styles.footerBrand}><span>{content.brand.name}</span><span className={styles.brandDivider}>|</span><span>{content.brand.accent}</span></div><p className={styles.footerText}>{content.footer.description}</p></div><div className={styles.footerColumn}><div className={styles.footerSectionTitle}>Links rápidos</div><a href="#sobre" className={styles.footerLink}>Sobre</a><a href="#como-funciona" className={styles.footerLink}>Como funciona</a><a href="#faq" className={styles.footerLink}>FAQ</a></div><div className={styles.footerColumn}><div className={styles.footerSectionTitle}>Contato</div><a href={`mailto:${content.contact.email}`} className={styles.footerContact}><Mail size={16} /> {content.contact.email}</a><a href={`https://instagram.com/${content.contact.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className={styles.footerContact}><Instagram size={16} /> {content.contact.instagram}</a><div className={styles.footerContact}><MapPin size={16} /> {content.footer.locationLabel}</div></div></div><div className={styles.footerBottom}>© {new Date().getFullYear()} {content.professional.displayName}. CRP {content.professional.crp}. Todos os direitos reservados.</div></div>
      </footer>

      <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.floatButton}><MessageCircle size={20} /><span>Fale comigo</span><span className={styles.floatDot} /></a>
    </div>
  );
}
