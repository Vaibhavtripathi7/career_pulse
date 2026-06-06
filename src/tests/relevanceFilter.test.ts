import { describe, expect, it } from "vitest";
import { isRelevantJobEmail } from "../services/relevanceFilter.js";

describe("isRelevantJobEmail", () => {

  it("accepts application received emails", () => {
    expect(
      isRelevantJobEmail({
        subject: "Application Received",
        sender: "careers@stripe.com",
        snippet: "Thank you for applying to Stripe",
      })
    ).toBe(true);
  });

  it("accepts interview emails", () => {
    expect(
      isRelevantJobEmail({
        subject: "Interview Invitation",
        sender: "recruiting@google.com",
        snippet: "Please share your availability",
      })
    ).toBe(true);
  });

  it("accepts assessment emails", () => {
    expect(
      isRelevantJobEmail({
        subject: "Coding Assessment",
        sender: "hiring@amazon.com",
        snippet: "Complete the online assessment",
      })
    ).toBe(true);
  });

  it("accepts offer emails", () => {
    expect(
      isRelevantJobEmail({
        subject: "Offer Letter",
        sender: "careers@microsoft.com",
        snippet: "We are excited to extend an offer",
      })
    ).toBe(true);
  });

  it("rejects job alerts", () => {
    expect(
      isRelevantJobEmail({
        subject: "Job Alert",
        sender: "alerts@linkedin.com",
        snippet: "Recommended jobs for you",
      })
    ).toBe(false);
  });

  it("rejects newsletters", () => {
    expect(
      isRelevantJobEmail({
        subject: "Weekly Career Newsletter",
        sender: "newsletter@indeed.com",
        snippet: "Top jobs and hiring trends",
      })
    ).toBe(false);
  });

  it("rejects marketing emails", () => {
    expect(
      isRelevantJobEmail({
        subject: "Promotion",
        sender: "marketing@jobboard.com",
        snippet: "Discover new opportunities",
      })
    ).toBe(false);
  });

});