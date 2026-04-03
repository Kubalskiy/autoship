import { z } from "zod";

// --- Zod Schemas ---

export const pipelineStepSchema = z.object({
  name: z.string().min(1, "Step name is required"),
  agent: z.string().min(1, "Agent identifier is required"),
  prompt: z.string().min(1, "Prompt is required"),
  dependsOn: z.array(z.string()).optional(),
});

export const pipelineConfigSchema = z.object({
  steps: z
    .array(pipelineStepSchema)
    .min(1, "At least one step is required")
    .refine(
      (steps) => {
        const names = steps.map((s) => s.name);
        return new Set(names).size === names.length;
      },
      { message: "Step names must be unique" }
    )
    .refine(
      (steps) => {
        const names = new Set(steps.map((s) => s.name));
        return steps.every((s) =>
          (s.dependsOn ?? []).every((dep) => names.has(dep))
        );
      },
      { message: "dependsOn references a step that does not exist" }
    ),
});

export const createPipelineSchema = z.object({
  name: z.string().min(1, "Pipeline name is required"),
  description: z.string().optional(),
  config: pipelineConfigSchema,
});

export const pipelineFileSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(pipelineStepSchema).min(1),
});

// --- TypeScript Types (derived from Zod) ---

export type PipelineStep = z.infer<typeof pipelineStepSchema>;
export type PipelineConfig = z.infer<typeof pipelineConfigSchema>;
export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;
export type PipelineFileDefinition = z.infer<typeof pipelineFileSchema>;

export type PipelineRunStatus = "pending" | "running" | "completed" | "failed";
export type StepLogStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export interface Pipeline {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  config: PipelineConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: PipelineRunStatus;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
}

export interface StepLog {
  id: string;
  runId: string;
  stepName: string;
  status: StepLogStatus;
  output?: string | null;
  error?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
}

// --- Billing Types ---

export type PlanTier = "free" | "pro" | "enterprise";
export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "incomplete";

export const PLAN_LIMITS = {
  free: {
    pipelineRunsPerMonth: 100,
    agentMinutesPerMonth: 30,
    githubRepos: 1,
    teamMembers: 1,
  },
  pro: {
    pipelineRunsPerMonth: 5000,
    agentMinutesPerMonth: 500,
    githubRepos: 10,
    teamMembers: 5,
  },
  enterprise: {
    pipelineRunsPerMonth: Infinity,
    agentMinutesPerMonth: Infinity,
    githubRepos: Infinity,
    teamMembers: Infinity,
  },
} as const;

export const PLAN_PRICES = {
  free: 0,
  pro: 4900, // cents
  enterprise: 49900, // cents
} as const;

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  tier: PlanTier;
  status: SubscriptionStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  id: string;
  userId: string;
  pipelineRunId?: string | null;
  agentMinutes: number;
  recordedAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  amountCents: number;
  currency: string;
  status: string;
  paidAt?: Date | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  createdAt: Date;
}

export interface BillingDashboard {
  subscription: Subscription | null;
  usage: {
    pipelineRunsThisMonth: number;
    agentMinutesThisMonth: number;
  };
  limits: (typeof PLAN_LIMITS)[PlanTier];
  invoices: Invoice[];
}
