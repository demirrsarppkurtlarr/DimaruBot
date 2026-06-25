# DimaruBot (DMB)

**One Bot. Endless Possibilities.**

DimaruBot is a next-generation, AI-powered, modular Discord server management platform with a built-in DimaCoin economy and casino system.

## Documentation

- [Technical Design Document](./docs/DIMARU_TECHNICAL_DESIGN.md)
- [DimaCoin Economy & Casino Design](./docs/DIMARU_ECONOMY_CASINO_DESIGN.md)

## Tech Stack

- **Runtime:** Node.js 20 + TypeScript 5
- **Bot:** discord.js
- **API:** Fastify
- **Dashboard:** Next.js 14 + React + TailwindCSS
- **Database:** PostgreSQL 16
- **ORM:** Prisma
- **Cache / Queues:** Redis 7 + BullMQ
- **Monorepo:** npm workspaces + Turborepo
- **Containers:** Docker + Docker Compose
- **CI/CD:** GitHub Actions

## Project Structure

```
DimaruBot/
├── apps/
│   ├── bot/          # Discord gateway + commands
│   ├── api/          # Fastify REST API
│   └── dashboard/    # Next.js admin panel
├── packages/
│   ├── shared/       # Shared types, enums, schemas
│   ├── prisma/       # Prisma schema + client
│   ├── config/       # Environment validation
│   └── logger/       # Pino logger
├── docs/             # Technical design documents
├── docker-compose.yml
└── turbo.json
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Discord token, database URL, etc.
```

### 3. Start infrastructure

```bash
docker compose up -d postgres redis
```

### 4. Generate Prisma client and run migrations

```bash
npm run db:generate
npm run db:migrate
```

The first migration will be named automatically by Prisma (e.g., `init`). Accept the prompt with a name like `init`.

### 5. Seed the database

```bash
npm run db:seed
```

This creates a test guild and an admin DimaCoin account using the `GOD_MODE_USER_IDS` from `.env`.

### 6. Run in development

```bash
npm run dev
```

This starts all apps in parallel via Turborepo.

### 7. Run the whole stack with Docker

```bash
docker compose up --build
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Build all apps and packages |
| `npm run lint` | Run TypeScript checks across all workspaces |
| `npm run typecheck` | Run type checks only |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:deploy` | Deploy Prisma migrations (production) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run format` | Format code with Prettier |

## Deploy on Render

The repository includes a `render.yaml` blueprint for Render.

1. Push this repo to GitHub.
2. In Render dashboard, click **New + → Blueprint** and select the repo.
3. Render creates:
   - `dimaru-postgres` PostgreSQL database
   - `dimaru-redis` Redis instance
   - `dimaru-api` web service
   - `dimaru-dashboard` web service
   - `dimaru-bot` worker service
4. Fill the environment variables marked `sync: false` in Render dashboard:
   - `DISCORD_TOKEN` (bot token)
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
   - `JWT_ACCESS_SECRET` (random 32+ chars)
   - `JWT_REFRESH_SECRET` (different random 32+ chars)
   - `GOD_MODE_USER_IDS` (Discord user ID)
5. Render will run `npm run db:deploy` during build, then start each service.

> **Important:** Before Render can deploy, Prisma migration files must exist in the repo. Generate them once with a local PostgreSQL instance:
>
> ```bash
> docker compose up -d postgres redis
> npm install
> npm run db:generate
> npm run db:migrate
> # Give the migration a name like "init" when prompted
> git add packages/prisma/prisma/migrations
> git commit -m "add prisma migrations"
> git push
> ```
>
> After migrations are pushed, re-enable `&& npm run db:deploy` in `render.yaml` for the API service.

## Ports

| Service | Port |
|---------|------|
| Dashboard | 3000 |
| API | 3001 |
| Grafana | 3002 |
| Prometheus | 9090 |
| PostgreSQL | 5432 |
| Redis | 6379 |

## License

Private — All rights reserved.
