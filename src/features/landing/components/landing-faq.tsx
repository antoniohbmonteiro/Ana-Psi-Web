import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import styles from './landing-page.module.css';

type LandingFaqProps = {
  faq: LandingContent['faq'];
  whatsappHref: string;
};

export function LandingFaq({ faq, whatsappHref }: LandingFaqProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="faq" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.eyebrow}>{faq.eyebrow}</div>
          <h2 className={styles.sectionTitleCenter}>{faq.title}</h2>
          <p className={styles.sectionLead}>{faq.subtitle}</p>
        </div>

        <div className={styles.faqWrap}>
          <div className={styles.faqList}>
            {faq.items.map((item, index) => {
              const isOpen = openFaq === index;

              return (
                <article
                  key={`${item.question}-${index}`}
                  className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
                >
                  <button
                    type="button"
                    className={styles.faqTrigger}
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span className={styles.faqQuestion}>{item.question}</span>
                    <Plus
                      className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ''}`}
                      size={20}
                    />
                  </button>

                  <div className={`${styles.faqAnswerWrap} ${isOpen ? styles.faqAnswerWrapOpen : ''}`}>
                    <div className={styles.faqAnswer}>
                      <div className={styles.faqAnswerInner}>{item.answer}</div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className={styles.faqFooter}>
            <p
              style={{
                margin: '0 0 12px',
                fontSize: '16px',
                lineHeight: '24px',
                color: '#475569',
              }}
            >
              {faq.footerLead}
            </p>

            <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.linkCta}>
              {faq.footerCtaLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
