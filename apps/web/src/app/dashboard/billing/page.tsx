"use client";

import { useEffect, useState } from "react";
import { api, type BillingDashboard } from "@/lib/api";

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  pro: 4900,
  enterprise: 49900,
};

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.billing.dashboard();
        setBilling(data);
      } catch {
        // API unavailable
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleUpgrade(tier: string) {
    setActionLoading(true);
    try {
      const { url } = await api.billing.checkout(tier);
      window.location.href = url;
    } catch {
      alert("Failed to create checkout session. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleManage() {
    setActionLoading(true);
    try {
      const { url } = await api.billing.portal();
      window.location.href = url;
    } catch {
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-32 rounded bg-gray-800" />
        <div className="mt-6 h-48 rounded-xl border border-gray-800 bg-gray-900/50" />
      </div>
    );
  }

  const tier = billing?.subscription?.tier ?? "free";
  const limits = billing?.limits ?? {
    pipelineRunsPerMonth: 100,
    agentMinutesPerMonth: 30,
    githubRepos: 1,
    teamMembers: 1,
  };
  const usage = billing?.usage ?? {
    pipelineRunsThisMonth: 0,
    agentMinutesThisMonth: 0,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Billing</h1>
      <p className="mt-1 text-sm text-gray-400">
        Manage your subscription and monitor usage.
      </p>

      {/* Current Plan */}
      <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Current Plan</p>
            <p className="mt-1 text-2xl font-bold capitalize">{tier}</p>
            {billing?.subscription?.status === "past_due" && (
              <p className="mt-1 text-sm text-red-400">
                Payment past due — please update your payment method.
              </p>
            )}
            {billing?.subscription?.cancelAtPeriodEnd && (
              <p className="mt-1 text-sm text-yellow-400">
                Cancels at end of current period
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              ${(PLAN_PRICES[tier] ?? 0) / 100}
              <span className="text-base font-normal text-gray-400">
                /mo
              </span>
            </p>
          </div>
        </div>

        {tier !== "free" && (
          <button
            onClick={handleManage}
            disabled={actionLoading}
            className="mt-4 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-600 hover:text-white disabled:opacity-50"
          >
            Manage Subscription
          </button>
        )}
      </div>

      {/* Usage */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <UsageCard
          label="Pipeline Runs"
          used={usage.pipelineRunsThisMonth}
          limit={limits.pipelineRunsPerMonth}
        />
        <UsageCard
          label="Agent Minutes"
          used={usage.agentMinutesThisMonth}
          limit={limits.agentMinutesPerMonth}
        />
      </div>

      {/* Upgrade Options */}
      {tier === "free" && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Upgrade Your Plan</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <PlanCard
              name="Pro"
              price="$49/mo"
              features={[
                "5,000 runs/month",
                "500 agent minutes",
                "10 GitHub repos",
                "5 team members",
              ]}
              onUpgrade={() => handleUpgrade("pro")}
              loading={actionLoading}
            />
            <PlanCard
              name="Enterprise"
              price="$499/mo"
              features={[
                "Unlimited runs",
                "Unlimited agent minutes",
                "Unlimited repos",
                "Unlimited team members",
              ]}
              onUpgrade={() => handleUpgrade("enterprise")}
              loading={actionLoading}
              highlight
            />
          </div>
        </div>
      )}

      {tier === "pro" && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Need More?</h2>
          <div className="mt-4 max-w-md">
            <PlanCard
              name="Enterprise"
              price="$499/mo"
              features={[
                "Unlimited runs",
                "Unlimited agent minutes",
                "Unlimited repos",
                "Unlimited team members",
              ]}
              onUpgrade={() => handleUpgrade("enterprise")}
              loading={actionLoading}
              highlight
            />
          </div>
        </div>
      )}

      {/* Invoices */}
      {billing?.invoices && billing.invoices.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Invoice History</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-800 bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Date
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Amount
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Period
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {billing.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-900/30">
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      ${(inv.amountCents / 100).toFixed(2)}{" "}
                      <span className="text-gray-500 uppercase">
                        {inv.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          inv.status === "paid"
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "bg-red-400/10 text-red-400"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {inv.periodStart && inv.periodEnd
                        ? `${new Date(inv.periodStart).toLocaleDateString()} — ${new Date(inv.periodEnd).toLocaleDateString()}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function UsageCard({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const isUnlimited = !isFinite(limit);
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isHigh = percentage > 80;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-sm font-medium">
          {used.toLocaleString()}{" "}
          <span className="text-gray-500">
            / {isUnlimited ? "Unlimited" : limit.toLocaleString()}
          </span>
        </p>
      </div>
      {!isUnlimited && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-800">
          <div
            className={`h-full rounded-full transition-all ${
              isHigh ? "bg-red-400" : "bg-emerald-400"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

function PlanCard({
  name,
  price,
  features,
  onUpgrade,
  loading,
  highlight,
}: {
  name: string;
  price: string;
  features: string[];
  onUpgrade: () => void;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        highlight
          ? "border-emerald-500/50 bg-gradient-to-b from-gray-900 to-gray-950"
          : "border-gray-800 bg-gray-900/50"
      }`}
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-1 text-2xl font-bold">{price}</p>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
            <svg
              className="h-4 w-4 shrink-0 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onUpgrade}
        disabled={loading}
        className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
          highlight
            ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white hover:from-blue-400 hover:to-emerald-400"
            : "bg-white text-black hover:bg-gray-200"
        }`}
      >
        Upgrade to {name}
      </button>
    </div>
  );
}
