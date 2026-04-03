import { db } from "../db/index.js";
import { subscriptions, usageRecords, invoices } from "../db/schema.js";
import { eq, and, gte, sql } from "drizzle-orm";
import {
  stripe,
  STRIPE_PRO_PRICE_ID,
  STRIPE_ENTERPRISE_PRICE_ID,
} from "./stripe.js";
import type { PlanTier } from "@autoship/shared";

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
) {
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

export async function createBillingPortalSession(userId: string) {
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
