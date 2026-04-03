#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { runCommand } from "./commands/run.js";

const program = new Command();

program
  .name("autoship")
  .description("CLI for AutoShip - AI agent pipeline orchestration")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a new pipeline configuration file")
  .option("-n, --name <name>", "Pipeline name", "my-pipeline")
  .option(
    "-f, --file <file>",
    "Output file path",
    "autoship.yaml"
  )
  .action(initCommand);

program
  .command("run")
  .description("Run a pipeline from a configuration file")
  .option(
    "-f, --file <file>",
    "Pipeline config file path",
    "autoship.yaml"
  )
  .option(
    "--api-url <url>",
    "AutoShip API URL",
    "http://localhost:3001"
  )
  .option("--api-key <key>", "API key for authentication")
  .action(runCommand);

program.parse();
