import Stripe from "stripe";
import { db } from "../db/index.js";
import { subscriptions, usageRecords, invoices } from "../db/schema.js";
import { eq, and, gte, sql } from "drizzle-orm";
import {
  stripe,
  STRIPE_PRO_PRICE_ID,
  STRIPE_ENTERPRISE_PRICE_ID,
} from "./stripe.js";
import { PLAN_LIMITS, PLAN_PRICES, type PlanTier } from "@autoship/shared";

// --- Subscription CRUD ---

export async function getSubscription(userId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));
  return sub ?? null;
}

export async function getOrCreateSubscription(
  userId: string,
  email: string
) {
  const existing = await getSubscription(userId);
  if (existing) return existing;

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  // Create free-tier subscription record
  const [sub] = await db
    .insert(subscriptions)
    .values({
      userId,
      stripeCustomerId: customer.id,
      tier: "free",
      status: "active",
    })
    .returning();

  return sub;
}

export async function updateSubscriptionFromStripe(
  stripeSubscriptionId: string,
  data: {
    status?: "active" | "past_due" | "canceled" | "trialing" | "incomplete";
    tier?: PlanTier;
    stripePriceId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  }
) {
  const [sub] = await db
    .update(subscriptions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .returning();
  return sub ?? null;
}

export async function setStripeSubscriptionId(
  userId: string,
  stripeSubscriptionId: string,
  stripePriceId: string,
  tier: PlanTier
) {
  const [sub] = await db
    .update(subscriptions)
    .set({
      stripeSubscriptionId,
      stripePriceId,
      tier,
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId))
    .returning();
  return sub ?? null;
}

// --- Checkout ---

export function getPriceIdForTier(tier: PlanTier): string | null {
  if (tier === "pro") return STRIPE_PRO_PRICE_ID;
  if (tier === "enterprise") return STRIPE_ENTERPRISE_PRICE_ID;
  return null;
}

export function getTierForPriceId(priceId: string): PlanTier {
  if (priceId === STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === STRIPE_ENTERPRISE_PRICE_ID) return "enterprise";
  return "free";
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  tier: PlanTier
): Promise<{ url: string | null }> {
  const sub = await getOrCreateSubscription(userId, email);
  const priceId = getPriceIdForTier(tier);
  if (!priceId) throw new Error("Invalid tier for checkout");

  const session = await stripe.checkout.sessions.create({
    customer: sub.stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.WEB_URL || "http://localhost:3000"}/billing?success=true`,
    cancel_url: `${process.env.WEB_URL || "http://localhost:3000"}/billing?canceled=true`,
    metadata: { userId, tier },
  });

  return session;
}

export async function createBillingPortalSession(userId: string): Promise<{ url: string }> {
  const sub = await getSubscription(userId);
  if (!sub) throw new Error("No subscription found");

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${process.env.WEB_URL || "http://localhost:3000"}/billing`,
  });

  return session;
}

// --- Usage Metering ---

export async function recordUsage(
  userId: string,
  agentMinutes: number,
  pipelineRunId?: string
) {
  const [record] = await db
    .insert(usageRecords)
    .values({ userId, agentMinutes, pipelineRunId })
    .returning();
  return record;
}

export async function getMonthlyUsage(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await db
    .select({
      totalAgentMinutes: sql<number>`coalesce(sum(${usageRecords.agentMinutes}), 0)`,
      totalRuns: sql<number>`count(*)`,
    })
    .from(usageRecords)
    .where(
      and(
        eq(usageRecords.userId, userId),
        gte(usageRecords.recordedAt, startOfMonth)
      )
    );

  return {
    agentMinutesThisMonth: Number(result[0]?.totalAgentMinutes ?? 0),
    pipelineRunsThisMonth: Number(result[0]?.totalRuns ?? 0),
  };
}

// --- Usage Limits ---

export async function checkUsageLimits(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  usage: { pipelineRunsThisMonth: number; agentMinutesThisMonth: number };
  limits: { pipelineRunsPerMonth: number; agentMinutesPerMonth: number };
}> {
  const sub = await getSubscription(userId);
  const tier = (sub?.tier ?? "free") as PlanTier;
  const limits = PLAN_LIMITS[tier];
  const usage = await getMonthlyUsage(userId);

  if (usage.pipelineRunsThisMonth >= limits.pipelineRunsPerMonth) {
    return {
      allowed: false,
      reason: `Monthly pipeline run limit reached (${limits.pipelineRunsPerMonth} runs on ${tier} plan)`,
      usage,
      limits,
    };
  }

  if (usage.agentMinutesThisMonth >= limits.agentMinutesPerMonth) {
    return {
      allowed: false,
      reason: `Monthly agent minutes limit reached (${limits.agentMinutesPerMonth} minutes on ${tier} plan)`,
      usage,
      limits,
    };
  }

  return { allowed: true, usage, limits };
}

// --- Invoices ---

export async function upsertInvoice(data: {
  userId: string;
  stripeInvoiceId: string;
  amountCents: number;
  currency: string;
  status: string;
  paidAt?: Date | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
}) {
  // Try update first
  const [existing] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.stripeInvoiceId, data.stripeInvoiceId));

  if (existing) {
    const [updated] = await db
      .update(invoices)
      .set({
        amountCents: data.amountCents,
        status: data.status,
        paidAt: data.paidAt,
      })
      .where(eq(invoices.stripeInvoiceId, data.stripeInvoiceId))
      .returning();
    return updated;
  }

  const [inv] = await db.insert(invoices).values(data).returning();
  return inv;
}

export async function listInvoices(userId: string, limit = 12) {
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(sql`${invoices.createdAt} desc`)
    .limit(limit);
}

// --- Financial Reporting ---

export async function getRevenueMetrics() {
  // MRR: sum of monthly prices for all active paid subscriptions
  const mrrResult = await db
    .select({
      tier: subscriptions.tier,
      count: sql<number>`count(*)::int`,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        sql`${subscriptions.tier} != 'free'`
      )
    )
    .groupBy(subscriptions.tier);

  let mrr = 0;
  const tierBreakdown: Record<string, { count: number; revenue: number }> = {};
  for (const row of mrrResult) {
    const price = PLAN_PRICES[row.tier as PlanTier] ?? 0;
    const revenue = row.count * price;
    mrr += revenue;
    tierBreakdown[row.tier] = { count: row.count, revenue };
  }

  // Subscription counts by status
  const statusCounts = await db
    .select({
      status: subscriptions.status,
      count: sql<number>`count(*)::int`,
    })
    .from(subscriptions)
    .groupBy(subscriptions.status);

  const byStatus: Record<string, number> = {};
  let totalSubscriptions = 0;
  for (const row of statusCounts) {
    byStatus[row.status] = row.count;
    totalSubscriptions += row.count;
  }

  // Churn: canceled subscriptions this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const churnResult = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "canceled"),
        gte(subscriptions.updatedAt, startOfMonth)
      )
    );

  const churnedThisMonth = churnResult[0]?.count ?? 0;

  // Revenue this month from paid invoices
  const revenueResult = await db
    .select({
      totalCents: sql<number>`coalesce(sum(${invoices.amountCents}), 0)::int`,
      invoiceCount: sql<number>`count(*)::int`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        gte(invoices.paidAt, startOfMonth)
      )
    );

  return {
    mrr, // in cents
    mrrFormatted: `$${(mrr / 100).toFixed(2)}`,
    tierBreakdown,
    subscriptions: {
      total: totalSubscriptions,
      byStatus,
    },
    churnedThisMonth,
    churnRate: totalSubscriptions > 0
      ? Math.round((churnedThisMonth / totalSubscriptions) * 10000) / 100
      : 0,
    revenueThisMonth: {
      totalCents: revenueResult[0]?.totalCents ?? 0,
      invoiceCount: revenueResult[0]?.invoiceCount ?? 0,
    },
  };
}
