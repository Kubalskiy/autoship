import { Queue } from "bullmq";
import { createRedisConnection } from "./connection.js";

export interface PipelineJobData {
  runId: string;
  pipelineId: string;
}

export const pipelineQueue = new Queue<PipelineJobData>("pipeline-runs", {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});
