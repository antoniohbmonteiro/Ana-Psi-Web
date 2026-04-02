import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://boaventurapsi.com.br';
const siteName = 'Ana Psicologia';
const siteTitle = 'Ana Paula Boaventura | Psicóloga Online';
const siteDescription =
  'Psicoterapia online para adultos e adolescentes com acolhimento, escuta ativa e cuidado profissional.';

const contact = {
  email: 'anapaulaboraventura.psi@gmail.com',
  telephone: '+55 31 97358-9839',
  instagramUrl: 'https://instagram.com/anapaulaboraventura.psi',
  linktreeUrl: 'https://linktr.ee/anapaulaboaventura.psi',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${siteUrl}#person`,
      name: 'Ana Paula Boaventura de Moura',
      alternateName: 'Ana Paula Boaventura',
      jobTitle: 'Psicóloga',
      description: siteDescription,
      url: siteUrl,
      image: `${siteUrl}/images/landing/ana-hero.jpeg`,
      email: `mailto:${contact.email}`,
      telephone: contact.telephone,
      sameAs: [contact.instagramUrl, contact.linktreeUrl],
      worksFor: {
        '@id': `${siteUrl}#business`,
      },
    },
    {
      '@type': ['ProfessionalService', 'LocalBusiness'],
      '@id': `${siteUrl}#business`,
      name: siteName,
      url: siteUrl,
      image: [
        `${siteUrl}/images/landing/ana-hero.jpeg`,
        `${siteUrl}/images/landing/ana-about.jpeg`,
      ],
      description: siteDescription,
      telephone: contact.telephone,
      email: contact.email,
      sameAs: [contact.instagramUrl, contact.linktreeUrl],
      areaServed: {
        '@type': 'Country',
        name: 'Brasil',
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Rua dos Odontologos, 95',
        addressLocality: 'Belo Horizonte',
        addressRegion: 'MG',
        postalCode: '30840200',
        addressCountry: 'BR',
      },
      serviceType: [
        'Psicoterapia online',
        'Atendimento psicológico para adultos',
        'Atendimento psicológico para adolescentes',
      ],
      founder: {
        '@id': `${siteUrl}#person`,
      },
      
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: '%s | Ana Psicologia',
  },
  description: siteDescription,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [{ url: '/icon.png', type: 'image/png' }],
  },
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
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName,
    title: siteTitle,
    description: siteDescription,
    url: '/',
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
      <body className={inter.className}>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
      </body>
    </html>
  );
}
