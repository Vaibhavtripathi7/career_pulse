export type EmailType =
  | "APPLICATION"
  | "INTERVIEW"
  | "ASSESSMENT"
  | "REJECTION"
  | "OFFER"
  | "UPDATE"
  | "UNKNOWN";

export interface EmailClassificationInput {
  subject: string;
  sender: string;
  snippet: string;
  body?: string;
}

const OFFER_PATTERNS: RegExp[] = [
  /offer letter/i,
  /pleased to (?:extend|offer)/i,
  /excited to (?:extend|offer)/i,
  /extend (?:an|the|you an) offer/i,
  /offer of employment/i,
  /job offer/i,
  /\bcongratulations\b[^.!\n]*\boffer\b/i,
  /\boffer\b[^.!\n]*\bjoining date\b/i,
  /letter of intent/i,
];

const REJECTION_PATTERNS: RegExp[] = [
  /regret to inform/i,
  /\bunfortunately\b/i,
  /not (?:be )?moving forward/i,
  /decided to (?:move|proceed|go) (?:forward|ahead) with other/i,
  /position has been filled/i,
  /application was not selected/i,
  /not (?:been )?selected/i,
  /no longer (?:under consideration|being considered)/i,
  /will not be (?:proceeding|progressing)/i,
];

const REJECTION_SOFT = /thank you for your interest/i;
const REJECTION_CUES: RegExp[] = [
  /\bunfortunately\b/i,
  /other candidates?/i,
  /not (?:been )?selected/i,
  /wish you (?:the best|success|all the best)/i,
  /future (?:opportunities|openings)/i,
  /decided to (?:pursue|proceed with|move forward with)/i,
];

const INTERVIEW_PATTERNS: RegExp[] = [
  /\binterview\b/i,
  /hiring manager (?:would like|wants|invites)/i,
  /meet (?:with )?(?:the|our) team/i,
];

const INTERVIEW_SOFT: RegExp[] = [/\bschedule\b/i, /\bavailability\b/i];
const INTERVIEW_CONTEXT: RegExp[] = [
  /\bcall\b/i,
  /\bmeeting\b/i,
  /\bround\b/i,
  /\bdiscussion\b/i,
  /\brecruiter\b/i,
  /hiring manager/i,
];

const ASSESSMENT_PATTERNS: RegExp[] = [
  /\bassessment\b/i,
  /coding (?:challenge|test|round)/i,
  /\bhackerrank\b|\bhackerearth\b|\bcodility\b|\bcodesignal\b/i,
  /take[- ]home/i,
  /technical (?:test|screening)/i,
  /aptitude test/i,
  /online test/i,
];

const APPLICATION_PATTERNS: RegExp[] = [
  /thank(?:s| you) for applying/i,
  /thank you for your application/i,
  /application (?:was |has been )?received/i,
  /received your application/i,
  /application confirmation/i,
  /application (?:was |has been )?(?:sent|submitted|forwarded)/i,
  /successfully applied/i,
];

const UPDATE_PATTERNS: RegExp[] = [
  /under review/i,
  /application update/i,
  /reviewing your application/i,
  /\bnext steps\b/i,
  /status update/i,
];

function anyMatch(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

export function classifyEmail(
  input: EmailClassificationInput
): EmailType {

  const text =
    `${input.subject} ${input.snippet} ${input.body ?? ""}`.toLowerCase();

  if (anyMatch(text, OFFER_PATTERNS)) {
    return "OFFER";
  }

  if (
    anyMatch(text, REJECTION_PATTERNS) ||
    (REJECTION_SOFT.test(text) && anyMatch(text, REJECTION_CUES))
  ) {
    return "REJECTION";
  }

  if (
    anyMatch(text, INTERVIEW_PATTERNS) ||
    (anyMatch(text, INTERVIEW_SOFT) && anyMatch(text, INTERVIEW_CONTEXT))
  ) {
    return "INTERVIEW";
  }

  if (anyMatch(text, ASSESSMENT_PATTERNS)) {
    return "ASSESSMENT";
  }

  if (anyMatch(text, APPLICATION_PATTERNS)) {
    return "APPLICATION";
  }

  if (anyMatch(text, UPDATE_PATTERNS)) {
    return "UPDATE";
  }

  return "UNKNOWN";
}
