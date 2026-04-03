import type { FastifyInstance } from "fastify";
import { PLAN_LIMITS, type PlanTier } from "@autoship/shared";
import { auth } from "../auth.js";
import {
  getOrCreateSubscription,
  getSubscription,
  createCheckoutSession,
  createBillingPortalSession,
  getMonthlyUsage,
  listInvoices,
  getRevenueMetrics,
} from "../services/billing-service.js";

async function getSessionUser(headers: Record<string, string>) {
  const session = await auth.api.getSession({ headers });
  return session?.user ?? null;
}

export async function billingRoutes(app: FastifyInstance) {
  // Get billing dashboard
  app.get("/api/billing", async (request, reply) => {
    const user = await getSessionUser(
      request.headers as Record<string, string>
    );
    if (!user) return reply.code(401).send({ error: "Unauthorized" });

    const subscription = await getOrCreateSubscription(user.id, user.email);
    const usage = await getMonthlyUsage(user.id);
    const tier = (subscription.tier ?? "free") as PlanTier;
    const limits = PLAN_LIMITS[tier];
    const userInvoices = await listInvoices(user.id);

    return {
      subscription,
      usage,
      limits,
      invoices: userInvoices,
    };
  });

  // Create checkout session for upgrade
  app.post("/api/billing/checkout", async (request, reply) => {
    const user = await getSessionUser(
      request.headers as Record<string, string>
    );
    if (!user) return reply.code(401).send({ error: "Unauthorized" });

    const body = request.body as { tier?: string };
    const tier = body.tier as PlanTier;

    if (!tier || !["pro", "enterprise"].includes(tier)) {
      return reply.code(400).send({ error: "Invalid tier" });
    }

    const currentSub = await getSubscription(user.id);
    if (currentSub?.tier === tier && currentSub.status === "active") {
      return reply
        .code(400)
        .send({ error: "Already subscribed to this tier" });
    }

    const session = await createCheckoutSession(user.id, user.email, tier);
    return { url: session.url };
  });

  // Create billing portal session (manage subscription)
  app.post("/api/billing/portal", async (request, reply) => {
    const user = await getSessionUser(
      request.headers as Record<string, string>
    );
    if (!user) return reply.code(401).send({ error: "Unauthorized" });

    const session = await createBillingPortalSession(user.id);
    return { url: session.url };
  });

  // Get current usage
  app.get("/api/billing/usage", async (request, reply) => {
    const user = await getSessionUser(
      request.headers as Record<string, string>
    );
    if (!user) return reply.code(401).send({ error: "Unauthorized" });

    const subscription = await getSubscription(user.id);
    const tier = (subscription?.tier ?? "free") as PlanTier;
    const usage = await getMonthlyUsage(user.id);
    const limits = PLAN_LIMITS[tier];

    return { tier, usage, limits };
  });

  // Financial reporting — MRR, churn, revenue metrics (admin-only endpoint)
  app.get("/api/billing/metrics", async (request, reply) => {
    const user = await getSessionUser(
      request.headers as Record<string, string>
    );
    if (!user) return reply.code(401).send({ error: "Unauthorized" });

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return reply.code(403).send({ error: "Forbidden — admin access required" });
    }

    const metrics = await getRevenueMetrics();
    return metrics;
  });
}
