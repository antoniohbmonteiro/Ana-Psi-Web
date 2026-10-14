# Public app

## Development

Use Node.js 24 LTS, conforme `.nvmrc` e `engines.node` na raiz do monorepo.
Execute `npm ci` na raiz antes dos comandos abaixo.

 npm run dev:public

## Build

 npm run build:public

## Deploy to Firebase Hosting

 npm run deploy:public

Remember to set `NEXT_PUBLIC_SITE_URL` in `.env.local` with the public URL of the site.
