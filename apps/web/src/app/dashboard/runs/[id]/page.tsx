"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { api, type PipelineRunDetail } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function RunDetailPage() {
  const { id: runId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const pipelineId = searchParams.get("pipelineId") ?? "";
  const [run, setRun] = useState<PipelineRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    async function load() {
      if (!pipelineId) return;
      try {
        const data = await api.pipelines.run(pipelineId, runId);
        setRun(data);
        if (data.stepLogs.length > 0 && !selectedStep) {
          setSelectedStep(data.stepLogs[0].stepName);
        }
      } catch {
        // Run may not exist
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [runId, pipelineId, selectedStep]);

  // SSE for real-time updates on running jobs
  useEffect(() => {
    if (!run || !pipelineId) return;
    if (run.status !== "running" && run.status !== "pending") return;

    const es = new EventSource(
      `${API_URL}/api/pipelines/${pipelineId}/runs/${runId}/stream`,
      { withCredentials: true }
    );
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "run_update") {
          setRun((prev) =>
            prev ? { ...prev, status: data.status } : prev
          );
        } else if (data.type === "step_update" && data.stepLog) {
          setRun((prev) => {
            if (!prev) return prev;
            const logs = prev.stepLogs.map((l) =>
              l.id === data.stepLog.id ? { ...l, ...data.stepLog } : l
            );
            return { ...prev, stepLogs: logs };
          });
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [run?.status, pipelineId, runId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-48 rounded bg-gray-800" />
        <div className="mt-6 h-64 rounded-xl border border-gray-800 bg-gray-900/50" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="text-center">
        <p className="text-gray-400">Run not found.</p>
        <Link
          href="/dashboard/pipelines"
          className="mt-4 inline-block text-sm text-blue-400 hover:underline"
        >
          Back to pipelines
        </Link>
      </div>
    );
  }

  const currentStep = run.stepLogs.find((l) => l.stepName === selectedStep);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/dashboard/pipelines" className="hover:text-white">
          Pipelines
        </Link>
        <span>/</span>
        {pipelineId && (
          <>
            <Link
              href={`/dashboard/pipelines/${pipelineId}/runs`}
              className="hover:text-white"
            >
              Runs
            </Link>
            <span>/</span>
          </>
        )}
        <span className="font-mono text-white">{runId.slice(0, 8)}</span>
      </div>

      {/* Run header */}
      <div className="mt-4 flex items-center gap-4">
        <h1 className="text-2xl font-bold">
          Run{" "}
          <span className="font-mono text-gray-400">{runId.slice(0, 8)}</span>
        </h1>
        <StatusBadge status={run.status} />
      </div>

      <div className="mt-2 flex gap-6 text-sm text-gray-400">
        {run.startedAt && (
          <span>Started: {new Date(run.startedAt).toLocaleString()}</span>
        )}
        {run.completedAt && (
          <span>
            Completed: {new Date(run.completedAt).toLocaleString()}
          </span>
        )}
      </div>

      {/* Step tabs + detail */}
      <div className="mt-8 flex gap-6">
        {/* Step list */}
        <div className="w-56 shrink-0 space-y-1">
          <h3 className="mb-2 text-sm font-medium text-gray-400">Steps</h3>
          {run.stepLogs.map((log) => (
            <button
              key={log.id}
              onClick={() => setSelectedStep(log.stepName)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                selectedStep === log.stepName
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <span className="truncate">{log.stepName}</span>
              <StatusBadge status={log.status} />
            </button>
          ))}
        </div>

        {/* Step detail */}
        <div className="min-w-0 flex-1">
          {currentStep ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50">
              <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{currentStep.stepName}</h3>
                  <StatusBadge status={currentStep.status} />
                </div>
                <div className="text-xs text-gray-500">
                  {currentStep.startedAt &&
                    new Date(currentStep.startedAt).toLocaleString()}
                </div>
              </div>

              {/* Output */}
              {currentStep.output && (
                <div className="border-b border-gray-800 p-5">
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Output
                  </h4>
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-950 p-4 font-mono text-sm text-gray-300">
                    {currentStep.output}
                  </pre>
                </div>
              )}

              {/* Error */}
              {currentStep.error && (
                <div className="p-5">
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-red-400">
                    Error
                  </h4>
                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-red-950/30 p-4 font-mono text-sm text-red-300">
                    {currentStep.error}
                  </pre>
                </div>
              )}

              {currentStep.status === "running" && (
                <div className="flex items-center gap-2 p-5 text-sm text-blue-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                  Running...
                </div>
              )}

              {currentStep.status === "pending" && (
                <div className="p-5 text-sm text-gray-500">
                  Waiting to start...
                </div>
              )}

              {!currentStep.output &&
                !currentStep.error &&
                currentStep.status === "completed" && (
                  <div className="p-5 text-sm text-gray-500">
                    Step completed with no output.
                  </div>
                )}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-center text-gray-400">
              Select a step to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
