import type { Application } from "@prisma/client";

export interface MatchResult {
  application: Application | null;
  confidence: number;
}

interface MatchInput {
  gmailThreadId?: string | null;
  senderDomain?: string | null;
  normalizedCompany?: string | null;
}

export function matchApplication(
  applications: Application[],
  input: MatchInput
): MatchResult {

  let bestMatch: Application | null = null;
  let highestScore = 0;
  let isAmbiguous = false;

  for (const application of applications) {

    let score = 0;

    if (
      input.gmailThreadId &&
      application.gmailThreadId === input.gmailThreadId
    ) {
      score += 100;
    }

    if (
      input.senderDomain &&
      application.senderDomain === input.senderDomain
    ) {
      score += 40;
    }

    if (
      input.normalizedCompany &&
      application.normalizedCompany === input.normalizedCompany
    ) {
      score += 30;
    }

    if (score > highestScore) {

      highestScore = score;
      bestMatch = application;

      isAmbiguous = false;

    } else if (
      score === highestScore &&
      score > 0
    ) {

      isAmbiguous = true;
    }
  }

  if (
    isAmbiguous ||
    !bestMatch ||
    highestScore === 0
  ) {
    return {
      application: null,
      confidence: 0,
    };
  }

  return {
    application: bestMatch,
    confidence: highestScore / 170,
  };
}