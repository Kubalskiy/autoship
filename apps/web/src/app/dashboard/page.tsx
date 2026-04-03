"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Pipeline, type PipelineRun, type UsageData } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";

interface DashboardStats {
  totalPipelines: number;
  totalRuns: number;
  successRate: number;
  agentMinutes: number;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRuns, setRecentRuns] = useState<
    (PipelineRun & { pipelineName: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pipelines, usage] = await Promise.all([
          api.pipelines.list(),
          api.billing.usage(),
        ]);

        // Gather all runs across pipelines
        const allRuns: (PipelineRun & { pipelineName: string })[] = [];
        await Promise.all(
          pipelines.map(async (p) => {
            const runs = await api.pipelines.runs(p.id);
            runs.forEach((r) => allRuns.push({ ...r, pipelineName: p.name }));
          })
        );

        allRuns.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const completedRuns = allRuns.filter(
          (r) => r.status === "completed" || r.status === "failed"
        );
        const successCount = completedRuns.filter(
          (r) => r.status === "completed"
        ).length;

        setStats({
          totalPipelines: pipelines.length,
          totalRuns: allRuns.length,
          successRate:
            completedRuns.length > 0
              ? Math.round((successCount / completedRuns.length) * 100)
              : 0,
          agentMinutes: usage.agentMinutesThisMonth,
        });
        setRecentRuns(allRuns.slice(0, 5));
      } catch {
        // API may not be available yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-400">
        Overview of your AutoShip pipelines and usage.
      </p>

      {/* Stats Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pipelines"
          value={stats?.totalPipelines ?? 0}
          color="text-blue-400"
        />
        <StatCard
          label="Total Runs"
          value={stats?.totalRuns ?? 0}
          color="text-emerald-400"
        />
        <StatCard
          label="Success Rate"
          value={`${stats?.successRate ?? 0}%`}
          color="text-purple-400"
        />
        <StatCard
          label="Agent Minutes"
          value={stats?.agentMinutes ?? 0}
          subtitle="this month"
          color="text-yellow-400"
        />
      </div>

      {/* Recent Runs */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Runs</h2>
          <Link
            href="/dashboard/pipelines"
            className="text-sm text-gray-400 hover:text-white"
          >
            View all pipelines
          </Link>
        </div>
        {recentRuns.length === 0 ? (
          <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-center">
            <p className="text-gray-400">No pipeline runs yet.</p>
            <p className="mt-1 text-sm text-gray-500">
              Create a pipeline and trigger a run to see results here.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-800 bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Pipeline
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Started
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-900/30">
                    <td className="px-4 py-3 font-medium">
                      {run.pipelineName}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {run.startedAt
                        ? new Date(run.startedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatDuration(run.startedAt, run.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}

function formatDuration(
  start?: string | null,
  end?: string | null
): string {
  if (!start) return "—";
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const seconds = Math.round((e - s) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-40 rounded bg-gray-800" />
      <div className="mt-2 h-4 w-64 rounded bg-gray-800" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-gray-800 bg-gray-900/50"
          />
        ))}
      </div>
    </div>
  );
}
