# Self-Hosting AutoShip

This guide covers deploying AutoShip to your own infrastructure.

## Prerequisites

- Docker Engine 24+ and Docker Compose v2
- At least 2 GB RAM and 10 GB disk
- A domain name (recommended for production)

## Quick Start (Docker Compose)

**1. Clone the repository**

```bash
git clone https://github.com/your-org/autoship.git
cd autoship
```

**2. Create your environment file**

```bash
cp .env.example .env
```

Edit `.env` and set the **required** values:

| Variable | Description |
|---|---|
| `BETTER_AUTH_SECRET` | Session signing secret. Generate with `openssl rand -base64 32` |
| `POSTGRES_PASSWORD` | PostgreSQL password |

See [Environment Variable Reference](#environment-variable-reference) for all options.

**3. Start the stack**

```bash
docker compose -f docker-compose.prod.yml up -d
```

This starts PostgreSQL, Redis, the API server, and the web dashboard.

**4. Run database migrations**

```bash
docker compose -f docker-compose.prod.yml exec api \
  node -e "import('./apps/api/dist/db/migrate.js')"
```

**5. Verify**

- Web UI: http://localhost:3000
- API health: http://localhost:3001/health

## Building Images Separately

If you prefer to build and push images to a registry:

```bash
# API
docker build -f apps/api/Dockerfile -t autoship-api:latest .

# Web
docker build -f apps/web/Dockerfile -t autoship-web:latest .
```

Then update `docker-compose.prod.yml` to use `image:` instead of `build:`.

## Deploying to Railway / Fly.io

### Railway

1. Create a new project on [Railway](https://railway.app)
2. Add a **PostgreSQL** and **Redis** service from the Railway marketplace
3. Add two services from your repo:
   - **API** — set root directory to `/`, Dockerfile path to `apps/api/Dockerfile`
   - **Web** — set root directory to `/`, Dockerfile path to `apps/web/Dockerfile`
4. Set the environment variables listed below on each service
5. Railway auto-detects health checks from the Dockerfiles

### Fly.io

```bash
# API
fly launch --dockerfile apps/api/Dockerfile --name autoship-api
fly secrets set BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
fly secrets set DATABASE_URL="your-postgres-url"
fly secrets set REDIS_URL="your-redis-url"

# Web
fly launch --dockerfile apps/web/Dockerfile --name autoship-web
fly secrets set NEXT_PUBLIC_API_URL="https://autoship-api.fly.dev"
```

## Production Recommendations

- **TLS**: Put a reverse proxy (Caddy, nginx, Traefik) in front with automatic HTTPS
- **Backups**: Schedule regular PostgreSQL backups (`pg_dump`)
- **Monitoring**: The API exposes `/health` for uptime checks
- **Secrets**: Use Docker secrets or a vault for `BETTER_AUTH_SECRET` and `POSTGRES_PASSWORD`
- **Updates**: Pull the latest images and run `docker compose -f docker-compose.prod.yml up -d`

## Environment Variable Reference

### Required

| Variable | Service | Description |
|---|---|---|
| `BETTER_AUTH_SECRET` | API | Secret key for session/token signing |
| `POSTGRES_PASSWORD` | API, PostgreSQL | Database password |

### Optional

| Variable | Default | Service | Description |
|---|---|---|---|
| `POSTGRES_USER` | `autoship` | PostgreSQL | Database user |
| `POSTGRES_DB` | `autoship` | PostgreSQL | Database name |
| `POSTGRES_PORT` | `5432` | PostgreSQL | Host port mapping |
| `REDIS_PASSWORD` | `autoship` | Redis | Redis auth password |
| `REDIS_PORT` | `6379` | Redis | Host port mapping |
| `API_PORT` | `3001` | API | Host port mapping |
| `WEB_PORT` | `3000` | Web | Host port mapping |
| `WEB_URL` | `http://localhost:3000` | API | CORS origin for the web app |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Web | API URL used by the browser |
| `STRIPE_SECRET_KEY` | _(empty)_ | API | Stripe secret key for billing |
| `STRIPE_WEBHOOK_SECRET` | _(empty)_ | API | Stripe webhook signing secret |

## Graceful Shutdown

Both containers handle `SIGTERM` for graceful shutdown:
- The API server drains in-flight requests via Fastify's built-in close handler
- The web server uses Next.js standalone server shutdown

Docker Compose sends `SIGTERM` by default and waits 10 seconds before `SIGKILL`.

## Troubleshooting

**API won't start / connection refused to postgres**
- Ensure PostgreSQL is healthy: `docker compose -f docker-compose.prod.yml ps`
- Check logs: `docker compose -f docker-compose.prod.yml logs api`

**Web shows blank page**
- Verify `NEXT_PUBLIC_API_URL` points to an accessible API URL
- Check browser console for CORS errors — ensure `WEB_URL` matches your web domain

**Database migrations fail**
- Check the API logs for detailed error output
- Ensure `DATABASE_URL` is correct and the database is reachable
