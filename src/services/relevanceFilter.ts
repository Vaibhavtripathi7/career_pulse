interface RelevanceInput {
  subject: string;
  sender: string;
  snippet: string;
}

const POSITIVE_SIGNALS = [
  "application received",
  "thank you for applying",
  "interview",
  "assessment",
  "offer",
  "candidate",
  "recruiter",
  "hiring manager",
  "application update",
  "next steps",
  "we received your application",
];

const NEGATIVE_SIGNALS = [
  "job alert",
  "recommended jobs",
  "newsletter",
  "salary guide",
  "unsubscribe",
  "promotion",
  "marketing",
  "top jobs",
  "career advice",
];

export function isRelevantJobEmail(
  input: RelevanceInput
): boolean {

  const text = [
    input.subject,
    input.sender,
    input.snippet,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;

  for (const keyword of POSITIVE_SIGNALS) {
    if (text.includes(keyword)) {
      score += 1;
    }
  }

  for (const keyword of NEGATIVE_SIGNALS) {
    if (text.includes(keyword)) {
      score -= 2;
    }
  }

  return score > 0;
}