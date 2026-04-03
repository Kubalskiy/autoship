import type { FastifyInstance } from "fastify";
import type Stripe from "stripe";
import { stripe, STRIPE_WEBHOOK_SECRET } from "../services/stripe.js";
import {
  updateSubscriptionFromStripe,
  setStripeSubscriptionId,
  getTierForPriceId,
  upsertInvoice,
  getSubscription,
} from "../services/billing-service.js";
import { db } from "../db/index.js";
import { subscriptions } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function webhookRoutes(app: FastifyInstance) {
  // Stripe needs raw body for signature verification
  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (_req, body, done) => {
      done(null, body);
    }
  );

  app.post("/api/webhooks/stripe", async (request, reply) => {
    const sig = request.headers["stripe-signature"];
    if (!sig) {
      return reply.code(400).send({ error: "Missing stripe-signature header" });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        request.body as Buffer,
        sig as string,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      app.log.error(`Webhook signature verification failed: ${message}`);
      return reply.code(400).send({ error: "Invalid signature" });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          // Fetch the Stripe subscription to get price details
          const stripeSub =
            await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = stripeSub.items.data[0]?.price?.id || "";
          const tier = getTierForPriceId(priceId);

          await setStripeSubscriptionId(userId, subscriptionId, priceId, tier);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price?.id || "";
        const tier = getTierForPriceId(priceId);

        await updateSubscriptionFromStripe(sub.id, {
          status: mapStripeStatus(sub.status),
          tier,
          stripePriceId: priceId,
          currentPeriodStart: new Date((sub as any).current_period_start * 1000),
          currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        // Downgrade to free
        const [record] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, sub.id));

        if (record) {
          await db
            .update(subscriptions)
            .set({
              tier: "free",
              status: "canceled",
              stripeSubscriptionId: null,
              stripePriceId: null,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubscriptionId, sub.id));
        }
        break;
      }

      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId =
          typeof inv.customer === "string" ? inv.customer : inv.customer?.id;

        if (customerId) {
          // Find user by stripe customer id
          const [sub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeCustomerId, customerId));

          if (sub) {
            await upsertInvoice({
              userId: sub.userId,
              stripeInvoiceId: inv.id,
              amountCents: inv.amount_paid,
              currency: inv.currency,
              status: "paid",
              hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
              paidAt: new Date(),
              periodStart: inv.period_start
                ? new Date(inv.period_start * 1000)
                : null,
              periodEnd: inv.period_end
                ? new Date(inv.period_end * 1000)
                : null,
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId =
          typeof inv.customer === "string" ? inv.customer : inv.customer?.id;

        if (customerId) {
          const [sub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeCustomerId, customerId));

          if (sub) {
            await upsertInvoice({
              userId: sub.userId,
              stripeInvoiceId: inv.id,
              amountCents: inv.amount_due,
              currency: inv.currency,
              status: "failed",
              hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
              periodStart: inv.period_start
                ? new Date(inv.period_start * 1000)
                : null,
              periodEnd: inv.period_end
                ? new Date(inv.period_end * 1000)
                : null,
            });

            // Mark subscription as past_due
            if (sub.stripeSubscriptionId) {
              await updateSubscriptionFromStripe(sub.stripeSubscriptionId, {
                status: "past_due",
              });
            }
          }
        }
        break;
      }

      default:
        app.log.info(`Unhandled webhook event: ${event.type}`);
    }

    return { received: true };
  });
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "active" | "past_due" | "canceled" | "trialing" | "incomplete" {
  switch (status) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "trialing":
      return "trialing";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return "active";
  }
}
