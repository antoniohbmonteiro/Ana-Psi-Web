# Firebase Hosting - preparo do projeto

Este patch prepara o projeto para publicar a landing atual no **Firebase Hosting** como **static export** do Next.js.

## O que entrou

- `next.config.ts` com `output: 'export'`
- `firebase.json` apontando para a pasta `out`
- `.firebaserc` com o projeto `ana-psi`
- scripts no `package.json`:
  - `npm run build:hosting`
  - `npm run deploy:hosting`

## Antes de publicar

No `.env.local`, troque o valor de `NEXT_PUBLIC_SITE_URL` para a URL pública que você vai usar.

Primeiro deploy pode ser com:

```env
NEXT_PUBLIC_SITE_URL=https://ana-psi.web.app
```

Se depois você conectar um domínio customizado, troca para o domínio real e publica de novo.

## Comandos

Instalar CLI:

```bash
npm install -g firebase-tools
```

Login:

```bash
firebase login
```

Na raiz do projeto:

```bash
npm run build:hosting
firebase deploy --only hosting
```

## Resultado esperado

O Next vai gerar a pasta `out/`, e o Firebase Hosting vai servir essa pasta.

## Observação

Esse preparo é para a landing atual, sem SSR do Next.
Se no futuro o projeto passar a depender de recursos de servidor do Next, aí vale reavaliar a estratégia de deploy.
