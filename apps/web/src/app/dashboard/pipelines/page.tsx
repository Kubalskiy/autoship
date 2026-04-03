"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Pipeline, type PipelineRun } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";

interface PipelineWithLastRun extends Pipeline {
  lastRun?: PipelineRun | null;
}

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<PipelineWithLastRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await api.pipelines.list();
        const enriched: PipelineWithLastRun[] = await Promise.all(
          list.map(async (p) => {
            const runs = await api.pipelines.runs(p.id);
            const sorted = runs.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            return { ...p, lastRun: sorted[0] ?? null };
          })
        );
        setPipelines(enriched);
      } catch {
        // API unavailable
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-32 rounded bg-gray-800" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-gray-800 bg-gray-900/50"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Pipelines</h1>
      <p className="mt-1 text-sm text-gray-400">
        All your AI agent pipelines in one place.
      </p>

      {pipelines.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
          <p className="text-lg font-medium text-gray-300">No pipelines yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Create a pipeline using the CLI:{" "}
            <code className="rounded bg-gray-800 px-2 py-0.5 text-emerald-400">
              autoship init
            </code>
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {pipelines.map((pipeline) => (
            <Link
              key={pipeline.id}
              href={`/dashboard/pipelines/${pipeline.id}/runs`}
              className="block rounded-xl border border-gray-800 bg-gray-900/50 p-5 transition-colors hover:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{pipeline.name}</h3>
                  {pipeline.description && (
                    <p className="mt-1 text-sm text-gray-400">
                      {pipeline.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>
                    {pipeline.config.steps.length} step
                    {pipeline.config.steps.length !== 1 ? "s" : ""}
                  </span>
                  {pipeline.lastRun ? (
                    <div className="flex items-center gap-2">
                      <StatusBadge status={pipeline.lastRun.status} />
                      <span className="text-xs">
                        {new Date(
                          pipeline.lastRun.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">No runs</span>
                  )}
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
