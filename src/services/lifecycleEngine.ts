import type { EmailType } from "./emailClassifier.js";

export type ApplicationStatus =
  | "Applied"
  | "Assessment"
  | "Interview"
  | "Offer"
  | "Rejected";

  export function classificationToStatus(
  emailType: EmailType
): ApplicationStatus | null {

  switch (emailType) {

    case "ASSESSMENT":
      return "Assessment";

    case "INTERVIEW":
      return "Interview";

    case "OFFER":
      return "Offer";

    case "REJECTION":
      return "Rejected";

    default:
      return null;
  }
}