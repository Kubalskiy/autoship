import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL || "postgres://autoship:autoship@localhost:5432/autoship";

const client = postgres(connectionString);
export const db = drizzle(client);
