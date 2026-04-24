import { parseWithGemini } from "./gemini.parser.js";
import { parseWithRules } from "./rule.parser.js";
import type { EmailInput, ParsedEmail } from "../types/email.types.js";

export async function parseEmail(input: EmailInput): Promise<ParsedEmail> {
  const fallback = parseWithRules(input);

  try {
    const llm = await parseWithGemini(input);

    return {
      companyName: llm.companyName || fallback.companyName,
      role: llm.role || fallback.role,
      workModel: llm.workModel || fallback.workModel
    };

  } catch (err) {
    console.warn(" Gemini failed → fallback to rule-based parser", err);
    return fallback;
  }
}