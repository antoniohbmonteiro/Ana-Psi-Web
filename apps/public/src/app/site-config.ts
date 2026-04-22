const fallbackSiteUrl = 'https://boaventurapsi.com.br';

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl).replace(
  /\/+$/,
  ''
);

export const siteName = 'Ana Psicologia';
