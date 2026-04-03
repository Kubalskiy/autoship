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
} from "../services/pipeline-service.js";
import { pipelineQueue } from "../queue/pipeline-queue.js";
import { auth } from "../auth.js";

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

  // Get a specific run with step logs
  app.get<{ Params: { id: string; runId: string } }>(
    "/api/pipelines/:id/runs/:runId",
    async (request, reply) => {
      const user = await getSessionUser(
        request.headers as Record<string, string>
      );
      if (!user) return reply.code(401).send({ error: "Unauthorized" });

      const run = await getRun(request.params.runId);
      if (!run) {
        return reply.code(404).send({ error: "Run not found" });
      }

      const logs = await getStepLogs(run.id);
      return { ...run, steps: logs };
    }
  );
}
