# Ana Psi Web

Base inicial do projeto em Next + Tailwind.

## Rotas iniciais
- /admin/inicio
- /admin/agenda
- /admin/agendamentos/novo
- /admin/agendamentos/1
- /admin/disponibilidade
- /admin/bloqueios
- /admin/pre-reservas
- /admin/pacientes
- /admin/financeiro
- /agendar
- /resultado-agendamento
- /style-guide

## Rodar

Use Node.js 24 LTS (`.nvmrc` na raiz; `engines.node` exige `>=24 <25`).
Os workflows do admin e do site público leem a mesma `.nvmrc`.
Com nvm, execute `nvm install` e `nvm use`; no nvm-windows, instale e selecione
uma versão 24.x explicitamente. A validação local utiliza v24.19.0.
O admin também requer Java 21 para o Firestore Emulator.

Execute na raiz do monorepo:

```powershell
npm ci
npm run dev:public
# Em outro terminal, se necessário:
npm run dev:admin
```

Configuração e testes do admin: [apps/admin/README.md](apps/admin/README.md).
Resultados e ressalvas da migração: [docs/node24-validation.md](docs/node24-validation.md).
Atualização de segurança das dependências: [docs/security-dependency-updates.md](docs/security-dependency-updates.md).
Preview do admin por Pull Request (Cloud Run + IAP): [docs/admin-preview.md](docs/admin-preview.md).
Risco conhecido no preview da landing: [docs/security-public-preview-credential.md](docs/security-public-preview-credential.md).

