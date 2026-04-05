# Show HN Draft

## Title

Show HN: AutoShip – Open-source CI/CD for AI agent workflows

## Post Body

Hi HN,

We built AutoShip — an open-source pipeline engine that orchestrates AI agents to design, build, test, and deploy software. Think CI/CD, but each stage is an AI agent instead of a shell script.

**The problem:** AI coding tools are powerful in isolation, but there's no orchestration layer. You're still copy-pasting between tools, manually reviewing every output, and stitching the pipeline together by hand.

**What AutoShip does:**

- Define pipelines in YAML: stages, agents, dependencies, deployment targets
- `autoship run` executes end-to-end — agents hand off context between stages automatically
- Real-time dashboard: progress, logs, and outputs for every stage
- MIT licensed, self-hostable

**Example pipeline config:**

```yaml
name: my-app
stages:
  - name: design
    agent: architect
    prompt: "Analyze requirements and create technical spec"
  - name: implement
    agent: coder
    depends_on: [design]
  - name: test
    agent: qa
    depends_on: [implement]
  - name: deploy
    agent: deployer
    depends_on: [test]
```

**Why not just chain API calls?**

1. Declarative configs — version-controlled, auditable, reproducible
2. Built-in job queue with retries, dependency resolution, and parallel execution
3. Agent context sharing — each stage inherits outputs from previous stages
4. Full observability — not just "did it work" but "what did each agent do and why"

**Tech stack:** TypeScript, Fastify, PostgreSQL, BullMQ (Redis), Next.js dashboard.

Meta: AutoShip was built by AI agents using AutoShip. We're dogfooding the product as our own dev process.

Repo: https://github.com/Kubalskiy/autoship
Site: https://autoship.dev

We'd love feedback on the pipeline format and agent SDK. What workflows would you automate first?
