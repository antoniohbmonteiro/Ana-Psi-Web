# Admin Ana Psi

Painel administrativo independente de `apps/public`. Home, Agenda e Detalhe
leem `appointments/{appointmentId}` pelo Firebase Admin SDK no servidor.
Não existem escritas administrativas habilitadas, mocks automáticos ou seed no
startup. Os comandos puros continuam disponíveis para os próximos PRs.

## Desenvolvimento local

Node.js 24 LTS e Java 21 são as versões utilizadas pelo CI. A `.nvmrc` da raiz
define a versão do Node nos workflows; `engines.node` na raiz exige `>=24 <25`
para os dois workspaces. Validação local com Node v24.19.0. Execute na raiz:

```powershell
npm ci
npm run emulators:admin
```

Antes de iniciar o admin, configure `apps/admin/.env.local` pelos valores de
`.env.example`. Se esse arquivo já aponta para outro projeto, preserve-o fora
deste fluxo e configure exclusivamente o projeto `demo-ana-psi`. Não reutilize a
configuração de `apps/public`. A origem deve corresponder exatamente ao endereço
usado no navegador, sem barra final.

Em outro terminal:

```powershell
npm run seed:admin
npm run dev:admin
```

Abra `/admin/entrar`. Usuário fictício: `ana.admin@example.invalid`.
Senha exclusivamente local: `LocalOnly-123456!`. UID: `local-admin-ana`.
Auth usa `127.0.0.1:9099`; Firestore usa `127.0.0.1:8080`.

O seed é opcional, explícito e restrito aos dois emuladores no projeto demo.
Prepara o usuário e dez consultas fictícias, incluindo 10:17, 07:15 e 23:45.
Atualiza somente IDs fixos dessas fixtures e não remove outros documentos.
Sem seed, o banco vazio é um resultado legítimo. Reiniciar emuladores sem
importar dados produz novamente um banco vazio. Nenhum dado real é utilizado.

`seed:admin` compila primeiro o mapper para `.next/persistence-tests` e utiliza
`react-server` somente no processo de fixture. O repository da aplicação não
expõe métodos de escrita. `seed:auth` continua disponível apenas para preparar o
usuário. Ambos recusam projetos reais.

## Autenticação e autorização

O SDK cliente usa somente Auth e `inMemoryPersistence`. O formulário envia o ID
token ao servidor; após a troca, encerra o estado temporário Firebase.
O servidor exige UID exatamente igual a `ADMIN_ALLOWED_UID`, revogação verificada
e autenticação nos últimos cinco minutos. Não autoriza por e-mail ou formulário.

Sessões duram oito horas, sem renovação automática. O cookie é HttpOnly,
SameSite=Lax, Path=/, sem Domain e Secure em HTTPS, com prefixo `__Host-` remoto.
Logout remove somente o cookie deste navegador, preservando outras sessões;
uma cópia do cookie continua válida até expiração ou revogação externa.

Cada página é protegida no servidor. `application.server` chama `requireAdmin`
antes de configurar Firestore e construir repository/service; layout e proxy
não substituem essa autorização. Novos handlers e Server Actions devem entrar
pelo mesmo fluxo autorizado. Verificações são memoizadas apenas na renderização.

- `GET /api/admin/auth/csrf`: token aleatório e cookie HttpOnly, sem cache.
- `POST /api/admin/auth/sessao`: JSON `{ idToken }`, limite de 16 KiB,
  `X-CSRF-Token` correspondente ao cookie e `Origin === ADMIN_ORIGIN`; sucesso 204.
- `POST /api/admin/auth/sair`: mesma proteção de origem/CSRF; sucesso 204,
  inclusive se a sessão já estiver inválida.

Erros HTTP: 400 para corpo inválido, 401 para identidade/sessão inválida,
403 para UID não autorizado ou CSRF inválido e 503 para configuração ou Auth
indisponível. Não há cadastro, recuperação de senha nem login de pacientes.

## Configuração e isolamento

A configuração é lazy: importar módulos ou fazer build não inicializa Firebase.
`ADMIN_ENV=local|ci` exige `demo-ana-psi`, Auth local e configuração pública
consistente. Leituras exigem também um host Firestore local válido, sem protocolo.
A ausência desse host impede consultas, mas não impede o login. SDK Auth e
Firestore compartilham o mesmo Admin App. Credenciais reais não são necessárias.

Em `development|production`, exigir HTTPS, projeto não demo e ausência de
variáveis/flags de emulador. Credenciais futuras serão ADC ou identidade
gerenciada. UID e credenciais nunca recebem prefixo `NEXT_PUBLIC_`.
A antiga flag `ADMIN_ENABLE_DEMO_APPOINTMENTS` não seleciona mais dados em memória;
remova-a da configuração local. Valores legados inválidos ou demonstração remota
continuam rejeitados. Todas as consultas usam Firestore.

Configuração pública é incorporada ao build: a ativação remota exige um novo
build com valores daquele ambiente. Não promover um bundle configurado para
emuladores. Este PR não cria projetos, publica Rules nem configura deploy.

## Modelo e leitura

O ID do documento define `Appointment.id`; não há campo ID duplicado persistido.
Datas e horários civis permanecem strings em `America/Sao_Paulo`. Instantes
reais (`paidAt`, `occurredAt`, inclusive pagamentos no histórico) são Firestore
Timestamp, convertidos pelo mapper para ISO UTC com precisão de milissegundos.
Valores monetários são inteiros seguros em centavos de BRL. Paciente é snapshot
com ID estável; pagamento e histórico permanecem embutidos no appointment.

O mapper valida documentos históricos sem exigir data futura. Valida estrutura,
enums, números, identidade, intervalos e histórico; campos desconhecidos não são
propagados. Não exige que a versão coincida com a quantidade de eventos nem que
o primeiro evento seja de criação. Documento inválido faz a leitura falhar;
nunca é descartado silenciosamente ou substituído por mock.

Repository e service são assíncronos. A listagem completa é validada e ordenada
por data, hora e ID em memória, sem `orderBy` que poderia omitir documentos
incompletos. Uma instância guarda sua promise de listagem por requisição.
Home usa esse único dataset para consultas do dia, próxima sessão, contagens
globais e duração de todos os status. Detalhe lê diretamente o documento.
Não há cache global, listener em tempo real nem paginação nesta etapa.

`getNextAppointment(now)` considera somente confirmed com início estritamente
futuro, incluindo próximos dias. Captura-se um `now` por renderização e o relógio
do processo não define a data civil. A Agenda mantém navegação semanal sobre o
dataset carregado e inclui inícios por minuto, expandindo a faixa quando preciso.

Banco vazio exibe métricas zero e mensagens vazias. Documento inexistente produz
not-found após autorização. Documento inválido, configuração incompleta e falha
de infraestrutura produzem mensagens distintas em português. Loading não contém
dados pessoais. Tentar novamente inicia uma nova renderização. Leituras têm um
limite de resposta de dez segundos; esse limite não garante cancelamento das
retentativas internas do SDK. Resultados tardios não são utilizados.

Alertas mostram “Ainda não integrado”. Botões de criar, editar, remarcar, cancelar,
concluir e registrar pagamentos continuam desabilitados. A apresentação preserva
paciente, pagamento, histórico, status e valores formatados.

## Security Rules

As Rules versionadas são carregadas explicitamente pelo emulador. Negam leitura
e escrita cliente de appointments, inclusive subcoleções, para anônimos,
usuários comuns e UID administrativo. Permitem apenas `get` de
`settings/site_public_profile` e `settings/site_public_landing`; listagens,
escritas e demais caminhos são negados. Não há allow genérico para autenticados.

Admin SDK ignora Rules: autorização no servidor e futuro IAM são obrigatórios.
As Rules realmente implantadas no projeto institucional não estão versionadas
neste repository e não foram publicadas/alteradas por este PR. Antes de publicar
em projeto real, comparar com a política existente e preservar os acessos
institucionais necessários. Excluir índices de contatos/paciente, pagamento,
observações, link e histórico; nenhum índice composto foi acrescentado.

## Testes e CI

```powershell
npm ci
npm run test:appointments --workspace @ana-psi/admin
npm run test:security:admin
npm run test:persistence:admin
npm run typecheck:admin
npm run lint:admin
npm run build:admin
npm run test:integration:admin
```

Mantemos `node:test`; TypeScript emite CommonJS em saídas ignoradas dentro de
`.next`, com imports relativos. Testes de módulos privados usam
`--conditions=react-server`. `@firebase/rules-unit-testing` está fixado em 5.0.2,
compatível com Node 24 e Firebase 12. A ferramenta firebase-tools permanece
14.22.0. O override de re2 foi removido; a resolução transitiva é preservada no
lockfile e validada por `npm ci` e pelos testes com Auth e Firestore Emulator.
`superstatic@9.2.0`, dependência transitiva da CLI, declara apenas Node 18/20/22
e gera aviso de engine em Node 24. Os fluxos de emuladores são validados em
Node 24; revisar o suporte declarado dessa transitiva em tarefa específica de
atualização da CLI. Não habilitar `engine-strict` sem resolver essa limitação.

A integração usa `emulators:exec --project demo-ana-psi --only auth,firestore`,
fixtures próprias, limpeza entre cenários e um Next real em porta temporária.
Testa repository, Rules, autenticação, sessão, CSRF, revogação, logout e telas.
Reinicia Next também com configuração incompleta e Auth/Firestore indisponíveis.
As variáveis são explícitas; ambiente herdado e credenciais são removidos.
O runner encerra Next e a CLI encerra os emuladores. Não depende de seed manual
ou secrets de produção. Não executar junto de emuladores interativos nas mesmas
portas. Para investigar sem build: `npm run test:integration:admin -- --dev`;
isso não substitui `next start` no CI.

## Limites e próximos passos

Listagem completa tem custo crescente; avaliar paginação antes de aumentar o
volume. Histórico embutido e limite do documento precisam de revisão antes das
escritas. Não registrar tokens, cookies ou dados pessoais em erros.
Emuladores não comprovam IAM, TLS, cotas ou todos os limites de produção.
Build usa Inter do Google Fonts e requer conectividade para obtê-la.

Domínio do PR 3 continua puro: criação, edição, remarcação e transições recebem
snapshot, versão e contexto explícitos; produzem resultado e evento UTC sem
persistir. Antes de conectar escritas, implementar transações de versão e
ocupação por dia, incluindo dia vazio, e idempotência. Não implementar portal,
agendamento público, prontuários ou pagamentos online nesta etapa.

Antes de ativação remota ou dados reais, tratar as vulnerabilidades existentes
em tarefa específica, incluindo Next 16.1.6 e transitivas de Firebase/Firestore.
Não executar `npm audit fix --force`. A atualização de Node não inclui migrar
para Admin SDK 14 nem atualizar Next ou outras dependências funcionais.
Depois das operações essenciais e atualização de segurança,
configurar ambientes/IAM/hospedagem, validar com dados fictícios e liberar o
piloto privado para Ana. `apps/public` permanece independente, com comportamento preservado.
