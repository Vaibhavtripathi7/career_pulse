// Replaces src/parsers/gemini.parser.ts during the load test. Counts calls and
// returns the same empty result production returns without GEMINI_API_KEY.
import { counters } from "./state.ts";

export interface GeminiParseResult {
  isJobApplicationEvent: boolean;
  companyName: string;
  role: string;
  workModel: string;
}

export async function parseWithGemini(_input: unknown): Promise<GeminiParseResult> {
  counters.llmCalls++;
  return { isJobApplicationEvent: true, companyName: "", role: "", workModel: "Unknown" };
}
