import { Fragment } from 'react';
import { MessageCircle } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import styles from './landing-page.module.css';

type LandingHeroProps = {
  professionalDisplayName: string;
  hero: LandingContent['hero'];
  whatsappHref: string;
  onWhatsappClick: () => void;
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

export function LandingHero({
  professionalDisplayName,
  hero,
  whatsappHref,
  onWhatsappClick,
}: LandingHeroProps) {
  const renderedHeroTitle = renderHeroTitle(hero.title, hero.highlightWords);

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroGrid}>
          <div>
            <h1 className={styles.heroTitle}>{renderedHeroTitle}</h1>

            <div className={styles.badge}>{hero.badge}</div>

            <p className={styles.heroDescription}>{hero.description}</p>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className={styles.primaryButton}
              onClick={onWhatsappClick}
            >
              <MessageCircle size={22} />
              {hero.ctaLabel}
            </a>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroImageFrame}>
              <img src={hero.imageSrc} alt={professionalDisplayName} className={styles.heroImage} />
            </div>

            <div className={styles.heroStat}>
              <div className={styles.heroStatValue}>{hero.statValue}</div>
              <div className={styles.heroStatText}>{hero.statText}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
