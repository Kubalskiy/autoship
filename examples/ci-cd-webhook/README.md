# CI/CD Webhook Pipeline

A pipeline designed to be triggered by a GitHub push webhook. It runs the full CI/CD lifecycle: lint, typecheck, test, build, and deploy.

## What it does

1. **lint** — Runs and auto-fixes lint errors
2. **typecheck** — Verifies TypeScript types compile cleanly
3. **test** — Runs the test suite (depends on lint + typecheck)
4. **build** — Produces a production build (depends on test)
5. **deploy** — Deploys build artifacts (depends on build)

`lint` and `typecheck` run in parallel. The remaining steps are sequential.

## Triggering via webhook

Configure a GitHub webhook to POST to your AutoShip API on push events:

```
POST https://your-autoship-instance.com/api/pipelines/<pipeline-id>/runs
Authorization: Bearer <your-api-key>
Content-Type: application/json
```

## Usage (manual)

```bash
autoship run -f examples/ci-cd-webhook/autoship.yaml
```

## Expected behavior

- Lint and type errors are auto-fixed when possible
- Test failures are investigated and patched
- Build artifacts are produced and verified
- Deployment is executed or instructions are provided
