# CLI Reference

The `autoship` CLI lets you create and run pipelines from the command line.

## Installation

The CLI is part of the monorepo at `apps/cli`. After `npm install` from the project root, run it with:

```bash
npx autoship <command>
```

## Commands

### `autoship init`

Generate a template pipeline YAML file.

```bash
autoship init [options]
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `-n, --name <name>` | `my-pipeline` | Pipeline name |
| `-f, --file <file>` | `autoship.yaml` | Output file path |

**Example:**

```bash
# Create with defaults
autoship init

# Custom name and file
autoship init --name deploy-pipeline --file pipelines/deploy.yaml
```

**Output file:**

```yaml
name: my-pipeline
description: "Pipeline: my-pipeline"
steps:
  - name: design
    agent: claude
    prompt: "Design the architecture for the feature described in the requirements"
  - name: implement
    agent: claude
    prompt: "Implement the feature based on the architecture design"
    dependsOn:
      - design
  - name: test
    agent: claude
    prompt: "Write and run tests for the implemented feature"
    dependsOn:
      - implement
```

---

### `autoship run`

Execute a pipeline from a YAML file.

```bash
autoship run [options]
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `-f, --file <file>` | `autoship.yaml` | Pipeline config file path |
| `--api-url <url>` | `http://localhost:3001` | AutoShip API server URL |
| `--api-key <key>` | — | API key for authentication |

**Example:**

```bash
# Run with defaults
autoship run

# Custom file and remote API
autoship run --file pipelines/deploy.yaml --api-url https://api.autoship.dev
```

**Behavior:**

1. Reads and validates the YAML file against the pipeline schema
2. Creates the pipeline via `POST /api/pipelines`
3. Triggers a run via `POST /api/pipelines/:id/runs`
4. Polls every 2 seconds for status updates
5. Prints step progress in real-time:

```
Pipeline created: 550e8400-...
Run started: run-uuid
  [pending]   design
  [pending]   implement
  [pending]   test
  [running]   design
  [completed] design
  [running]   implement
  [completed] implement
  [running]   test
  [completed] test
Pipeline completed successfully!
```

6. Exit codes:
   - `0` — All steps completed successfully
   - `1` — One or more steps failed

**Validation errors** are printed immediately if the YAML is invalid (missing fields, circular dependencies, duplicate step names).

## Pipeline YAML Format

See the [Configuration Reference](configuration.md#pipeline-yaml-schema) for the full schema.

Quick example:

```yaml
name: my-pipeline
description: Optional description
steps:
  - name: step-1
    agent: claude
    prompt: "Do the first thing"
  - name: step-2
    agent: claude
    prompt: "Do the second thing"
    dependsOn: [step-1]
```
