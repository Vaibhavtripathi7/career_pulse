// Works out which rows a complete sync should produce.
//
// Promo mail is ignored by the parser and never stored, so the expected row count
// is not the number of unique message ids. This runs the real pipeline over every
// unique message with the same inputs gmail.ts builds. For a new user, gmail.ts
// stores a row when Subject and From are set and the parser doesn't return IGNORE.
//
// It also times the pipeline on its own (one thread, no database or queue).
import { performance } from "node:perf_hooks";
import { emailPipeline } from "../dist/pipeline/email.pipeline.js";
import { extractEmailBody } from "../dist/utils/extractEmailBody.js";
import { counters } from "./fakes/state.ts";
import { generateMailbox, loadConfigFromEnv, userId, type MessageKind } from "./mailbox.ts";

export interface OracleResult {
  type: "oracle";
  expectedKeys: string[];
  uniqueMessages: number;
  deliveries: number;
  byKind: Record<MessageKind, { unique: number; stored: number }>;
  byTemplate: Record<string, { unique: number; stored: number }>;
  /** LLM calls for one pass over every delivery, duplicates included */
  llmCallsPerPass: number;
  llmCallsUnique: number;
  generateMs: number;
  pipelineMs: number;
}

const cfg = loadConfigFromEnv();

const expectedKeys: string[] = [];
const byKind: OracleResult["byKind"] = { job: { unique: 0, stored: 0 }, promo: { unique: 0, stored: 0 } };
const byTemplate: OracleResult["byTemplate"] = {};
let uniqueMessages = 0;
let deliveries = 0;
let llmCallsPerPass = 0;
let generateMs = 0;
let pipelineMs = 0;

for (let u = 0; u < cfg.users; u++) {
  const g0 = performance.now();
  const list = generateMailbox(cfg, u);
  generateMs += performance.now() - g0;
  deliveries += list.length;

  const usedLlm = new Map<string, boolean>();
  for (const m of list) {
    if (usedLlm.has(m.id)) continue;
    uniqueMessages++;
    byKind[m.kind].unique++;
    const t = (byTemplate[m.template] ??= { unique: 0, stored: 0 });
    t.unique++;

    const headers = m.payload.headers ?? [];
    const subject = headers.find((h) => h.name === "Subject")?.value;
    const from = headers.find((h) => h.name === "From")?.value;
    if (!subject || !from) {
      usedLlm.set(m.id, false);
      continue;
    }

    const before = counters.llmCalls;
    const p0 = performance.now();
    const parsed = await emailPipeline({
      subject,
      sender: from,
      snippet: m.snippet,
      body: extractEmailBody(m.payload),
      labelIds: m.labelIds,
    });
    pipelineMs += performance.now() - p0;
    usedLlm.set(m.id, counters.llmCalls > before);

    if (parsed.companyName === "IGNORE") continue;
    expectedKeys.push(`${userId(u)}|${m.id}`);
    byKind[m.kind].stored++;
    t.stored++;
  }

  // gmail.ts parses every listed message, duplicates included.
  for (const m of list) if (usedLlm.get(m.id)) llmCallsPerPass++;
}

const result: OracleResult = {
  type: "oracle",
  expectedKeys,
  uniqueMessages,
  deliveries,
  byKind,
  byTemplate,
  llmCallsPerPass,
  llmCallsUnique: counters.llmCalls,
  generateMs,
  pipelineMs,
};

if (process.send) {
  process.send(result, () => process.exit(0));
} else {
  const { expectedKeys: keys, ...summary } = result;
  console.log(JSON.stringify({ ...summary, expectedRows: keys.length }, null, 2));
}
