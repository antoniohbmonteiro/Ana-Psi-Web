# Validação da migração para Node.js 24 LTS

Validação local em 14/10/2026, Windows, Node **v24.19.0**, npm **11.17.0**
e Java **21.0.4**. Os workflows usam a versão 24.x selecionada pela `.nvmrc`.
Os jobs do GitHub Actions não foram executados remotamente nesta tarefa.

## Isolamento

O estado inicial estava limpo na branch `codex/admin-firestore-pr4b`, com o PR 4B
já registrado em `eb3c959` (`feat(admin): persist authorized appointment reads
in Firestore`). A migração foi preparada na branch `codex/node24-lts`.
Nenhum código de aplicação, teste, regra ou script de autenticação/Firestore foi
alterado. Não houve push, merge, deploy ou criação de projeto Firebase.

## Alterações

- `.nvmrc`: Node 24 como referência única para desenvolvimento e workflows.
- `package.json`: `engines.node` igual a `>=24 <25`, sem duplicá-lo nos workspaces.
- Workflows `admin-ci.yml`, `public-preview.yml` e `public-production.yml`:
  substituição de `node-version: 20` por `node-version-file: .nvmrc`.
- `public-preview-cleanup.yml`: checkout e setup explícito do mesmo Node 24.
- CI do admin também é acionado quando `.nvmrc` muda; instalações do preview e
  da produção pública passam a usar `npm ci` para preservar o lockfile.
- READMEs da raiz, do admin e do público: instruções do monorepo e Node 24.
  Removidas as recomendações e justificativas antigas de uso de Node 20 do admin.
- `@types/node` nos dois workspaces: `^20.19.37` para `^24.19.0`, resolvido em
  `24.19.2`; `undici-types` correspondente: `6.21.0` para `7.24.6`.
- Lockfile atualizado apenas para engines e esses tipos. Todas as versões das
  dependências funcionais e demais transitivas foram preservadas.

## Compatibilidade

Versões e requisitos conferidos nos manifests da árvore travada pelo lockfile;
uma varredura de todos os `engines.node` encontrou somente a exceção
`superstatic`, descrita abaixo.

| Dependência | Versão instalada | Evidência em Node 24 |
| --- | --- | --- |
| Next.js | 16.1.6 | Engine `>=20.9.0`; ambos os builds e integração com `next start` passaram |
| React / React DOM | 19.2.3 | Engine de React `>=0.10.0`; builds e renderização nas integrações passaram |
| Firebase SDK | 12.2.1 | Módulos App/Auth/Firestore exigem `>=20.0.0`; testes cliente Auth e Rules passaram |
| Firebase Admin SDK | 13.10.0 | Engine `>=18`; persistência, sessão e consultas ao emulador passaram |
| Firebase CLI | 14.22.0 | Engine `>=20.0.0 || >=22.0.0`; inicialização e encerramento dos emuladores passaram |
| Emulator Suite | CLI 14.22.0 / Firestore 1.19.8 | Auth e Firestore executados no projeto `demo-ana-psi`, com Java 21 |
| TypeScript | 5.9.3 | Engine `>=14.17`; compilação dos testes, typecheck e builds passaram |
| ESLint | 9.39.4 | Engine `^18.18.0 || ^20.9.0 || >=21.1.0`; lint do admin passou |
| Rules unit testing | 5.0.2 | Engine `>=20.0.0`; negações e permissões verificadas no emulador |

Referências oficiais: [requisitos do Next.js](https://nextjs.org/docs/app/getting-started/installation),
[manifest da Firebase CLI 14.22.0](https://github.com/firebase/firebase-tools/blob/v14.22.0/package.json),
[manifest do Admin SDK 13.10.0](https://github.com/firebase/firebase-admin-node/blob/v13.10.0/package.json)
e [pré-requisitos do Emulator Suite](https://firebase.google.com/docs/emulator-suite/install_and_configure).
Os testes acima confirmam o funcionamento dos fluxos utilizados por este
repositório; não cobrem todos os comandos possíveis da CLI.

## Override de re2

**Removido** o override `firebase-tools.re2 = 1.22.1`, criado para Node 20.
A versão transitiva **1.22.1** já registrada no lockfile atende ao intervalo
opcional `^1.17.7` do `superstatic`; removê-lo não exige atualizar esse pacote.
O `npm ci` sem override passou, assim como toda a suíte de testes.
Também foi carregado o módulo nativo resolvido a partir de `superstatic`:
`new RE2("node", "i").test("Node 24")` retornou `true`.
Uma futura atualização transitiva de re2 deverá ser validada separadamente.

## Comandos e resultados

Todos os comandos partiram da raiz do monorepo e utilizaram Node v24.19.0.

| Comando | Resultado |
| --- | --- |
| `node -v` | `v24.19.0` |
| `npm ci` | Exit 0; 1.144 pacotes instalados |
| `npm run test:appointments --workspace @ana-psi/admin` | Exit 0; 93 testes aprovados |
| `npm run test:security:admin` | Exit 0; 34 testes aprovados |
| `npm run test:persistence:admin` | Exit 0; 33 testes aprovados do PR 4B |
| `npm run test:integration:admin` | Exit 0; 27 testes aprovados |
| `npm run typecheck:admin` | Exit 0 |
| `npm run lint:admin` | Exit 0; sem avisos |
| `npm run build:admin` | Exit 0 |
| `npm run lint:public` | Falhou: falta `eslint.config.js`, `.mjs` ou `.cjs` no público ou na raiz |
| `npm run build:public` | Exit 0; exportação estática concluída |

Total: **187 testes aprovados, sem falhas ou skips**. A integração inclui 10
testes de Firestore/Rules, 13 de Auth/HTTP e quatro de configuração/serviços
indisponíveis.

Os builds foram executados por um subprocesso Node com o ambiente isolado
retornado por `localEnvironment()` em `apps/admin/scripts/emulator-env.mjs`.
No público, `FIREBASE_SERVICE_ACCOUNT_JSON=null` (texto JSON) e
`NEXT_PUBLIC_FIREBASE_API_KEY` vazio impediram o uso de credenciais locais e
leituras remotas pelo sincronizador. O build manteve o snapshot versionado,
sem modificá-lo. Os arquivos `.env.local` e de credenciais foram preservados.
Os builds obtiveram as fontes Inter normalmente.

## Pendências e ocorrências

- **Lint público preexistente:** o commit inicial já tinha `lint: eslint`,
  ESLint 9 e apenas `apps/admin/eslint.config.mjs`. Não existia configuração no
  público nem na raiz. Essa falha não decorre de Node 24; não foi corrigida
  para manter o escopo da migração.
- **Engine transitiva:** `superstatic@9.2.0` declara `18 || 20 || 22` e gera
  `EBADENGINE` em Node 24. A CLI e os emuladores usados nos testes funcionaram,
  mas o suporte declarado dessa transitiva continua pendente. Uma instalação
  com `engine-strict=true` falharia enquanto esse requisito não for atualizado.
- **Auditoria:** `npm ci` reportou 44 vulnerabilidades (2 baixas, 17 moderadas,
  22 altas e 3 críticas) e avisos de depreciação. Não foi executado nenhum
  `npm audit fix`; dependências funcionais permaneceram nas versões anteriores.
- npm 11 também emitiu avisos de `allow-scripts` para cinco pacotes; isso não
  impediu a instalação, o carregamento nativo de re2, os testes ou os builds.
- A primeira tentativa de integração encontrou a porta 8080 ocupada por um
  Firestore Emulator do próprio `demo-ana-psi`, sem processo pai ativo. Somente
  esse processo órfão foi encerrado; a repetição da suíte passou. O aviso de
  múltiplas instâncias apareceu na repetição, após a execução órfã anterior.
- A tentativa inicial de instalação no sandbox falhou por permissões; o
  `npm ci` com as permissões de execução necessárias concluiu com sucesso.

Não foram alterados visuais, regras de negócio, arquitetura de autenticação ou
Firestore, nem a separação entre os workspaces público e administrativo.
