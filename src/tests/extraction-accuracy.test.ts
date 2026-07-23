import { describe, it, expect, vi } from "vitest";
import { parseEmail } from "../parsers/index.js";
import { EMAIL_FIXTURES } from "./fixtures/emails.js";

vi.mock("../parsers/gemini.parser.js", () => ({
  parseWithGemini: vi.fn().mockResolvedValue({
    isJobApplicationEvent: true,
    companyName: "",
    role: "",
    workModel: "Unknown",
  }),
}));

const junkFixtures = EMAIL_FIXTURES.filter(
  (f) => "ignore" in f.expected && f.expected.ignore === true
);
const realFixtures = EMAIL_FIXTURES.filter(
  (f) => !("ignore" in f.expected) || f.expected.ignore !== true
);

describe("parsing accuracy corpus", () => {

  it("ignores 100% of junk emails (alerts, promos, digests, unrelated)", async () => {
    const leaked: string[] = [];

    for (const fixture of junkFixtures) {
      const result = await parseEmail(fixture.input);
      if (result.companyName !== "IGNORE") {
        leaked.push(`${fixture.name} → ${result.companyName}`);
      }
    }

    expect(leaked, `junk leaked into applications:\n${leaked.join("\n")}`).toEqual([]);
  });

  it("never drops a real application event", async () => {
    const dropped: string[] = [];

    for (const fixture of realFixtures) {
      const result = await parseEmail(fixture.input);
      if (result.companyName === "IGNORE") {
        dropped.push(fixture.name);
      }
    }

    expect(dropped, `real events wrongly ignored:\n${dropped.join("\n")}`).toEqual([]);
  });

  it("extracts the exact company for >= 90% of real emails", async () => {
    const misses: string[] = [];

    for (const fixture of realFixtures) {
      const expected = fixture.expected as { company: string };
      const result = await parseEmail(fixture.input);
      if (result.companyName.toLowerCase() !== expected.company.toLowerCase()) {
        misses.push(
          `${fixture.name}: expected "${expected.company}", got "${result.companyName}"`
        );
      }
    }

    const accuracy = 1 - misses.length / realFixtures.length;
    expect(
      accuracy,
      `company accuracy ${(accuracy * 100).toFixed(1)}%\n${misses.join("\n")}`
    ).toBeGreaterThanOrEqual(0.9);
  });

  it("extracts the exact role for >= 85% of emails where a role is stated", async () => {
    const roleFixtures = realFixtures.filter(
      (f) => (f.expected as { role?: string }).role
    );
    const misses: string[] = [];

    for (const fixture of roleFixtures) {
      const expected = fixture.expected as { role: string };
      const result = await parseEmail(fixture.input);
      if (result.role.toLowerCase() !== expected.role.toLowerCase()) {
        misses.push(
          `${fixture.name}: expected "${expected.role}", got "${result.role}"`
        );
      }
    }

    const accuracy = 1 - misses.length / roleFixtures.length;
    expect(
      accuracy,
      `role accuracy ${(accuracy * 100).toFixed(1)}%\n${misses.join("\n")}`
    ).toBeGreaterThanOrEqual(0.85);
  });

  it("never fabricates a role — missing roles come back as Unknown", async () => {
    const result = await parseEmail({
      subject: "Application received",
      sender: '"Acme Careers" <careers@acme.com>',
      snippet: "Thank you for applying to Acme. We will be in touch.",
    });

    expect(result.companyName).toBe("Acme");
    expect(result.role).toBe("Unknown");
  });
});
