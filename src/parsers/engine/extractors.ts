import type { EmailInput } from "../../types/email.types.js";
import type { FieldPattern, SourceRule, TextSource } from "./registry.js";
import type { SenderInfo } from "./sender.js";
import { cleanCompany, cleanRole } from "./validate.js";

export interface FieldCandidate {
  value: string;
  confidence: number;
}

const FREEMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.in", "outlook.com",
  "hotmail.com", "live.com", "protonmail.com", "proton.me", "icloud.com",
  "rediffmail.com", "aol.com", "zohomail.in",
]);

function textFor(
  input: EmailInput,
  sender: SenderInfo,
  source: TextSource
): string {
  switch (source) {
    case "subject":
      return input.subject ?? "";
    case "snippet":
      return input.snippet ?? "";
    case "body":
      return input.body && input.body.length > 0
        ? input.body
        : input.snippet ?? "";
    case "displayName":
      return sender.displayName ?? "";
  }
}

type Cleaner = (raw: string | null | undefined) => string | null;

export function runFieldPatterns(
  input: EmailInput,
  sender: SenderInfo,
  patterns: FieldPattern[],
  clean: Cleaner
): FieldCandidate | null {

  let best: FieldCandidate | null = null;

  for (const fp of patterns) {
    if (best && best.confidence >= fp.confidence) continue;

    const text = textFor(input, sender, fp.source);
    if (!text) continue;

    const match = text.match(fp.pattern);
    if (!match?.[1]) continue;

    const cleaned = clean(match[1]);
    if (!cleaned) continue;

    best = { value: cleaned, confidence: fp.confidence };
  }

  return best;
}

export const GENERIC_COMPANY_PATTERNS: FieldPattern[] = [
  {
    pattern: /(?:thank you|thanks) for applying (?:to|at|with) ([^.,!;\n]+?)(?=\s+for\s|[.,!;\n]|$)/i,
    source: "subject",
    confidence: 0.85,
  },
  {
    pattern: /your application (?:to|at|with) ([^.,!;\n]+?)(?=\s+(?:for|has|was)\s|[.,!;\n]|$)/i,
    source: "subject",
    confidence: 0.8,
  },
  {
    pattern: /application (?:has been |was )?(?:sent|submitted|forwarded) to ([^.,!;\n]+?)(?=\s+for\s|[.,!;\n]|$)/i,
    source: "subject",
    confidence: 0.85,
  },
  {
    pattern: /interview (?:with|at) ([^.,!;\n]+?)(?=\s+for\s|[.,!;\n]|$)/i,
    source: "subject",
    confidence: 0.75,
  },
  {
    pattern: /offer (?:from|at) ([^.,!;\n]+?)(?=[.,!;\n]|$)/i,
    source: "subject",
    confidence: 0.75,
  },
  {
    pattern: /(?:thank you|thanks) for applying (?:to|at|with) ([^.,!;\n]+?)(?=\s+for\s|[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.8,
  },
  {
    pattern: /(?:thank you|thanks) for your (?:application|interest) (?:to|at|in|with) (?:joining |working (?:at|with) )?([^.,!;\n]+?)(?=\s+for\s|[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.75,
  },
  {
    pattern: /your application (?:to|at|with) ([^.,!;\n]+?)(?=\s+(?:for|has|was)\s|[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.7,
  },
  {
    pattern: /application (?:has been |was )?(?:sent|submitted|forwarded) to ([^.,!;\n]+?)(?=\s+for\s|[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.75,
  },
  {
    pattern: /applying (?:to|at) ([^.,!;\n]+?)(?=\s+for\s|[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.65,
  },
  {
    pattern: /position (?:at|with) ([^.,!;\n]+?)(?=[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.6,
  },
  {
    pattern: /\bat ([^|\-–,.\n]{2,40}?)\s*$/i,
    source: "subject",
    confidence: 0.5,
  },
];

const KNOWN_TITLES =
  /\b(software (?:development )?engineer(?:ing)?(?: intern| trainee)?|backend (?:developer|engineer)(?: intern)?|frontend (?:developer|engineer)(?: intern)?|full[- ]?stack (?:developer|engineer)(?: intern)?|web developer|software developer|data (?:scientist|analyst|engineer)|machine learning engineer|ml engineer|ai engineer|devops engineer|site reliability engineer|cloud engineer|qa engineer|test engineer|sdet|sde[- ]?(?:1|2|i{1,3})?|swe|android developer|ios developer|mobile developer|product manager|program manager|business analyst|ui\/?ux designer|product designer|graduate engineer trainee|associate software engineer|senior software engineer|junior developer|intern(?:ship)?)\b/i;

export const GENERIC_ROLE_PATTERNS: FieldPattern[] = [
  {
    pattern: /application for (?:the )?([^.,!;\n]+?)(?=\s+(?:position|role|opening)\b|\s+at\s|\s+-\s|[.,!;\n]|$)/i,
    source: "subject",
    confidence: 0.85,
  },
  {
    pattern: /applied for (?:the )?([^.,!;\n]+?)(?=\s+(?:position|role|opening)\b|\s+at\s|[.,!;\n]|$)/i,
    source: "subject",
    confidence: 0.85,
  },
  {
    pattern: /(?:for|to) the ([^.,!;\n]+?) (?:position|role|opening|opportunity)/i,
    source: "subject",
    confidence: 0.8,
  },
  {
    pattern: /(?:position|role)\s*[:\-]\s*([^.,!;\n]+?)(?=\s+at\s|[.,!;\n]|$)/i,
    source: "subject",
    confidence: 0.8,
  },
  {
    pattern: /(?:for|to) the ([^.,!;\n]+?) (?:position|role|opening|opportunity)/i,
    source: "body",
    confidence: 0.75,
  },
  {
    pattern: /(?:position|post|role) of ([^.,!;\n]+?)(?=\s+at\s|[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.75,
  },
  {
    pattern: /your application for (?:the )?([^.,!;\n]+?)(?=\s+at\s|\s+has\s|\s+was\s|[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.7,
  },
  {
    pattern: /interview for (?:the )?([^.,!;\n]+?)(?=\s+at\s|\s+position|\s+role|[.,!;\n]|$)/i,
    source: "subject",
    confidence: 0.75,
  },
  { pattern: KNOWN_TITLES, source: "subject", confidence: 0.6 },
  { pattern: KNOWN_TITLES, source: "snippet", confidence: 0.55 },
  { pattern: KNOWN_TITLES, source: "body", confidence: 0.5 },
];

export function extractCompanyFromSender(
  sender: SenderInfo,
  source: SourceRule | null
): FieldCandidate | null {

  if (sender.displayName) {
    const cleaned = cleanCompany(sender.displayName);
    if (cleaned) {
      return { value: cleaned, confidence: 0.5 };
    }
  }

  if (source || !sender.domain) return null;
  if (FREEMAIL_DOMAINS.has(sender.domain)) return null;

  const root = sender.domain.split(".")[0];
  if (!root) return null;

  const cleaned = cleanCompany(root);
  if (!cleaned) return null;

  return { value: cleaned, confidence: 0.4 };
}

const WORK_MODEL_PATTERNS: Array<[RegExp, string]> = [
  [/\bremote\b/i, "Remote"],
  [/\bwork from home\b/i, "Remote"],
  [/\bwfh\b/i, "Remote"],
  [/\bhybrid\b/i, "Hybrid"],
  [/\bon-?site\b/i, "Onsite"],
  [/\bin-?office\b/i, "Onsite"],
];

export function extractWorkModel(input: EmailInput): string {
  const text = `${input.subject ?? ""} ${input.snippet ?? ""} ${input.body ?? ""}`;

  for (const [pattern, model] of WORK_MODEL_PATTERNS) {
    if (pattern.test(text)) return model;
  }
  return "Unknown";
}

export function pickBest(
  candidates: Array<FieldCandidate | null>
): FieldCandidate | null {
  let best: FieldCandidate | null = null;
  for (const c of candidates) {
    if (c && (!best || c.confidence > best.confidence)) {
      best = c;
    }
  }
  return best;
}
