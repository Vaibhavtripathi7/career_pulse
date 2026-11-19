// IPC messages between worker processes and the orchestrator.
import type { Counters } from "../fakes/state.ts";

export type WorkerMessage =
  | { type: "ready"; pid: number; port: number }
  | { type: "active"; jobId: string }
  | {
      type: "completed";
      jobId: string;
      userId: string;
      timestamp: number;
      processedOn: number;
      finishedOn: number;
      attemptsMade: number;
    }
  | { type: "failed"; jobId: string; reason: string }
  | ({ type: "counters"; final: boolean } & Counters);

export type OrchestratorMessage = { type: "report" };
