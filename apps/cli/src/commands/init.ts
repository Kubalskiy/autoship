import { writeFileSync, existsSync } from "node:fs";
import { stringify } from "yaml";

interface InitOptions {
  name: string;
  file: string;
}

export async function initCommand(options: InitOptions) {
  const { name, file } = options;

  if (existsSync(file)) {
    console.error(`Error: ${file} already exists. Use a different filename.`);
    process.exit(1);
  }

  const template = {
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
    ],
  };

  const yamlContent = stringify(template, { lineWidth: 0 });
  writeFileSync(file, yamlContent, "utf-8");
  console.log(`Created ${file}`);
  console.log(`\nEdit the file to customize your pipeline, then run:`);
  console.log(`  autoship run -f ${file}`);
}
