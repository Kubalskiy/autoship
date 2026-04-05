"use client";

const integrations = [
  {
    name: "GitHub",
    description: "Connect your GitHub account to link repos and enable CI/CD pipelines.",
    icon: GitHubIcon,
    authUrl: "https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&scope=repo,read:org",
    connected: false,
    category: "development",
  },
  {
    name: "Twitter / X",
    description: "Connect your Twitter/X account to post launch updates and engage with the dev community.",
    icon: TwitterIcon,
    authUrl: "https://twitter.com/i/oauth2/authorize?response_type=code&client_id=YOUR_CLIENT_ID&scope=tweet.read+tweet.write+users.read",
    connected: false,
    category: "social",
  },
  {
    name: "Discord",
    description: "Connect your Discord server for community notifications and bot integration.",
    icon: DiscordIcon,
    authUrl: "https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2048&scope=bot+applications.commands",
    connected: false,
    category: "social",
  },
  {
    name: "Instagram",
    description: "Connect Instagram for visual content and product updates.",
    icon: InstagramIcon,
    authUrl: "https://api.instagram.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT&scope=user_profile,user_media&response_type=code",
    connected: false,
    category: "social",
  },
];

const domainProviders = [
  {
    name: "GoDaddy",
    description: "Manage your domain through GoDaddy. Register or transfer autoship.dev.",
    icon: GlobeIcon,
    url: "https://www.godaddy.com/domainsearch/find?domainToCheck=autoship.dev",
  },
  {
    name: "Cloudflare",
    description: "Register and manage DNS with Cloudflare for fast, secure domain management.",
    icon: GlobeIcon,
    url: "https://dash.cloudflare.com/sign-up",
  },
  {
    name: "Namecheap",
    description: "Affordable domain registration with free WHOIS privacy.",
    icon: GlobeIcon,
    url: "https://www.namecheap.com/domains/registration/results/?domain=autoship.dev",
  },
];

const deploymentProviders = [
  {
    name: "Vercel",
    description: "Deploy the AutoShip landing page and dashboard. Recommended for Next.js.",
    icon: DeployIcon,
    url: "https://vercel.com/new",
  },
];

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Settings & Integrations</h1>
      <p className="mt-2 text-gray-400">
        Connect your accounts, register your domain, and deploy AutoShip.
      </p>

      {/* Domain Registration */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Domain Registration</h2>
        <p className="mt-1 text-sm text-gray-400">
          Register <strong>autoship.dev</strong> through one of these providers.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {domainProviders.map((provider) => (
            <a
              key={provider.name}
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition-colors hover:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <provider.icon className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold">{provider.name}</h3>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                {provider.description}
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-blue-400 group-hover:text-blue-300">
                Open {provider.name} &rarr;
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Social Media Connections */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Social Media & Auth</h2>
        <p className="mt-1 text-sm text-gray-400">
          Connect social accounts to manage your presence and automate launch communications.
        </p>
        <div className="mt-4 space-y-3">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/50 p-5"
            >
              <div className="flex items-center gap-4">
                <integration.icon className="h-6 w-6 text-gray-300" />
                <div>
                  <h3 className="font-medium">{integration.name}</h3>
                  <p className="text-sm text-gray-400">
                    {integration.description}
                  </p>
                </div>
              </div>
              <a
                href={integration.authUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold ${
                  integration.connected
                    ? "border border-emerald-800 bg-emerald-950/50 text-emerald-400"
                    : "bg-white text-black hover:bg-gray-200"
                }`}
              >
                {integration.connected ? "Connected" : "Connect"}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Deployment */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Deployment</h2>
        <p className="mt-1 text-sm text-gray-400">
          Deploy the AutoShip web app to production.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {deploymentProviders.map((provider) => (
            <a
              key={provider.name}
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition-colors hover:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <provider.icon className="h-5 w-5 text-emerald-400" />
                <h3 className="font-semibold">{provider.name}</h3>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                {provider.description}
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-emerald-400 group-hover:text-emerald-300">
                Deploy now &rarr;
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Setup Guide */}
      <section className="mt-10 rounded-xl border border-gray-800 bg-gray-900/30 p-6">
        <h2 className="text-lg font-semibold">Quick Setup Guide</h2>
        <ol className="mt-4 space-y-3 text-sm text-gray-400">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-400">
              1
            </span>
            <span>
              <strong className="text-white">Register your domain</strong> — Click any provider above to register <code className="rounded bg-gray-800 px-1 text-xs">autoship.dev</code>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-400">
              2
            </span>
            <span>
              <strong className="text-white">Deploy to Vercel</strong> — Import the repo, set <code className="rounded bg-gray-800 px-1 text-xs">apps/web</code> as root directory, and deploy
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-400">
              3
            </span>
            <span>
              <strong className="text-white">Point DNS</strong> — Add Vercel&apos;s CNAME record to your domain provider
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-400">
              4
            </span>
            <span>
              <strong className="text-white">Connect social accounts</strong> — Link GitHub, Twitter/X, and Discord for launch day
            </span>
          </li>
        </ol>
      </section>
    </div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.466.733-3.558"
      />
    </svg>
  );
}

function DeployIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
      />
    </svg>
  );
}
