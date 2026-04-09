import { Menu, X } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import styles from './landing-page.module.css';

type LandingHeaderProps = {
  brand: LandingContent['brand'];
  menuOpen: boolean;
  whatsappHref: string;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onWhatsappClick: () => void;
};

export function LandingHeader({
  brand,
  menuOpen,
  whatsappHref,
  onToggleMenu,
  onCloseMenu,
  onWhatsappClick,
}: LandingHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerInner}>
          <a href="#conteudo-principal" className={styles.brand}>
            <span>{brand.name}</span>
            <span className={styles.brandDivider}>|</span>
            <span className={styles.brandAccent}>{brand.accent}</span>
          </a>

          <nav className={styles.nav} aria-label="Navegação principal">
            <a href="#sobre" className={styles.navLink}>
              Sobre
            </a>
            <a href="#como-funciona" className={styles.navLink}>
              Como funciona
            </a>
            <a href="#faq" className={styles.navLink}>
              FAQ
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className={styles.headerButton}
              aria-label="Entrar em contato pelo WhatsApp"
              onClick={onWhatsappClick}
            >
              Contato
            </a>
          </nav>

          <button
            type="button"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            className={styles.mobileMenuButton}
            onClick={onToggleMenu}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>

        {menuOpen ? (
          <nav id="landing-mobile-menu" className={styles.mobileMenu} aria-label="Menu mobile">
            <a href="#sobre" onClick={onCloseMenu}>
              Sobre
            </a>
            <a href="#como-funciona" onClick={onCloseMenu}>
              Como funciona
            </a>
            <a href="#faq" onClick={onCloseMenu}>
              FAQ
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                onWhatsappClick();
                onCloseMenu();
              }}
              className={styles.headerButton}
              aria-label="Entrar em contato pelo WhatsApp"
            >
              Contato
            </a>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
