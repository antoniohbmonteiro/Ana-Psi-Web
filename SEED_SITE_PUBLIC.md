# Seed do conteúdo público

## O que este patch adiciona
- `scripts/site-public-content.seed.mjs`
- `scripts/seed-site-public-content.mjs`
- script `npm run seed:site-public`
- dependência `firebase-admin`

## Como usar

### 1. Instale as dependências
```bash
npm install
```

### 2. Forneça credenciais do Firebase Admin

Use uma destas opções:

#### Opção A — arquivo de service account
```bash
export FIREBASE_SERVICE_ACCOUNT_PATH="./service-account.json"
npm run seed:site-public
```

#### Opção B — GOOGLE_APPLICATION_CREDENTIALS
```bash
export GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"
export FIREBASE_PROJECT_ID="ana-psi"
npm run seed:site-public
```

## O seed cria ou atualiza:
- `settings/site_public_profile`
- `settings/site_public_landing`

## Observações
- O seed usa `merge: true`, então atualiza sem apagar campos extras já existentes.
- Os placeholders de WhatsApp, Instagram e e-mail continuam para você trocar depois.
- O conteúdo foi montado a partir da landing atual do projeto.
