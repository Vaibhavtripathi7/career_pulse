import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";

export const register = new Registry();
register.setDefaultLabels({ app: "careerpulse" });
collectDefaultMetrics({ register });

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export const emailsProcessedTotal = new Counter({
  name: "emails_processed_total",
  help: "Emails processed by the sync pipeline, labelled by outcome",
  labelNames: ["outcome"],
  registers: [register],
});

export const emailSyncDuration = new Histogram({
  name: "email_sync_duration_seconds",
  help: "Duration of a full per-user email sync",
  buckets: [0.5, 1, 2, 5, 10, 30, 60, 120],
  registers: [register],
});

export const llmCallsTotal = new Counter({
  name: "llm_calls_total",
  help: "Gemini LLM calls, labelled by outcome",
  labelNames: ["outcome"],
  registers: [register],
});

export const llmCallDuration = new Histogram({
  name: "llm_call_duration_seconds",
  help: "Latency of Gemini LLM calls in seconds",
  buckets: [0.2, 0.5, 1, 2, 5, 10, 15],
  registers: [register],
});

export const emailQueueJobs = new Gauge({
  name: "email_queue_jobs",
  help: "BullMQ email-sync queue jobs by state",
  labelNames: ["state"],
  registers: [register],
});
