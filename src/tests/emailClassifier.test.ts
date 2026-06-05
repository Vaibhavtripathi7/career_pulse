import { describe, expect, it } from "vitest";
import { classifyEmail } from "../services/emailClassifier.js";

describe("classifyEmail", () => {

  it("classifies rejection emails", () => {
    expect(
      classifyEmail({
        subject: "Application Update",
        sender: "test@test.com",
        snippet:
          "Unfortunately we have decided to move forward with other candidates",
      })
    ).toBe("REJECTION");
  });

  it("classifies interview emails", () => {
    expect(
      classifyEmail({
        subject: "Interview Invitation",
        sender: "test@test.com",
        snippet:
          "Please share your availability for an interview",
      })
    ).toBe("INTERVIEW");
  });

  it("classifies assessment emails", () => {
    expect(
      classifyEmail({
        subject: "Coding Assessment",
        sender: "test@test.com",
        snippet:
          "Please complete the HackerRank assessment",
      })
    ).toBe("ASSESSMENT");
  });

  it("classifies offer emails", () => {
    expect(
      classifyEmail({
        subject: "Offer Letter",
        sender: "test@test.com",
        snippet:
          "We are excited to extend an offer",
      })
    ).toBe("OFFER");
  });

  it("classifies application confirmations", () => {
    expect(
      classifyEmail({
        subject: "Application Received",
        sender: "test@test.com",
        snippet:
          "Thank you for applying",
      })
    ).toBe("APPLICATION");
  });

  it("returns unknown when no rule matches", () => {
    expect(
      classifyEmail({
        subject: "Hello",
        sender: "test@test.com",
        snippet:
          "Just checking in",
      })
    ).toBe("UNKNOWN");
  });
  it("prioritizes rejection over application confirmation", () => {
  expect(
    classifyEmail({
      subject: "Application Update",
      sender: "test@test.com",
      snippet:
        "Thank you for applying. Unfortunately we have decided to move forward with other candidates.",
    })
  ).toBe("REJECTION");
});
});