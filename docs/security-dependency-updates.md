# Atualização de segurança das dependências

Validação local em 15/10/2026, container Linux, Node **v24.19.0**, npm **11.17.0**
e Java **21.0.12**. Branch `chore/security-dependency-updates`, criada a partir de
`main` em `9ccc90d` (PR 5 integrado). Os jobs do GitHub Actions rodam no PR.

## Diretriz

O projeto ainda não está em produção. Por isso a stack foi levada às versões
**estáveis mais recentes** (sem beta, rc ou canary), inclusive majors, desde que
os ajustes não enfraquecessem segurança nem removessem funcionalidade. Não houve
`overrides`, `npm audit fix` nem `--force`. Arquitetura, visual, regras de
autenticação/Firestore e a independência entre `apps/public` e `apps/admin` foram
preservados.

## Diagnóstico inicial

`npm audit` na `main`: **44** achados (3 críticos, 22 altos, 17 moderados,
2 baixos). Sem dependências de desenvolvimento: **21** (2 críticos, 8 altos,
10 moderados, 1 baixo). O npm lista cada elo das cadeias; as causas-raiz eram:

| Causa-raiz | Escopo | Severidade | Relevância para o projeto |
| --- | --- | --- | --- |
| `next` 16.1.6 | produção (2 apps) | crítica + altas | Real para o admin com `next start`: bypass do Proxy no App Router, DoS em RSC e Server Actions, RCE no Image Optimization com AVIF, cache poisoning. A autorização não depende só do `proxy.ts`. No público (`output: export`), só build e dev. |
| `websocket-driver` 0.7.4 | produção | crítica | Via `@firebase/database`; o Realtime Database não é usado. |
| `sharp`, `postcss`, `nanoid`, `source-map-js` | produção (via next) | altas | Image Optimization e build. |
| `@grpc/grpc-js` 1.9.15 e 1.14.3 | produção | altas | Crash com mensagens malformadas do servidor; avisos de lado servidor. |
| `uuid` < 11.1.1 → `firebase-admin` 13 | produção | moderada | Só `v3/v5/v6` com `buf`; as libs usam `v4()`. |
| `@fastify/busboy`, `form-data`, `fast-xml-*` | produção | altas/moderadas | Via Admin SDK e Storage (não usado). |
| `firebase-tools` 14.22.0 (`tar` 6, `js-yaml` 3, `csv-parse`, `stream-json`, `proxy-agent` → `basic-ftp`, `re2`) | dev (emuladores) | crítica/altas | Ferramenta local com inputs confiáveis; linha 14.x sem manutenção. |
| `braces` ≤ 3.0.3 (ESLint e CLI) | dev | alta | Sem versão corrigida publicada. |

`react`/`react-dom` 19.2.3 e o Firebase SDK 12.2.1 não tinham advisory direto.
Os DoS de React Server Components afetam o React empacotado pelo Next.

## Alterações

| Pacote | Antes | Depois | Observação |
| --- | --- | --- | --- |
| `next`, `eslint-config-next` | 16.1.6 | **16.4.1** | Nos dois apps (`^16.4.1`). |
| `react`, `react-dom` | 19.2.3 | **19.3.1** | Nos dois apps. |
| `@types/react`, `@types/react-dom` | 19.2.x | **19.3.0** | Nos dois apps. |
| `firebase` | 12.2.1 | **13.0.0** | Major só quebra `@firebase/ai` (não usado). |
| `@firebase/rules-unit-testing` | 5.0.2 | **6.0.0** | Fixado; exige `firebase ^13` e Node ≥ 24.12. |
| `firebase-admin` | 13.10.0 | **14.5.0** | Fixado no admin; `^14.5.0` no público. |
| `firebase-tools` | 14.22.0 | **15.34.0** | Fixado; Firestore Emulator 1.19.8 → 1.22.0. |
| Transitivas | — | — | `websocket-driver` 0.7.5, `@fastify/busboy` 3.2.3, `source-map-js` 1.2.2, `brace-expansion` 1.1.21, `@humanfs/node` 0.16.8. |

Efeitos relevantes na árvore:
- `@google-cloud/firestore` 7.11.6 → 9.3.1, `google-auth-library` 10 → 11 e
  `@google-cloud/storage` 7 → 8, via Admin SDK.
- `postcss` 8.4.31 → 8.5.23 e `sharp` 0.34.5 → 0.35.5, via Next.
- `tar` 6 → 7.5.22 e `superstatic` 9 → 10, via CLI. O `proxy-agent`/`basic-ftp`
  deixou de existir.
- O lockfile passou de 1222 para 1095 entradas. Há uma cópia única de `next`,
  `react`, `react-dom`, `firebase` e `firebase-admin`.

Fora deste PR, por não terem achados de segurança e terem risco próprio de
tooling ou visual: TypeScript 7, ESLint 10, Tailwind 4.3, lucide-react 1.x e
tailwind-merge 3.7. `@types/node` permanece em 24.x junto do Node 24.

## Adaptações

- **Lint (Next 16.4):** a regra nova `no-location-assign-relative-destination`
  apontou o redirecionamento após criar um agendamento. A navegação completa é
  intencional: o Detalhe é renderizado por uma nova requisição ao servidor após
  a escrita. A regra foi desabilitada só nessa linha, com justificativa. O
  comportamento não mudou.
- **Lockfile:** depois da instalação incremental do Admin SDK 14, o
  `@firebase/database-compat` foi hoisted sem acesso ao peer
  `@firebase/app-compat`, e os testes de Rules falharam ao importar. Um `npm dedupe`
  levou o Firebase 13 para a raiz e resolveu o problema. Não houve mudança de
  código.
- Nenhuma outra adaptação foi necessária. Todo o código usa os entry points
  modulares do Admin SDK. Os códigos de erro `auth/...` usados por
  `normalizeAuthError` continuam iguais no Admin SDK 14, conforme os testes de
  segurança e de Auth. O Firestore 8/9 só mudou o Node mínimo e alguns tipos.

## Auditoria final

`npm audit`: **16** achados (0 críticos, 12 altos, 4 moderados). Sem
dependências de desenvolvimento: **4** altos, todos da mesma causa-raiz.

| Causa-raiz | Escopo | Motivo para permanecer |
| --- | --- | --- |
| `@grpc/grpc-js` 1.9.16 (GHSA-m9gg, GHSA-f596) → `@firebase/firestore`, `-compat`, `firebase`, `rules-unit-testing` | produção | Só afetam **servidores** gRPC (`getAuthContext`, mensagens de erro de handlers). O SDK cliente usa gRPC apenas como cliente em Node (no browser usa WebChannel) e fixa `~1.9.0`, mesmo no Firebase 13; não há patch na linha 1.9. Um override foi descartado por risco de compatibilidade. |
| `braces` ≤ 3.0.3 → `micromatch`, `fast-glob`, `chokidar`, `@next/eslint-plugin-next`, `eslint-config-next`, `firebase-tools` | dev | Sem versão corrigida publicada; os inputs são globs do próprio repositório. |
| `uuid` 9 → `gaxios` 6 (CLI) | dev | Só `v3/v5/v6` com `buf`; fora da faixa declarada pela CLI. |
| `@opentelemetry/core` < 2.8 → `@google-cloud/pubsub` (CLI) | dev | DoS por header de baggage; o emulador PubSub não é usado. |

As "correções" que o npm sugere para esses itens (`firebase@9.14.0`,
`eslint-config-next@14.2.35`, `firebase-tools@14.23.0`) são downgrades de major
e não foram aplicadas.

Assinaturas: `npm audit signatures` não pôde rodar neste ambiente, porque a
política de rede bloqueia o CDN TUF do Sigstore. Como alternativa, as
assinaturas ECDSA do registro npm foram verificadas para as **209** versões
adicionadas ou alteradas. Em todas, a assinatura é válida e o `integrity` do
lockfile coincide com o do registro.

## Comandos e resultados

Na raiz, com Node v24.19.0, após `npm ci` limpo a cada etapa. A suíte completa
rodou no baseline e após cada um dos cinco commits de dependências.

| Comando | Baseline (`main`) | Final |
| --- | --- | --- |
| `npm ci` | Exit 0; aviso `EBADENGINE` do `superstatic@9.2.0` | Exit 0; sem `EBADENGINE` |
| `npm ls --all` | Exit 0 | Exit 0 |
| `npm run test:appointments --workspace @ana-psi/admin` | 135 aprovados | 135 aprovados |
| `npm run test:security:admin` | 34 aprovados | 34 aprovados |
| `npm run test:persistence:admin` | 45 aprovados | 45 aprovados |
| `npm run typecheck:admin` | Exit 0 | Exit 0 |
| `npm run lint:admin` | Exit 0 | Exit 0 |
| `npm run build:admin` | Exit 0 | Exit 0 |
| `npm run test:integration:admin` | 46 aprovados | 46 aprovados |
| `npm run test:integration:admin -- --dev` | 35 aprovados, **1 falha** | 46 aprovados |
| `npm run build:public` | Exit 0 | Exit 0 |
| `npm run lint:public` | Falha preexistente (sem `eslint.config`) | Mesma falha |

São **260 testes aprovados** no fluxo do CI, sem falhas nem skips. A integração
cobre:
- Rules.
- Autenticação, sessão HttpOnly, Origin e CSRF.
- Revogação, logout e contas desabilitadas.
- Criação concorrente (sobreposta e não sobreposta).
- Idempotência sequencial e paralela.
- Dados corrompidos.

A falha do modo `--dev` no baseline também existe na `main`: o servidor de
desenvolvimento do Next 16.1 incluía no HTML o texto de um documento
corrompido. Com o Next 16.4, o teste passa.

No público, `FIREBASE_SERVICE_ACCOUNT_JSON=null` e
`NEXT_PUBLIC_FIREBASE_API_KEY` vazio impediram leituras remotas. O build manteve
o snapshot versionado sem modificá-lo.

## Validações adicionais

- **Visual:** foram capturados screenshots Playwright em desktop (1440×900) e
  mobile (390×844), antes e depois, de:
  - `/admin/entrar`, `/admin/inicio`, `/admin/agenda` e
    `/admin/agendamentos/novo`, com seed fictício nos emuladores;
  - landing e `_not-found`.

  Todas as capturas do admin e as de desktop do público ficaram idênticas pixel
  a pixel. No mobile da landing, apenas o header sticky e o botão flutuante
  mudam de posição entre capturas do mesmo build. Com esses elementos ocultos, a
  comparação também ficou idêntica. O HTML exportado tem o mesmo texto e a mesma
  estrutura, e o CSS mantém as mesmas 276 regras. Só mudaram nomes com hash e o
  formato abreviado das classes de CSS Modules no Next 16.4.
- **Export estático:** as rotas e os assets públicos de `out/` são os mesmos. O
  Next 16.4 deixou de emitir cinco arquivos internos de prefetch de segmentos:
  `__next._head.txt` e `__next._index.txt`, na raiz e em `_not-found/`, e
  `_not-found/__next._not-found.txt`.
- **Sincronização da landing com o Admin SDK 14:** o script
  `apps/public/scripts/sync-site-public-content.mjs` foi executado com diretório
  de trabalho temporário, uma service account **fictícia** (chave RSA
  descartável) e `FIRESTORE_EMULATOR_HOST`. O emulador foi semeado com o
  conteúdo do snapshot versionado. O script imprimiu "✅ Snapshot atualizado", e o
  JSON gerado é idêntico ao versionado, tanto com o Admin SDK 13 (controle)
  quanto com o 14.
- **re2:** `re2` 1.27.0 (via `superstatic` 10) carrega nativamente em Node 24
  (`new RE2("node", "i").test("Node 24")` retornou `true`).

## Ocorrências e pendências

- **`MetadataLookupWarning`:** com o Firestore 9 (google-gax 6), o cliente
  resolve o universe domain por Application Default Credentials ao abrir o canal
  gRPC, inclusive no emulador. Fora do GCE, a verificação do servidor de
  metadados falha e gera esse aviso nos testes e no servidor local. O admin
  continua inicializado sem credenciais em modo local, e as chamadas ao emulador
  continuam sem credenciais. Os tempos dos testes não mudaram.
- **Credenciais de produção:** o caminho `applicationDefault()` com
  `google-auth-library` 11 não é coberto pelos emuladores. Deve ser validado no
  ambiente hospedado antes da ativação remota.
- **Pipeline público:** no PR, o workflow `Public Preview` executa o sync com a
  credencial real. O sync cai silenciosamente para o snapshot versionado se o
  Admin SDK falhar, então o log precisa mostrar "✅ Snapshot atualizado", e não
  "Firebase Admin SDK indisponível".
- **Pré-download dos emuladores:** os scripts removem as variáveis de proxy do
  ambiente da CLI. Atrás de um proxy obrigatório, o Firestore Emulator 1.22.0 e
  a UI precisam ser pré-baixados com `firebase setup:emulators:firestore` e
  `firebase setup:emulators:ui`.
- **Lint público:** continua sem configuração, como já registrado em
  `docs/node24-validation.md`. Não foi corrigido para manter o escopo.
- **`allow-scripts`:** o npm 11 continua emitindo avisos de `allow-scripts` para
  pacotes com scripts de instalação. Os avisos não impediram a instalação, o
  carregamento nativo do `re2`, os testes nem os builds.

Não houve deploy, merge, criação de projeto Firebase, uso de credenciais reais
nem uso de dados de pacientes.
