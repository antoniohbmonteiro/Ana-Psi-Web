import { ArrowRight, MessageCircle } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import styles from './landing-page.module.css';

type LandingFinalCtaProps = {
  finalCta: LandingContent['finalCta'];
  whatsappHref: string;
};

export function LandingFinalCta({ finalCta, whatsappHref }: LandingFinalCtaProps) {
  return (
    <section className={styles.sectionSoft}>
      <div className={styles.container}>
        <div className={styles.finalCtaCard}>
          <div className={styles.finalCtaContent}>
            <h2 className={styles.finalCtaTitle}>{finalCta.title}</h2>
            <p className={styles.finalCtaDescription}>{finalCta.description}</p>

            <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.secondaryButton}>
              <MessageCircle size={22} />
              {finalCta.buttonLabel}
            </a>

            <div className={styles.finalHelper}>
              <ArrowRight size={16} />
              {finalCta.helper}
            </div>
          </div>

          <div className={styles.finalCtaVisual} aria-hidden="true">
            <img
              src={finalCta.imageSrc ?? '/images/landing/final-cta-room.jpg'}
              alt=""
              className={styles.finalCtaImage}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
