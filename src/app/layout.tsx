import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const siteName = 'Ana Psicologia';
const siteTitle = 'Ana Paula Boaventura | Psicóloga Online';
const siteDescription =
  'Psicoterapia online para adultos e adolescentes com acolhimento, escuta ativa e cuidado profissional.';

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: siteTitle,
    template: '%s | Ana Psicologia',
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    'psicóloga online',
    'psicoterapia online',
    'psicóloga para adultos',
    'psicóloga para adolescentes',
    'acolhimento psicológico',
    'Ana Paula Boaventura',
  ],
  authors: [{ name: 'Ana Paula Boaventura' }],
  creator: 'Ana Paula Boaventura',
  publisher: siteName,
  category: 'health',
  alternates: siteUrl ? { canonical: '/' } : undefined,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName,
    title: siteTitle,
    description: siteDescription,
    ...(siteUrl ? { url: '/' } : {}),
  },
  twitter: {
    card: 'summary',
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
