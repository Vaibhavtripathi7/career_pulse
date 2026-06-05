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
}

const OFFER_KEYWORDS = [
  "offer",
  "offer letter",
  "compensation",
  "joining date",
  "pleased to offer",
  "excited to extend",
];

const REJECTION_KEYWORDS = [
  "unfortunately",
  "regret to inform",
  "not moving forward",
  "other candidates",
  "position has been filled",
  "application was not selected",
  "thank you for your interest",
];

const INTERVIEW_KEYWORDS = [
  "interview",
  "schedule",
  "availability",
  "meet with",
  "hiring manager",
  "interview round",
  "interview invitation",
];

const ASSESSMENT_KEYWORDS = [
  "assessment",
  "coding challenge",
  "hackerrank",
  "take-home",
  "technical test",
  "online assessment",
];

const APPLICATION_KEYWORDS = [
  "thank you for applying",
  "application received",
  "received your application",
  "application confirmation",
];

const UPDATE_KEYWORDS = [
  "under review",
  "application update",
  "reviewing your application",
  "next steps",
  "status update",
];

function containsKeyword(
  text: string,
  keywords: string[]
): boolean {
  return keywords.some((keyword) =>
    text.includes(keyword)
  );
}

export function classifyEmail(
  input: EmailClassificationInput
): EmailType {

  const text = `${input.subject} ${input.snippet}`
    .toLowerCase();

  if (containsKeyword(text, OFFER_KEYWORDS)) {
    return "OFFER";
  }

  if (containsKeyword(text, REJECTION_KEYWORDS)) {
    return "REJECTION";
  }

  if (containsKeyword(text, INTERVIEW_KEYWORDS)) {
    return "INTERVIEW";
  }

  if (containsKeyword(text, ASSESSMENT_KEYWORDS)) {
    return "ASSESSMENT";
  }

  if (containsKeyword(text, APPLICATION_KEYWORDS)) {
    return "APPLICATION";
  }

  if (containsKeyword(text, UPDATE_KEYWORDS)) {
    return "UPDATE";
  }

  return "UNKNOWN";
}