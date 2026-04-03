import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { waitlistEntries } from "../db/schema.js";

export async function waitlistRoutes(app: FastifyInstance) {
  app.post("/api/waitlist", async (request, reply) => {
    const { email } = request.body as { email?: string };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      reply.code(400);
      return { error: "Valid email is required" };
    }

    try {
      await db.insert(waitlistEntries).values({ email }).onConflictDoNothing();
      return { success: true, message: "You're on the list!" };
    } catch {
      reply.code(500);
      return { error: "Something went wrong. Please try again." };
    }
  });
}
