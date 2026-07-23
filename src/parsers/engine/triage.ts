import type { EmailInput } from "../../types/email.types.js";
import type { SourceRule } from "./registry.js";
import type { SenderInfo } from "./sender.js";

export interface TriageResult {
  decision: "PROCESS" | "IGNORE";
  reason: string;
}

const IGNORED_GMAIL_CATEGORIES = [
  "CATEGORY_PROMOTIONS",
  "CATEGORY_SOCIAL",
  "CATEGORY_FORUMS",
];

const ALERT_LOCAL_PARTS = [
  "alert",
  "alerts",
  "jobalert",
  "jobalerts",
  "jobalerts-noreply",
  "naukrialerts",
  "digest",
  "newsletter",
  "newsletters",
  "marketing",
  "promo",
  "promotions",
  "news",
];

const ALERT_SUBJECT_PATTERNS: RegExp[] = [
  /\+?\s*\d+\s+new jobs?/i,
  /\bnew jobs? (?:for you|posted|this week|today)/i,
  /recommended (?:jobs?|for you)/i,
  /jobs? (?:matching|for you|you may (?:be interested|like)|similar to)/i,
  /\bjob alert\b/i,
  /\b(?:daily|weekly) (?:alert|digest|jobs?)\b/i,
  /\btop (?:jobs?|companies)\b/i,
  /\bopen positions? (?:at|in|for)\b.*\bapply\b/i,
  /\bhiring now\b/i,
  /\bhot jobs?\b/i,
  /\bvacanc(?:y|ies) (?:alert|digest)\b/i,
  /\bwho(?:'s| is) viewed your profile\b/i,
  /viewed your profile/i,
  /appear(?:ed)? in \d+ searches/i,
  /invitation to connect/i,
  /grow your (?:network|career)/i,
  /\bnewsletter\b/i,
  /career (?:advice|tips|guide)/i,
  /salary (?:guide|report|trends|insights)/i,
  /\bwebinar\b/i,
  /\bupskill\b/i,
  /\benroll now\b/i,
  /\bfree trial\b/i,
  /\b\d+% off\b/i,
  /boost your (?:profile|resume|career)/i,
  /complete your profile/i,
];

const STRONG_POSITIVE: RegExp[] = [
  /thank(?:s| you) for applying/i,
  /thank you for your application/i,
  /application (?:was |has been )?received/i,
  /(?:we|i) have received your application/i,
  /your application (?:was|has been) (?:sent|submitted|forwarded)/i,
  /successfully applied/i,
  /application confirmation/i,
  /your candidacy/i,
  /viewed your application/i,
  /(?:review|reviewing) your application\b/i,
  /interview (?:scheduled|invitation|invite|call|slot)\b/i,
  /invited (?:to|for) (?:an? )?interview/i,
  /coding (?:challenge|test|round)/i,
  /take[- ]home (?:test|assignment|challenge)/i,
  /technical (?:test|screening|round)\b/i,
  /(?:coding|technical|skills?) assessment\b/i,
  /\bhackerrank\b|\bhackerearth\b|\bcodility\b|\bcodesignal\b/i,
  /regret to inform/i,
  /not (?:been )?selected\b/i,
  /(?:moving|move) forward with other candidates/i,
  /will not be (?:moving forward|proceeding|continuing)\b/i,
  /not (?:moving|proceeding) forward with your application/i,
  /position has been filled/i,
  /decided to (?:pursue|move forward with) other/i,
  /offer letter\b/i,
  /pleased to (?:extend|offer)\b/i,
  /excited to extend\b/i,
  /offer of employment/i,
];

const WEAK_POSITIVE: RegExp[] = [
  /\brecruiter\b/i,
  /hiring (?:team|manager)/i,
  /\bnext steps\b/i,
  /\bcandidate\b/i,
  /talent (?:acquisition|team)/i,
  /\byour application\b/i,
  /thank you for your interest/i,
  /\binterview\b/i,
  /\bassessment\b/i,
];

const NEGATIVE: RegExp[] = [
  /job alert/i,
  /recommended jobs?/i,
  /jobs? (?:for you|matching|you may)/i,
  /based on your (?:profile|preferences|search)/i,
  /\bapply now\b/i,
  /\bhot jobs?\b/i,
  /\btop jobs?\b/i,
  /\bnewsletter\b/i,
  /career (?:advice|tips)/i,
  /salary (?:guide|report|trends)/i,
  /\bwebinar\b/i,
  /\bupskill\b|\bcourse\b|\bcertification\b/i,
  /\bpremium\b|\bsubscription\b|\bfree trial\b|\bdiscount\b/i,
  /viewed your profile/i,
  /invitation to connect/i,
  /\bunsubscribe\b.*\balerts?\b/i,
];

function countMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const p of patterns) {
    if (p.test(text)) count++;
  }
  return count;
}

export function triageEmail(
  input: EmailInput,
  source: SourceRule | null,
  sender: SenderInfo
): TriageResult {

  const subject = input.subject ?? "";
  const snippet = input.snippet ?? "";
  const body = input.body ?? "";
  const fullText = `${subject} ${snippet} ${body}`;
  const headText = `${subject} ${snippet}`;

  const isPromoCategory = (input.labelIds ?? []).some((l) =>
    IGNORED_GMAIL_CATEGORIES.includes(l)
  );
  if (isPromoCategory && source?.kind !== "ATS") {
    return { decision: "IGNORE", reason: "gmail-category" };
  }

  if (
    sender.localPart &&
    ALERT_LOCAL_PARTS.some(
      (lp) => sender.localPart === lp || sender.localPart!.startsWith(lp + ".")
    )
  ) {
    return { decision: "IGNORE", reason: "alert-sender" };
  }

  if (ALERT_SUBJECT_PATTERNS.some((p) => p.test(subject))) {
    return { decision: "IGNORE", reason: "alert-subject" };
  }

  if (source?.ignorePatterns?.some((p) => p.test(headText))) {
    return { decision: "IGNORE", reason: `${source.name}-noise` };
  }

  if (source?.confirmationPatterns?.some((p) => p.test(fullText))) {
    return { decision: "PROCESS", reason: `${source.name}-confirmation` };
  }

  const score =
    countMatches(headText, STRONG_POSITIVE) * 3 +
    countMatches(headText, WEAK_POSITIVE) * 1 -
    countMatches(headText, NEGATIVE) * 3;

  const threshold = source?.kind === "ATS" ? 1 : 3;

  if (score >= threshold) {
    return { decision: "PROCESS", reason: `relevance-score:${score}` };
  }

  return { decision: "IGNORE", reason: `low-relevance:${score}` };
}
