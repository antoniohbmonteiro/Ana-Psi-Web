import { Instagram, Link2, Mail, MapPin, MessageCircle } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import { buildWhatsappLink } from '@/features/landing/utils/build-whatsapp-link';
import styles from './landing-page.module.css';

type LandingFooterProps = {
  brand: LandingContent['brand'];
  contact: LandingContent['contact'];
  footer: LandingContent['footer'];
  professional: LandingContent['professional'];
  onWhatsappClick: () => void;
};

export function LandingFooter({
  brand,
  contact,
  footer,
  professional,
  onWhatsappClick,
}: LandingFooterProps) {
  const whatsappHref = buildWhatsappLink(contact.whatsapp, contact.whatsappMessage);

  return (
    <>
      <footer className={styles.footer} aria-label="Rodapé">
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

            <nav className={styles.footerColumn} aria-label="Links rápidos">
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
            </nav>

            <div className={styles.footerColumn}>
              <div className={styles.footerSectionTitle}>Contato</div>

              <a
                href={`mailto:${contact.email}`}
                className={styles.footerContact}
                aria-label={`Enviar e-mail para ${contact.email}`}
              >
                <Mail size={16} aria-hidden="true" /> {contact.email}
              </a>

              <a
                href={`https://instagram.com/${contact.instagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className={styles.footerContact}
                aria-label={`Abrir Instagram ${contact.instagram}`}
              >
                <Instagram size={16} aria-hidden="true" /> {contact.instagram}
              </a>

              <a
                href="https://linktr.ee/anapaulaboaventura.psi"
                target="_blank"
                rel="noreferrer"
                className={styles.footerContact}
                aria-label="Abrir página com outros links"
              >
                <Link2 size={16} aria-hidden="true" /> Outros links
              </a>

              <div className={styles.footerContact}>
                <MapPin size={16} aria-hidden="true" /> {footer.locationLabel}
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            © {new Date().getFullYear()} {professional.displayName}. CRP {professional.crp}. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className={styles.floatButton}
        aria-label="Falar comigo no WhatsApp"
        onClick={onWhatsappClick}
      >
        <MessageCircle size={20} aria-hidden="true" />
        <span>Fale comigo</span>
        <span className={styles.floatDot} aria-hidden="true" />
      </a>
    </>
  );
}
