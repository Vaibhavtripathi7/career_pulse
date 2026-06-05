import type { ApplicationStatus }
from "./lifecycleEngine.js";

const VALID_TRANSITIONS:
Record<ApplicationStatus, ApplicationStatus[]> = {

  Applied: [
    "Assessment",
    "Interview",
    "Offer",
    "Rejected",
  ],

  Assessment: [
    "Interview",
    "Offer",
    "Rejected",
  ],

  Interview: [
    "Offer",
    "Rejected",
  ],

  Offer: [],

  Rejected: [],
};


export function canTransition(
  current: ApplicationStatus,
  next: ApplicationStatus
): boolean {

  return VALID_TRANSITIONS[current]
    .includes(next);
}
