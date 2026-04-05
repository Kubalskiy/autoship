# AutoShip Waitlist Email Sequence

Three-email onboarding drip for beta waitlist signups.

---

## Email 1: Welcome (Immediate)

**Subject:** You're in. Welcome to AutoShip.

**Body:**

Hey {{first_name}},

Thanks for joining the AutoShip beta waitlist. You're one of the first to get access to CI/CD built for AI agent workflows.

Here's what AutoShip does in 30 seconds:

- **Define** your pipeline in YAML — stages, agents, dependencies
- **Run** it with `autoship run` — agents execute automatically
- **Watch** everything in a real-time dashboard — logs, progress, results

We're building this because AI can write code, but nobody's orchestrating the full pipeline. AutoShip fixes that.

You'll hear from us again in a few days with a quick-start preview. In the meantime:

- Star us on GitHub: https://github.com/Kubalskiy/autoship
- Join the Discord: https://discord.gg/autoship

— The AutoShip Team

---

## Email 2: Quick Start Preview (Day 3)

**Subject:** How AutoShip works (3-minute read)

**Body:**

Hey {{first_name}},

Here's what your first AutoShip pipeline looks like:

```yaml
# autoship.yaml
name: my-app
stages:
  - name: design
    agent: architect
    prompt: "Analyze requirements and create technical spec"
  - name: implement
    agent: coder
    depends_on: [design]
    prompt: "Implement the technical spec"
  - name: test
    agent: qa
    depends_on: [implement]
    prompt: "Write and run tests for the implementation"
  - name: deploy
    agent: deployer
    depends_on: [test]
    prompt: "Deploy to staging environment"
```

Three commands to go from zero to running:

```bash
autoship init my-project
autoship run
autoship dashboard
```

That's it. Four AI agents, fully coordinated, with real-time observability.

**Open-source core.** MIT licensed. Self-host it or use AutoShip Cloud when it launches.

We'll send you one more email with an invite to our community. No spam after that — promise.

— The AutoShip Team

---

## Email 3: Community Invite (Day 7)

**Subject:** Join 500+ devs building with AI agents

**Body:**

Hey {{first_name}},

Last email in this series.

We're building a community of developers who are pushing the boundaries of AI-powered software development. Here's what's happening:

**Discord** — Technical discussions, pipeline showcases, early feature requests. This is where power users shape the product.

Join here: https://discord.gg/autoship

**Twitter/X** — Daily updates on AutoShip development, AI agent orchestration patterns, and behind-the-scenes of building a product with an all-AI engineering team.

Follow: https://twitter.com/autoshipdev

**GitHub** — Contribute, file issues, or just star the repo. Open-source means you can see exactly how the orchestration engine works.

Repo: https://github.com/Kubalskiy/autoship

When beta launches, waitlist members get first access. We'll email you a direct invite link.

Thanks for being early.

— The AutoShip Team
