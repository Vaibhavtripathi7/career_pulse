# Load test: Gmail ingestion pipeline

This runs the real ingestion path (BullMQ queue, production worker, `fetchemails()`,
parser, Postgres) with 100,000 fake Gmail messages. It measures throughput with
1, 2, 4 and 8 worker processes, then kills workers while the same batch is queued
three times and checks that the database ends up correct.

Nothing outside `loadtest/` is changed. Results are in [RESULTS.md](RESULTS.md).

## Running it

You need Docker, Node 24+ (the `.ts` files run directly) and OpenSSL.

```bash
node loadtest/run.ts                         # full run, about 15 minutes
node loadtest/run.ts --repeats 1 --skip-adversarial
node loadtest/run.ts --messages 5000 --users 50 --workers 1,2 --repeats 1   # quick check
npx tsc -p loadtest                          # type-check
```

Other options: `--adv-workers 4`, `--kill-every-ms 5000`, `--seed N`, `--skip-scaling`,
`--no-build`, `--keep-infra`.

To see where worker CPU goes:

```bash
node loadtest/run.ts --tag diag --repeats 1 --skip-adversarial --profile --workers 1,4,8
node loadtest/profile-summary.ts loadtest/results/profiles/diag-w1-r1
```

`--tag NAME` writes `results/NAME.json` and `results/NAME.md` instead of `RESULTS.md`.

It's a CPU benchmark on a single machine, so close anything heavy before running it.

## Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Postgres 15 (TLS) on port 5433 and Redis 7 on port 6380, separate from the dev stack |
| `mailbox.ts` | Seeded fake mailboxes: 10% job emails, 90% promo and other mail, 5% duplicate deliveries |
| `fakes/googleapis.ts` | Fake Gmail client (`messages.list` in pages of 50, `messages.get`) |
| `fakes/gemini.parser.ts` | LLM fallback stub that only counts calls |
| `register.mjs`, `hooks.mjs` | Load the fakes through ESM resolve hooks and block non-local connections |
| `worker.ts` | Starts the production worker from `dist/email.worker.js` without the API server or cron |
| `oracle.ts` | Runs the parser over every unique message to get the exact rows a full sync should produce |
| `run.ts` | Starts everything, runs the scaling and kill tests, samples resources, checks the database |
| `lib/` | Stats, `/proc` and cgroup sampling, report writer |
| `profile-summary.ts` | Groups CPU profile time by component |

| In `results/` | |
|---|---|
| `latest.json` | Raw numbers behind RESULTS.md |
| `profile-summary.md` | Worker CPU by component at 1, 4 and 8 workers |
| `diag.*` | The profiling run (profiling adds a little overhead) |
| `adversarial-aggressive.*` | Kill test with a kill every 1.5 s on 50 users |
| `run1-browser-contended.json` | First full run, slowed by a busy browser, kept for reference |

## Design notes

- **One job per user.** The app queues one `{ userId }` job per user, and
  `fetchemails` syncs the whole mailbox and writes once at the end. So the 100,000
  messages are split over 1,000 users with 100 each, which gives 1,000 jobs.
- **Worker count means processes.** Each process runs the production worker with
  its concurrency of 2.
- **Expected rows come from the oracle.** Promo mail never becomes a row, so the
  check is that the database holds exactly the (user, message) pairs the parser
  accepts: nothing missing, nothing extra, no duplicates.
- **Production mode.** `NODE_ENV=production` means JSON logging and a TLS
  connection to Postgres (`src/db.ts`), which is why the test database uses a
  self-signed cert in `.certs/` (ignored by git).
- **Two latency numbers.** Exact per-job times from BullMQ, and quantiles from the
  app's own `email_sync_duration_seconds` histogram, computed the same way
  Prometheus's `histogram_quantile` does.
- **Kills use SIGKILL** and each killed worker is replaced right away. BullMQ only
  notices once the job's 30 s lock runs out, so most of the kill test's drain time
  is waiting for that.

## Not covered

- Gmail API latency and quotas. The fake answers instantly.
- Real Gemini calls, which production limits to one every 6 s per process
  (`CALL_INTERVAL_MS` in `src/parsers/gemini.parser.ts`).
- The cron path, which sleeps 1 s per user (`src/services/cron.ts`). Jobs are added
  with `addBulk` using the app's own queue and job options.
- Gmail's search filter. In production the query already drops most promos before
  the worker sees them, while the fake returns everything.
