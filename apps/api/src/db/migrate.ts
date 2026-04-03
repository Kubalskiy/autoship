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

  await sql`
    CREATE TABLE IF NOT EXISTS waitlist_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_pipeline_runs_pipeline_id ON pipeline_runs(pipeline_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_step_logs_run_id ON step_logs(run_id);`;

  // --- Billing tables ---

  await sql`
    DO $$ BEGIN
      CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE plan_tier AS ENUM ('free', 'pro', 'enterprise');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      stripe_customer_id TEXT NOT NULL,
      stripe_subscription_id TEXT,
      stripe_price_id TEXT,
      tier plan_tier NOT NULL DEFAULT 'free',
      status subscription_status NOT NULL DEFAULT 'active',
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);`;

  await sql`
    CREATE TABLE IF NOT EXISTS usage_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      pipeline_run_id UUID,
      agent_minutes INTEGER NOT NULL DEFAULT 0,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_usage_records_user_id_recorded_at ON usage_records(user_id, recorded_at);`;

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      stripe_invoice_id TEXT NOT NULL UNIQUE,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'usd',
      status TEXT NOT NULL,
      paid_at TIMESTAMPTZ,
      period_start TIMESTAMPTZ,
      period_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);`;

  // Add hosted_invoice_url column to invoices (idempotent)
  await sql`
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS hosted_invoice_url TEXT;
  `;

  // --- Analytics & streaming indexes ---
  await sql`CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_step_logs_run_id_started_at ON step_logs(run_id, started_at);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pipelines_owner_id ON pipelines(owner_id);`;

  console.log("Migrations complete.");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
