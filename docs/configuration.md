# Configuration Reference

## Pipeline YAML Schema

Pipelines are defined in YAML files. The CLI reads these files and submits them to the API.

### Full Schema

```yaml
# Required. Pipeline name.
name: my-pipeline

# Optional. Human-readable description.
description: Build and deploy a feature

# Required. At least one step.
steps:
  - name: design           # Required. Unique step identifier.
    agent: claude           # Required. Agent to execute the step.
    prompt: "Design..."     # Required. Instruction for the agent.
    dependsOn:              # Optional. Steps that must complete first.
      - other-step-name
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Pipeline name |
| `description` | string | No | Pipeline description |
| `steps` | array | Yes | List of pipeline steps (minimum 1) |
| `steps[].name` | string | Yes | Unique step identifier (non-empty) |
| `steps[].agent` | string | Yes | Agent identifier (e.g., `claude`, `gpt-4`) |
| `steps[].prompt` | string | Yes | Instruction text for the agent |
| `steps[].dependsOn` | string[] | No | Names of steps that must complete first |

### Validation Rules

1. **Unique names** — Each step must have a unique `name`
2. **Valid references** — All `dependsOn` entries must reference existing step names
3. **No circular dependencies** — The dependency graph must be a DAG (directed acyclic graph)

### Execution Order

Steps are resolved into execution batches using topological sort:

- Steps with no dependencies run first (in parallel)
- Steps with satisfied dependencies run in the next batch (in parallel)
- Steps wait until all their dependencies complete

Example:

```yaml
steps:
  - name: a
    agent: claude
    prompt: "Step A"
  - name: b
    agent: claude
    prompt: "Step B"
  - name: c
    agent: claude
    prompt: "Step C"
    dependsOn: [a, b]
  - name: d
    agent: claude
    prompt: "Step D"
    dependsOn: [c]
```

Execution order:
1. **Batch 1:** `a` and `b` (run in parallel)
2. **Batch 2:** `c` (waits for both `a` and `b`)
3. **Batch 3:** `d` (waits for `c`)

## Environment Variables

Configure the API server via environment variables in `apps/api/.env`.

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |

Example: `postgres://autoship:autoship@localhost:5432/autoship`

### Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | Yes | — | Redis connection string for BullMQ |

Example: `redis://localhost:6379`

### Authentication

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_CLIENT_ID` | Yes | — | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Yes | — | GitHub OAuth app client secret |
| `BETTER_AUTH_SECRET` | Yes | — | Secret for signing auth tokens |

To create a GitHub OAuth app:
1. Go to https://github.com/settings/applications/new
2. Set **Homepage URL** to `http://localhost:3000`
3. Set **Authorization callback URL** to `http://localhost:3001/api/auth/callback/github`
4. Copy the client ID and secret

### URLs

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_BASE_URL` | No | `http://localhost:3001` | Public URL of the API server |
| `WEB_URL` | No | `http://localhost:3000` | Public URL of the web dashboard |

### Stripe Billing

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | No | — | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | No | — | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | No | — | Stripe price ID for the Pro plan |
| `STRIPE_ENTERPRISE_PRICE_ID` | No | — | Stripe price ID for the Enterprise plan |

Stripe variables are optional. Without them, billing features are disabled and all users default to the free tier.

To set up Stripe webhooks:
1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward events locally: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
3. Copy the webhook signing secret

## Docker Compose

The included `docker-compose.yml` provides local development infrastructure:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: autoship
      POSTGRES_PASSWORD: autoship
      POSTGRES_DB: autoship
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

### Default Credentials

| Service | Host | Port | User | Password | Database |
|---------|------|------|------|----------|----------|
| PostgreSQL | localhost | 5432 | autoship | autoship | autoship |
| Redis | localhost | 6379 | — | — | — |

## Turborepo Scripts

Run from the project root:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all apps in development mode (watch + HMR) |
| `npm run build` | Build all packages and apps |
| `npm run lint` | Lint all packages |
| `npm run test` | Run all tests |

## Database Schema

AutoShip uses Drizzle ORM with PostgreSQL. The schema is defined in `apps/api/src/db/schema.ts`.

### Core Tables

**pipelines** — Pipeline definitions

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Pipeline name |
| `description` | text | Optional description |
| `owner_id` | text | User ID of the owner |
| `config` | jsonb | Pipeline configuration (steps) |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update time |

**pipeline_runs** — Execution records

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `pipeline_id` | uuid | FK to pipelines |
| `status` | enum | `pending`, `running`, `completed`, `failed` |
| `started_at` | timestamp | When execution started |
| `completed_at` | timestamp | When execution finished |
| `created_at` | timestamp | Creation time |

**step_logs** — Per-step execution logs

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `run_id` | uuid | FK to pipeline_runs |
| `step_name` | text | Step identifier |
| `status` | enum | `pending`, `running`, `completed`, `failed`, `skipped` |
| `output` | text | Agent output |
| `error` | text | Error message if failed |
| `started_at` | timestamp | Step start time |
| `completed_at` | timestamp | Step completion time |

### Billing Tables

**subscriptions** — User subscription state

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | text | User ID |
| `stripe_customer_id` | text | Stripe customer ID |
| `tier` | enum | `free`, `pro`, `enterprise` |
| `status` | enum | `active`, `past_due`, `canceled`, `trialing`, `incomplete` |
| `current_period_start` | timestamp | Billing period start |
| `current_period_end` | timestamp | Billing period end |

**usage_records** — Usage metering per run

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | text | User ID |
| `pipeline_run_id` | uuid | FK to pipeline_runs |
| `agent_minutes` | integer | Minutes consumed |
| `recorded_at` | timestamp | When usage was recorded |

**invoices** — Stripe invoice records

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | text | User ID |
| `stripe_invoice_id` | text | Stripe invoice ID |
| `amount_cents` | integer | Invoice amount in cents |
| `status` | text | Invoice status |
| `paid_at` | timestamp | Payment time |

## Plan Limits

| | Free | Pro | Enterprise |
|---|---|---|---|
| Pipeline runs/month | 100 | 5,000 | Unlimited |
| Agent minutes/month | 30 | 500 | Unlimited |
| GitHub repos | 1 | 10 | Unlimited |
| Team members | 1 | 5 | Unlimited |
| Price | $0 | $49/mo | $499/mo |
