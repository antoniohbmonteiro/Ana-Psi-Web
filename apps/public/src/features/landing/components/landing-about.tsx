import type { LandingContent } from '@/features/landing/types/content';
import styles from './landing-page.module.css';

type LandingAboutProps = {
  about: LandingContent['about'];
  professionalDisplayName: string;
  whatsappHref: string;
  onWhatsappClick: () => void;
};

export function LandingAbout({
  about,
  professionalDisplayName,
  whatsappHref,
  onWhatsappClick,
}: LandingAboutProps) {
  return (
    <section id="sobre" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.aboutGrid}>
          <div className={styles.aboutImageWrap}>
            <img src={about.imageSrc} alt={professionalDisplayName} className={styles.aboutImage} />
          </div>

          <div>
            <div className={styles.eyebrow}>{about.eyebrow}</div>
            <h2 className={styles.cardTitle}>{about.title}</h2>

            <div className={styles.aboutText}>
              {about.paragraphs.map((paragraph: string, index: number) => (
                <p
                  key={`${index}-${paragraph.slice(0, 24)}`}
                  dangerouslySetInnerHTML={{ __html: paragraph }}
                />
              ))}
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className={styles.linkCta}
              onClick={onWhatsappClick}
            >
              {about.ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
