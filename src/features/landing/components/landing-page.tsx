'use client';

import { useState } from 'react';
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
import { buildWhatsappLink } from '@/features/landing/utils/build-whatsapp-link';
import styles from './landing-page.module.css';

const specialtyIcons = { brain: Brain, heart: Heart, smile: Smile, shield: Shield, spark: Sparkles, users: Users } as const;
const processIcons = { message: MessageCircle, calendar: Calendar, video: Video, chart: ChartNoAxesColumn } as const;
const infoIcons = { video: Video, clock: Clock3, lock: Lock, calendar: Calendar } as const;

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const whatsappHref = buildWhatsappLink(landingContent.contact.whatsapp, landingContent.contact.whatsappMessage);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerInner}>
            <a href="#top" className={styles.brand}><span>{landingContent.brand.name}</span><span className={styles.brandDivider}>|</span><span className={styles.brandAccent}>{landingContent.brand.accent}</span></a>
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
                  const [highlightTop = landingContent.hero.highlight, highlightBottom = ''] = landingContent.hero.highlight.split(' ');
                  const suffixWords = landingContent.hero.suffix.split(' ');
                  const middleWord = suffixWords[0] ?? '';
                  const lowerLines = suffixWords.slice(1);

                  return (
                    <h1 className={styles.heroTitle}>
                      <span className={styles.heroTitleLine}>
                        {landingContent.hero.title} <span className={styles.heroHighlight}>{highlightTop}</span>
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
                <div className={styles.badge}>{landingContent.hero.badge}</div>
                <p className={styles.heroDescription}>{landingContent.hero.description}</p>
                <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.primaryButton}><MessageCircle size={22} />{landingContent.hero.ctaLabel}</a>
              </div>
              <div className={styles.heroVisual}>
                <div className={styles.heroImageFrame}><img src={landingContent.hero.imageSrc} alt={landingContent.professional.displayName} className={styles.heroImage} /></div>
                <div className={styles.heroStat}><div className={styles.heroStatValue}>{landingContent.hero.statValue}</div><div className={styles.heroStatText}>{landingContent.hero.statText}</div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="sobre" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.aboutGrid}>
              <div className={styles.aboutImageWrap}><img src={landingContent.about.imageSrc} alt={landingContent.professional.displayName} className={styles.aboutImage} /></div>
              <div>
                <div className={styles.eyebrow}>{landingContent.about.eyebrow}</div>
                <h2 className={styles.cardTitle}>{landingContent.about.title}</h2>
                <div className={styles.aboutText}>{landingContent.about.paragraphs.map((paragraph) => <p key={paragraph} dangerouslySetInnerHTML={{ __html: paragraph }} />)}</div>
                <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.linkCta}>{landingContent.about.ctaLabel}</a>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.finalCtaSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}><div className={styles.eyebrow}>{landingContent.specialties.eyebrow}</div><h2 className={styles.sectionTitleCenter}>{landingContent.specialties.title}</h2><p className={styles.sectionLead}>{landingContent.specialties.subtitle}</p></div>
            <div className={styles.cardsGrid}>{landingContent.specialties.items.map((item) => { const Icon = specialtyIcons[item.icon]; return <article key={item.title} className={styles.card}><div className={styles.iconWrap}><Icon size={24} /></div><h3 className={styles.cardTitle}>{item.title}</h3><p className={styles.cardDescription}>{item.description}</p></article>; })}</div>
          </div>
        </section>

        <section id="como-funciona" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}><div className={styles.eyebrow}>{landingContent.process.eyebrow}</div><h2 className={styles.sectionTitleCenter}>{landingContent.process.title}</h2><p className={styles.sectionLead}>{landingContent.process.subtitle}</p></div>
            <div className={styles.processGrid}>{landingContent.process.items.map((item) => { const Icon = processIcons[item.icon]; return <article key={item.number} className={styles.processCard}><div className={styles.processTop}><div className={styles.iconWrap}><Icon size={24} /></div><div><div className={styles.processNumber}>{item.number}</div><h3 className={styles.cardTitle}>{item.title}</h3><p className={styles.cardDescription}>{item.description}</p></div></div></article>; })}</div>
          </div>
        </section>

        <section className={styles.sectionSoft}>
          <div className={styles.container}><div className={styles.infoGrid}>{landingContent.infoCards.map((item) => { const Icon = infoIcons[item.icon]; return <article key={item.title} className={styles.infoCard}><div className={styles.iconWrap}><Icon size={22} /></div><div className={styles.infoLabel}>{item.title}</div><div className={styles.infoValue}>{item.value}</div><div className={styles.infoDetail}>{item.detail}</div></article>; })}</div></div>
        </section>

        <section id="faq" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}><div className={styles.eyebrow}>{landingContent.faq.eyebrow}</div><h2 className={styles.sectionTitleCenter}>{landingContent.faq.title}</h2><p className={styles.sectionLead}>{landingContent.faq.subtitle}</p></div>
            <div className={styles.faqWrap}><div className={styles.faqList}>{landingContent.faq.items.map((item, index) => { const isOpen = openFaq === index; return <article key={item.question} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}><button type="button" className={styles.faqTrigger} aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? null : index)}><span className={styles.faqQuestion}>{item.question}</span><Plus className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ''}`} size={20} /></button><div className={`${styles.faqAnswerWrap} ${isOpen ? styles.faqAnswerWrapOpen : ''}`}><div className={styles.faqAnswer}><div className={styles.faqAnswerInner}>{item.answer}</div></div></div></article>; })}</div><div className={styles.faqFooter}><p style={{ margin: '0 0 12px', fontSize: '16px', lineHeight: '24px', color: '#475569' }}>Ainda tem dúvidas?</p><a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.linkCta}>Falar comigo no WhatsApp →</a></div></div>
          </div>
        </section>

        <section className={styles.sectionSoft}>
          <div className={styles.container}><div className={styles.finalCtaCard}><div className={styles.finalCtaContent}><h2 className={styles.finalCtaTitle}>{landingContent.finalCta.title}</h2><p className={styles.finalCtaDescription}>{landingContent.finalCta.description}</p><a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.secondaryButton}><MessageCircle size={22} />{landingContent.finalCta.buttonLabel}</a><div className={styles.finalHelper}><ArrowRight size={16} />{landingContent.finalCta.helper}</div></div><div className={styles.finalCtaVisual} aria-hidden="true"><img src="/images/landing/final-cta-room.jpg" alt="" className={styles.finalCtaImage} /></div></div></div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}><div className={styles.footerGrid}><div className={styles.footerColumn}><div className={styles.footerBrand}><span>{landingContent.brand.name}</span><span className={styles.brandDivider}>|</span><span>{landingContent.brand.accent}</span></div><p className={styles.footerText}>{landingContent.footer.description}</p></div><div className={styles.footerColumn}><div className={styles.footerSectionTitle}>Links rápidos</div><a href="#sobre" className={styles.footerLink}>Sobre</a><a href="#como-funciona" className={styles.footerLink}>Como funciona</a><a href="#faq" className={styles.footerLink}>FAQ</a></div><div className={styles.footerColumn}><div className={styles.footerSectionTitle}>Contato</div><a href={`mailto:${landingContent.contact.email}`} className={styles.footerContact}><Mail size={16} /> {landingContent.contact.email}</a><a href={`https://instagram.com/${landingContent.contact.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className={styles.footerContact}><Instagram size={16} /> {landingContent.contact.instagram}</a><div className={styles.footerContact}><MapPin size={16} /> Atendimento online | Contagem, BH e região</div></div></div><div className={styles.footerBottom}>© {new Date().getFullYear()} {landingContent.professional.displayName}. CRP {landingContent.professional.crp}. Todos os direitos reservados.</div></div>
      </footer>

      <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.floatButton}><MessageCircle size={20} /><span>Fale comigo</span><span className={styles.floatDot} /></a>
    </div>
  );
}
