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
`node:assert/strict`, sem dependências extras. O TypeScript compila os dois arquivos
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
