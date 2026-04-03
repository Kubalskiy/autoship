import type { FastifyInstance } from "fastify";
import { createPipelineSchema } from "@autoship/shared";
import {
  createPipeline,
  listPipelines,
  getPipeline,
  updatePipeline,
  deletePipeline,
  createRun,
  getRun,
  listRuns,
  getStepLogs,
  getStepLogsByTimestamp,
  getAnalytics,
} from "../services/pipeline-service.js";
import { pipelineQueue } from "../queue/pipeline-queue.js";
import { auth } from "../auth.js";
import { checkUsageLimits } from "../services/billing-service.js";

async function getSessionUser(headers: Record<string, string>) {
  const session = await auth.api.getSession({ headers });
  return session?.user ?? null;
}

export async function pipelineRoutes(app: FastifyInstance) {
  // Create pipeline
  app.post("/api/pipelines", async (request, reply) => {
    const user = await getSessionUser(
      request.headers as Record<string, string>
    );
    if (!user) return reply.code(401).send({ error: "Unauthorized" });

    const parsed = createPipelineSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const pipeline = await createPipeline(parsed.data, user.id);
    return reply.code(201).send(pipeline);
  });

  // List pipelines
  app.get("/api/pipelines", async (request, reply) => {
    const user = await getSessionUser(
      request.headers as Record<string, string>
    );
    if (!user) return reply.code(401).send({ error: "Unauthorized" });

    const results = await listPipelines(user.id);
    return results;
  });

  // Get pipeline
  app.get<{ Params: { id: string } }>(
    "/api/pipelines/:id",
    async (request, reply) => {
      const user = await getSessionUser(
        request.headers as Record<string, string>
      );
      if (!user) return reply.code(401).send({ error: "Unauthorized" });

      const pipeline = await getPipeline(request.params.id);
      if (!pipeline || pipeline.ownerId !== user.id) {
        return reply.code(404).send({ error: "Pipeline not found" });
      }
      return pipeline;
    }
  );

  // Update pipeline
  app.patch<{ Params: { id: string } }>(
    "/api/pipelines/:id",
    async (request, reply) => {
      const user = await getSessionUser(
        request.headers as Record<string, string>
      );
      if (!user) return reply.code(401).send({ error: "Unauthorized" });

      const existing = await getPipeline(request.params.id);
      if (!existing || existing.ownerId !== user.id) {
        return reply.code(404).send({ error: "Pipeline not found" });
      }

      const body = request.body as Record<string, unknown>;
      if (body.config) {
        const parsed = createPipelineSchema
          .pick({ config: true })
          .safeParse({ config: body.config });
        if (!parsed.success) {
          return reply.code(400).send({ error: parsed.error.flatten() });
        }
      }

      const updated = await updatePipeline(request.params.id, body as any);
      return updated;
    }
  );

  // Delete pipeline
  app.delete<{ Params: { id: string } }>(
    "/api/pipelines/:id",
    async (request, reply) => {
      const user = await getSessionUser(
        request.headers as Record<string, string>
      );
      if (!user) return reply.code(401).send({ error: "Unauthorized" });

      const existing = await getPipeline(request.params.id);
      if (!existing || existing.ownerId !== user.id) {
        return reply.code(404).send({ error: "Pipeline not found" });
      }

      await deletePipeline(request.params.id);
      return reply.code(204).send();
    }
  );

  // Trigger a pipeline run
  app.post<{ Params: { id: string } }>(
    "/api/pipelines/:id/runs",
    async (request, reply) => {
      const user = await getSessionUser(
        request.headers as Record<string, string>
      );
      if (!user) return reply.code(401).send({ error: "Unauthorized" });

      const pipeline = await getPipeline(request.params.id);
      if (!pipeline || pipeline.ownerId !== user.id) {
        return reply.code(404).send({ error: "Pipeline not found" });
      }

      // Check usage limits before allowing new run
      const limitCheck = await checkUsageLimits(user.id);
      if (!limitCheck.allowed) {
        return reply.code(429).send({
          error: "Usage limit exceeded",
          message: limitCheck.reason,
          usage: limitCheck.usage,
          limits: limitCheck.limits,
        });
      }

      const run = await createRun(pipeline.id);

      await pipelineQueue.add(`run-${run.id}`, {
        runId: run.id,
        pipelineId: pipeline.id,
      });

      return reply.code(201).send(run);
    }
  );

  // List runs for a pipeline
  app.get<{ Params: { id: string } }>(
    "/api/pipelines/:id/runs",
    async (request, reply) => {
      const user = await getSessionUser(
        request.headers as Record<string, string>
      );
      if (!user) return reply.code(401).send({ error: "Unauthorized" });

      const pipeline = await getPipeline(request.params.id);
      if (!pipeline || pipeline.ownerId !== user.id) {
        return reply.code(404).send({ error: "Pipeline not found" });
      }

      return listRuns(pipeline.id);
    }
  );

  // Get a specific run with step logs inline
  app.get<{ Params: { id: string; runId: string } }>(
    "/api/pipelines/:id/runs/:runId",
    async (request, reply) => {
      const user = await getSessionUser(
        request.headers as Record<string, string>
      );
      if (!user) return reply.code(401).send({ error: "Unauthorized" });

      const pipeline = await getPipeline(request.params.id);
      if (!pipeline || pipeline.ownerId !== user.id) {
        return reply.code(404).send({ error: "Pipeline not found" });
      }

      const run = await getRun(request.params.runId);
      if (!run || run.pipelineId !== pipeline.id) {
        return reply.code(404).send({ error: "Run not found" });
      }

      const steps = await getStepLogs(run.id);
      return { ...run, steps };
    }
  );

  // SSE streaming endpoint — stream step log updates in real-time
  app.get<{ Params: { id: string; runId: string } }>(
    "/api/pipelines/:id/runs/:runId/stream",
    async (request, reply) => {
      const user = await getSessionUser(
        request.headers as Record<string, string>
      );
      if (!user) return reply.code(401).send({ error: "Unauthorized" });

      const pipeline = await getPipeline(request.params.id);
      if (!pipeline || pipeline.ownerId !== user.id) {
        return reply.code(404).send({ error: "Pipeline not found" });
      }

      const run = await getRun(request.params.runId);
      if (!run || run.pipelineId !== pipeline.id) {
        return reply.code(404).send({ error: "Run not found" });
      }

      // Set SSE headers using raw response
      const raw = reply.raw;
      raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      let lastSeenCount = 0;
      const interval = setInterval(async () => {
        try {
          const currentRun = await getRun(run.id);
          const logs = await getStepLogsByTimestamp(run.id);

          // Send any new or updated log entries
          if (logs.length > 0) {
            raw.write(
              `data: ${JSON.stringify({ type: "steps", steps: logs })}\n\n`
            );
          }

          // If run is completed or failed, send final event and close
          if (
            currentRun &&
            (currentRun.status === "completed" || currentRun.status === "failed")
          ) {
            raw.write(
              `data: ${JSON.stringify({ type: "run_complete", status: currentRun.status })}\n\n`
            );
            clearInterval(interval);
            raw.end();
          }
        } catch {
          clearInterval(interval);
          raw.end();
        }
      }, 1000);

      // Clean up on client disconnect
      request.raw.on("close", () => {
        clearInterval(interval);
      });

      // Hijack reply so Fastify doesn't try to send a response
      reply.hijack();
    }
  );

  // Log aggregation endpoint — all step logs for a run, ordered by timestamp
  app.get<{ Params: { id: string; runId: string } }>(
    "/api/pipelines/:id/runs/:runId/logs",
    async (request, reply) => {
      const user = await getSessionUser(
        request.headers as Record<string, string>
      );
      if (!user) return reply.code(401).send({ error: "Unauthorized" });

      const pipeline = await getPipeline(request.params.id);
      if (!pipeline || pipeline.ownerId !== user.id) {
        return reply.code(404).send({ error: "Pipeline not found" });
      }

      const run = await getRun(request.params.runId);
      if (!run || run.pipelineId !== pipeline.id) {
        return reply.code(404).send({ error: "Run not found" });
      }

      const logs = await getStepLogsByTimestamp(run.id);
      return { runId: run.id, status: run.status, logs };
    }
  );

  // Analytics endpoint — dashboard stats
  app.get("/api/analytics", async (request, reply) => {
    const user = await getSessionUser(
      request.headers as Record<string, string>
    );
    if (!user) return reply.code(401).send({ error: "Unauthorized" });

    const stats = await getAnalytics(user.id);
    return stats;
  });
}
