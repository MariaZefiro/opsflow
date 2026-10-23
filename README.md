# OpsFlow

Sistema web de operações e suporte para acompanhar tickets, disponibilidade de serviços e incidentes. Este repositório contém uma API NestJS, uma interface React e uma stack local executada com Docker Compose.

> **Estado do projeto:** em desenvolvimento. O login de demonstração é compartilhado e destinado somente a execuções locais. 

## Índice

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Executar com Docker](#executar-com-docker-recomendado)
- [Executar em desenvolvimento](#executar-em-desenvolvimento)
- [Credenciais demo](#credenciais-demo)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Arquitetura e domínios](#arquitetura-e-domínios)
- [API HTTP](#api-http)
- [Autenticação e tenants](#autenticação-e-tenants)
- [Banco de dados](#banco-de-dados)
- [Scripts disponíveis](#scripts-disponíveis)
- [Testes e validação](#testes-e-validação)

## Funcionalidades

- Dashboard com totais de tickets, incidentes abertos, serviços ativos, notificações não lidas e disponibilidade calculada a partir dos checks das últimas 24 horas.
- Tickets com prioridade, status, responsável, SLA, comentários, histórico de alterações, filtro por status e paginação.
- Cadastro de serviços monitorados e histórico de checks de disponibilidade.
- Criação manual e automática de incidentes associados a serviços.
- Alertas internos criados quando o monitoramento abre um incidente.
- Endpoints para consultar notificações e cadastrar/receber webhooks assinados.
- Autenticação com hash Argon2, access token JWT e refresh token rotativo em cookie httpOnly.
- Isolamento lógico por empresa (`companyId`) no backend e remoção lógica em tickets e serviços.
- Interface em português para login, dashboard, tickets, serviços e incidentes.

## Tecnologias

| Área | Tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| API | NestJS 11, TypeScript, class-validator |
| Persistência | PostgreSQL 16, Prisma 6 |
| Autenticação | JWT, Argon2, cookies httpOnly |
| Containers | Docker Compose, Node.js 22, Nginx não-root |

Redis e BullMQ não são requisitos do runtime atual e não fazem parte da composição.

## Executar com Docker (recomendado)

Requisitos: Docker Engine e Docker Compose v2. Node.js e PostgreSQL não precisam estar instalados no host.

```bash
cp .env.example .env
docker compose up --build
```

Na primeira execução, o Compose:

1. inicia PostgreSQL e aguarda o healthcheck;
2. aplica as migrations versionadas com `prisma migrate deploy`;
3. executa o seed idempotente para criar/atualizar a conta demo e as políticas SLA;
4. inicia a API e, após seu healthcheck, o site estático servido por Nginx.

Acesse:

| Serviço | Endereço |
| --- | --- |
| Aplicação web | http://localhost:8080 |
| API | http://localhost:3000 |
| PostgreSQL | `localhost:5432` |

Os serviços são vinculados a `127.0.0.1` por padrão, portanto ficam acessíveis apenas pela máquina local.

Comandos úteis:

```bash
docker compose ps                         # serviços e healthchecks
docker compose logs -f                    # acompanhar os logs
docker compose logs -f api                # logs apenas da API
docker compose down                       # parar containers, preservar banco
docker compose down -v                    # apagar containers e volume do banco
docker compose exec api npm run prisma:seed  # recriar/atualizar a conta demo
```

O seed redefine a senha demo para o valor atual de `DEMO_USER_PASSWORD` sempre que for executado. `docker compose down -v` apaga os dados locais permanentemente.

## Executar em desenvolvimento

Requisitos: Node.js 22, npm e Docker Compose. Esse modo usa Docker apenas para PostgreSQL; API e frontend executam no host com hot reload.

```bash
cp .env.example .env
docker compose up -d postgres
npm ci
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Em outro terminal, inicie a interface:

```bash
npm run dev:web
```

Endereços no modo desenvolvimento:

- Vite: http://localhost:5173
- API: http://localhost:3000
- PostgreSQL: `localhost:5432`

A migration inicial já está incluída em `apps/api/prisma/migrations`. Para criar futuras migrations durante o desenvolvimento, use `npm run db:migrate -- --name descricao-da-mudanca`.

## Credenciais demo

A tela vem preenchida com a conta criada pelo seed:

| Campo | Valor local |
| --- | --- |
| Empresa | `opsflow-demo` |
| Email | `demo@opsflow.local` |
| Senha | `OpsFlowDemo2026!` |

A senha é armazenada como hash Argon2; não existe senha em texto puro no banco. Para personalizar a conta antes da primeira execução, altere `DEMO_USER_EMAIL` e `DEMO_USER_PASSWORD` no `.env` e recrie o usuário com o seed. Como o seed usa `upsert`, trocar o email cria outro usuário demo e não remove automaticamente o anterior.

## Variáveis de ambiente

As variáveis podem ser definidas no `.env`, criado a partir de `.env.example`.

| Variável | Padrão local | Uso |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL local na porta 5432 | Conexão Prisma para executar API/comandos no host. Dentro do Compose, a URL interna usa o host `postgres`. |
| `POSTGRES_DB` | `opsflow` | Nome do banco criado pelo container PostgreSQL. |
| `POSTGRES_USER` | `opsflow` | Usuário do banco local. |
| `POSTGRES_PASSWORD` | `opsflow` | Senha local do banco; altere antes de qualquer exposição externa. |
| `JWT_ACCESS_SECRET` | segredo de desenvolvimento | Segredo usado para assinar e validar access tokens. Substitua por valor aleatório forte fora do ambiente local. |
| `DEMO_USER_EMAIL` | `demo@opsflow.local` | Email gerado pelo seed. |
| `DEMO_USER_PASSWORD` | `OpsFlowDemo2026!` | Senha Argon2 gerada pelo seed. |
| `WEB_ORIGIN` | origens Vite e Docker locais | Lista separada por vírgulas de origens aceitas pelo CORS. |
| `API_PORT` | `3000` | Porta do host publicada para a API no Compose. |
| `WEB_PORT` | `8080` | Porta do host publicada para o frontend no Compose. |
| `PORT` | `3000` | Porta interna da API. |
| `VITE_API_URL` | `http://localhost:3000` | URL da API embutida no build do frontend. No Compose é definida como argumento de build. |
| `NODE_ENV` | depende da execução | Controla opções de runtime, incluindo cookie `secure` da API. |

`JWT_REFRESH_SECRET` e `REDIS_URL` não são usados pelo código atual e, portanto, não são necessários para executar o projeto.

## Estrutura do repositório

```text
.
├── docker-compose.yml
├── package.json                 # scripts raiz e workspaces npm
├── .env.example
├── apps/
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # modelos e enums
│   │   │   ├── migrations/      # histórico versionado de banco
│   │   │   └── seed.ts          # empresa demo, usuário e SLAs
│   │   └── src/
│   │       ├── main.ts          # bootstrap HTTP, validação e CORS
│   │       ├── app.module.ts    # composição dos módulos
│   │       ├── common/          # guards, DTOs, Prisma e activity log
│   │       └── features/        # domínios da API
│   └── web/
│       ├── Dockerfile           # build Vite e runtime Nginx
│       ├── nginx.conf           # fallback para rotas da SPA
│       └── src/
│           ├── App.tsx          # sessão, navegação e carga do dashboard
│           ├── features/        # telas por domínio
│           └── shared/          # cliente HTTP e tipos compartilhados
└── README.md
```

## Arquitetura e domínios

### API

A aplicação NestJS registra módulos por domínio. `CoreModule` fornece globalmente o Prisma, os guards JWT/tenant e o serviço de activity log. A validação global usa `ValidationPipe` com `whitelist` e `forbidNonWhitelisted`, rejeitando campos extras nos DTOs. Um throttler global limita chamadas a 60 requisições por minuto.

| Domínio | Responsabilidade |
| --- | --- |
| `auth` | Registro, login, renovação e recuperação de senha. |
| `tickets` | Fila, paginação, filtros, comentários, alterações e histórico. |
| `services` | Cadastro e consulta de serviços, remoção lógica e monitoramento periódico. |
| `incidents` | Lista, criação, alteração de estado e duração. |
| `dashboard` | Agregações para a tela inicial. |
| `alerts` | Consulta de alertas do tenant. |
| `notifications` | Consulta e marcação de notificações do usuário. |
| `webhooks` | Cadastro e listagem de webhooks, mais verificação de assinatura recebida. |

### Frontend

A aplicação React tem telas para login/cadastro, visão geral, tickets, serviços e incidentes. `App.tsx` mantém o access token em memória, carrega as quatro áreas usadas no dashboard e atualiza os dados após operações de criação. Tickets e serviços têm formulários de criação; incidentes são listados na UI. Alertas, notificações e webhooks têm rotas na API, mas ainda não possuem telas próprias no frontend.

### Monitoramento

A API inicia uma verificação imediata dos serviços ativos e repete as verificações a cada 60 segundos. Para cada serviço, faz uma requisição HTTP com timeout e compara o status retornado ao status esperado. Uma falha grava um `ServiceCheck`; se não houver incidente aberto para aquele serviço, cria incidente de severidade `HIGH` e alerta interno `IN_APP`.

Embora o modelo armazene `type` e `checkInterval`, a implementação atual usa `fetch` HTTP e agenda todos os serviços a cada minuto. Ela ainda não implementa sondas TCP/ICMP nem respeita intervalo individual por serviço.

## API HTTP

Base local: `http://localhost:3000`. A API retorna JSON. Para rotas protegidas, envie `Authorization: Bearer <accessToken>`. O refresh token é entregue apenas no cookie httpOnly `opsflow_refresh`, com caminho `/auth`.

### Autenticação — pública

| Método e caminho | Entrada principal | Comportamento |
| --- | --- | --- |
| `POST /auth/register` | `companyName`, `name`, `email`, `password` | Cria empresa e administrador; senha mínima de 12 caracteres. |
| `POST /auth/login` | `companySlug`, `email`, `password` | Valida credenciais e retorna `accessToken` e dados do usuário; define cookie de refresh. |
| `POST /auth/refresh` | Cookie `opsflow_refresh` | Revoga o refresh atual e emite novo par de tokens. |
| `POST /auth/forgot-password` | `companySlug`, `email` | Inicia recuperação; em desenvolvimento retorna token para teste, sem envio de email. |
| `POST /auth/reset-password` | `token`, `password` | Troca a senha, marca token como usado e revoga refresh tokens ativos. |

### Dashboard — requer autenticação

| Método e caminho | Comportamento |
| --- | --- |
| `GET /dashboard/summary` | Totais por status de tickets, incidentes não resolvidos, serviços ativos, notificações não lidas e uptime de 24h. |

### Tickets — requer autenticação

| Método e caminho | Entrada/parâmetros | Comportamento |
| --- | --- | --- |
| `GET /tickets` | Query opcional: `page`, `limit`, `status` | Lista paginada; `limit` máximo de 100; resposta `{ items, total, page, limit }`. |
| `GET /tickets/:id` | ID do ticket | Retorna ticket com solicitante, responsável, comentários e histórico. |
| `POST /tickets` | `title`, `description`, `category`, `priority?`, `assigneeId?` | Cria ticket para o usuário atual e calcula `slaDueAt` pela política da empresa (fallback de 24h). |
| `PATCH /tickets/:id` | `title?`, `description?`, `priority?`, `status?`, `assigneeId?` | Atualiza campos e grava as alterações no histórico. |
| `DELETE /tickets/:id` | ID do ticket | Soft delete; o registro não é removido fisicamente. |
| `POST /tickets/:id/comments` | `content` | Adiciona comentário do usuário autenticado. |

Prioridades: `LOW`, `MEDIUM`, `HIGH`, `URGENT`. Status: `OPEN`, `IN_PROGRESS`, `PENDING`, `RESOLVED`, `CLOSED`.

### Serviços — requer autenticação

| Método e caminho | Entrada/parâmetros | Comportamento |
| --- | --- | --- |
| `GET /services` | — | Lista serviços não removidos, último check e contagens. |
| `GET /services/:id` | ID do serviço | Retorna o serviço, até 100 checks recentes e até 20 incidentes. |
| `POST /services` | `name`, `url`, `type`, `checkInterval?`, `timeout?`, `expectedStatus?` | Cadastra serviço para o tenant autenticado. |
| `PATCH /services/:id` | Campos do serviço opcionais | Atualiza configuração do serviço. |
| `DELETE /services/:id` | ID do serviço | Soft delete. |

Tipos declarados: `HTTP`, `HTTPS`, `TCP`, `ICMP`. Parâmetros: intervalo mínimo 5 segundos, timeout entre 1 e 120 segundos, status esperado de 100 a 599.

### Incidentes — requer autenticação

| Método e caminho | Entrada/parâmetros | Comportamento |
| --- | --- | --- |
| `GET /incidents` | — | Lista incidentes, serviço e check mais recente, responsável e criador. |
| `POST /incidents` | `title`, `description`, `severity`, `serviceId?`, `assigneeId?` | Cria incidente manual. |
| `PATCH /incidents/:id` | `status?`, `description?`, `assigneeId?` | Atualiza incidente; ao resolver, define `endedAt` e duração em segundos. |

Severidades: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. Status: `INVESTIGATING`, `IDENTIFIED`, `MONITORING`, `RESOLVED`.

### Alertas e notificações — requer autenticação

| Método e caminho | Comportamento |
| --- | --- |
| `GET /alerts` | Lista os 100 alertas mais recentes da empresa. |
| `GET /notifications` | Lista até 50 notificações do usuário atual. |
| `PATCH /notifications/:id/read` | Marca como lida uma notificação do usuário atual. |

O monitor cria alertas internos ao abrir incidentes. Não há atualmente integração de envio de email nem criação automática de notificações.

### Webhooks

| Método e caminho | Acesso | Comportamento |
| --- | --- | --- |
| `GET /webhooks` | Autenticado | Lista webhooks do tenant sem expor o segredo. |
| `POST /webhooks` | Autenticado | Recebe `url` e lista `events`, gera segredo e retorna o segredo uma única vez na resposta. |
| `POST /webhooks/receive/:id` | Assinatura HMAC | Valida o header `X-OpsFlow-Signature` contra o corpo bruto da requisição usando HMAC-SHA256. |

O endpoint `receive` valida a assinatura, mas não implementa processamento ou despacho de eventos. Não configure URLs externas sem adicionar controles adequados, como validação de destino e proteção contra SSRF.

O serviço de monitoramento também faz requisições para a URL cadastrada. Em uma implantação pública, restrinja destinos e saída de rede para evitar acesso a endereços internos ou metadados de infraestrutura.

## Autenticação e tenants

- O login e o registro devolvem access token JWT com validade de 15 minutos.
- O refresh token aleatório é armazenado no banco somente como SHA-256 e entregue ao navegador em cookie httpOnly; a rotação revoga o token anterior. Validade: sete dias.
- Senhas são armazenadas com Argon2.
- `AuthGuard` valida bearer token; `TenantGuard` exige `companyId` na identidade autenticada. As rotas operacionais filtram os registros pelo tenant atual.
- O cliente deve enviar access token no header `Authorization`. A interface demonstra login e logout, mas não persiste a sessão nem renova automaticamente o access token após recarregar a página.
- Os endpoints de cadastro e recuperação são públicos e protegidos pelo throttler global; a política de criação de contas ainda não é configurável.

## Banco de dados

O schema Prisma fica em `apps/api/prisma/schema.prisma`. Entidades principais:

- **Company/User:** tenant, plano, usuário, role, estado ativo e soft delete do usuário/empresa.
- **Ticket/TicketComment/TicketHistory:** fila, comentários e auditoria de mudanças.
- **SLAPolicy:** prazo de resolução em horas por prioridade e empresa.
- **Service/ServiceCheck:** configuração do monitoramento e resultados de disponibilidade.
- **Incident:** severidade, status, serviço associado, responsável, origem e duração.
- **Alert/Notification/Webhook:** registros de alertas internos, notificações por usuário e configurações de webhook.
- **ActivityLog:** registro de ações por empresa e usuário.
- **RefreshToken/PasswordResetToken:** tokens com hash, expiração e revogação/uso.

As migrations aplicáveis ficam em `apps/api/prisma/migrations`. O seed cria a empresa `opsflow-demo`, o usuário demo e SLAs padrão: urgência 4h, alta 8h, média 24h e baixa 72h.

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm ci` | Instala exatamente as dependências do lockfile. |
| `npm run build` | Compila API e frontend para produção. |
| `npm run dev` | Inicia a API com reinício automático. Requer `.env` e banco acessível. |
| `npm run dev:web` | Inicia o servidor de desenvolvimento Vite. |
| `npm run start` | Inicia a API compilada. |
| `npm run db:generate` | Gera o client Prisma. |
| `npm run db:migrate -- --name nome` | Executa/cria migration em desenvolvimento. |
| `npm run db:migrate:deploy` | Aplica migrations já versionadas. |
| `npm run db:seed` | Cria/atualiza a empresa demo, usuário e políticas SLA. |
| `npm run db:studio` | Abre Prisma Studio para inspecionar o banco. |

## Testes e validação

O projeto ainda não possui suíte de testes automatizados configurada. Antes de enviar mudanças, valide ao menos:

```bash
npm ci
npm run build
docker compose config --quiet
docker compose up --build
```

Após o Compose ficar saudável, teste o login pela interface com as credenciais demo. Para integração e regressão, adicione testes unitários da API, testes de integração com PostgreSQL e testes de interface.
