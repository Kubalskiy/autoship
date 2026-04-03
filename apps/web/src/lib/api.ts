const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export const api = {
  pipelines: {
    list: () => apiFetch<Pipeline[]>("/api/pipelines"),
    get: (id: string) => apiFetch<Pipeline>(`/api/pipelines/${id}`),
    runs: (id: string) => apiFetch<PipelineRun[]>(`/api/pipelines/${id}/runs`),
    run: (pipelineId: string, runId: string) =>
      apiFetch<PipelineRunDetail>(`/api/pipelines/${pipelineId}/runs/${runId}`),
  },
  billing: {
    dashboard: () => apiFetch<BillingDashboard>("/api/billing"),
    usage: () => apiFetch<UsageData>("/api/billing/usage"),
    checkout: (tier: string) =>
      apiFetch<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ tier }),
      }),
    portal: () =>
      apiFetch<{ url: string }>("/api/billing/portal", { method: "POST" }),
    metrics: () => apiFetch<RevenueMetrics>("/api/billing/metrics"),
  },
};

// Re-export types for dashboard use
export interface Pipeline {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  config: { steps: PipelineStep[] };
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStep {
  name: string;
  agent: string;
  prompt: string;
  dependsOn?: string[];
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface PipelineRunDetail extends PipelineRun {
  stepLogs: StepLog[];
}

export interface StepLog {
  id: string;
  runId: string;
  stepName: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  output?: string | null;
  error?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface BillingDashboard {
  subscription: Subscription | null;
  usage: {
    pipelineRunsThisMonth: number;
    agentMinutesThisMonth: number;
  };
  limits: {
    pipelineRunsPerMonth: number;
    agentMinutesPerMonth: number;
    githubRepos: number;
    teamMembers: number;
  };
  invoices: Invoice[];
}

export interface Subscription {
  id: string;
  userId: string;
  tier: "free" | "pro" | "enterprise";
  status: "active" | "past_due" | "canceled" | "trialing" | "incomplete";
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface Invoice {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  hostedInvoiceUrl?: string | null;
  paidAt?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  createdAt: string;
}

export interface RevenueMetrics {
  mrr: number;
  mrrFormatted: string;
  tierBreakdown: Record<string, { count: number; revenue: number }>;
  subscriptions: {
    total: number;
    byStatus: Record<string, number>;
  };
  churnedThisMonth: number;
  churnRate: number;
  revenueThisMonth: {
    totalCents: number;
    invoiceCount: number;
  };
}

export interface UsageData {
  pipelineRunsThisMonth: number;
  agentMinutesThisMonth: number;
  limits: {
    pipelineRunsPerMonth: number;
    agentMinutesPerMonth: number;
  };
}
