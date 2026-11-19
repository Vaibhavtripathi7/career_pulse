// Worker process for the load test. Starts the production BullMQ worker from
// dist/email.worker.js without index.ts (so no express server or cron) and adds a
// /metrics endpoint plus IPC messages so run.ts can collect timings.
import http from "node:http";
import { emailWorker } from "../dist/email.worker.js";
import { register } from "../dist/utils/metrics.js";
import prisma from "../dist/db.js";
import { counters } from "./fakes/state.ts";
import type { OrchestratorMessage, WorkerMessage } from "./lib/messages.ts";

const port = Number(process.env.LT_METRICS_PORT);

function send(message: WorkerMessage): void {
  process.send?.(message);
}

emailWorker.on("active", (job) => {
  send({ type: "active", jobId: job.id ?? "" });
});

emailWorker.on("completed", (job) => {
  send({
    type: "completed",
    jobId: job.id ?? "",
    userId: job.data.userId,
    timestamp: job.timestamp,
    processedOn: job.processedOn ?? 0,
    finishedOn: job.finishedOn ?? Date.now(),
    attemptsMade: job.attemptsMade,
  });
});

emailWorker.on("failed", (job, err) => {
  send({ type: "failed", jobId: job?.id ?? "", reason: err.message });
});

const server = http.createServer(async (req, res) => {
  if (req.url === "/metrics") {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
    return;
  }
  res.statusCode = 404;
  res.end();
});
await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));

// connect to redis and open one pg connection before reporting ready
await emailWorker.waitUntilReady();
await prisma.$queryRaw`SELECT 1`;

const ticker = setInterval(() => send({ type: "counters", final: false, ...counters }), 250);
send({ type: "ready", pid: process.pid, port });

process.on("message", (message: OrchestratorMessage) => {
  if (message.type === "report") send({ type: "counters", final: true, ...counters });
});

process.on("SIGTERM", async () => {
  clearInterval(ticker);
  await emailWorker.close();
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});
