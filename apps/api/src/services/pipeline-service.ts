import { db } from "../db/index.js";
import { pipelines, pipelineRuns, stepLogs } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import type { CreatePipelineInput, PipelineConfig } from "@autoship/shared";

export async function createPipeline(
  input: CreatePipelineInput,
  ownerId: string
) {
  const [pipeline] = await db
    .insert(pipelines)
    .values({
      name: input.name,
      description: input.description,
      ownerId,
      config: input.config,
    })
    .returning();
  return pipeline;
}

export async function listPipelines(ownerId: string) {
  return db
    .select()
    .from(pipelines)
    .where(eq(pipelines.ownerId, ownerId))
    .orderBy(desc(pipelines.createdAt));
}

export async function getPipeline(id: string) {
  const [pipeline] = await db
    .select()
    .from(pipelines)
    .where(eq(pipelines.id, id));
  return pipeline ?? null;
}

export async function updatePipeline(
  id: string,
  input: Partial<CreatePipelineInput>
) {
  const [pipeline] = await db
    .update(pipelines)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(pipelines.id, id))
    .returning();
  return pipeline ?? null;
}

export async function deletePipeline(id: string) {
  const [pipeline] = await db
    .delete(pipelines)
    .where(eq(pipelines.id, id))
    .returning();
  return pipeline ?? null;
}

export async function createRun(pipelineId: string) {
  const [run] = await db
    .insert(pipelineRuns)
    .values({ pipelineId })
    .returning();
  return run;
}

export async function getRun(id: string) {
  const [run] = await db
    .select()
    .from(pipelineRuns)
    .where(eq(pipelineRuns.id, id));
  return run ?? null;
}

export async function listRuns(pipelineId: string) {
  return db
    .select()
    .from(pipelineRuns)
    .where(eq(pipelineRuns.pipelineId, pipelineId))
    .orderBy(desc(pipelineRuns.createdAt));
}

export async function updateRunStatus(
  id: string,
  status: "pending" | "running" | "completed" | "failed",
  extra?: { startedAt?: Date; completedAt?: Date }
) {
  const [run] = await db
    .update(pipelineRuns)
    .set({ status, ...extra })
    .where(eq(pipelineRuns.id, id))
    .returning();
  return run ?? null;
}

export async function createStepLog(runId: string, stepName: string) {
  const [log] = await db
    .insert(stepLogs)
    .values({ runId, stepName })
    .returning();
  return log;
}

export async function updateStepLog(
  id: string,
  data: {
    status?: "pending" | "running" | "completed" | "failed" | "skipped";
    output?: string;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
  }
) {
  const [log] = await db
    .update(stepLogs)
    .set(data)
    .where(eq(stepLogs.id, id))
    .returning();
  return log ?? null;
}

export async function getStepLogs(runId: string) {
  return db.select().from(stepLogs).where(eq(stepLogs.runId, runId));
}
