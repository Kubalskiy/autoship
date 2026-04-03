import { Worker, Job } from "bullmq";
import { createRedisConnection } from "./connection.js";
import type { PipelineJobData } from "./pipeline-queue.js";
import {
  getPipeline,
  updateRunStatus,
  createStepLog,
  updateStepLog,
} from "../services/pipeline-service.js";
import {
  executeAgent,
  resolveExecutionOrder,
} from "../services/agent-orchestrator.js";
import type { PipelineConfig } from "@autoship/shared";

async function processPipelineJob(job: Job<PipelineJobData>) {
  const { runId, pipelineId } = job.data;

  console.log(`[worker] Processing run ${runId} for pipeline ${pipelineId}`);

  const pipeline = await getPipeline(pipelineId);
  if (!pipeline) {
    throw new Error(`Pipeline ${pipelineId} not found`);
  }

  const config = pipeline.config as PipelineConfig;

  // Mark run as running
  await updateRunStatus(runId, "running", { startedAt: new Date() });

  try {
    // Resolve execution order (respecting dependencies)
    const batches = resolveExecutionOrder(config.steps);

    for (const batch of batches) {
      // Execute steps in the same batch concurrently
      await Promise.all(
        batch.map(async (step) => {
          const stepLog = await createStepLog(runId, step.name);

          await updateStepLog(stepLog.id, {
            status: "running",
            startedAt: new Date(),
          });

          try {
            const result = await executeAgent(step);

            await updateStepLog(stepLog.id, {
              status: result.success ? "completed" : "failed",
              output: result.output,
              completedAt: new Date(),
            });

            if (!result.success) {
              throw new Error(
                `Step "${step.name}" failed: ${result.output}`
              );
            }
          } catch (err) {
            await updateStepLog(stepLog.id, {
              status: "failed",
              error: err instanceof Error ? err.message : String(err),
              completedAt: new Date(),
            });
            throw err;
          }
        })
      );
    }

    // Mark run as completed
    await updateRunStatus(runId, "completed", { completedAt: new Date() });
    console.log(`[worker] Run ${runId} completed successfully`);
  } catch (err) {
    await updateRunStatus(runId, "failed", { completedAt: new Date() });
    console.error(`[worker] Run ${runId} failed:`, err);
    throw err;
  }
}

export function startWorker() {
  const worker = new Worker<PipelineJobData>(
    "pipeline-runs",
    processPipelineJob,
    {
      connection: createRedisConnection(),
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[worker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[worker] Job ${job?.id} failed:`, err.message);
  });

  console.log("[worker] Pipeline worker started");
  return worker;
}
