# Firebase web - etapa 1

Este patch faz só a base do Firebase web no app, sem mexer na landing ainda.

## O que entra

- dependência `firebase`
- arquivo `src/lib/firebase/client.ts`
- arquivo `.env.example`

## O que fazer depois de extrair

1. Rode `npm install`
2. Copie `.env.example` para `.env.local`
3. Preencha os valores com a configuração Web App do projeto `ana-psi`
4. Reinicie o servidor `npm run dev`

## Observação

A service account NÃO entra no app web.
O app web usa somente as variáveis públicas `NEXT_PUBLIC_FIREBASE_*`.
