import type { PipelineStep } from "@autoship/shared";

export interface AgentResult {
  output: string;
  success: boolean;
}

export async function executeAgent(step: PipelineStep): Promise<AgentResult> {
  console.log(
    `[agent-orchestrator] Executing step "${step.name}" with agent "${step.agent}"`
  );
  console.log(`[agent-orchestrator] Prompt: ${step.prompt.slice(0, 100)}...`);

  // Simulate agent execution time (1-3s)
  const duration = 1000 + Math.random() * 2000;
  await new Promise((resolve) => setTimeout(resolve, duration));

  // Stub: in production, this would call the AI provider API
  // based on step.agent (e.g., "claude", "gpt-4", "codex")
  const output = [
    `Agent "${step.agent}" processed step "${step.name}".`,
    `Prompt received: "${step.prompt.slice(0, 80)}"`,
    `Execution completed in ${Math.round(duration)}ms.`,
    `Result: Task completed successfully.`,
  ].join("\n");

  return { output, success: true };
}

export function resolveExecutionOrder(
  steps: PipelineStep[]
): PipelineStep[][] {
  const stepMap = new Map(steps.map((s) => [s.name, s]));
  const resolved: string[] = [];
  const batches: PipelineStep[][] = [];

  while (resolved.length < steps.length) {
    const batch = steps.filter(
      (s) =>
        !resolved.includes(s.name) &&
        (s.dependsOn ?? []).every((dep) => resolved.includes(dep))
    );

    if (batch.length === 0) {
      throw new Error(
        "Circular dependency detected in pipeline steps"
      );
    }

    batches.push(batch);
    resolved.push(...batch.map((s) => s.name));
  }

  return batches;
}
