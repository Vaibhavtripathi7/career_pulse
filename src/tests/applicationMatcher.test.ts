import { describe, expect, it } from "vitest";
import type { Application } from "@prisma/client";

import { matchApplication } from "../services/applicationMatcher.js";

const baseApplication: Application = {
  id: "1",
  messageId: "msg-1",
  subject: "Backend Intern",
  sender: "careers@stripe.com",

  companyName: "Stripe",
  normalizedCompany: "stripe",

  role: "Backend Intern",
  status: "Applied",
  workModel: "Remote",

  gmailThreadId: "thread-1",
  senderDomain: "stripe.com",

  userID: "user-1",

  dateApplied: new Date(),
  updatedAt: new Date(),
};


it("matches by thread id", () => {

  const result = matchApplication(
    [baseApplication],
    {
      gmailThreadId: "thread-1",
    }
  );

  expect(result.application?.id)
    .toBe("1");

  expect(result.confidence)
    .toBeGreaterThan(0.5);
});


it("matches by sender domain", () => {

  const result = matchApplication(
    [baseApplication],
    {
      senderDomain: "stripe.com",
    }
  );

  expect(result.application?.id)
    .toBe("1");
});

it("matches by normalized company", () => {

  const result = matchApplication(
    [baseApplication],
    {
      normalizedCompany: "stripe",
    }
  );

  expect(result.application?.id)
    .toBe("1");
});

it("returns null when no match exists", () => {

  const result = matchApplication(
    [baseApplication],
    {
      normalizedCompany: "notion",
    }
  );

  expect(result.application)
    .toBeNull();

  expect(result.confidence)
    .toBe(0);
});

it("returns null for ambiguous matches", () => {

  const app1 = {
    ...baseApplication,
    id: "1",
  };

  const app2 = {
    ...baseApplication,
    id: "2",
  };

  const result = matchApplication(
    [app1, app2],
    {
      senderDomain: "stripe.com",
    }
  );

  expect(result.application)
    .toBeNull();
});

it("prefers stronger matches", () => {

  const app1 = {
    ...baseApplication,
    id: "1",
    gmailThreadId: "thread-1",
  };

  const app2 = {
    ...baseApplication,
    id: "2",
    gmailThreadId: "thread-2",
  };

  const result = matchApplication(
    [app1, app2],
    {
      gmailThreadId: "thread-1",
      senderDomain: "stripe.com",
      normalizedCompany: "stripe",
    }
  );

  expect(result.application?.id)
    .toBe("1");
});