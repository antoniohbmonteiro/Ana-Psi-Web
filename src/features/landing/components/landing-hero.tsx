import type { ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import styles from './landing-page.module.css';

type LandingHeroProps = {
  professionalDisplayName: string;
  hero: LandingContent['hero'];
  whatsappHref: string;
  renderedHeroTitle: ReactNode;
};

export function LandingHero({
  professionalDisplayName,
  hero,
  whatsappHref,
  renderedHeroTitle,
}: LandingHeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroGrid}>
          <div>
            <h1 className={styles.heroTitle}>{renderedHeroTitle}</h1>

            <div className={styles.badge}>{hero.badge}</div>

            <p className={styles.heroDescription}>{hero.description}</p>

            <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.primaryButton}>
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
