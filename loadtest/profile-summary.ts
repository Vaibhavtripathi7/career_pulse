// Summarises the CPU profiles from `node loadtest/run.ts --profile` by component.
//
//   node loadtest/profile-summary.ts loadtest/results/profiles/diag-w1-r1
//
// Frames without a source file (native code, wasm, node internals) are counted
// against the nearest caller from the app or a package, so a regex shows up under
// the parser and Prisma's wasm query compiler under the database client.
import fs from "node:fs";
import path from "node:path";

interface ProfileNode {
  id: number;
  callFrame: { functionName: string; url: string; lineNumber: number };
  children?: number[];
}

interface CpuProfile {
  nodes: ProfileNode[];
  startTime: number;
  endTime: number;
  samples: number[];
  timeDeltas: number[];
}

const SPECIAL = new Map<string, string>([
  ["(idle)", "idle (waiting on I/O)"],
  ["(garbage collector)", "garbage collection"],
  ["(program)", "V8 / native, unattributed"],
  ["(root)", "Node.js runtime (event loop, promises, module loading)"],
]);

const CATEGORIES: [string, RegExp][] = [
  ["load-test harness (synthetic Gmail source, IPC)", /\/loadtest\//],
  ["CareerPulse parser (dist/parsers, dist/pipeline)", /\/dist\/(parsers|pipeline)\//],
  ["CareerPulse sync code (gmail.ts, classifier, matcher, utils)", /\/dist\//],
  ["logging (pino)", /node_modules\/(pino|sonic-boom|thread-stream|fast-redact|quick-format-unescaped|on-exit-leak-free)/],
  ["database client (Prisma + pg)", /node_modules\/(@prisma|\.prisma|pg|pg-protocol|pg-pool|pg-types|postgres-)/],
  ["queue client (BullMQ + ioredis)", /node_modules\/(bullmq|ioredis|msgpackr|cluster-key-slot|standard-as-callback|denque)/],
];

function categoryOfUrl(url: string): string {
  for (const [name, re] of CATEGORIES) if (re.test(url)) return name;
  return "other JavaScript";
}

interface Summary {
  totalMs: number;
  byCategory: Map<string, number>;
  byFunction: Map<string, number>;
}

function summarise(profile: CpuProfile, into: Summary): void {
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const parent = new Map<number, number>();
  for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);

  const categoryCache = new Map<number, string>();
  const categoryOf = (id: number): string => {
    const cached = categoryCache.get(id);
    if (cached) return cached;
    const node = byId.get(id)!;
    const special = SPECIAL.get(node.callFrame.functionName);
    // wasm and node: frames get charged to whoever called them
    const raw = node.callFrame.url;
    const url = raw.startsWith("wasm://") || raw.startsWith("node:") ? "" : raw;
    let result: string;
    if (special && !url) result = special;
    else if (url) result = categoryOfUrl(url);
    else {
      const p = parent.get(id);
      result = p === undefined ? "Node.js runtime (event loop, promises, module loading)" : categoryOf(p);
    }
    categoryCache.set(id, result);
    return result;
  };

  for (let i = 0; i < profile.samples.length; i++) {
    const id = profile.samples[i]!;
    const ms = (profile.timeDeltas[i] ?? 0) / 1000;
    const node = byId.get(id)!;
    const cat = categoryOf(id);
    into.byCategory.set(cat, (into.byCategory.get(cat) ?? 0) + ms);
    const f = node.callFrame;
    const where = f.url ? `${path.basename(f.url)}:${f.lineNumber + 1}` : "native";
    const key = `${f.functionName || "(anonymous)"} (${where}) [${cat}]`;
    into.byFunction.set(key, (into.byFunction.get(key) ?? 0) + ms);
    into.totalMs += ms;
  }
}

const dirs = process.argv.slice(2);
if (dirs.length === 0) {
  console.error("usage: node loadtest/profile-summary.ts <profile dir> [...]");
  process.exit(1);
}

for (const dir of dirs) {
  const summary: Summary = { totalMs: 0, byCategory: new Map(), byFunction: new Map() };
  // files are named CPU.<date>.<time>.<pid>.<tid>.<seq>.cpuprofile, tid 0 is the main thread
  const files = fs.readdirSync(dir).filter((f) => /^CPU\.\d+\.\d+\.\d+\.0\.\d+\.cpuprofile$/.test(f));
  for (const f of files) summarise(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as CpuProfile, summary);

  const idle = summary.byCategory.get("idle (waiting on I/O)") ?? 0;
  const busy = summary.totalMs - idle;
  console.log(`\n### ${path.basename(dir)}: ${files.length} worker profile(s), ${(busy / 1000).toFixed(1)} s busy CPU, ${(idle / 1000).toFixed(1)} s idle\n`);
  console.log("| Component | Share of busy CPU |");
  console.log("|---|---:|");
  for (const [cat, ms] of [...summary.byCategory].filter(([c]) => !c.startsWith("idle")).sort((a, b) => b[1] - a[1])) {
    console.log(`| ${cat} | ${((ms / busy) * 100).toFixed(1)}% |`);
  }
  console.log("\nTop functions by self time:\n");
  for (const [fn, ms] of [...summary.byFunction].filter(([k]) => !k.startsWith("(idle)")).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log(`- ${((ms / busy) * 100).toFixed(1)}%  ${fn}`);
  }
}
