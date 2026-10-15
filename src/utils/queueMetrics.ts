import { emailQueue } from "../queues/email.queue.js";
import { emailQueueJobs } from "./metrics.js";
import { logger } from "./logger.js";

const POLL_INTERVAL_MS = 15_000;

export function startQueueMetrics(): NodeJS.Timeout {
  const poll = async () => {
    try {
      const counts = await emailQueue.getJobCounts(
        "waiting",
        "active",
        "completed",
        "failed",
        "delayed"
      );
      for (const [state, value] of Object.entries(counts)) {
        emailQueueJobs.set({ state }, value);
      }
    } catch (err) {
      logger.warn({ err }, "Failed to poll email queue metrics");
    }
  };

  poll();
  return setInterval(poll, POLL_INTERVAL_MS);
}
