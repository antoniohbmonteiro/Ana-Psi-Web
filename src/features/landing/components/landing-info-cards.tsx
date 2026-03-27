import { Calendar, Clock3, Lock, Video } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import styles from './landing-page.module.css';

const infoIcons = {
  video: Video,
  clock: Clock3,
  lock: Lock,
  calendar: Calendar,
} as const;

type LandingInfoCardsProps = {
  infoCards: LandingContent['infoCards'];
};

export function LandingInfoCards({ infoCards }: LandingInfoCardsProps) {
  return (
    <section className={styles.sectionSoft}>
      <div className={styles.container}>
        <div className={styles.infoGrid}>
          {infoCards.map((item, index) => {
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
  );
}
