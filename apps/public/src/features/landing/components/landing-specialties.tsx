import { Brain, Heart, Shield, Smile, Sparkles, Users } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import styles from './landing-page.module.css';

const specialtyIcons = {
  brain: Brain,
  heart: Heart,
  smile: Smile,
  shield: Shield,
  spark: Sparkles,
  users: Users,
} as const;

type LandingSpecialtiesProps = {
  specialties: LandingContent['specialties'];
};

export function LandingSpecialties({ specialties }: LandingSpecialtiesProps) {
  return (
    <section className={styles.finalCtaSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.eyebrow}>{specialties.eyebrow}</div>
          <h2 className={styles.sectionTitleCenter}>{specialties.title}</h2>
          <p className={styles.sectionLead}>{specialties.subtitle}</p>
        </div>

        <div className={styles.cardsGrid}>
          {specialties.items.map((item, index) => {
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
  );
}
