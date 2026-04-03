import { writeFileSync, existsSync } from "node:fs";
import { stringify } from "yaml";

interface InitOptions {
  name: string;
  file: string;
  template: string;
}

const templates: Record<string, { description: string; build: (name: string) => object }> = {
  basic: {
    description: "Simple single-agent code generation pipeline",
    build: (name) => ({
      name,
      description: `Pipeline: ${name}`,
      steps: [
        {
          name: "generate",
          agent: "claude",
          prompt:
            "Generate the code for the feature described in the project requirements.",
        },
        {
          name: "test",
          agent: "claude",
          prompt:
            "Write and run tests for the generated code.",
          dependsOn: ["generate"],
        },
      ],
    }),
  },
  "multi-agent": {
    description: "Design → implement → test → review workflow",
    build: (name) => ({
      name,
      description: `Pipeline: ${name}`,
      steps: [
        {
          name: "design",
          agent: "claude",
          prompt:
            "Design the architecture for the feature described in the project requirements.",
        },
        {
          name: "implement",
          agent: "claude",
          prompt:
            "Implement the feature based on the architecture design.",
          dependsOn: ["design"],
        },
        {
          name: "test",
          agent: "claude",
          prompt:
            "Write and run tests for the implemented feature.",
          dependsOn: ["implement"],
        },
        {
          name: "review",
          agent: "claude",
          prompt:
            "Review all code for correctness, security, and best practices. Write a summary.",
          dependsOn: ["implement", "test"],
        },
      ],
    }),
  },
  cicd: {
    description: "CI/CD pipeline: lint, typecheck, test, build, deploy",
    build: (name) => ({
      name,
      description: `Pipeline: ${name}`,
      steps: [
        {
          name: "lint",
          agent: "claude",
          prompt: "Run the project linter and auto-fix any errors.",
        },
        {
          name: "typecheck",
          agent: "claude",
          prompt: "Run type checking and fix any type errors.",
        },
        {
          name: "test",
          agent: "claude",
          prompt: "Run the test suite and fix any failures.",
          dependsOn: ["lint", "typecheck"],
        },
        {
          name: "build",
          agent: "claude",
          prompt: "Produce a production build and verify output artifacts.",
          dependsOn: ["test"],
        },
        {
          name: "deploy",
          agent: "claude",
          prompt: "Deploy the build artifacts to the target platform.",
          dependsOn: ["build"],
        },
      ],
    }),
  },
};

export async function initCommand(options: InitOptions) {
  const { name, file, template } = options;

  if (existsSync(file)) {
    console.error(`Error: ${file} already exists. Use a different filename.`);
    process.exit(1);
  }

  const selected = templates[template];
  if (!selected) {
    console.error(`Error: Unknown template "${template}".`);
    console.error(`Available templates:`);
    for (const [key, t] of Object.entries(templates)) {
      console.error(`  ${key.padEnd(14)} ${t.description}`);
    }
    process.exit(1);
  }

  const pipeline = selected.build(name);
  const yamlContent = stringify(pipeline, { lineWidth: 0 });
  writeFileSync(file, yamlContent, "utf-8");
  console.log(`Created ${file} (template: ${template})`);
  console.log(`\nEdit the file to customize your pipeline, then run:`);
  console.log(`  autoship run -f ${file}`);
}
