import { Fragment } from 'react';
import { Heart, Lightbulb, Target, Users } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import styles from './landing-page.module.css';

const approachIcons = {
  heart: Heart,
  users: Users,
  lightbulb: Lightbulb,
  target: Target,
} as const;

type LandingApproachProps = {
  approach: LandingContent['approach'];
};

function renderTitle(title: string, highlightWords: string[]) {
  const wordsToHighlight = new Set(highlightWords.map((word) => word.toLowerCase()));

  return title.split(' ').map((word, index, allWords) => {
    const normalizedWord = word.replace(/[.,!?;:]/g, '').toLowerCase();
    const isHighlighted = wordsToHighlight.has(normalizedWord);

    return (
      <span key={`${word}-${index}`}>
        <span className={isHighlighted ? styles.approachTitleHighlight : undefined}>{word}</span>
        {index < allWords.length - 1 ? ' ' : null}
      </span>
    );
  });
}

function renderParagraph(paragraph: string) {
  return paragraph.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4;

    if (!isBold) {
      return <Fragment key={`${part.slice(0, 16)}-${index}`}>{part}</Fragment>;
    }

    return <strong key={`${part.slice(2, 18)}-${index}`}>{part.slice(2, -2)}</strong>;
  });
}

export function LandingApproach({ approach }: LandingApproachProps) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.badge}>{approach.eyebrow}</div>
          <h2 className={styles.sectionTitleCenter}>{renderTitle(approach.title, approach.highlightWords)}</h2>
        </div>

        <div className={styles.approachDescriptionBox}>
          {approach.description.map((paragraph, index) => (
            <p
              key={`${paragraph.slice(0, 24)}-${index}`}
              className={styles.approachDescriptionParagraph}
            >
              {renderParagraph(paragraph)}
            </p>
          ))}
        </div>

        <div className={styles.approachGrid}>
          {approach.principles.map((principle, index) => {
            const Icon = approachIcons[principle.icon];

            return (
              <article key={`${principle.title}-${index}`} className={styles.card}>
                <div className={styles.iconWrap}>
                  <Icon size={24} />
                </div>
                <h3 className={styles.cardTitle}>{principle.title}</h3>
                <p className={styles.cardDescription}>{principle.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
