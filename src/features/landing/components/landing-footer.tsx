import { Instagram, Mail, MapPin, MessageCircle } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import { buildWhatsappLink } from '@/features/landing/utils/build-whatsapp-link';
import styles from './landing-page.module.css';

type LandingFooterProps = {
  brand: LandingContent['brand'];
  contact: LandingContent['contact'];
  footer: LandingContent['footer'];
  professional: LandingContent['professional'];
};

export function LandingFooter({
  brand,
  contact,
  footer,
  professional,
}: LandingFooterProps) {
  const whatsappHref = buildWhatsappLink(contact.whatsapp, contact.whatsappMessage);

  return (
    <>
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

      <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.floatButton}>
        <MessageCircle size={20} />
        <span>Fale comigo</span>
        <span className={styles.floatDot} />
      </a>
    </>
  );
}
