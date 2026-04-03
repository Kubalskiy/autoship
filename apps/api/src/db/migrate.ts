import "dotenv/config";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://autoship:autoship@localhost:5432/autoship";

const sql = postgres(connectionString);

async function migrate() {
  console.log("Running migrations...");

  await sql`
    DO $$ BEGIN
      CREATE TYPE pipeline_run_status AS ENUM ('pending', 'running', 'completed', 'failed');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE step_log_status AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pipelines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      owner_id TEXT NOT NULL,
      config JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
      status pipeline_run_status NOT NULL DEFAULT 'pending',
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS step_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
      step_name TEXT NOT NULL,
      status step_log_status NOT NULL DEFAULT 'pending',
      output TEXT,
      error TEXT,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_pipeline_runs_pipeline_id ON pipeline_runs(pipeline_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_step_logs_run_id ON step_logs(run_id);`;

  console.log("Migrations complete.");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
