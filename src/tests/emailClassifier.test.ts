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

  it("does NOT mark 'thank you for your interest' alone as rejection", () => {
    expect(
      classifyEmail({
        subject: "Application Received",
        sender: "no-reply@hire.lever.co",
        snippet:
          "Thank you for your interest in Razorpay. We have received your application.",
      })
    ).toBe("APPLICATION");
  });

  it("marks 'thank you for your interest' + rejection cue as rejection", () => {
    expect(
      classifyEmail({
        subject: "Your application",
        sender: "test@test.com",
        snippet:
          "Thank you for your interest in Acme. We have decided to pursue other candidates and wish you the best.",
      })
    ).toBe("REJECTION");
  });

  it("does not classify 'offerings' as an offer", () => {
    expect(
      classifyEmail({
        subject: "Our new product offerings",
        sender: "test@test.com",
        snippet: "Check out the latest offerings from our platform.",
      })
    ).toBe("UNKNOWN");
  });

  it("does not treat unrelated scheduling as an interview", () => {
    expect(
      classifyEmail({
        subject: "Delivery scheduled",
        sender: "test@test.com",
        snippet: "Your package delivery is scheduled for tomorrow.",
      })
    ).toBe("UNKNOWN");
  });

  it("treats scheduling with recruiter context as an interview", () => {
    expect(
      classifyEmail({
        subject: "Next round",
        sender: "test@test.com",
        snippet:
          "Please share your availability for a call with the recruiter this week.",
      })
    ).toBe("INTERVIEW");
  });

  it("classifies using the body when snippet is thin", () => {
    expect(
      classifyEmail({
        subject: "Update from Acme",
        sender: "test@test.com",
        snippet: "Hi there,",
        body: "We are pleased to offer you the position. Your offer letter is attached.",
      })
    ).toBe("OFFER");
  });
});