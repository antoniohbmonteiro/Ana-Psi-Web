# Preview do admin por Pull Request

Cada PR que altera o admin (`apps/admin`) ganha um ambiente de testes próprio no **Google Cloud
Run**, protegido pelo **Identity-Aware Proxy (IAP)**, usando um projeto Firebase de
**desenvolvimento** com dados fictícios. O endereço aparece num comentário do PR, é atualizado a
cada commit e o ambiente é removido quando o PR é fechado ou integrado.

```
Claude implementa → abre PR → CI testa → preview publicado → você testa → merge → preview removido
```

A landing (`apps/public`) e o projeto de produção `ana-psi` não são tocados por nada aqui.

## Sumário

- [Como testar um preview](#como-testar-um-preview)
- [Arquitetura](#arquitetura)
- [Segurança e isolamento](#segurança-e-isolamento)
- [Concorrência e limpeza](#concorrência-e-limpeza)
- [IAM](#iam)
- [Configuração inicial (uma vez)](#configuração-inicial-uma-vez)
- [Workload Identity Federation](#workload-identity-federation)
- [Operação](#operação)
- [Custos](#custos)
- [Testes de aceite](#testes-de-aceite)
- [Limitações](#limitações)

## Como testar um preview

1. Abra o comentário **"Preview do admin"** no PR e clique no endereço
   (`https://admin-pr-<N>-<número do projeto>.us-central1.run.app/admin/entrar`).
2. Entre com uma **conta Google autorizada**. Isso é o IAP; contas não autorizadas recebem acesso
   negado e nem chegam à aplicação.
3. Entre no admin com o **usuário de teste** do projeto de desenvolvimento. A senha fica só com
   você, nunca no GitHub.
4. No celular, abra o link no **Chrome ou Safari**. O Google bloqueia login OAuth em navegadores
   embutidos de alguns apps; se o login Google falhar dentro de um app, use "abrir no navegador".

Depois de alguns minutos sem uso o serviço desliga (scale to zero). O primeiro acesso seguinte leva
alguns segundos a mais. Se uma ação falhar depois de muito tempo parado (sessão do IAP expirada),
recarregue a página.

## Arquitetura

```
PR do mesmo repositório ─► workflow "Admin CI" (.github/workflows/admin-ci.yml)
  check           testes, emuladores, build              [sem credenciais]
  preview-image   docker build da imagem standalone      [sem credenciais] → artifact (1 dia)
  preview-deploy  push no Artifact Registry + Cloud Run  [OIDC → WIF → SA deployer; sem checkout]
  preview-report  comenta falhas no PR                   [sem credenciais de nuvem]

PR fechado / diário / manual ─► "Admin Preview Cleanup" (.github/workflows/admin-preview-cleanup.yml)

Navegador ─► https://admin-pr-N-<NUM>.us-central1.run.app
  ─► IAP (conta Google autorizada) ─► contêiner Next.js (SA admin-preview-runtime, sem chave)
       ├─ Firebase Auth do projeto de desenvolvimento (usuário de teste, UID permitido)
       └─ Firestore (default) do projeto de desenvolvimento (dados fictícios)
```

- **Imagem:** `apps/admin/Dockerfile` gera o servidor `standalone` do Next.js.
  - O modo só é ativado na imagem, por `ADMIN_NEXT_OUTPUT=standalone`; CI e desenvolvimento local
    continuam com `next start`.
  - A base é `node:24.19.0-bookworm-slim`, fixada por digest e baixada pelo mirror do Google para o
    Docker Hub (`mirror.gcr.io`), que não tem limite de pulls anônimos.
  - O processo roda como usuário `node`, sem permissão de escrita no código.
  - O contexto de build é controlado por `apps/admin/Dockerfile.dockerignore` (lista de permissão):
    não entram `.env`, chaves, `node_modules`, `.next` nem o código de `apps/public`.
- **A imagem não contém configuração de ambiente.** A configuração pública do Firebase é lida em
  runtime no servidor (`src/lib/firebase/config.server.ts`) e chega ao navegador por props. Por isso
  a mesma imagem serve a qualquer ambiente. Isso importa porque o repositório e os artefatos do
  GitHub Actions são **públicos**.
- **Serviço por PR:** `admin-pr-<N>`, região `us-central1`.
  - Escala de 0 a 1 instância, 1 vCPU, 512 MiB, timeout de 60 s, cobrança por requisição.
  - Labels `managed-by=admin-preview`, `pr-number=<N>` e `commit=<sha>`.
- **Variáveis do serviço** (definidas a cada deploy; nenhuma credencial):

  | Variável | Valor |
  |---|---|
  | `ADMIN_ENV` | `development` (exige HTTPS, projeto real não-demo e nenhum emulador) |
  | `ADMIN_ORIGIN` | URL determinística do PR, `https://admin-pr-N-<NUM>.<REGIÃO>.run.app` |
  | `ADMIN_ALLOWED_UID` | UID do usuário de teste |
  | `FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | projeto de desenvolvimento |
  | `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_APP_ID` | configuração web pública do projeto de desenvolvimento |
  | `NEXT_PUBLIC_FIREBASE_USE_EMULATORS` | `false` |

- O Admin SDK usa `applicationDefault()`, ou seja, a SA de runtime pelo servidor de metadados do
  Cloud Run. Não existe chave JSON.

## Segurança e isolamento

- **Projeto separado.** Tudo do preview vive no projeto de desenvolvimento (sugestão: `ana-psi-dev`):
  Auth, Firestore, Cloud Run, Artifact Registry, Workload Identity Federation e service accounts.
  - Nenhuma identidade desse projeto tem papel no `ana-psi`.
  - O workflow recusa o projeto `ana-psi` e exige que SAs, provider WIF e domínio de Auth pertençam
    ao projeto configurado.
- **Dados fictícios.** O usuário de teste e todos os agendamentos são inventados. O banco começa vazio
  (estado válido) e os dados de teste são criados pela própria interface.
- **Duas barreiras de acesso.** O IAP exige uma conta Google autorizada antes de qualquer requisição
  chegar ao contêiner. Depois, o admin mantém tudo o que já existe:
  - UID permitido;
  - sessão HttpOnly `__Host-` de 8 horas;
  - login recente;
  - revogação;
  - `Origin` e CSRF comparados com o `ADMIN_ORIGIN` exato do PR.

  A URL "difícil de adivinhar" **não** é considerada proteção: ela aparece em comentários públicos.
- **Verificação automática a cada deploy.** O job confirma que:
  - o serviço está pronto e roda o digest enviado;
  - o IAP está ligado e a verificação de IAM do invoker continua ativa;
  - a política de IAM do serviço não tem `allUsers`/`allAuthenticatedUsers`;
  - uma requisição anônima é barrada **pelo próprio IAP**. A resposta precisa trazer o cabeçalho
    `X-Goog-IAP-Generated-Response`, que o IAP adiciona às respostas que ele mesmo gera. Se for um
    redirecionamento (302), ele precisa levar ao login do Google com o retorno do IAP
    (`https://iap.googleapis.com/v1/oauth/clientIds/…:handleRedirect`). Redirecionamentos e erros
    gerados pela aplicação (302/307, 401/403) não contam.

  **O serviço é removido** e o job falha se:
  - o IAP não estiver ativo;
  - o invoker estiver desligado;
  - a política de IAM for pública;
  - a SA de runtime estiver errada;
  - o bloqueio anônimo não puder ser atribuído ao IAP: resposta da aplicação, inclusive 302 ou 403,
    ou nenhuma confirmação depois das novas tentativas.
- **Deploy sem chave.** O GitHub Actions troca um token OIDC por credenciais temporárias via Workload
  Identity Federation, restrito a este repositório, a estes dois workflows e aos eventos esperados
  (ver [condição](#workload-identity-federation)).
- **Código do PR nunca roda com credenciais.**
  - O build (`npm ci`, `next build`) acontece em `preview-image`, sem token de nuvem.
  - Os jobs com `id-token: write` (`preview-deploy` e os da limpeza) não fazem checkout nem executam
    nada do repositório. Isso também protege contra dependência npm comprometida.
- **PRs de fork** rodam o CI, mas os jobs de preview são pulados. O GitHub também não emite token OIDC
  nem secrets para eles. Nunca é usado `pull_request_target`.
- **Logs públicos.**
  - O UID do usuário de teste fica num *secret* do GitHub, mascarado automaticamente. Ele não é
    credencial.
  - O JSON do serviço (que contém as variáveis) é verificado e nunca impresso.
  - Comentários de falha mostram só a etapa e o link do run.
- **Isolamento entre previews.** Cada PR tem origem, cookies, contêiner e revisões próprios. **Os dados
  são compartilhados:** todos os previews usam o mesmo Firestore `(default)` do projeto de
  desenvolvimento.
  - Um agendamento criado num PR aparece nos outros.
  - Um PR que mude o formato dos documentos pode gravar dados que o mapper estrito de outro PR
    rejeita, e a leitura falha com mensagem de dados inconsistentes.
  - Teste PRs que mudam o schema um de cada vez e use o [reset de dados](#reset-dos-dados-de-teste)
    se necessário.
  - Um banco nomeado por PR exigiria configurar `databaseId` no Admin SDK (mudança de código) e não
    tem cota gratuita; fica para quando houver necessidade.
- **Limite assumido.** Em eventos `pull_request`, quem tem permissão de push no repositório pode
  editar o workflow dentro do próprio PR. O dano possível fica restrito ao projeto de
  desenvolvimento:
  - o deployer não altera políticas de IAM nem torna serviços públicos;
  - só escreve num repositório do Artifact Registry;
  - não acessa Firestore nem Auth;
  - não tem nenhum papel na produção.

## Concorrência e limpeza

Cada PR é identificado pelo **número** (`github.event.pull_request.number`), nunca por
`github.ref`. No fechamento por merge, `github.ref` pode ser `refs/heads/main`.

| Grupo de concorrência | Jobs | Cancela o anterior? |
|---|---|---|
| `admin-ci-pr-<N>` (PR) / `admin-ci-<ref>` (push) | `check` | sim |
| `admin-preview-image-pr-<N>` | `preview-image` | sim |
| `admin-preview-pr-<N>` | `preview-deploy`, `remove` (fechamento e varredura) | **não** |
| `admin-preview-report-pr-<N>` | `preview-report` | não |
| `admin-preview-sweep` | `sweep-list` | não |

- A concorrência é definida **por job**. Um push novo cancela testes e builds obsoletos, mas **nunca
  interrompe um deploy em andamento**: o deploy do commit novo espera na fila.
- O GitHub mantém, por grupo, um job em execução e no máximo um pendente; um novo pendente substitui o
  anterior. Por isso a correção não depende só da fila. **Todo job da fila `admin-preview-pr-<N>`
  reconsulta o PR antes de agir:**
  - `preview-deploy`:
    - PR fechado → remove o que existir e não publica;
    - commit do run ≠ commit atual do PR → não publica (*superseded*);
    - senão, publica, verifica e **reconsulta o PR**: se fechou durante o deploy, remove o que acabou
      de criar.
  - `remove`: se o PR foi reaberto, não faz nada (o run do reopen publica de novo). Senão, remove o
    serviço (com novas tentativas se houver operação em andamento) e o pacote de imagens, e atualiza o
    comentário.
- Uma falha da API do GitHub interrompe o job; nunca é interpretada como "PR fechado".
- A limpeza no fechamento roda para **todo** PR fechado do mesmo repositório, sem filtro de paths.
  Ela **não depende** de `ADMIN_PREVIEW_ENABLED`: desligar os previews não impede a remoção.
- A **varredura** (diária às 07:41 UTC e manual) lista serviços `managed-by=admin-preview` e pacotes
  `pr-*` cujo PR não está aberto. Depois remove cada um num job da mesma fila do PR correspondente.

| Cenário | Resultado |
|---|---|
| Dois pushes seguidos | `check`/`preview-image` antigos cancelados; só o último publica |
| Push durante um deploy | o deploy atual termina; o novo espera e publica depois |
| Run antigo chega ao deploy (ou re-run manual) | não publica (*superseded*) |
| PR fechado com o CI ainda rodando | a limpeza roda; o deploy posterior encontra o PR fechado e não publica |
| PR fechado durante o deploy | a limpeza fica "Waiting" na fila e remove logo depois |
| PR fecha logo após a checagem do deploy | a reconsulta pós-deploy remove; a limpeza pendente também (idempotente) |
| Merge | mesma fila por número; remoção normal |
| Fechar e reabrir rápido | o job que rodar converge para o estado atual do PR |
| Limpeza cancelada ou com falha | a varredura remove depois |
| Deploy cancelado no meio | a operação no Cloud Run pode concluir; o próximo deploy ou a limpeza converge |

## IAM

Papéis permanentes, todos no projeto de desenvolvimento e **nenhum no `ana-psi`**:

| Principal | Papel | Escopo | Por quê |
|---|---|---|---|
| Contas Google de quem testa | `roles/iap.httpsResourceAccessor` | projeto | única permissão que libera o acesso via IAP; **Owner não a inclui**. Em nível de projeto, todo `admin-pr-N` novo herda |
| Agente do IAP `service-<NUM>@gcp-sa-iap.iam.gserviceaccount.com` | `roles/run.invoker` | projeto | o IAP precisa invocar os serviços. Concedido uma vez, o deployer não precisa de `setIamPolicy` |
| `admin-preview-deployer` | `roles/run.developer` | projeto | criar, atualizar, excluir e listar serviços; ler a política para verificação. **Sem `setIamPolicy`:** não torna serviços públicos nem desliga o invoker |
| `admin-preview-deployer` | `roles/iam.serviceAccountUser` | só a SA `admin-preview-runtime` | implantar serviços que rodam como a SA de runtime |
| `admin-preview-deployer` | `roles/artifactregistry.repoAdmin` | só o repositório `admin-preview` | enviar imagens e excluir os pacotes dos PRs fechados |
| GitHub (principalSet por `repository_id`) | `roles/iam.workloadIdentityUser` | só a SA `admin-preview-deployer` | impersonação via WIF |
| `admin-preview-runtime` | `roles/datastore.user` | projeto | leituras, escritas e transações do Firestore |
| `admin-preview-runtime` | papel customizado `adminPreviewAuthSession` (`firebaseauth.users.get`, `firebaseauth.users.createSession`) | projeto | o código só usa `verifyIdToken`/`verifySessionCookie` com revogação e `createSessionCookie`. O logout não chama o Auth |

**De fora, de propósito:**
- Do deployer: `run.admin`, `iap.admin`, `iap.settingsAdmin`, `oauthconfig.editor` e qualquer papel de
  Firestore, Auth ou IAM do projeto.
- Do runtime: `firebaseauth.admin` (criar e excluir usuários, ler segredos de configuração) e qualquer
  papel de Cloud Run, Artifact Registry ou IAM.

**Configuração inicial (humano):** você, como Owner do projeto de desenvolvimento, já tem tudo o que
a configuração exige:
- tela de consentimento e OAuth client (`roles/oauthconfig.editor`);
- configurações do IAP (`roles/iap.settingsAdmin`);
- concessões de acesso (`roles/iap.admin` ou IAM do projeto).

Nenhum desses papéis é dado a service accounts. O teste de impersonação do passo C5 exige
`roles/iam.serviceAccountTokenCreator` na SA deployer, que o Owner **não** tem; ele é concedido
temporariamente e removido em seguida.

**Se o teste do passo C5 falhar:**
1. Se o `gcloud run deploy --iap` como deployer for negado citando `run.services.setIamPolicy`, trocar
   `roles/run.developer` por `roles/run.admin` (papel listado pela documentação do Google, restrito ao
   projeto de desenvolvimento). As verificações pós-deploy passam a ser a barreira.
2. Se for negado citando uma permissão `iap.*`, criar um papel customizado com **exatamente** essa
   permissão. Nunca dar `roles/iap.admin` ao deployer.
3. Se o papel customizado `adminPreviewAuthSession` não puder ser criado, usar
   `roles/firebaseauth.admin` e registrar a exceção.

## Configuração inicial (uma vez)

Não crie chaves JSON de service account e não altere nada no projeto `ana-psi`. Os comandos usam o
Cloud Shell ou um gcloud local autenticado como Owner do projeto de desenvolvimento.

```bash
PROJECT_ID=ana-psi-dev            # ID real do projeto criado no passo A1
REGION=us-central1
REPO_ID=1178339251                # antoniohbmonteiro/Ana-Psi-Web
OWNER_ID=239388036                # antoniohbmonteiro
```

### A. Projeto e Firebase

1. No [console do Firebase](https://console.firebase.google.com/), crie o projeto de desenvolvimento
   (sugestão `ana-psi-dev`) e ative o plano **Blaze**, vinculando a conta de faturamento. Depois:
   `PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')`.
2. Registre um **Web App** e anote `apiKey`, `authDomain` e `appId`. São valores públicos.
3. **Authentication:**
   - Ative o provedor E-mail/Senha.
   - Crie **um** usuário de teste com e-mail fictício e senha forte, guardada só com você.
   - Anote o **UID**.
   - Recomendado, se disponível no seu projeto: em *Settings → User actions*, desative a criação
     de contas pelo cliente.
4. **Firestore:** crie o banco `(default)` em modo nativo, **modo produção** (nega tudo ao cliente),
   local `us-central1`. A localização não pode ser mudada depois.

### B. Google Cloud

5. APIs:

   ```bash
   gcloud services enable run.googleapis.com artifactregistry.googleapis.com iam.googleapis.com \
     iamcredentials.googleapis.com sts.googleapis.com iap.googleapis.com \
     cloudresourcemanager.googleapis.com --project "$PROJECT_ID"
   ```

6. Artifact Registry com política de limpeza. A remoção principal é feita pelos workflows; a política
   é rede de segurança.

   ```bash
   gcloud artifacts repositories create admin-preview --repository-format=docker \
     --location="$REGION" --project "$PROJECT_ID" --description="Imagens dos previews do admin"
   cat > cleanup-policy.json <<'EOF'
   [
     {"name": "keep-latest-2", "action": {"type": "Keep"}, "mostRecentVersions": {"keepCount": 2}},
     {"name": "delete-older-than-7d", "action": {"type": "Delete"}, "condition": {"tagState": "any", "olderThan": "7d"}}
   ]
   EOF
   gcloud artifacts repositories set-cleanup-policies admin-preview --location="$REGION" \
     --project "$PROJECT_ID" --policy=cleanup-policy.json --no-dry-run
   ```

7. Service accounts, papel customizado e permissões:

   ```bash
   gcloud iam service-accounts create admin-preview-runtime --project "$PROJECT_ID" \
     --display-name="Admin preview runtime"
   gcloud iam service-accounts create admin-preview-deployer --project "$PROJECT_ID" \
     --display-name="Admin preview deployer (GitHub Actions)"
   RUNTIME_SA=admin-preview-runtime@$PROJECT_ID.iam.gserviceaccount.com
   DEPLOYER_SA=admin-preview-deployer@$PROJECT_ID.iam.gserviceaccount.com

   gcloud iam roles create adminPreviewAuthSession --project "$PROJECT_ID" --stage=GA \
     --title="Admin preview: verify and create sessions" \
     --permissions=firebaseauth.users.get,firebaseauth.users.createSession

   gcloud projects add-iam-policy-binding "$PROJECT_ID" --condition=None \
     --member="serviceAccount:$RUNTIME_SA" --role=roles/datastore.user
   gcloud projects add-iam-policy-binding "$PROJECT_ID" --condition=None \
     --member="serviceAccount:$RUNTIME_SA" --role="projects/$PROJECT_ID/roles/adminPreviewAuthSession"

   gcloud projects add-iam-policy-binding "$PROJECT_ID" --condition=None \
     --member="serviceAccount:$DEPLOYER_SA" --role=roles/run.developer
   gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" --project "$PROJECT_ID" \
     --member="serviceAccount:$DEPLOYER_SA" --role=roles/iam.serviceAccountUser
   gcloud artifacts repositories add-iam-policy-binding admin-preview --location="$REGION" \
     --project "$PROJECT_ID" --member="serviceAccount:$DEPLOYER_SA" --role=roles/artifactregistry.repoAdmin
   ```

8. Workload Identity Federation (a condição está explicada [abaixo](#workload-identity-federation)):

   ```bash
   cat > wif-condition.cel <<'EOF'
   assertion.repository_id == '1178339251' &&
   assertion.repository_owner_id == '239388036' &&
   assertion.runner_environment == 'github-hosted' &&
   (
     (assertion.event_name == 'pull_request' && assertion.base_ref == 'main' &&
      (assertion.workflow_ref.startsWith('antoniohbmonteiro/Ana-Psi-Web/.github/workflows/admin-ci.yml@refs/pull/') ||
       assertion.workflow_ref.startsWith('antoniohbmonteiro/Ana-Psi-Web/.github/workflows/admin-preview-cleanup.yml@')))
     ||
     (assertion.event_name in ['schedule', 'workflow_dispatch'] &&
      assertion.ref == 'refs/heads/main' &&
      assertion.workflow_ref == 'antoniohbmonteiro/Ana-Psi-Web/.github/workflows/admin-preview-cleanup.yml@refs/heads/main')
   )
   EOF
   gcloud iam workload-identity-pools create github-actions --location=global \
     --project "$PROJECT_ID" --display-name="GitHub Actions"
   gcloud iam workload-identity-pools providers create-oidc ana-psi-web --location=global \
     --workload-identity-pool=github-actions --project "$PROJECT_ID" \
     --display-name="Ana-Psi-Web" --issuer-uri="https://token.actions.githubusercontent.com" \
     --attribute-mapping="google.subject=assertion.sub,attribute.repository_id=assertion.repository_id,attribute.repository_owner_id=assertion.repository_owner_id,attribute.event_name=assertion.event_name,attribute.workflow_ref=assertion.workflow_ref,attribute.ref=assertion.ref" \
     --attribute-condition="$(cat wif-condition.cel)"
   gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" --project "$PROJECT_ID" \
     --role=roles/iam.workloadIdentityUser \
     --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/attribute.repository_id/$REPO_ID"
   ```

9. Orçamento de US$ 5/mês com alertas por e-mail. O orçamento **avisa, não bloqueia**.

   ```bash
   gcloud billing budgets create --billing-account=<ID_DA_CONTA_DE_FATURAMENTO> \
     --display-name="ana-psi-dev mensal" --budget-amount=5USD \
     --filter-projects="projects/$PROJECT_ID" \
     --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0
   ```

### C. IAP em projeto pessoal, sem organização

Sem organização no Google Cloud não existe o OAuth client gerenciado pelo Google. Sem um client
próprio, o IAP responde *502 "Empty Google Account OAuth client ID(s)/secret(s)"*. A documentação do
Google indica configurar um OAuth client personalizado pelo Console antes de automatizar; é o que os
passos abaixo fazem, uma única vez.

1. **Google Auth Platform** (console do Google Cloud → *Google Auth Platform*):
   - *Branding*: nome "Ana Psi — Admin Preview" e seu e-mail de suporte.
   - *Audience*: **External**, status **Testing**.
   - *Test users*: sua conta Google e a de quem mais for testar (por exemplo, a da Ana).
   - Não adicione escopos.
2. **OAuth client:**
   - Em *Clients → Create client*, escolha *Web application* com o nome "IAP admin preview".
   - **Copie o Client ID e o Client secret na hora** (ou baixe o JSON). O Google não mostra o secret
     de novo.
   - Edite o client e adicione o *Authorized redirect URI*
     `https://iap.googleapis.com/v1/oauth/clientIds/<CLIENT_ID>:handleRedirect`.
3. **Aplicar o client a todos os serviços Cloud Run da região.** Assim todo `admin-pr-N` novo herda a
   configuração:

   ```bash
   umask 077
   cat > iap-oauth.yaml <<'EOF'
   accessSettings:
     oauthSettings:
       clientId: COLE_O_CLIENT_ID
       clientSecret: COLE_O_CLIENT_SECRET
   EOF
   gcloud iap settings set iap-oauth.yaml --project="$PROJECT_ID" --resource-type=cloud-run --region="$REGION"
   rm -f iap-oauth.yaml   # o secret fica só no Google Cloud; nunca o coloque no GitHub
   ```

4. **Acesso e invocação** (nível de projeto, valem para todos os previews):

   ```bash
   PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
   gcloud beta services identity create --service=iap.googleapis.com --project "$PROJECT_ID"
   gcloud projects add-iam-policy-binding "$PROJECT_ID" --condition=None \
     --member="serviceAccount:service-$PROJECT_NUMBER@gcp-sa-iap.iam.gserviceaccount.com" --role=roles/run.invoker
   gcloud projects add-iam-policy-binding "$PROJECT_ID" --condition=None \
     --member="user:SEU_EMAIL@gmail.com" --role=roles/iap.httpsResourceAccessor
   # Repita a última linha para cada conta Google que vai testar (que também precisa estar em Test users).
   ```

5. **Teste de fumaça antes do primeiro PR.** Este teste valida juntos o IAP, a herança da configuração
   e o papel do deployer:
   1. Faça um deploy impersonando o deployer:

      ```bash
      ME=$(gcloud config get-value account)
      gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" --project "$PROJECT_ID" \
        --member="user:$ME" --role=roles/iam.serviceAccountTokenCreator
      gcloud run deploy iap-check --image=us-docker.pkg.dev/cloudrun/container/hello \
        --region="$REGION" --project "$PROJECT_ID" --service-account="$RUNTIME_SA" \
        --iap --ingress=all --min-instances=0 --max-instances=1 \
        --impersonate-service-account="$DEPLOYER_SA" --quiet
      ```

      Se o deploy for negado, siga a regra da seção [IAM](#iam).
   2. Abra a URL do `iap-check` no computador e no celular (Chrome ou Safari):
      - deve pedir o login Google e, com a conta autorizada, mostrar a página "Hello";
      - com uma conta não autorizada, o acesso deve ser negado;
      - um erro 502 indica que o passo 3 não foi aplicado.
   3. Limpe:

      ```bash
      gcloud run services delete iap-check --region="$REGION" --project "$PROJECT_ID" --quiet
      gcloud iam service-accounts remove-iam-policy-binding "$DEPLOYER_SA" --project "$PROJECT_ID" \
        --member="user:$ME" --role=roles/iam.serviceAccountTokenCreator
      ```

   Alternativa, se algo falhar no passo 3: habilite o IAP uma vez pelo Console do Cloud Run num serviço
   de teste com a mesma imagem `hello`, aceite a configuração de OAuth sugerida e depois apague esse
   serviço.

### D. GitHub

10. *Settings → Secrets and variables → Actions → **Variables***:

    | Variável | Exemplo |
    |---|---|
    | `ADMIN_PREVIEW_PROJECT_ID` | `ana-psi-dev` |
    | `ADMIN_PREVIEW_PROJECT_NUMBER` | `123456789012` |
    | `ADMIN_PREVIEW_REGION` | `us-central1` |
    | `ADMIN_PREVIEW_WIF_PROVIDER` | `projects/123456789012/locations/global/workloadIdentityPools/github-actions/providers/ana-psi-web` |
    | `ADMIN_PREVIEW_DEPLOYER_SA` | `admin-preview-deployer@ana-psi-dev.iam.gserviceaccount.com` |
    | `ADMIN_PREVIEW_RUNTIME_SA` | `admin-preview-runtime@ana-psi-dev.iam.gserviceaccount.com` |
    | `ADMIN_PREVIEW_FIREBASE_API_KEY` | `apiKey` do Web App (público) |
    | `ADMIN_PREVIEW_FIREBASE_AUTH_DOMAIN` | `ana-psi-dev.firebaseapp.com` |
    | `ADMIN_PREVIEW_FIREBASE_APP_ID` | `appId` do Web App (público) |
    | `ADMIN_PREVIEW_ENABLED` | `true`. Defina **por último**, depois de tudo acima |

    *Settings → Secrets and variables → Actions → **Secrets***: `ADMIN_PREVIEW_ALLOWED_UID` com o UID do
    usuário de teste. Não é credencial; fica como secret só para não aparecer nos logs públicos.
11. *Settings → Actions → General*:
    - *Fork pull request workflows*: exigir aprovação para todos os colaboradores externos.
    - *Workflow permissions*: somente leitura (os jobs declaram as próprias permissões).
12. Se a `main` tiver proteção exigindo checks, os nomes existentes continuam iguais (`check`).

### E. Opcionais

- Publicar no projeto de desenvolvimento as `firestore.rules` e as exclusões de índice do repositório:
  `npx firebase deploy --only firestore --project "$PROJECT_ID"` em `apps/admin`.
- Política de TTL em `idempotencyKeys.expiresAt` (Firestore → *TTL*).
- Restringir a API key do projeto de desenvolvimento às APIs do Firebase Authentication.

## Workload Identity Federation

A condição do provider (passo B8) aceita um token do GitHub somente quando:

- o repositório e o dono têm os **IDs numéricos** deste repositório (resistentes a renomear ou
  recriar o repositório com o mesmo nome);
- o runner é hospedado pelo GitHub;
- for um `pull_request` para a `main` executando `admin-ci.yml` (refs de PR) ou
  `admin-preview-cleanup.yml`. No fechamento por merge, o ref pode ser `refs/heads/main`;
- ou for `schedule`/`workflow_dispatch` executando `admin-preview-cleanup.yml` **a partir da
  `main`**.

Assim, workflows da landing, workflows novos adicionados num PR e o Admin CI em `push` na `main`
não obtêm credenciais. A SA deployer só aceita principals com `repository_id` deste repositório.

Teste negativo, depois do merge: dispare *Admin Preview Cleanup* por `workflow_dispatch` a partir de
outra branch. O passo de autenticação deve falhar. Se o repositório for renomeado, atualize os
prefixos de `workflow_ref` na condição.

## Operação

- **Desligar os previews:** remova `ADMIN_PREVIEW_ENABLED` ou defina como `false`. O CI continua e a
  limpeza segue funcionando.
- **Varredura manual:** *Actions → Admin Preview Cleanup → Run workflow* (a partir da `main`).
- **Reset dos dados de teste:** no console do Firebase do projeto de desenvolvimento, exclua as
  coleções `appointments`, `patients`, `appointmentDays` e `idempotencyKeys`. O banco vazio é um
  estado válido.
- **Atualizar a imagem base:** troque a tag e o digest em `ARG NODE_IMAGE` do `apps/admin/Dockerfile`.
  O digest do índice multi-arquitetura aparece em
  `docker buildx imagetools inspect mirror.gcr.io/library/node:<tag>`.
- **Build local da imagem:**
  `docker build -f apps/admin/Dockerfile -t ana-psi-admin:local .` na raiz do repositório. Atrás de
  proxy com inspeção TLS, passe a CA como secret de build: `--secret id=extra_ca,src=<ca.pem>`. O
  secret nunca entra nas camadas da imagem.

**Problemas comuns:**

| Sintoma | Causa provável |
|---|---|
| 502 *Empty Google Account OAuth client ID(s)/secret(s)* | OAuth client não configurado no nível `cloud-run` da região (passo C3) |
| Erro de redirect no login Google | redirect URI do OAuth client diferente de `…/clientIds/<CLIENT_ID>:handleRedirect` (passo C2) |
| 403 do IAP com a conta certa | falta `roles/iap.httpsResourceAccessor` ou a conta não está em *Test users* |
| "Acesso administrativo temporariamente indisponível" no login | SA de runtime sem o papel `adminPreviewAuthSession`, ou Auth com problema |
| "Acesso não autorizado" | UID do usuário diferente de `ADMIN_PREVIEW_ALLOWED_UID` |
| Login falha com 403 abrindo `*.a.run.app` | Origin diferente do `ADMIN_ORIGIN`; use o endereço do comentário |
| Erro de dados inconsistentes | documentos gravados por outro PR com schema diferente; ver reset |
| Falha em *Authenticate to Google Cloud* | condição do WIF, variáveis ou binding `workloadIdentityUser` |

## Custos

Estimativa para 1 a 3 previews por mês, região `us-central1`. As cotas gratuitas são por conta de
faturamento.

| Item | Uso típico | Estimativa |
|---|---|---|
| Cloud Run (por requisição, mínimo 0, máximo 1) | alguns milhares de requisições | US$ 0 (dentro da cota) |
| Artifact Registry | ~0,3–0,7 GB (0,5 GB grátis; US$ 0,10/GB-mês) | US$ 0–0,05 |
| Firestore e Firebase Auth | dentro das cotas gratuitas | US$ 0 |
| IAP | sem custo adicional no Cloud Run | US$ 0 |
| Cloud Logging | bem abaixo da cota | US$ 0 |
| Rede | < 1 GB | US$ 0–0,12 |
| GitHub Actions | repositório público | US$ 0 |

**Total esperado: menos de US$ 1 por mês.**

**Pode gerar cobrança mesmo sem acessos:**
- imagens acima de 0,5 GB;
- armazenamento do Firestore e de logs acima das cotas;
- cotas gratuitas já consumidas por outros projetos da mesma conta de faturamento.

Com mínimo de 0 instâncias não há custo de servidor ocioso. Requisições barradas pelo IAP não chegam
ao contêiner. O budget do passo B9 avisa por e-mail.

## Testes de aceite

**Funcionais (computador e celular):**
- [ ] IAP: conta autorizada entra; conta não autorizada é negada.
- [ ] Login com o usuário de teste leva à Home. O cookie `__Host-ana-admin-session` é HttpOnly e
      Secure. O logout funciona.
- [ ] POST sem `X-CSRF-Token` → 403. Login pelo endereço `*.a.run.app` falha (Origin diferente).
- [ ] Home, Agenda e Detalhe funcionam vazios e com dados.
- [ ] Criar agendamento: persiste após recarregar e após o serviço desligar (voltar 20 minutos depois).
- [ ] Horário sobreposto → mensagem de conflito (409). Clique duplo cria um único agendamento.
- [ ] Nada novo no projeto `ana-psi`; o IAM do `ana-psi` não cita SAs do projeto de desenvolvimento.

**Deploy e limpeza:**
- [ ] Dois commits seguidos: só o último publica; o comentário mostra o SHA mais recente.
- [ ] Commit durante um deploy: o deploy novo fica "Waiting" e publica depois.
- [ ] Re-run de um run antigo: não publica.
- [ ] Fechar o PR durante o `check`: nada é publicado depois.
- [ ] Fechar durante o deploy: a limpeza espera e remove.
- [ ] Merge: serviço e pacote removidos; comentário "Preview removido".
- [ ] Fechar e reabrir: estado final consistente (preview ativo).
- [ ] Cancelar uma limpeza e rodar a varredura manual: órfão removido.
- [ ] `workflow_dispatch` da limpeza a partir de outra branch: autenticação negada.

## Limitações

- O CI testa `next start`; a nuvem roda o `server.js` standalone. As suítes HTTP de integração
  também foram executadas contra a imagem, com emuladores, durante a implementação.
- Cada commit faz dois builds: o do CI e o da imagem, este isolado de credenciais. São alguns minutos
  a mais, em paralelo ao CI.
- O primeiro acesso após ociosidade tem cold start de alguns segundos.
- O status *Testing* da tela de consentimento pode pedir o login Google de novo periodicamente.
- Os dados de teste são compartilhados entre previews (ver
  [Segurança e isolamento](#segurança-e-isolamento)).
- A produção do admin não é configurada aqui.
- Risco pré-existente, fora deste fluxo: a credencial de produção usada pelo preview da landing. Ver
  [security-public-preview-credential.md](security-public-preview-credential.md).
