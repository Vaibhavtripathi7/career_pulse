# Worker CPU profiles (diagnostic pass)

From `node loadtest/run.ts --tag diag --repeats 1 --skip-adversarial --profile --no-build --workers 1,4,8`, summarised with `node loadtest/profile-summary.ts`. Main-thread V8 profiles of every worker process, whole process lifetime (includes ~1 s of startup per process). Profiling slows workers slightly, so throughput comes from RESULTS.md, not this pass.

### diag-w1-r1: 1 worker profile(s), 19.8 s busy CPU, 9.1 s idle

| Component | Share of busy CPU |
|---|---:|
| database client (Prisma + pg) | 31.8% |
| CareerPulse sync code (gmail.ts, classifier, matcher, utils) | 21.9% |
| load-test harness (synthetic Gmail source, IPC) | 17.5% |
| CareerPulse parser (dist/parsers, dist/pipeline) | 10.2% |
| logging (pino) | 7.7% |
| Node.js runtime (event loop, promises, module loading) | 4.5% |
| garbage collection | 3.0% |
| other JavaScript | 1.5% |
| queue client (BullMQ + ioredis) | 1.1% |
| V8 / native, unattributed | 0.9% |

Top functions by self time:

- 4.8%  htmlToText (extractEmailBody.js:10) [CareerPulse sync code (gmail.ts, classifier, matcher, utils)]
- 4.4%  toMessage (mailbox.ts:404) [load-test harness (synthetic Gmail source, IPC)]
- 3.8%  (anonymous) (native) [logging (pino)]
- 3.5%  textOf (mailbox.ts:400) [load-test harness (synthetic Gmail source, IPC)]
- 3.0%  (garbage collector) (native) [garbage collection]
- 2.7%  extractEmailBody (extractEmailBody.js:40) [CareerPulse sync code (gmail.ts, classifier, matcher, utils)]
- 1.6%  runMicrotasks (native) [Node.js runtime (event loop, promises, module loading)]
- 1.4%  parseEmail (index.js:13) [CareerPulse parser (dist/parsers, dist/pipeline)]
- 1.4%  decodeUTF8 (native) [database client (Prisma + pg)]
- 1.3%  promoHtml (mailbox.ts:296) [load-test harness (synthetic Gmail source, IPC)]
- 1.2%  writev (native) [database client (Prisma + pg)]
- 1.1%  promoDraft (mailbox.ts:311) [load-test harness (synthetic Gmail source, IPC)]
- 1.1%  decode (encoding:440) [database client (Prisma + pg)]
- 1.1%  RegExp: \s+ (native) [load-test harness (synthetic Gmail source, IPC)]
- 1.1%  be (query_compiler_fast_bg.js:2) [database client (Prisma + pg)]

### diag-w4-r1: 4 worker profile(s), 50.2 s busy CPU, 15.3 s idle

| Component | Share of busy CPU |
|---|---:|
| database client (Prisma + pg) | 31.1% |
| CareerPulse sync code (gmail.ts, classifier, matcher, utils) | 19.6% |
| load-test harness (synthetic Gmail source, IPC) | 16.9% |
| CareerPulse parser (dist/parsers, dist/pipeline) | 9.8% |
| Node.js runtime (event loop, promises, module loading) | 7.3% |
| logging (pino) | 7.2% |
| garbage collection | 3.2% |
| other JavaScript | 2.5% |
| queue client (BullMQ + ioredis) | 1.7% |
| V8 / native, unattributed | 0.8% |

Top functions by self time:

- 4.2%  htmlToText (extractEmailBody.js:10) [CareerPulse sync code (gmail.ts, classifier, matcher, utils)]
- 3.9%  toMessage (mailbox.ts:404) [load-test harness (synthetic Gmail source, IPC)]
- 3.2%  (garbage collector) (native) [garbage collection]
- 3.1%  (anonymous) (native) [logging (pino)]
- 3.0%  textOf (mailbox.ts:400) [load-test harness (synthetic Gmail source, IPC)]
- 2.6%  writev (native) [database client (Prisma + pg)]
- 2.2%  extractEmailBody (extractEmailBody.js:40) [CareerPulse sync code (gmail.ts, classifier, matcher, utils)]
- 1.8%  runMicrotasks (native) [Node.js runtime (event loop, promises, module loading)]
- 1.4%  promoHtml (mailbox.ts:296) [load-test harness (synthetic Gmail source, IPC)]
- 1.2%  parseEmail (index.js:13) [CareerPulse parser (dist/parsers, dist/pipeline)]
- 1.1%  decodeUTF8 (native) [database client (Prisma + pg)]
- 1.1%  decode (encoding:440) [database client (Prisma + pg)]
- 1.1%  RegExp: \s+ (native) [load-test harness (synthetic Gmail source, IPC)]
- 1.1%  promoDraft (mailbox.ts:311) [load-test harness (synthetic Gmail source, IPC)]
- 1.0%  resolveSource (registry.js:671) [CareerPulse parser (dist/parsers, dist/pipeline)]

### diag-w8-r1: 8 worker profile(s), 135.4 s busy CPU, 25.3 s idle

| Component | Share of busy CPU |
|---|---:|
| database client (Prisma + pg) | 30.1% |
| CareerPulse sync code (gmail.ts, classifier, matcher, utils) | 18.5% |
| load-test harness (synthetic Gmail source, IPC) | 15.9% |
| Node.js runtime (event loop, promises, module loading) | 9.5% |
| CareerPulse parser (dist/parsers, dist/pipeline) | 9.1% |
| logging (pino) | 6.9% |
| other JavaScript | 3.5% |
| garbage collection | 3.5% |
| queue client (BullMQ + ioredis) | 2.3% |
| V8 / native, unattributed | 0.7% |

Top functions by self time:

- 3.7%  writev (native) [database client (Prisma + pg)]
- 3.6%  htmlToText (extractEmailBody.js:10) [CareerPulse sync code (gmail.ts, classifier, matcher, utils)]
- 3.5%  (garbage collector) (native) [garbage collection]
- 3.4%  toMessage (mailbox.ts:404) [load-test harness (synthetic Gmail source, IPC)]
- 2.7%  textOf (mailbox.ts:400) [load-test harness (synthetic Gmail source, IPC)]
- 2.4%  (anonymous) (native) [logging (pino)]
- 1.9%  extractEmailBody (extractEmailBody.js:40) [CareerPulse sync code (gmail.ts, classifier, matcher, utils)]
- 1.7%  runMicrotasks (native) [Node.js runtime (event loop, promises, module loading)]
- 1.3%  makeSyncRequest (hooks:632) [Node.js runtime (event loop, promises, module loading)]
- 1.3%  promoHtml (mailbox.ts:296) [load-test harness (synthetic Gmail source, IPC)]
- 1.2%  parseEmail (index.js:13) [CareerPulse parser (dist/parsers, dist/pipeline)]
- 1.1%  writeBuffer (native) [database client (Prisma + pg)]
- 1.1%  (anonymous) (gmail.js:71) [CareerPulse sync code (gmail.ts, classifier, matcher, utils)]
- 1.0%  resolveSource (registry.js:671) [CareerPulse parser (dist/parsers, dist/pipeline)]
- 1.0%  wrapSafe (loader:1650) [database client (Prisma + pg)]
