"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, type Pipeline, type PipelineRun } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";

export default function RunHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, r] = await Promise.all([
          api.pipelines.get(id),
          api.pipelines.runs(id),
        ]);
        setPipeline(p);
        setRuns(
          r.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
        );
      } catch {
        // Pipeline may not exist
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-48 rounded bg-gray-800" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl border border-gray-800 bg-gray-900/50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="text-center">
        <p className="text-gray-400">Pipeline not found.</p>
        <Link
          href="/dashboard/pipelines"
          className="mt-4 inline-block text-sm text-blue-400 hover:underline"
        >
          Back to pipelines
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/dashboard/pipelines" className="hover:text-white">
          Pipelines
        </Link>
        <span>/</span>
        <span className="text-white">{pipeline.name}</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pipeline.name}</h1>
          {pipeline.description && (
            <p className="mt-1 text-sm text-gray-400">
              {pipeline.description}
            </p>
          )}
        </div>
        <div className="text-sm text-gray-400">
          {pipeline.config.steps.length} step
          {pipeline.config.steps.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Steps overview */}
      <div className="mt-6 flex flex-wrap gap-2">
        {pipeline.config.steps.map((step) => (
          <span
            key={step.name}
            className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300"
          >
            {step.name}
            <span className="ml-1 text-gray-500">({step.agent})</span>
          </span>
        ))}
      </div>

      {/* Runs */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Run History</h2>
        {runs.length === 0 ? (
          <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-center">
            <p className="text-gray-400">No runs yet.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-800 bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Run ID
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Started
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Completed
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-900/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/runs/${run.id}?pipelineId=${id}`}
                        className="font-mono text-blue-400 hover:underline"
                      >
                        {run.id.slice(0, 8)}
                      </Link>
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
                      {run.completedAt
                        ? new Date(run.completedAt).toLocaleString()
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
