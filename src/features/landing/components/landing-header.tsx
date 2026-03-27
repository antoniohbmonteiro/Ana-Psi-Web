import { Menu, X } from 'lucide-react';
import type { LandingContent } from '@/features/landing/types/content';
import styles from './landing-page.module.css';

type LandingHeaderProps = {
  brand: LandingContent['brand'];
  menuOpen: boolean;
  whatsappHref: string;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
};

export function LandingHeader({
  brand,
  menuOpen,
  whatsappHref,
  onToggleMenu,
  onCloseMenu,
}: LandingHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerInner}>
          <a href="#top" className={styles.brand}>
            <span>{brand.name}</span>
            <span className={styles.brandDivider}>|</span>
            <span className={styles.brandAccent}>{brand.accent}</span>
          </a>

          <nav className={styles.nav}>
            <a href="#sobre" className={styles.navLink}>
              Sobre
            </a>
            <a href="#como-funciona" className={styles.navLink}>
              Como funciona
            </a>
            <a href="#faq" className={styles.navLink}>
              FAQ
            </a>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.headerButton}>
              Contato
            </a>
          </nav>

          <button
            type="button"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            className={styles.mobileMenuButton}
            onClick={onToggleMenu}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen ? (
          <div className={styles.mobileMenu}>
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
              onClick={onCloseMenu}
              className={styles.headerButton}
            >
              Contato
            </a>
          </div>
        ) : null}
      </div>
    </header>
  );
}
