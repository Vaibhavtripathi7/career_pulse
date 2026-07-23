import { describe, expect, it } from "vitest";
import { triageEmail } from "../parsers/engine/triage.js";
import { parseSender } from "../parsers/engine/sender.js";
import { resolveSource } from "../parsers/engine/registry.js";
import type { EmailInput } from "../types/email.types.js";

function triage(input: EmailInput) {
  const sender = parseSender(input.sender);
  const source = resolveSource(sender.domain);
  return triageEmail(input, source, sender);
}

describe("triageEmail", () => {

  it("ignores SEEK recommendation digests", () => {
    expect(
      triage({
        subject: "Software Engineer + 11 new jobs",
        sender: "jobs@email.seek.com",
        snippet: "New jobs matching your saved search.",
      }).decision
    ).toBe("IGNORE");
  });

  it("ignores Jobright daily alerts", () => {
    expect(
      triage({
        subject: "Daily Job Alert",
        sender: "noreply@jobright.ai",
        snippet: "Recommended jobs for you.",
      }).decision
    ).toBe("IGNORE");
  });

  it("ignores alert-only sender mailboxes", () => {
    expect(
      triage({
        subject: "5 jobs in Bangalore",
        sender: "naukrialerts@naukri.com",
        snippet: "Jobs matching your profile.",
      }).decision
    ).toBe("IGNORE");
  });

  it("ignores gmail promotions category from unknown senders", () => {
    expect(
      triage({
        subject: "Your dream job is waiting",
        sender: "hello@tophire.co",
        snippet: "Find jobs through TopHire.",
        labelIds: ["CATEGORY_PROMOTIONS"],
      }).decision
    ).toBe("IGNORE");
  });

  it("does NOT auto-ignore promotions category for known ATS senders", () => {
    expect(
      triage({
        subject: "Thank you for applying to Stripe",
        sender: '"Stripe" <no-reply@us.greenhouse-mail.io>',
        snippet: "We have received your application for the Backend Engineer role.",
        labelIds: ["CATEGORY_PROMOTIONS"],
      }).decision
    ).toBe("PROCESS");
  });

  it("processes LinkedIn Easy Apply confirmations (previously blanket-blocked)", () => {
    expect(
      triage({
        subject: "Your application was sent to Swiggy",
        sender: '"LinkedIn" <jobs-noreply@linkedin.com>',
        snippet: "Your application was sent to Swiggy.",
      }).decision
    ).toBe("PROCESS");
  });

  it("still ignores LinkedIn job digests", () => {
    expect(
      triage({
        subject: '30+ new jobs for "software engineer"',
        sender: '"LinkedIn Job Alerts" <jobalerts-noreply@linkedin.com>',
        snippet: "Apply now.",
      }).decision
    ).toBe("IGNORE");
  });

  it("processes direct application confirmations", () => {
    expect(
      triage({
        subject: "Thank you for applying",
        sender: "careers@stripe.com",
        snippet: "We received your application to Stripe.",
      }).decision
    ).toBe("PROCESS");
  });

  it("processes interview emails", () => {
    expect(
      triage({
        subject: "Interview Scheduling",
        sender: "jobs@ashbyhq.com",
        snippet: "We'd like to schedule your interview.",
      }).decision
    ).toBe("PROCESS");
  });

  it("processes rejection emails so status can update", () => {
    expect(
      triage({
        subject: "Update on your application",
        sender: "no-reply@google.com",
        snippet: "Unfortunately we will not be moving forward.",
      }).decision
    ).toBe("PROCESS");
  });

  it("ignores unrelated transactional email", () => {
    expect(
      triage({
        subject: "Your order is on the way",
        sender: '"Swiggy" <noreply@swiggy.in>',
        snippet: "Your order will be delivered in 20 minutes.",
      }).decision
    ).toBe("IGNORE");
  });
});
