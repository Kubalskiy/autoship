# Multi-Agent Pipeline

A four-stage pipeline that walks through the full software development lifecycle: design, implement, test, and review.

## What it does

1. **design** — Generates an OpenAPI spec for a bookmark manager API
2. **implement** — Builds the Fastify API from the spec (depends on design)
3. **test** — Writes integration tests for the API (depends on implement)
4. **review** — Reviews all generated code and writes feedback (depends on implement + test)

Steps 3 and 4 both depend on step 2, so `test` and `review` can run in parallel once `implement` completes — but `review` also waits for `test` to finish so it can evaluate test results.

## Usage

```bash
autoship run -f examples/multi-agent-pipeline/autoship.yaml
```

## Expected output

- `docs/api-spec.yaml` — OpenAPI specification
- `src/routes/bookmarks.ts` — Route handlers
- `src/app.ts` — Fastify application setup
- `src/routes/bookmarks.test.ts` — Integration tests
- `docs/review.md` — Code review summary
