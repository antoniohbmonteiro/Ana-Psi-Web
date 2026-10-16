# Risco conhecido: credencial de produção no preview da landing

Registrado durante o PR 7 (preview do admin). **Os workflows da landing não foram alterados nesse
PR**; a correção é recomendada em um PR separado, com prioridade alta. O IAP e o projeto de
desenvolvimento do admin **não** reduzem este risco: são outro projeto e outros workflows.

## O que acontece hoje

O secret `FIREBASE_SERVICE_ACCOUNT_ANA_PSI` é uma chave JSON persistente de uma service account do
projeto de **produção** `ana-psi`.

| Workflow | Gatilho | Uso da chave |
|---|---|---|
| `.github/workflows/public-preview.yml` | **todo** PR para `main`, sem filtro de paths (inclusive PRs que só mudam o admin) | `npm ci` roda os scripts de instalação das dependências do lockfile do PR. Em seguida, `npm run sync:snapshot` e `npm run build:public` recebem a chave em `FIREBASE_SERVICE_ACCOUNT_JSON`; o `build` roda o sync de novo e o `next build`. A chave também vai para `FirebaseExtended/action-hosting-deploy@v0`, uma tag flutuante |
| `.github/workflows/public-preview-cleanup.yml` | PR fechado | grava a chave em arquivo e executa `npx firebase-tools` **sem versão fixada** (baixa a versão mais recente da npm na hora), com `\|\| true` |
| `.github/workflows/public-production.yml` | push na `main` | mesma chave para sync, build e deploy do canal `live` (código já integrado) |

Na prática, **código controlado pelo PR roda com a credencial de produção**:
- scripts do repositório;
- `next.config`;
- scripts de instalação de qualquer dependência adicionada ou atualizada.

Um script de instalação malicioso pode deixar código que só exfiltra a chave no passo seguinte, quando
ela está no ambiente.

## Alcance real

- **Quem dispara:** PRs de branches do próprio repositório (o dono e o app do Claude) e qualquer
  dependência comprometida que um desses PRs traga. PRs de fork não recebem secrets do GitHub.
- **Duração:** a chave não expira; uma cópia vazada vale até ser revogada.
- **Permissões: precisam ser inventariadas.** Não estão no repositório. Se a SA foi criada por
  `firebase init hosting:github`, costuma ter papéis como *Firebase Hosting Admin* (inclui publicar no
  canal **live**) e *Firebase Authentication Admin*, além do acesso ao Firestore usado pelo sync.
- **Impacto possível:**
  - substituir a landing publicada;
  - ler o Firestore do `ana-psi`;
  - administrar usuários do Auth de produção.

  **Se o admin de produção vier a usar o `ana-psi` com dados reais de pacientes, essa chave passa a
  ser um vetor para dados sensíveis.**

Inventário sugerido:

```bash
gcloud projects get-iam-policy ana-psi --flatten='bindings[].members' \
  --filter='bindings.members:serviceAccount' --format='table(bindings.role, bindings.members)'
gcloud iam service-accounts keys list --iam-account=<EMAIL_DA_SA> --project=ana-psi
```

Revise também os *Cloud Audit Logs* da SA em busca de uso fora dos horários dos workflows.

## Correção recomendada (PR separado, antes de dados reais no `ana-psi`)

1. **Separar o build não confiável das operações autenticadas:**
   - o build do preview roda **sem credencial**, usando o snapshot versionado do conteúdo;
   - um job que não executa código do PR publica o `out/` recebido como artifact.
2. **Trocar a chave por GitHub OIDC + Workload Identity Federation no `ana-psi`**, com service
   accounts mínimas e distintas:
   - **preview:** só canais de preview do Hosting, a partir de PRs do próprio repositório;
   - **sync:** leitura dos documentos `settings/site_public_*`, só na `main`;
   - **produção:** deploy do canal `live`, só em `refs/heads/main`.
3. Fixar versões: `firebase-tools` com versão explícita e actions por SHA. Remover o `|| true` do
   cleanup.
4. Depois da migração, **revogar e apagar** a chave JSON e remover o secret do GitHub.
5. Opcional: filtro de paths no preview da landing, para PRs só do admin não dispararem o deploy da
   landing.
