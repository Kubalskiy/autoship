# AutoShip

**CI/CD for AI agent workflows.** Define, orchestrate, and monitor multi-agent software pipelines from a single CLI or web dashboard.

AutoShip lets you declare pipelines in YAML that coordinate AI agents through design, implementation, testing, and deployment stages — with real-time streaming, usage metering, and built-in billing.

## Features

- **Declarative pipelines** — Define multi-step agent workflows in YAML
- **Job queue orchestration** — BullMQ-powered execution with retries and dependency resolution
- **Real-time streaming** — SSE-based live logs and step progress
- **Web dashboard** — Pipeline management, run history, analytics, and billing
- **CLI tool** — `autoship init` and `autoship run` for local/CI usage
- **Usage metering** — Track pipeline runs and agent minutes per tier
- **Stripe billing** — Free, Pro ($49/mo), and Enterprise tiers with automatic enforcement
- **Self-hostable** — Run the entire stack with Docker Compose

## Architecture

```
┌─────────┐    ┌───────────┐    ┌──────────────┐
│   CLI   │───▶│    API    │───▶│  PostgreSQL   │
└─────────┘    │ (Fastify) │    └──────────────┘
               │           │
┌─────────┐    │           │    ┌──────────────┐
│   Web   │───▶│           │───▶│ Redis/BullMQ │
│ (Next)  │    └───────────┘    └──────┬───────┘
└─────────┘                           │
                              ┌───────▼───────┐
                              │ Agent Workers  │
                              └───────────────┘
```

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 16
- Redis 7

### 1. Clone and install

```bash
git clone https://github.com/your-org/autoship.git
cd autoship
npm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL and Redis locally.

### 3. Configure environment

```bash
# apps/api/.env
DATABASE_URL=postgres://autoship:autoship@localhost:5432/autoship
REDIS_URL=redis://localhost:6379
BETTER_AUTH_SECRET=your-secret-here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Run in development

```bash
npm run dev
```

- **API server**: http://localhost:3001
- **Web dashboard**: http://localhost:3000

### 5. Create and run a pipeline

```bash
# Generate a template pipeline
npx autoship init --name my-pipeline

# Execute it
npx autoship run --file autoship.yaml
```

## Project Structure

```
autoship/
├── apps/
│   ├── api/              # Fastify API server (port 3001)
│   │   └── src/
│   │       ├── routes/   # REST endpoints
│   │       ├── services/ # Business logic
│   │       ├── db/       # Drizzle ORM schema + migrations
│   │       └── queue/    # BullMQ job definitions
│   ├── web/              # Next.js dashboard (port 3000)
│   │   └── src/
│   │       ├── app/      # App router pages
│   │       └── components/
│   └── cli/              # CLI tool (autoship)
│       └── src/
├── packages/
│   └── shared/           # Shared types, Zod schemas, constants
├── docker-compose.yml
└── turbo.json
```

## API Endpoints

### Pipelines
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/pipelines` | Create a pipeline |
| `GET` | `/api/pipelines` | List pipelines |
| `GET` | `/api/pipelines/:id` | Get pipeline details |
| `PATCH` | `/api/pipelines/:id` | Update pipeline |
| `DELETE` | `/api/pipelines/:id` | Delete pipeline |

### Runs
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/pipelines/:id/runs` | Trigger a run |
| `GET` | `/api/pipelines/:id/runs` | List runs |
| `GET` | `/api/pipelines/:id/runs/:runId` | Get run with step logs |
| `GET` | `/api/pipelines/:id/runs/:runId/stream` | SSE live stream |
| `GET` | `/api/pipelines/:id/runs/:runId/logs` | Aggregated logs |

### Analytics & Billing
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics` | Dashboard metrics |
| `GET` | `/api/billing` | Billing dashboard |
| `POST` | `/api/billing/checkout` | Stripe checkout |
| `POST` | `/api/billing/portal` | Stripe portal |
| `GET` | `/api/billing/usage` | Usage vs limits |

## Pipeline Definition

Pipelines are defined in YAML:

```yaml
name: my-app-builder
version: "1.0"
steps:
  - name: design
    agent: architect
    prompt: "Design the system architecture for a REST API"
    timeout: 300
  - name: implement
    agent: coder
    prompt: "Implement the architecture from the design step"
    dependsOn:
      - design
    timeout: 600
  - name: test
    agent: tester
    prompt: "Write and run tests for the implementation"
    dependsOn:
      - implement
    timeout: 300
```

## Pricing

| Tier | Price | Runs/mo | Agent Minutes | Repos | Team |
|------|-------|---------|---------------|-------|------|
| Free | $0 | 100 | 30 | 1 | 1 |
| Pro | $49/mo | 5,000 | 500 | 10 | 5 |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited | Unlimited |

## Tech Stack

- **Runtime**: Node.js 22, TypeScript
- **API**: Fastify 5
- **Frontend**: Next.js 15, Tailwind CSS 4
- **Database**: PostgreSQL 16, Drizzle ORM
- **Queue**: BullMQ, Redis 7
- **Auth**: Better Auth
- **Billing**: Stripe
- **Validation**: Zod
- **Build**: Turborepo

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Step-by-step setup for new users |
| [API Reference](docs/api-reference.md) | All REST endpoints with request/response examples |
| [CLI Reference](docs/cli-reference.md) | All CLI commands with usage examples |
| [Configuration](docs/configuration.md) | Pipeline YAML schema, env vars, database schema |

## Development

```bash
npm run dev      # Start all apps in dev mode
npm run build    # Build all apps
npm run lint     # Lint all apps
npm run test     # Run all tests
```

## License

Open source. See [LICENSE](LICENSE) for details.
