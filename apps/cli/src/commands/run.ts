import { readFileSync, existsSync } from "node:fs";
import { parse } from "yaml";
import { pipelineFileSchema } from "@autoship/shared";

interface RunOptions {
  file: string;
  apiUrl: string;
  apiKey?: string;
}

export async function runCommand(options: RunOptions) {
  const { file, apiUrl, apiKey } = options;

  if (!existsSync(file)) {
    console.error(`Error: File not found: ${file}`);
    console.error(`Run "autoship init" to create a pipeline config.`);
    process.exit(1);
  }

  // Parse YAML
  const raw = readFileSync(file, "utf-8");
  let parsed: unknown;
  try {
    parsed = parse(raw);
  } catch (err) {
    console.error(`Error: Invalid YAML in ${file}`);
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // Validate schema
  const result = pipelineFileSchema.safeParse(parsed);
  if (!result.success) {
    console.error("Pipeline validation failed:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  const pipelineDef = result.data;
  console.log(`Pipeline: ${pipelineDef.name}`);
  console.log(`Steps: ${pipelineDef.steps.length}`);

  // Create pipeline via API
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  console.log(`\nConnecting to ${apiUrl}...`);

  try {
    // Create the pipeline
    const createRes = await fetch(`${apiUrl}/api/pipelines`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: pipelineDef.name,
        description: pipelineDef.description,
        config: { steps: pipelineDef.steps },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      console.error(
        `Failed to create pipeline (${createRes.status}):`,
        JSON.stringify(err, null, 2)
      );
      process.exit(1);
    }

    const pipeline = (await createRes.json()) as { id: string };
    console.log(`Created pipeline: ${pipeline.id}`);

    // Trigger a run
    const runRes = await fetch(
      `${apiUrl}/api/pipelines/${pipeline.id}/runs`,
      { method: "POST", headers }
    );

    if (!runRes.ok) {
      const err = await runRes.json().catch(() => ({}));
      console.error(
        `Failed to trigger run (${runRes.status}):`,
        JSON.stringify(err, null, 2)
      );
      process.exit(1);
    }

    const run = (await runRes.json()) as { id: string };
    console.log(`Started run: ${run.id}`);

    // Poll for completion
    console.log("\nWaiting for pipeline to complete...\n");
    let status = "pending";

    while (status === "pending" || status === "running") {
      await new Promise((r) => setTimeout(r, 2000));

      const statusRes = await fetch(
        `${apiUrl}/api/pipelines/${pipeline.id}/runs/${run.id}`,
        { headers }
      );

      if (!statusRes.ok) break;

      const runData = (await statusRes.json()) as {
        status: string;
        steps?: Array<{
          stepName: string;
          status: string;
          output?: string;
          error?: string;
        }>;
      };
      status = runData.status;

      // Print step progress
      if (runData.steps) {
        for (const step of runData.steps) {
          const icon =
            step.status === "completed"
              ? "done"
              : step.status === "failed"
                ? "FAIL"
                : step.status === "running"
                  ? "..."
                  : "    ";
          console.log(`  [${icon}] ${step.stepName} (${step.status})`);
        }
        console.log();
      }
    }

    if (status === "completed") {
      console.log("Pipeline completed successfully!");
    } else if (status === "failed") {
      console.error("Pipeline failed.");
      process.exit(1);
    }
  } catch (err) {
    console.error("Error connecting to API:", err instanceof Error ? err.message : String(err));
    console.error(`Make sure the API server is running at ${apiUrl}`);
    process.exit(1);
  }
}
