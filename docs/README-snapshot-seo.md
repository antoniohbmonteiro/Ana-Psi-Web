# Snapshot inicial da landing

O objetivo deste pacote é parar de entregar só o estado de loading no HTML inicial do `apps/public`.

## O que entra

- `apps/public/scripts/sync-site-public-content.mjs`
- `apps/public/src/features/landing/data/site-public-content.snapshot.json`
- `apps/public/src/app/page.tsx`
- `apps/public/src/features/landing/components/landing-page.tsx`
- `apps/public/package.json`

## Como funciona

1. `npm run sync:snapshot` busca `settings/site_public_profile` e `settings/site_public_landing`
2. grava um snapshot JSON local
3. `npm run build` usa esse snapshot para renderizar a home com conteúdo real no HTML inicial
4. depois da abertura, o client ainda consulta o Firestore para atualizar o conteúdo

## Credenciais

O script tenta, nesta ordem:

1. `FIREBASE_SERVICE_ACCOUNT_JSON`
2. `FIREBASE_SERVICE_ACCOUNT_PATH`
3. `../../service-account.json`
4. Web SDK com as variáveis `NEXT_PUBLIC_FIREBASE_*`

Se nenhuma opção funcionar, mas já existir um snapshot anterior, o build continua usando o snapshot existente.

## Uso

Dentro de `apps/public`:

```bash
npm run sync:snapshot
npm run build
firebase deploy --only hosting
```

Ou, como o `build` já chama o sync:

```bash
npm run build
firebase deploy --only hosting
```
