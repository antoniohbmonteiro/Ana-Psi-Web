# Migração para 1 repositório com 2 apps

Esse pacote cria a base para separar o projeto em:

- `apps/public` → landing + SEO + Firebase Hosting
- `apps/admin` → painel interno

## O que o script faz

- cria `apps/public`
- cria `apps/admin`
- cria `tsconfig.base.json` na raiz
- transforma a raiz em workspace npm
- copia `.env.local` para os dois apps, se existir
- copia a feature `landing` para o app público
- copia as features não-landing para o app admin
- copia `src/app/(admin)` para o app admin
- cria `firebase.json` e `.firebaserc` dentro de `apps/public`
- faz backup de arquivos sobrescritos em `.workspace-migration-backup`

## Como usar

1. extraia este zip na raiz do repositório atual
2. rode:

```bash
node scripts/split-workspaces.mjs
```

3. depois rode:

```bash
npm install
```

4. para testar os apps:

```bash
npm run dev:public
npm run dev:admin
```

## Firebase Hosting do app público

Depois da migração:

```bash
cd apps/public
firebase deploy --only hosting
```

## Observações

- o script não apaga o código antigo da raiz; ele cria a estrutura nova para validação segura
- depois que os dois apps estiverem ok, vale limpar o código legado da raiz
- o app público continua usando o mesmo projeto Firebase (`ana-psi`)
- ajuste `NEXT_PUBLIC_SITE_URL` no `.env.local` do `apps/public`
