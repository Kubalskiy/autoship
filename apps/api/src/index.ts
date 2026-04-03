import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";
import { pipelineRoutes } from "./routes/pipelines.js";
import { startWorker } from "./queue/worker.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.WEB_URL || "http://localhost:3000",
  credentials: true,
});

await app.register(cookie);

// Better Auth handles /api/auth/* routes
const authHandler = toNodeHandler(auth);

app.all("/api/auth/*", async (request, reply) => {
  await authHandler(request.raw, reply.raw);
  reply.hijack();
});

// Health check
app.get("/health", async () => ({ status: "ok" }));

// API routes
app.get("/api/me", async (request, reply) => {
  const session = await auth.api.getSession({
    headers: request.headers as Record<string, string>,
  });
  if (!session) {
    reply.code(401);
    return { error: "Unauthorized" };
  }
  return { user: session.user };
});

// Pipeline CRUD + runs
await app.register(pipelineRoutes);

// Start BullMQ worker (in-process for simplicity)
startWorker();

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || "0.0.0.0";

await app.listen({ port, host });
console.log(`AutoShip API running at http://${host}:${port}`);
