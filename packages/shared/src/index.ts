export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  config: PipelineConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineConfig {
  steps: PipelineStep[];
}

export interface PipelineStep {
  name: string;
  agent: string;
  prompt: string;
  dependsOn?: string[];
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  logs: RunLog[];
}

export interface RunLog {
  stepName: string;
  output: string;
  timestamp: Date;
}
