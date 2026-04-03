import Link from "next/link";
import { WaitlistForm } from "./waitlist-form";

function NavBar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          AutoShip
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="#features"
            className="text-sm text-gray-400 hover:text-white"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm text-gray-400 hover:text-white"
          >
            How It Works
          </Link>
          <Link
            href="#open-source"
            className="text-sm text-gray-400 hover:text-white"
          >
            Open Source
          </Link>
          <a
            href="https://github.com/autoship"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium hover:border-gray-500 hover:bg-gray-800/50"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
      <div className="mb-6 inline-flex items-center rounded-full border border-gray-700 bg-gray-900 px-4 py-1.5 text-sm text-gray-300">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
        Now in Public Beta
      </div>
      <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
        Ship software with AI agents.{" "}
        <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Automatically.
        </span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
        AutoShip orchestrates AI agents to design, build, test, and deploy your
        software — so you define the what, not the how.
      </p>
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <a
          href="#waitlist"
          className="rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-black hover:bg-gray-200"
        >
          Join the Beta Waitlist
        </a>
        <a
          href="https://github.com/autoship"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-gray-700 px-8 py-3.5 text-sm font-semibold hover:border-gray-500 hover:bg-gray-800/50"
        >
          View on GitHub
        </a>
      </div>
      <div className="mt-16 w-full max-w-3xl overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-1">
        <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-500/60" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
          <span className="h-3 w-3 rounded-full bg-green-500/60" />
          <span className="ml-4 text-xs text-gray-500">terminal</span>
        </div>
        <pre className="p-6 text-left text-sm leading-relaxed">
          <code>
            <span className="text-gray-500">$</span>{" "}
            <span className="text-emerald-400">autoship</span> init my-project
            {"\n"}
            <span className="text-gray-500">✓</span> Pipeline config created:{" "}
            <span className="text-blue-400">autoship.yaml</span>
            {"\n\n"}
            <span className="text-gray-500">$</span>{" "}
            <span className="text-emerald-400">autoship</span> run
            {"\n"}
            <span className="text-gray-500">▸</span> Stage 1/4:{" "}
            <span className="text-yellow-400">Design</span> — AI architect
            analyzing requirements...
            {"\n"}
            <span className="text-gray-500">▸</span> Stage 2/4:{" "}
            <span className="text-yellow-400">Implement</span> — AI coder
            generating code...
            {"\n"}
            <span className="text-gray-500">▸</span> Stage 3/4:{" "}
            <span className="text-yellow-400">Test</span> — AI QA running test
            suite...
            {"\n"}
            <span className="text-gray-500">▸</span> Stage 4/4:{" "}
            <span className="text-yellow-400">Deploy</span> — Pushing to
            production...
            {"\n\n"}
            <span className="text-emerald-400">✓ Pipeline complete.</span> 4
            stages, 0 failures.{" "}
            <span className="text-gray-500">
              Deployed to https://my-project.autoship.dev
            </span>
          </code>
        </pre>
      </div>
    </section>
  );
}

function ProblemSection() {
  const problems = [
    {
      title: "Agent Sprawl",
      description:
        "Multiple AI tools with no coordination. Each agent is a silo — no shared context, no pipeline.",
      icon: (
        <svg
          className="h-8 w-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      ),
    },
    {
      title: "No Observability",
      description:
        "AI agents run in the dark. No logs, no progress tracking, no way to know what happened or why.",
      icon: (
        <svg
          className="h-8 w-8 text-yellow-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
          />
        </svg>
      ),
    },
    {
      title: "Manual Glue",
      description:
        "You're still copy-pasting between tools, reviewing every output, and stitching the pipeline together by hand.",
      icon: (
        <svg
          className="h-8 w-8 text-orange-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.193-.14 1.743"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          AI can write code.{" "}
          <span className="text-gray-400">But who&apos;s running the show?</span>
        </h2>
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-left"
            >
              <div className="mb-4">{problem.icon}</div>
              <h3 className="mb-2 text-lg font-semibold">{problem.title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "Define",
      description:
        "YAML/JSON pipeline configs. Declarative, version-controlled, and auditable. Define stages, agents, and dependencies in one file.",
      badge: "autoship.yaml",
      color: "text-blue-400",
    },
    {
      title: "Orchestrate",
      description:
        "A job engine that coordinates AI agents in sequence or parallel. Automatic retries, dependency resolution, and context sharing between stages.",
      badge: "BullMQ-powered",
      color: "text-emerald-400",
    },
    {
      title: "Observe",
      description:
        "Real-time dashboard with live logs, run history, and success metrics. Know exactly what every agent did, when, and why.",
      badge: "Real-time",
      color: "text-purple-400",
    },
  ];

  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          One pipeline. Full automation.{" "}
          <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Total visibility.
          </span>
        </h2>
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-left transition-colors hover:border-gray-700"
            >
              <span
                className={`mb-4 inline-block rounded-md bg-gray-800 px-3 py-1 text-xs font-medium ${feature.color}`}
              >
                {feature.badge}
              </span>
              <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      command: "autoship init",
      title: "Scaffold your pipeline",
      description:
        "Initialize a pipeline config that defines your stages, AI agents, and deployment targets.",
    },
    {
      step: "02",
      command: "autoship run",
      title: "Agents execute",
      description:
        "AI agents run through your pipeline: design, implement, test, and deploy — fully automated.",
    },
    {
      step: "03",
      command: "dashboard",
      title: "Watch and review",
      description:
        "Monitor progress in real-time. Review outputs, logs, and metrics from every stage.",
    },
  ];

  return (
    <section id="how-it-works" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          How It Works
        </h2>
        <div className="mt-16 grid gap-12 sm:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="relative">
              <span className="text-6xl font-bold text-gray-800">
                {item.step}
              </span>
              <div className="mt-4">
                <code className="rounded bg-gray-800 px-2 py-1 text-sm text-emerald-400">
                  {item.command}
                </code>
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OpenSourceSection() {
  return (
    <section
      id="open-source"
      className="px-6 py-24"
    >
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Open-source core.{" "}
          <span className="text-emerald-400">Always.</span>
        </h2>
        <p className="mt-6 text-lg text-gray-400">
          MIT licensed. Self-hostable. Extensible agent SDK. Your agents, your
          data, your infrastructure.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="https://github.com/autoship"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-gray-200"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

function CloudSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 p-12 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Or let us handle the infra.
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          Managed hosting. Team features. Priority support. Focus on building —
          we&apos;ll keep AutoShip running.
        </p>
        <a
          href="#waitlist"
          className="mt-8 inline-block rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 px-8 py-3.5 text-sm font-semibold text-white hover:from-blue-400 hover:to-emerald-400"
        >
          Join the Cloud Beta Waitlist
        </a>
      </div>
    </section>
  );
}

function WaitlistSection() {
  return (
    <section id="waitlist" className="px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Get early access.
        </h2>
        <p className="mt-4 text-gray-400">
          Join the waitlist for AutoShip Cloud beta. We&apos;ll notify you when
          it&apos;s ready.
        </p>
        <WaitlistForm />
        <p className="mt-3 text-xs text-gray-500">
          No spam. We&apos;ll only email you about AutoShip.
        </p>
      </div>
    </section>
  );
}

function BuiltByAIBanner() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-gray-500">
          Built by AI agents, for AI agents
        </p>
        <p className="mt-2 text-gray-400">
          Our entire engineering team is AI-powered. AutoShip is the proof that
          AI agent orchestration works.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-800 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div>
          <p className="text-sm font-bold">AutoShip</p>
          <p className="mt-1 text-xs text-gray-500">
            CI/CD for the AI agent era.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-gray-400">
          <a href="https://github.com/autoship" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            GitHub
          </a>
          <a href="https://twitter.com/autoshipdev" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            Twitter/X
          </a>
          <a href="https://discord.gg/autoship" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            Discord
          </a>
          <a href="/docs" className="hover:text-white">
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <NavBar />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <OpenSourceSection />
      <CloudSection />
      <BuiltByAIBanner />
      <WaitlistSection />
      <Footer />
    </>
  );
}
