import { Instagram, Mail, MapPin } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import styles from './landing-page.module.css';

type LandingFooterProps = {
  brand: LandingContent['brand'];
  professional: LandingContent['professional'];
  contact: LandingContent['contact'];
  footer: LandingContent['footer'];
};

export function LandingFooter({ brand, professional, contact, footer }: LandingFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.footerColumn}>
            <div className={styles.footerBrand}>
              <span>{brand.name}</span>
              <span className={styles.brandDivider}>|</span>
              <span>{brand.accent}</span>
            </div>

            <p className={styles.footerText}>{footer.description}</p>
          </div>

          <div className={styles.footerColumn}>
            <div className={styles.footerSectionTitle}>Links rápidos</div>
            <a href="#sobre" className={styles.footerLink}>
              Sobre
            </a>
            <a href="#como-funciona" className={styles.footerLink}>
              Como funciona
            </a>
            <a href="#faq" className={styles.footerLink}>
              FAQ
            </a>
          </div>

          <div className={styles.footerColumn}>
            <div className={styles.footerSectionTitle}>Contato</div>

            <a href={`mailto:${contact.email}`} className={styles.footerContact}>
              <Mail size={16} /> {contact.email}
            </a>

            <a
              href={`https://instagram.com/${contact.instagram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className={styles.footerContact}
            >
              <Instagram size={16} /> {contact.instagram}
            </a>

            <div className={styles.footerContact}>
              <MapPin size={16} /> {footer.locationLabel}
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          © {new Date().getFullYear()} {professional.displayName}. CRP {professional.crp}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
