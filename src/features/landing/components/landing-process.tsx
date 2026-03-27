import { Calendar, ChartNoAxesColumn, MessageCircle, Video } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import styles from './landing-page.module.css';

const processIcons = {
  message: MessageCircle,
  calendar: Calendar,
  video: Video,
  chart: ChartNoAxesColumn,
} as const;

type LandingProcessProps = {
  process: LandingContent['process'];
};

type ProcessItem = {
  number: string;
  title: string;
  description: string;
  icon: keyof typeof processIcons;
};

export function LandingProcess({ process }: LandingProcessProps) {
  const processItems = (process.items ?? []) as ProcessItem[];

  return (
    <section id="como-funciona" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.eyebrow}>{process.eyebrow}</div>
          <h2 className={styles.sectionTitleCenter}>{process.title}</h2>
          <p className={styles.sectionLead}>{process.subtitle}</p>
        </div>

        <div className={styles.processGrid}>
          {processItems.map((item, index) => {
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
  );
}
