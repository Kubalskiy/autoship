# Basic Pipeline

A minimal single-agent pipeline that generates a utility function and its tests.

## What it does

1. **generate** — Creates a `slugify` TypeScript utility function
2. **test** — Writes Vitest tests for the generated function

The `test` step depends on `generate`, so they run sequentially.

## Usage

```bash
autoship run -f examples/basic-pipeline/autoship.yaml
```

## Expected output

- `src/slugify.ts` — The utility function
- `src/slugify.test.ts` — Test suite covering edge cases
