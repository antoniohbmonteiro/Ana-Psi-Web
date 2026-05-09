import { Fragment } from 'react';
import { Check } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import pageStyles from './landing-page.module.css';
import styles from './landing-hero.module.css';

type LandingHeroProps = {
  professionalDisplayName: string;
  hero: LandingContent['hero'];
  whatsappHref: string;
  onWhatsappClick: () => void;
};

const defaultHeroChecks = [
  'Atendimento particular',
  '100% online',
  'Abordagem humanista',
] as const;

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

export function LandingHero({
  professionalDisplayName,
  hero,
  whatsappHref,
  onWhatsappClick,
}: LandingHeroProps) {
  const renderedHeroTitle = renderHeroTitle(hero.title, hero.highlightWords);
  const checks = hero.checks?.length ? hero.checks : defaultHeroChecks;

  return (
    <section className={styles.hero}>
      <div className={pageStyles.container}>
        <div className={styles.heroGrid}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>{hero.badge}</div>

            <h1 className={styles.heroTitle}>{renderedHeroTitle}</h1>

            <p className={styles.heroDescription}>{hero.description}</p>

            <div className={styles.heroChecks} aria-label="Diferenciais do atendimento">
              {checks.map((check) => (
                <div key={check} className={styles.heroCheck}>
                  <span className={styles.heroCheckIcon} aria-hidden="true">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>{check}</span>
                </div>
              ))}
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className={styles.primaryButton}
              onClick={onWhatsappClick}
            >
              <img
                src="/images/landing/whatsapp/Digital_Glyph_White_RGB_2026.svg"
                alt=""
                aria-hidden="true"
                className={styles.primaryButtonIcon}
              />
              {hero.ctaLabel}
            </a>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroImageFrame}>
              <img src={hero.imageSrc} alt={professionalDisplayName} className={styles.heroImage} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
