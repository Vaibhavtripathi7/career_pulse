// Load test for the Gmail ingestion pipeline.
//
// Usage:
//   node loadtest/run.ts
//   node loadtest/run.ts --repeats 1 --skip-adversarial
//
// Runs the real worker code against a local Postgres and Redis (docker-compose.yml).
// Gmail and Gemini are replaced with fakes through module hooks, see register.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, fork, spawnSync, type ChildProcess } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import pg from "pg";
import { QueueEvents } from "bullmq";
import type { Counters } from "./fakes/state.ts";
import type { OracleResult } from "./oracle.ts";
import type { WorkerMessage } from "./lib/messages.ts";
import { DEFAULT_CONFIG, mulberry32, userId, type LoadConfig } from "./mailbox.ts";
import { histogramQuantile, mergeHistograms, parseHistogram, quantile, type Histogram } from "./lib/stats.ts";
import {
  cgroupCpuSeconds,
  containerCpuStatPath,
  perCpuSnapshot,
  machineCpu,
  machineSpecs,
  memInfo,
  procCpuSeconds,
  procRssMB,
  type MachineSpecs,
} from "./lib/system.ts";
import { writeReport } from "./lib/report.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const COMPOSE = path.join(HERE, "docker-compose.yml");
const PG_URL = "postgresql://loadtest:loadtest@127.0.0.1:5433/careerpulse_loadtest";
const REDIS = { host: "127.0.0.1", port: 6380 };
const CONTAINERS = { postgres: "careerpulse_lt_postgres", redis: "careerpulse_lt_redis" };

interface Options {
  cfg: LoadConfig;
  workers: number[];
  repeats: number;
  advWorkers: number;
  killEveryMs: number;
  skipScaling: boolean;
  skipAdversarial: boolean;
  build: boolean;
  keepInfra: boolean;
  /** Write a CPU profile per worker. Adds some overhead. */
  profile: boolean;
  /** Write results/<tag>.json and results/<tag>.md instead of RESULTS.md. */
  tag: string | undefined;
}

function parseOptions(argv: string[]): Options {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const num = (flag: string, fallback: number) => Number(get(flag) ?? fallback);
  return {
    cfg: {
      ...DEFAULT_CONFIG,
      messages: num("--messages", DEFAULT_CONFIG.messages),
      users: num("--users", DEFAULT_CONFIG.users),
      seed: num("--seed", DEFAULT_CONFIG.seed),
    },
    workers: (get("--workers") ?? "1,2,4,8").split(",").map(Number),
    repeats: num("--repeats", 3),
    advWorkers: num("--adv-workers", 4),
    killEveryMs: num("--kill-every-ms", 5000),
    skipScaling: argv.includes("--skip-scaling"),
    skipAdversarial: argv.includes("--skip-adversarial"),
    build: !argv.includes("--no-build"),
    keepInfra: argv.includes("--keep-infra"),
    profile: argv.includes("--profile"),
    tag: get("--tag"),
  };
}

const opts = parseOptions(process.argv.slice(2));
const log = (msg: string) => console.log(`[loadtest ${new Date().toISOString().slice(11, 19)}] ${msg}`);

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv = process.env): void {
  const r = spawnSync(cmd, args, { cwd: ROOT, env, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed (exit ${r.status})`);
}

function ensureCerts(): void {
  const dir = path.join(HERE, ".certs");
  if (fs.existsSync(path.join(dir, "server.key"))) return;
  fs.mkdirSync(dir, { recursive: true });
  execFileSync("openssl", [
    "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "30", "-subj", "/CN=localhost",
    "-keyout", path.join(dir, "server.key"), "-out", path.join(dir, "server.crt"),
  ], { stdio: "ignore" });
}

const childEnv: NodeJS.ProcessEnv = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  // production mode: JSON logs and TLS to Postgres (see src/db.ts)
  NODE_ENV: "production",
  DATABASE_URL: PG_URL,
  REDIS_HOST: REDIS.host,
  REDIS_PORT: String(REDIS.port),
  // gemini is stubbed anyway, this just makes sure no key is picked up
  GEMINI_API_KEY: "",
  LT_CONFIG: JSON.stringify(opts.cfg),
};

interface WorkerHandle {
  index: number;
  child: ChildProcess;
  pid: number;
  ready: Promise<void>;
  isReady: boolean;
  alive: boolean;
  killedByUs: boolean;
  active: Set<string>;
  counters: Counters | null;
  port: number;
  stderr: string;
}

interface JobTiming {
  jobId: string;
  userId: string;
  timestamp: number;
  processedOn: number;
  finishedOn: number;
}

let profileDir: string | null = null;

class RunState {
  workers: WorkerHandle[] = [];
  timings = new Map<string, JobTiming>();
  ipcFailures: { jobId: string; reason: string }[] = [];
  private nextIndex = 0;
  private finalWaiters = new Map<number, (c: Counters) => void>();

  spawn(): WorkerHandle {
    const index = this.nextIndex++;
    const port = 9400 + index;
    const child = fork(path.join(HERE, "worker.ts"), [], {
      cwd: HERE, // no .env here, so dotenv in production code loads nothing
      env: { ...childEnv, LT_METRICS_PORT: String(port) },
      execArgv: [
        "--import", path.join(HERE, "register.mjs"),
        // keep node's default file names, they include the thread id
        ...(profileDir ? ["--cpu-prof", `--cpu-prof-dir=${profileDir}`] : []),
      ],
      stdio: ["ignore", "ignore", "pipe", "ipc"], // pino output goes to /dev/null
    });
    let resolveReady!: () => void;
    let rejectReady!: (e: Error) => void;
    const ready = new Promise<void>((res, rej) => {
      resolveReady = res;
      rejectReady = rej;
    });
    const handle: WorkerHandle = {
      index, child, pid: child.pid ?? -1, ready, isReady: false, alive: true, killedByUs: false,
      active: new Set(), counters: null, port, stderr: "",
    };
    child.stderr?.on("data", (d: Buffer) => {
      handle.stderr = (handle.stderr + d.toString()).slice(-4000);
    });
    child.on("message", (m: WorkerMessage) => this.onMessage(handle, m, resolveReady));
    child.on("exit", (code, signal) => {
      handle.alive = false;
      rejectReady(new Error(`worker ${index} exited before ready (${code ?? signal}): ${handle.stderr}`));
      if (!handle.killedByUs && code !== 0 && signal !== "SIGTERM") {
        log(`worker ${index} died unexpectedly (${code ?? signal}): ${handle.stderr.slice(-500)}`);
      }
    });
    this.workers.push(handle);
    return handle;
  }

  private onMessage(w: WorkerHandle, m: WorkerMessage, resolveReady: () => void): void {
    switch (m.type) {
      case "ready":
        w.isReady = true;
        resolveReady();
        break;
      case "active":
        w.active.add(m.jobId);
        break;
      case "completed":
        w.active.delete(m.jobId);
        this.timings.set(m.jobId, m);
        break;
      case "failed":
        w.active.delete(m.jobId);
        this.ipcFailures.push({ jobId: m.jobId, reason: m.reason });
        break;
      case "counters": {
        const { type: _t, final, ...counters } = m;
        w.counters = counters;
        if (final) this.finalWaiters.get(w.index)?.(counters);
        break;
      }
    }
  }

  alive(): WorkerHandle[] {
    return this.workers.filter((w) => w.alive);
  }

  async finalCounters(w: WorkerHandle): Promise<Counters | null> {
    if (!w.alive) return w.counters;
    const reply = new Promise<Counters>((res) => this.finalWaiters.set(w.index, res));
    w.child.send({ type: "report" });
    return Promise.race([reply, sleep(5000).then(() => w.counters)]);
  }

  async stopAll(): Promise<void> {
    await Promise.all(this.alive().map(async (w) => {
      const exited = new Promise((res) => w.child.once("exit", res));
      w.child.kill("SIGTERM");
      const done = await Promise.race([exited.then(() => true), sleep(15000).then(() => false)]);
      if (!done) w.child.kill("SIGKILL");
    }));
  }
}

interface ResourceSummary {
  windowMs: number;
  workerCpuSeconds: number;
  workerCpuCores: number;
  perWorkerCpuPct: number;
  machineBusyPct: number;
  meanCpuMHz: number | null;
  postgresCpuCores: number | null;
  redisCpuCores: number | null;
  orchestratorCpuCores: number;
  peakPgConnections: number;
  peakPgTlsConnections: number;
  avgPgConnections: number;
  redisCommands: number;
  redisCommandsPerSec: number;
  peakRedisOpsPerSec: number;
  peakWorkerRssMB: number;
  minMemAvailableMB: number;
  maxSwapUsedMB: number;
}

interface RedisInfo {
  info(section: string): Promise<string>;
}

function infoField(text: string, key: string): number {
  return Number(new RegExp(`^${key}:(\\d+)`, "m").exec(text)?.[1] ?? 0);
}

class Sampler {
  private pool: pg.Pool;
  private redis: RedisInfo;
  private state: RunState;
  private cgroups: { postgres: string | null; redis: string | null };
  private timer: NodeJS.Timeout | undefined;
  private ticking = false;
  private t0 = 0;
  private machine0 = machineCpu();
  private cg0 = { postgres: 0, redis: 0 };
  private redis0 = 0;
  private orch0 = process.cpuUsage();
  private cpu = new Map<number, { first: number; last: number }>();
  private pgSamples: number[] = [];
  private peakPg = 0;
  private peakPgTls = 0;
  private peakRedisOps = 0;
  private peakRss = 0;
  private minAvail = Number.POSITIVE_INFINITY;
  private maxSwap = 0;
  private prevCpu: number[] | null = null;
  private clockWeighted = 0;
  private clockWeight = 0;

  constructor(pool: pg.Pool, redis: RedisInfo, state: RunState, cgroups: { postgres: string | null; redis: string | null }) {
    this.pool = pool;
    this.redis = redis;
    this.state = state;
    this.cgroups = cgroups;
  }

  async start(): Promise<void> {
    this.t0 = Date.now();
    this.machine0 = machineCpu();
    this.orch0 = process.cpuUsage();
    this.cg0 = {
      postgres: this.cgroups.postgres ? cgroupCpuSeconds(this.cgroups.postgres) ?? 0 : 0,
      redis: this.cgroups.redis ? cgroupCpuSeconds(this.cgroups.redis) ?? 0 : 0,
    };
    this.redis0 = infoField(await this.redis.info("stats"), "total_commands_processed");
    for (const w of this.state.alive()) {
      const s = procCpuSeconds(w.pid);
      if (s !== null) this.cpu.set(w.pid, { first: s, last: s });
    }
    this.timer = setInterval(() => void this.tick(), 200);
  }

  private async tick(): Promise<void> {
    if (this.ticking) return;
    this.ticking = true;
    try {
      const { rows } = await this.pool.query<{ total: number; tls: number }>(
        `SELECT count(*)::int AS total, count(*) FILTER (WHERE s.ssl)::int AS tls
           FROM pg_stat_activity a JOIN pg_stat_ssl s USING (pid)
          WHERE a.datname = current_database() AND a.backend_type = 'client backend'
            AND a.application_name <> 'lt-orchestrator'`);
      const total = rows[0]?.total ?? 0;
      this.pgSamples.push(total);
      this.peakPg = Math.max(this.peakPg, total);
      this.peakPgTls = Math.max(this.peakPgTls, rows[0]?.tls ?? 0);

      const stats = await this.redis.info("stats");
      this.peakRedisOps = Math.max(this.peakRedisOps, infoField(stats, "instantaneous_ops_per_sec"));

      for (const w of this.state.workers) {
        if (!w.alive) continue;
        const s = procCpuSeconds(w.pid);
        if (s !== null) {
          const entry = this.cpu.get(w.pid);
          if (entry) entry.last = s;
          else this.cpu.set(w.pid, { first: 0, last: s }); // started mid-run, count from zero
        }
        this.peakRss = Math.max(this.peakRss, procRssMB(w.pid) ?? 0);
      }
      // average clock of the cores that were busy since the last tick
      const snap = perCpuSnapshot();
      if (this.prevCpu) {
        snap.busy.forEach((b, i) => {
          const d = b - (this.prevCpu?.[i] ?? b);
          const mhz = snap.mhz[i];
          if (mhz != null && d > 0) {
            this.clockWeighted += mhz * d;
            this.clockWeight += d;
          }
        });
      }
      this.prevCpu = snap.busy;
      const mem = memInfo();
      this.minAvail = Math.min(this.minAvail, mem.availableMB);
      this.maxSwap = Math.max(this.maxSwap, mem.swapUsedMB);
    } finally {
      this.ticking = false;
    }
  }

  async stop(endMs = Date.now()): Promise<ResourceSummary> {
    clearInterval(this.timer);
    await this.tick();
    const windowMs = Math.max(1, endMs - this.t0);
    const windowS = windowMs / 1000;
    const machine1 = machineCpu();
    const workerCpuSeconds = [...this.cpu.values()].reduce((a, c) => a + (c.last - c.first), 0);
    const cg = (key: "postgres" | "redis") => {
      const p = this.cgroups[key];
      const now = p ? cgroupCpuSeconds(p) : null;
      return now === null ? null : (now - this.cg0[key]) / windowS;
    };
    const redis1 = infoField(await this.redis.info("stats"), "total_commands_processed");
    const orch = process.cpuUsage(this.orch0);
    const workersSeen = Math.max(1, this.cpu.size);
    return {
      windowMs,
      workerCpuSeconds,
      workerCpuCores: workerCpuSeconds / windowS,
      perWorkerCpuPct: (workerCpuSeconds / windowS / workersSeen) * 100,
      machineBusyPct: ((machine1.busy - this.machine0.busy) / Math.max(1, machine1.total - this.machine0.total)) * 100,
      meanCpuMHz: this.clockWeight > 0 ? this.clockWeighted / this.clockWeight : null,
      postgresCpuCores: cg("postgres"),
      redisCpuCores: cg("redis"),
      orchestratorCpuCores: (orch.user + orch.system) / 1e6 / windowS,
      peakPgConnections: this.peakPg,
      peakPgTlsConnections: this.peakPgTls,
      avgPgConnections: this.pgSamples.reduce((a, b) => a + b, 0) / Math.max(1, this.pgSamples.length),
      redisCommands: redis1 - this.redis0,
      redisCommandsPerSec: (redis1 - this.redis0) / windowS,
      peakRedisOpsPerSec: this.peakRedisOps,
      peakWorkerRssMB: this.peakRss,
      minMemAvailableMB: this.minAvail,
      maxSwapUsedMB: this.maxSwap,
    };
  }
}

log(`config: ${JSON.stringify(opts.cfg)}`);
const specs: MachineSpecs = machineSpecs();
log(`machine: ${specs.cpuModel}, ${specs.physicalCores} cores / ${specs.logicalCpus} threads, ` +
  `${specs.ramGiB} GiB RAM, ${specs.os} (kernel ${specs.kernel}), Node ${specs.node}, Docker ${specs.docker}, ` +
  `load avg ${specs.loadAverage.join(" ")}, ${specs.memAvailableMB} MB available`);

ensureCerts();
log("starting Postgres + Redis (loadtest/docker-compose.yml)");
run("docker", ["compose", "-f", COMPOSE, "up", "-d", "--wait"]);
if (opts.build) {
  log("building dist/ (npm run build)");
  run("npm", ["run", "build", "--silent"]);
}
log("applying migrations to the load-test database");
run("npx", ["prisma", "migrate", "deploy"], { ...process.env, DATABASE_URL: PG_URL, CHECKPOINT_DISABLE: "1" });

// email.queue.js reads REDIS_HOST/PORT at import time
process.env.REDIS_HOST = REDIS.host;
process.env.REDIS_PORT = String(REDIS.port);
const { emailQueue } = await import("../dist/queues/email.queue.js");
const redis: RedisInfo = await emailQueue.client;

const pool = new pg.Pool({ connectionString: PG_URL, application_name: "lt-orchestrator", max: 3 });
const versions = {
  postgres: (await pool.query<{ v: string }>("SELECT current_setting('server_version') AS v")).rows[0]?.v ?? "?",
  redis: /^redis_version:(\S+)/m.exec(await redis.info("server"))?.[1] ?? "?",
  bullmq: JSON.parse(fs.readFileSync(path.join(ROOT, "node_modules/bullmq/package.json"), "utf8")).version as string,
  commit: execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT }).toString().trim(),
};
const cgroups = { postgres: containerCpuStatPath(CONTAINERS.postgres), redis: containerCpuStatPath(CONTAINERS.redis) };

log("oracle: running the production parser over every unique message");
const oracle = await new Promise<OracleResult>((resolve, reject) => {
  const child = fork(path.join(HERE, "oracle.ts"), [], {
    cwd: HERE, env: childEnv, execArgv: ["--import", path.join(HERE, "register.mjs")],
    stdio: ["ignore", "ignore", "inherit", "ipc"],
  });
  child.on("message", (m: OracleResult) => resolve(m));
  child.on("exit", (code) => code !== 0 && reject(new Error(`oracle exited ${code}`)));
});
const expected = new Set(oracle.expectedKeys);
log(`oracle: ${oracle.uniqueMessages} unique / ${oracle.deliveries} deliveries -> ${expected.size} expected rows, ` +
  `${oracle.llmCallsPerPass} LLM calls per pass, pipeline ${(oracle.uniqueMessages / (oracle.pipelineMs / 1000)).toFixed(0)} msgs/s single-threaded`);

const queueEvents = new QueueEvents("email-sync", { connection: REDIS });
await queueEvents.waitUntilReady();
const events = { completed: new Set<string>(), failed: new Map<string, string>(), stalled: [] as string[] };
queueEvents.on("completed", ({ jobId }) => events.completed.add(jobId));
queueEvents.on("failed", ({ jobId, failedReason }) => events.failed.set(jobId, failedReason));
queueEvents.on("stalled", ({ jobId }) => events.stalled.push(jobId));
function resetEvents(): void {
  events.completed.clear();
  events.failed.clear();
  events.stalled.length = 0;
}

async function resetData(): Promise<void> {
  await emailQueue.obliterate({ force: true });
  await pool.query(`TRUNCATE "Application", "User" CASCADE`);
  await pool.query(
    `INSERT INTO "User" (id, email, "refreshToken", "accessToken", "updatedAt")
     SELECT 'lt-user-' || lpad(i::text, 5, '0'), 'lt-user-' || lpad(i::text, 5, '0') || '@loadtest.invalid',
            'lt-refresh:' || i, 'lt-access', now()
       FROM generate_series(0, $1::int - 1) AS i`,
    [opts.cfg.users]);
}

const jobSpecs = (users: number[]) => users.map((u) => ({ name: "sync-user", data: { userId: userId(u) } }));
const allUsers = Array.from({ length: opts.cfg.users }, (_, u) => u);

async function waitForDrain(pollMs: number, stableTicks: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let stable = 0;
  for (;;) {
    const counts = await emailQueue.getJobCounts("waiting", "active", "delayed", "prioritized", "paused", "waiting-children");
    const pending = Object.values(counts).reduce((a, b) => a + b, 0);
    stable = pending === 0 ? stable + 1 : 0;
    if (stable >= stableTicks) return;
    if (Date.now() > deadline) throw new Error(`queue did not drain: ${JSON.stringify(counts)}`);
    await sleep(pollMs);
  }
}

export interface Verification {
  rows: number;
  expected: number;
  missing: number;
  extra: number;
  duplicateGroups: number;
  pass: boolean;
}

async function verify(): Promise<Verification> {
  const { rows } = await pool.query<{ k: string }>(`SELECT "userID" || '|' || "messageId" AS k FROM "Application"`);
  const dup = await pool.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM (SELECT 1 FROM "Application" GROUP BY "userID", "messageId" HAVING count(*) > 1) d`);
  const found = new Set(rows.map((r) => r.k));
  let missing = 0;
  for (const k of expected) if (!found.has(k)) missing++;
  let extra = 0;
  for (const k of found) if (!expected.has(k)) extra++;
  const duplicateGroups = dup.rows[0]?.n ?? 0;
  return { rows: rows.length, expected: expected.size, missing, extra, duplicateGroups,
    pass: missing === 0 && extra === 0 && duplicateGroups === 0 && rows.length === expected.size };
}

async function scrapeHistogram(workers: WorkerHandle[]): Promise<Histogram | null> {
  const parts: Histogram[] = [];
  for (const w of workers) {
    const text = await (await fetch(`http://127.0.0.1:${w.port}/metrics`)).text();
    const h = parseHistogram(text, "email_sync_duration_seconds");
    if (h) parts.push(h);
  }
  return mergeHistograms(parts);
}

function sumCounters(list: (Counters | null)[]): Counters {
  const total: Counters = { gmailListCalls: 0, gmailGetCalls: 0, llmCalls: 0, fakeSourceMs: 0 };
  for (const c of list) {
    if (!c) continue;
    total.gmailListCalls += c.gmailListCalls;
    total.gmailGetCalls += c.gmailGetCalls;
    total.llmCalls += c.llmCalls;
    total.fakeSourceMs += c.fakeSourceMs;
  }
  return total;
}

export interface ScalingRun {
  workers: number;
  repeat: number;
  jobs: number;
  deliveries: number;
  drainMs: number;
  msgsPerSec: number;
  jobMs: { p50: number; p95: number; max: number };
  endToEndMs: { p50: number; p95: number };
  histogram: { p50Ms: number; p95Ms: number; count: number; buckets: Histogram["buckets"] } | null;
  llmCalls: number;
  fakeSourceSeconds: number;
  failedJobs: number;
  resources: ResourceSummary;
  verify: Verification;
}

async function scalingRun(workers: number, repeat: number): Promise<ScalingRun> {
  await resetData();
  resetEvents();
  const state = new RunState();
  profileDir = opts.profile ? path.join(HERE, "results", "profiles", `${opts.tag ?? "run"}-w${workers}-r${repeat}`) : null;
  for (let i = 0; i < workers; i++) state.spawn();
  await Promise.all(state.workers.map((w) => w.ready));
  await sleep(500);

  const sampler = new Sampler(pool, redis, state, cgroups);
  await sampler.start();
  const t0 = Date.now();
  await emailQueue.addBulk(jobSpecs(allUsers));
  await waitForDrain(100, 1, 30 * 60 * 1000);
  const deadline = Date.now() + 5000;
  while (state.timings.size + state.ipcFailures.length < opts.cfg.users && Date.now() < deadline) await sleep(20);

  const timings = [...state.timings.values()];
  const t1 = Math.max(...timings.map((t) => t.finishedOn));
  const resources = await sampler.stop(t1);
  const histogram = await scrapeHistogram(state.workers);
  const counters = sumCounters(await Promise.all(state.workers.map((w) => state.finalCounters(w))));
  const verification = await verify();
  await state.stopAll();

  const drainMs = t1 - t0;
  const result: ScalingRun = {
    workers,
    repeat,
    jobs: opts.cfg.users,
    deliveries: counters.gmailGetCalls,
    drainMs,
    msgsPerSec: counters.gmailGetCalls / (drainMs / 1000),
    jobMs: {
      p50: quantile(timings.map((t) => t.finishedOn - t.processedOn), 0.5),
      p95: quantile(timings.map((t) => t.finishedOn - t.processedOn), 0.95),
      max: Math.max(...timings.map((t) => t.finishedOn - t.processedOn)),
    },
    endToEndMs: {
      p50: quantile(timings.map((t) => t.finishedOn - t.timestamp), 0.5),
      p95: quantile(timings.map((t) => t.finishedOn - t.timestamp), 0.95),
    },
    histogram: histogram && {
      p50Ms: histogramQuantile(0.5, histogram) * 1000,
      p95Ms: histogramQuantile(0.95, histogram) * 1000,
      count: histogram.count,
      buckets: histogram.buckets,
    },
    llmCalls: counters.llmCalls,
    fakeSourceSeconds: counters.fakeSourceMs / 1000,
    failedJobs: events.failed.size,
    resources,
    verify: verification,
  };
  log(`workers=${workers} #${repeat}: ${result.msgsPerSec.toFixed(0)} msgs/s, drain ${(drainMs / 1000).toFixed(2)} s, ` +
    `job p50/p95 ${result.jobMs.p50.toFixed(0)}/${result.jobMs.p95.toFixed(0)} ms, ` +
    `worker CPU ${resources.workerCpuCores.toFixed(2)} cores, machine ${resources.machineBusyPct.toFixed(0)}%, ` +
    `PG peak ${resources.peakPgConnections} conns, rows ${verification.rows}/${verification.expected} ` +
    `${verification.pass ? "OK" : "MISMATCH"}, LLM stub ${counters.llmCalls}/${oracle.llmCallsPerPass}`);
  return result;
}

const scaling: ScalingRun[] = [];
if (!opts.skipScaling) {
  for (let r = 1; r <= opts.repeats; r++) {
    for (const n of opts.workers) {
      scaling.push(await scalingRun(n, r));
      await sleep(3000); // let the CPU settle between runs
    }
  }
}

export interface AdversarialRun {
  workers: number;
  batches: number;
  jobsEnqueued: number;
  killEveryMs: number;
  kills: { atMs: number; pid: number; inFlight: string[] }[];
  jobsInterrupted: number;
  interruptedFate: { completed: number; failed: number; unknown: number };
  stalledEvents: number;
  stalledJobs: number;
  failedJobs: { jobId: string; userId: string; reason: string }[];
  completedJobs: number;
  usersWithoutCompletedJob: number;
  drainMs: number;
  approxDeliveries: number;
  approxLlmCalls: number;
  resources: ResourceSummary;
  verify: Verification;
  recovery: { usersReenqueued: number; verify: Verification } | null;
}

async function adversarialRun(): Promise<AdversarialRun> {
  await resetData();
  resetEvents();
  const state = new RunState();
  for (let i = 0; i < opts.advWorkers; i++) state.spawn();
  await Promise.all(state.workers.map((w) => w.ready));
  await sleep(500);

  const sampler = new Sampler(pool, redis, state, cgroups);
  await sampler.start();
  const t0 = Date.now();
  // same batch three times at once, no job ids (the cron doesn't set them either)
  const batches = await Promise.all([0, 1, 2].map(() => emailQueue.addBulk(jobSpecs(allUsers))));
  const jobUser = new Map<string, string>();
  for (const b of batches) for (const j of b) jobUser.set(j.id ?? "", j.data.userId);

  const rng = mulberry32(opts.cfg.seed);
  const kills: AdversarialRun["kills"] = [];
  let chaos = true;
  const chaosLoop = (async () => {
    while (chaos) {
      await sleep(opts.killEveryMs * (0.8 + 0.4 * rng())); // 4 to 6 s with the default 5 s
      if (!chaos) break;
      // skip replacements that are still starting up
      const candidates = state.alive().filter((w) => w.isReady && !w.killedByUs);
      const victim = candidates[Math.floor(rng() * candidates.length)];
      if (!victim) continue;
      victim.killedByUs = true;
      kills.push({ atMs: Date.now() - t0, pid: victim.pid, inFlight: [...victim.active] });
      victim.child.kill("SIGKILL");
      const replacement = state.spawn();
      replacement.ready.catch((e: Error) => log(`replacement worker failed: ${e.message}`));
    }
  })();

  await waitForDrain(500, 3, 30 * 60 * 1000);
  chaos = false;
  await chaosLoop;
  const t1 = Date.now();
  const resources = await sampler.stop(t1);
  const counters = sumCounters(await Promise.all(state.workers.map((w) => state.finalCounters(w))));
  const verification = await verify();

  const interrupted = new Set(kills.flatMap((k) => k.inFlight));
  const fate = { completed: 0, failed: 0, unknown: 0 };
  for (const id of interrupted) {
    if (events.completed.has(id)) fate.completed++;
    else if (events.failed.has(id)) fate.failed++;
    else fate.unknown++;
  }
  const usersCompleted = new Set([...events.completed].map((id) => jobUser.get(id)));
  const failedJobs = [...events.failed].map(([jobId, reason]) => ({ jobId, userId: jobUser.get(jobId) ?? "?", reason }));

  // production recovers on the next cron run since lastSyncAt only moves after a
  // clean sync, so if anything is missing, re-sync those users once
  let recovery: AdversarialRun["recovery"] = null;
  if (!verification.pass) {
    const found = new Set((await pool.query<{ u: string }>(`SELECT DISTINCT "userID" AS u FROM "Application"`)).rows.map((r) => r.u));
    const missingUsers = new Set<number>();
    for (const k of expected) {
      const u = k.split("|")[0] ?? "";
      if (!found.has(u)) missingUsers.add(Number(u.slice("lt-user-".length)));
    }
    for (const f of failedJobs) missingUsers.add(Number(f.userId.slice("lt-user-".length)));
    await emailQueue.addBulk(jobSpecs([...missingUsers]));
    await waitForDrain(500, 3, 10 * 60 * 1000);
    recovery = { usersReenqueued: missingUsers.size, verify: await verify() };
  }
  await state.stopAll();

  const result: AdversarialRun = {
    workers: opts.advWorkers,
    batches: 3,
    jobsEnqueued: jobUser.size,
    killEveryMs: opts.killEveryMs,
    kills,
    jobsInterrupted: interrupted.size,
    interruptedFate: fate,
    stalledEvents: events.stalled.length,
    stalledJobs: new Set(events.stalled).size,
    failedJobs,
    completedJobs: events.completed.size,
    usersWithoutCompletedJob: opts.cfg.users - usersCompleted.size,
    drainMs: t1 - t0,
    approxDeliveries: counters.gmailGetCalls,
    approxLlmCalls: counters.llmCalls,
    resources,
    verify: verification,
    recovery,
  };
  log(`adversarial: ${kills.length} kills, ${interrupted.size} jobs interrupted, ${result.stalledJobs} stalled, ` +
    `${failedJobs.length} failed, rows ${verification.rows}/${verification.expected}, missing ${verification.missing}, ` +
    `extra ${verification.extra}, duplicates ${verification.duplicateGroups} -> ${verification.pass ? "PASS" : "FAIL"}`);
  return result;
}

const adversarial = opts.skipAdversarial ? null : await adversarialRun();

const results = {
  generatedAt: new Date().toISOString(),
  command: `node loadtest/run.ts ${process.argv.slice(2).join(" ")}`.trim(),
  config: opts.cfg,
  options: { workers: opts.workers, repeats: opts.repeats, advWorkers: opts.advWorkers, killEveryMs: opts.killEveryMs, profile: opts.profile },
  specs,
  versions,
  oracle: { ...oracle, expectedKeys: undefined, expectedRows: expected.size },
  scaling,
  adversarial,
};
fs.mkdirSync(path.join(HERE, "results"), { recursive: true });
const jsonOut = path.join(HERE, "results", `${opts.tag ?? "latest"}.json`);
const mdOut = opts.tag ? path.join(HERE, "results", `${opts.tag}.md`) : path.join(HERE, "RESULTS.md");
fs.writeFileSync(jsonOut, JSON.stringify(results, null, 2));
writeReport(mdOut, results, !opts.tag);
log(`wrote ${path.relative(ROOT, mdOut)} and ${path.relative(ROOT, jsonOut)}`);

await queueEvents.close();
await emailQueue.close();
await pool.end();
if (!opts.keepInfra) {
  log("stopping load-test containers");
  run("docker", ["compose", "-f", COMPOSE, "down", "-v"]);
}

export type Results = typeof results;
