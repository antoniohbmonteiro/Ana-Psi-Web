# Admin app

## Desenvolvimento e produção

Executar na raiz do workspace:

```powershell
npm run dev:admin
npm run build:admin
npm run start --workspace @ana-psi/admin
```

## Núcleo de appointments

Home, Agenda e Detalhe usam o fluxo `appointments/mock → repository → service`.
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

1. **PR 4:** autenticação Firebase, autorização por UID administrativo, sessões
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
Testes de durabilidade, autorização e concorrência real pertencem ao PR 4/5.
