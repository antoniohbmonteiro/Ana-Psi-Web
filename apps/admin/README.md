# Admin app

## Desenvolvimento e produção

Executar na raiz do workspace:

```powershell
npm run dev:admin
npm run build:admin
npm run start --workspace @ana-psi/admin
```

## Núcleo de appointments

No PR 4A, Home, Agenda e Detalhe usam o fluxo autenticado
`demo.server → appointments/mock → repository → service` somente quando
`ADMIN_ENABLE_DEMO_APPOINTMENTS=true` em ambiente local/CI.
As telas exibem “Demonstração — consultas ainda sem persistência”.
Em ambientes remotos e quando a demonstração não está habilitada, as consultas
ficam indisponíveis até a integração com Firestore no PR 4B.
O adapter da Agenda recebe appointments do service; somente o bloqueio demonstrativo
continua separado. Não há persistência nem operações de escrita.

Cada renderização captura um único `now` e cria um service síncrono com um dataset
próprio. As três páginas são dinâmicas, calculadas no runtime do servidor.
Uma aba já aberta não atualiza automaticamente com a passagem do tempo.

### Datas civis e instantes

- O timezone oficial é `America/Sao_Paulo`.
- `Appointment.date` (`YYYY-MM-DD`) e `time` (`HH:mm`) são valores civis do atendimento.
- `payment.paidAt` e `activityTimeline[].occurredAt` são instantes ISO 8601 UTC,
  terminados em `Z`; a apresentação os formata em São Paulo.
- Operações de calendário usam strings de data e Date UTC apenas como suporte
  de aritmética civil. O timezone do processo ou navegador não define “hoje”.
- `payment.amount` é um inteiro em centavos de BRL; cada appointment tem uma cobrança.
- Labels e variants pertencem à apresentação e nunca determinam regras de negócio.

`getNextAppointment(now)` retorna o confirmed de início estritamente posterior a
`now`, ordenado por data, horário e ID, incluindo próximos dias. Início exatamente
igual, passado ou atendimento em andamento não qualificam. Modalidade e pagamento
não restringem a seleção; sem candidato, retorna `null`.

Contagens de pagamento/agendamento pendente abrangem todo o dataset e usam os
status de domínio. Consultas por data e soma de duração incluem todos os status.
A Home soma as duas categorias de pendência, mesmo quando o mesmo appointment
contribui para ambas.

### Mocks

`createMockAppointments(referenceNow)` ancora sete registros no dia de São Paulo:
um concluído ontem; confirmed hoje às 09:00, 14:00 e 17:00; pending amanhã às
10:30; confirmed amanhã às 14:00; cancelled com pagamento refunded em dois dias.
Inclui online/presencial e pagamentos paid/pending/refunded.

IDs, pacientes e horários são determinísticos dentro de um dia. Os acontecimentos
também usam horários UTC fixos relativos à data-âncora. Depois das 17:00, o próximo
confirmado está no dia seguinte. Um service mantém seu dataset mesmo após a
virada do dia; uma nova renderização cria o dataset atualizado.

O block hardcoded e os alertas demonstrativos da Home permanecem fora das regras
e contagens de appointments.

## Validação

```powershell
npm run test:appointments --workspace @ana-psi/admin
npm run typecheck:admin
npm run lint:admin
npm run build:admin
```

O CI executa essa sequência com Node 20. Os testes usam `node:test` e
`node:assert/strict`, sem dependências extras. O TypeScript compila os quatro arquivos
de teste e suas dependências para CommonJS em `.next/domain-tests`; Node executa
os arquivos JavaScript por caminhos explícitos, sem loaders ou suporte nativo a TS.

A aplicação mantém `moduleResolution: "bundler"` e aliases `@/`. A compilação de
testes usa `moduleResolution: "node"`, `module: "CommonJS"` e `paths: {}`.
Todos os imports internos do conjunto testado são relativos e imports de tipos
são apagados na emissão. Assim, aliases introduzidos nesse conjunto falham na
compilação. A saída está ignorada por Git/ESLint; compilação com erro impede
a execução dos testes.

Os testes cobrem seleção temporal, status, contagens, ordenação, mocks,
timestamps UTC, apresentação e calendário, inclusive subprocessos nos timezones
UTC, America/Sao_Paulo e Asia/Tokyo.

Para validação visual em produção, conferir Home → Detalhe e Agenda → Detalhe,
navegação semanal, desktop/viewport estreito e ausência de divergência de dia
com navegador em outro timezone. As três rotas devem aparecer como dinâmicas
no build; Home e Agenda não devem constar como rotas estáticas do prerender manifest.

## Comandos de domínio (PR 3)

`features/appointments/commands.ts` exporta `createAppointment`, `editAppointment`,
`rescheduleAppointment`, `cancelAppointment`, `confirmAppointment`,
`completeAppointment` e `markAppointmentNoShow`. São funções puras: recebem uma
entrada (validada em runtime), um snapshot de appointments e um contexto explícito
com `now` e `actorId`. Na criação, o contexto também contém um ID fornecido pela
camada chamadora confiável. Não acessam relógio global, Firebase ou sessão.

O resultado é `{ ok: true, appointment }` ou `{ ok: false, error }`. Sucesso retorna
um snapshot independente, inclusive paciente, pagamento e histórico aninhados.
Nenhum comando grava no repository ou altera seus argumentos. Os testes aplicam
resultados a novas fixtures para verificar consultas; isso não constitui persistência.

### Identidade, versão e auditoria

- `patient.id` é obrigatório e estável; não derive identidade de nome ou contatos.
  Nome e vínculo são obrigatórios; telefone/e-mail são opcionais e exibem
  “Não informado” quando ausentes.
- Criação inicia `version: 1`; demais alterações efetivas incrementam a versão e
  exigem `expectedVersion`. Divergência retorna `VERSION_CONFLICT`.
- Cada sucesso produz exatamente um evento com `type`, `actorId`, sequência numérica
  e `occurredAt = now.toISOString()`. IDs anteriores são preservados.
- Criação registra o estado inicial; remarcação guarda os dois intervalos;
  transições guardam os dois status e cancelamento pode guardar um motivo.
  Edição registra campos e mudanças administrativas, sem duplicar o texto de
  observações no evento. Não registrar informações clínicas nas observações.
- Falhas e operações sem efeito não geram eventos. Códigos de erro em inglês;
  mensagens de apresentação em português.

### Regras de operação

- Criação exige data existente `YYYY-MM-DD`, hora `HH:mm`, início estritamente
  futuro em São Paulo, duração inteira positiva, modalidade, tipo de sessão,
  valor inteiro seguro não negativo em centavos e método de pagamento válido.
  Campos desconhecidos são rejeitados, inclusive nos objetos de paciente/edição.
- O status inicial é `confirmed` por padrão, ou `pending` explícito. Pagamento
  começa sempre `pending`, sem `paidAt`. Não há registro de recebimento financeiro.
- Link de sessão é opcional e deve ser HTTPS; presencial não conserva link.
- Edição de modalidade, tipo de sessão, link e observações é permitida apenas em
  `pending`/`confirmed` antes do início. Valor/método só mudam com pagamento pendente.
  `null` remove link/observações; mudar para presencial remove o link existente.
  Edição não muda paciente, horário, duração ou status.
- Remarcação altera data, hora e duração antes do início original; o novo início
  deve estar no futuro. Preserva ID, paciente, status e pagamento. O próprio ID é
  excluído da validação de conflito.
- `pending → confirmed`, `pending/confirmed → cancelled`,
  `confirmed → completed`, `pending/confirmed → no_show`. Estados terminais não
  permitem reabertura. Confirmação tardia e cancelamento tardio são permitidos.
- Conclusão/ausência exigem que o término previsto tenha sido atingido, inclusive
  exatamente no término. Cancelar, concluir e registrar ausência preservam todo o
  pagamento, inclusive `paidAt`; não produzem reembolso.
- Intervalos são semiabertos `[início, término)`: conflito se
  `candidateStart < existingEnd && existingStart < candidateEnd`. Todos os
  appointments não cancelados ocupam tempo, independentemente da modalidade.
  Intervalos adjacentes são permitidos. Duração não depende dos slots da interface.
- Sessões não ultrapassam a meia-noite; término exatamente à meia-noite é permitido.
  Horários por minuto são aceitos. Não há buffer, disponibilidade ou bloqueio real.

Erros: `VALIDATION_ERROR` (com erros por campo quando aplicável), `NOT_FOUND`,
`DUPLICATE_ID`, `INVALID_TRANSITION`, `INVALID_OPERATION_TIME`, `SCHEDULE_CONFLICT`,
`VERSION_CONFLICT` e `NO_CHANGES`. Repetir uma transição retorna `INVALID_TRANSITION`;
edição/remarcação sem efeito retorna `NO_CHANGES`.

### Interface e próximos PRs

As ações de escrita continuam desabilitadas com indicação “Disponível após
integração”. Alertas e atalhos são demonstrativos. “Ver agendamento” apenas navega
ao Detalhe. Nenhum endpoint de mutação ou CRUD em memória foi introduzido.

1. **PR 4A (implementado):** autenticação Firebase e autorização por UID,
   sessão de oito horas, CSRF, proteção de páginas/handlers e testes com Auth
   Emulator. **PR 4B (pendente):**
   protegidas, Firestore no servidor, regras negando acesso direto às coleções
   administrativas, consultas assíncronas e testes com emuladores. O Admin SDK
   contorna Security Rules: autorização no servidor e IAM são obrigatórios.
   Credenciais não entram em código, mocks ou testes. Produção não terá fallback
   automático para mocks. Home deve calcular indicadores de um único dataset por
   requisição. O admin permanece independente de `apps/public`.
2. **PR 5:** criação persistida e identificação mínima de pacientes. Antes da
   primeira escrita real, transação deve ler versão/dados/ocupação, executar o
   domínio e gravar appointment/histórico atomicamente. Um documento de controle
   por agenda/data serializa alterações de ocupação, inclusive em um dia vazio;
   remarcação entre dias atualiza os dois controles. Identificador de solicitação
   estável evita duplicar criação após resposta perdida. IDs e efeitos externos
   não são gerados em callbacks sujeitos a retry.
3. **PR 6:** edição, remarcação e cancelamento persistidos.
4. **PR 7:** confirmação, conclusão e ausência persistidas.

Antes da criação real, a grade precisa exibir inícios entre slots e expandir a
faixa visível quando necessário; duração continuará textual sem redesign. O
bloqueio hardcoded não valida ocupação. `blocks` persistidos usarão sobreposição e
`availability` futura validará o intervalo inteiro dentro de uma janela disponível.
Após commit persistido, atualizar/invalidate Home, Agenda e Detalhe; não mostrar
sucesso antecipado. A versão local não garante exclusão entre requisições: isso
depende da transação e de testes concorrentes com emuladores.

Mocks usam IDs/autores fictícios e domínios `example.invalid`; não são importados
automaticamente para Firestore. Os novos testes cobrem entradas inválidas,
transições, limites temporais, conflitos, remarcação, edição, pagamentos preservados,
histórico, versões, imutabilidade, consultas após alterações e timezones distintos.
Autorização é testada no PR 4A. Durabilidade e concorrência persistida pertencem
ao PR 4B/5.

## Autenticação administrativa — PR 4A

Somente o UID configurado no servidor em `ADMIN_ALLOWED_UID` pode estabelecer
sessão. Estar autenticado no Firebase, conhecer o e-mail ou possuir um cookie
não concede autorização administrativa.

O login `/admin/entrar` usa e-mail/senha pelo SDK cliente com persistência apenas
em memória. O ID token é enviado por POST ao servidor; o Admin SDK verifica
revogação, UID e autenticação nos últimos cinco minutos antes de emitir um cookie
HttpOnly de oito horas. O estado Firebase cliente é encerrado após a tentativa.
Não há cadastro ou recuperação de senha nesta etapa.

Cada página verifica sessão/autorização antes de renderizar. O layout também
verifica, mas não é a única barreira. O helper de acesso memoiza somente durante
a renderização; todos os verificadores usam `checkRevoked=true`. `proxy.ts`
antecipa redirecionamentos quando não há cookie e aplica headers sem cache.
Não verifica identidade nem substitui a autorização dos módulos de servidor.

O cookie é host-only, `Path=/`, `SameSite=Lax`, HttpOnly e Secure em HTTPS.
Em HTTPS tem prefixo `__Host-`; HTTP local usa outro nome. A sessão não é
renovada automaticamente. Revogação, expiração, conta excluída/desabilitada e
UID não autorizado impedem novas requisições protegidas.

“Sair” exige CSRF e remove somente o cookie deste navegador, mesmo quando a
sessão está inválida. Não revoga sessões em outros dispositivos. Uma cópia do
cookie permanece válida até expiração ou revogação externa. A navegação completa
no login/logout descarta o cache de navegação autenticado do cliente.

### Desenvolvimento com Auth Emulator

Node 20 (CI) ou 22 e Java 21 são as versões recomendadas para as ferramentas
locais. O Auth Emulator desta etapa não precisa de um projeto Firebase real.
Não reutilize `.firebaserc`, variáveis ou credenciais de `apps/public`.
A CLI está fixada em 14.22.0; o override de `re2` 1.22.1, restrito à sua árvore,
mantém compatibilidade com Node 20. Versões recentes de `re2` exigem Node 22/24.

1. Faça uma cópia de segurança da sua `.env.local`, se já existir. Configure
   `apps/admin/.env.local` usando exclusivamente os valores de `.env.example`.
   `ADMIN_ORIGIN` deve ser exatamente a origem usada no navegador, sem barra
   final. O exemplo usa `http://localhost:3000`.
2. Na raiz, execute `npm ci` e `npm run emulators:admin`.
3. Em outro terminal, execute `npm run seed:admin` e `npm run dev:admin`.
4. Abra `/admin/entrar`. Login fictício: `ana.admin@example.invalid`;
   senha exclusivamente local: `LocalOnly-123456!`.

O seed cria apenas o usuário `local-admin-ana`, de forma explícita e idempotente.
Ele exige ambiente local/CI, projeto `demo-ana-psi` e Auth em
`127.0.0.1:9099`. Não grava appointments, não usa pacientes reais e não roda
automaticamente. Os dados do emulador são descartáveis.

A configuração central é lazy e falha fechada se estiver incompleta. Em
`local/ci`, cliente/servidor devem apontar para o mesmo projeto demo e Auth
local; ADC e service accounts não são usados. A demonstração de appointments
exige `ADMIN_ENABLE_DEMO_APPOINTMENTS=true` explicitamente.

Em `development/production`, exigir HTTPS, projeto remoto, SDK cliente com
`NEXT_PUBLIC_FIREBASE_USE_EMULATORS=false` e ausência de qualquer variável de
emulador. A demonstração é proibida. Credenciais privadas futuras serão ADC
(`GOOGLE_APPLICATION_CREDENTIALS` fora do repositório ou identidade gerenciada).
Nunca prefixar credenciais, UID autorizado ou configurações privadas com
`NEXT_PUBLIC_`. O formulário recebe do servidor apenas a configuração pública
validada; não há inicialização Firebase durante o build.

Esta etapa não ativa projetos remotos, habilita providers, publica regras nem
configura domínio/deploy. Antes da ativação futura, revisar IAM e a configuração
do projeto escolhido. As consultas remotas continuam indisponíveis até o PR 4B.

### Dependências antes da ativação remota

O Admin SDK está fixado em 13.10.0, a versão mais recente da série 13 compatível
com Node 20 consultada nesta implementação. Essa versão remove `node-forge` da
árvore do SDK. O SDK 14 exige Node 22 e não foi adotado nesta etapa.

A auditoria do workspace ainda identifica vulnerabilidades na base existente,
incluindo Next 16.1.6. Antes de ativar um ambiente remoto ou usar dados reais,
atualizar Next e revisar as dependências de produção em uma alteração própria,
validando também o site público e o runtime LTS escolhido. Ver os avisos
[Windows RCE](https://github.com/advisories/GHSA-p293-qw3h-jr36) e
[Image Optimization RCE](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4).
Os testes desta etapa comprovam as barreiras de autenticação locais; não
substituem a correção das vulnerabilidades do framework nem uma validação de
produção. Não executar `npm audit fix --force` automaticamente.

### Operações HTTP e CSRF

- `GET /api/admin/auth/csrf`: token aleatório de 256 bits e cookie HttpOnly;
  não possui CORS e rejeita origem estrangeira/contexto cross-site.
- `POST /api/admin/auth/sessao`: corpo JSON `{ idToken }`, limite de 16 KiB,
  header `X-CSRF-Token` correspondente ao cookie e `Origin === ADMIN_ORIGIN`.
  Sucesso `204`, cookie de sessão e remoção do token CSRF usado.
- `POST /api/admin/auth/sair`: mesma verificação CSRF/origem, sem exigir uma
  sessão válida e sem chamar revogação; sucesso `204`.

Respostas: `400` para corpo inválido, `401` para token/sessão inválidos ou login
antigo, `403` para UID não autorizado ou CSRF inválido, `503` para configuração
ou provedor indisponível. Mensagens e logs não devem incluir tokens, cookies,
credenciais ou dados pessoais. Todas as respostas administrativas são privadas
e sem cache. Novos handlers/Server Actions devem verificar autorização no
próprio fluxo, antes de qualquer acesso a dados.

### Testes e CI

```powershell
npm run test:appointments --workspace @ana-psi/admin
npm run test:security:admin
npm run typecheck:admin
npm run lint:admin
npm run build:admin
npm run test:integration:admin
```

Os testes de segurança usam `node:test`, compilação CommonJS separada em
`.next/security-tests` e `--conditions=react-server` para módulos `server-only`.
A integração usa `emulators:exec --project demo-ana-psi --only auth`, fixtures
fictícias, porta Next temporária e o build servido por `next start`.
As variáveis são fornecidas explicitamente e credenciais herdadas são removidas;
valores vazios impedem que `.env.local` preencha os principais campos privados.
O runner encerra o servidor Next e a CLI encerra os emuladores.

Para investigar o servidor de desenvolvimento sem build prévio:
`npm run test:integration:admin -- --dev`. Isso não substitui a integração com
`next start` no CI. Não execute a integração enquanto um Auth Emulator interativo
estiver usando a porta 9099; o teste inicia sua própria instância.

A suíte também reinicia Next com demonstração desabilitada, configuração
incompleta e Auth apontando para uma porta local indisponível, comprovando
falha fechada e respostas `503` sem dados demonstrativos.
A suíte verifica login válido/inválido, UID não autorizado, acesso direto a
todas as páginas, HTML/RSC sem dados privados, cookie inválido/expirado/revogado,
autenticação antiga, conta desabilitada/excluída, CSRF, corpo inválido e logout
preservando a sessão de outro navegador. Fixtures de cookies unsigned/expirados
existem apenas nos testes do emulador. A política remota rejeita emuladores.

O emulador não comprova IAM, assinatura de tokens de produção ou TLS remoto.
Esses aspectos exigirão validação na ativação futura. O build continua usando
Inter via Google Fonts e precisa de conectividade para obtê-la.
