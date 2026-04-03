# Getting Started

This guide walks you through setting up AutoShip from scratch and running your first AI agent pipeline.

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | >= 22 | Runtime for all services |
| Docker | Latest | PostgreSQL and Redis containers |
| GitHub account | — | OAuth authentication |

## Step 1: Install dependencies

```bash
git clone <repo-url> autoship
cd autoship
npm install
```

This installs all workspace packages across `apps/api`, `apps/cli`, `apps/web`, and `packages/shared`.

## Step 2: Start infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on port 5432 (user: `autoship`, password: `autoship`, database: `autoship`)
- **Redis 7** on port 6379

Verify both are running:

```bash
docker compose ps
```

## Step 3: Configure the API

Copy the example environment file:

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` with your credentials:

```bash
# Database (matches docker-compose defaults)
DATABASE_URL=postgres://autoship:autoship@localhost:5432/autoship

# Redis
REDIS_URL=redis://localhost:6379

# GitHub OAuth — create at https://github.com/settings/applications/new
#   Homepage URL: http://localhost:3000
#   Callback URL: http://localhost:3001/api/auth/callback/github
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Auth secret (generate a random string)
BETTER_AUTH_SECRET=your-random-secret-here

# URLs
API_BASE_URL=http://localhost:3001
WEB_URL=http://localhost:3000

# Stripe (optional — billing features disabled without these)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

See the [Configuration Reference](configuration.md) for full details on every variable.

## Step 4: Set up the database

Push the schema to PostgreSQL:

```bash
cd apps/api
npx drizzle-kit push
```

## Step 5: Start development servers

From the project root:

```bash
npm run dev
```

Turborepo starts all services concurrently:

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:3001 | Fastify REST API + job worker |
| Web | http://localhost:3000 | Next.js dashboard + landing page |

## Step 6: Sign in

1. Open http://localhost:3000
2. Click **Sign in with GitHub**
3. Authorize the OAuth app
4. You'll be redirected to the dashboard

## Step 7: Create your first pipeline

### Option A: Using the CLI

```bash
# Generate a template YAML file
npx autoship init --name my-first-pipeline

# This creates autoship.yaml with example steps:
#   design → implement → test
```

Edit `autoship.yaml` to customize your pipeline, then run it:

```bash
npx autoship run --file autoship.yaml --api-url http://localhost:3001
```

The CLI will:
1. Create the pipeline via the API
2. Trigger a run
3. Poll for progress and print step status in real-time
4. Exit with code 0 on success, 1 on failure

### Option B: Using the API directly

```bash
# Create a pipeline
curl -X POST http://localhost:3001/api/pipelines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-pipeline",
    "config": {
      "steps": [
        {"name": "design", "agent": "claude", "prompt": "Design a REST API"},
        {"name": "implement", "agent": "claude", "prompt": "Implement the API", "dependsOn": ["design"]}
      ]
    }
  }'

# Trigger a run (use the pipeline ID from the response)
curl -X POST http://localhost:3001/api/pipelines/<pipeline-id>/runs
```

### Option C: Using the dashboard

1. Navigate to **Dashboard → Pipelines**
2. View your pipelines and trigger runs from the UI
3. Monitor progress in real-time with streaming logs

## Step 8: Monitor your run

### Dashboard

Go to **Dashboard → Pipelines → [your pipeline] → Runs** to see real-time step progress with streaming logs.

### API

```bash
# Get run status with step logs
curl http://localhost:3001/api/pipelines/<pipeline-id>/runs/<run-id>

# Stream real-time updates (SSE)
curl http://localhost:3001/api/pipelines/<pipeline-id>/runs/<run-id>/stream
```

## Next steps

- [API Reference](api-reference.md) — Full endpoint documentation
- [CLI Reference](cli-reference.md) — All CLI commands and options
- [Configuration Reference](configuration.md) — Pipeline YAML schema and environment variables
