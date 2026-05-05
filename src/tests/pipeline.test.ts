import { describe, it, expect } from "vitest";
import { emailPipeline } from "../pipeline/email.pipeline.js";
import { vi } from "vitest";

vi.mock("../parsers/gemini.parser.js", () => ({
  parseWithGemini: vi.fn().mockResolvedValue({
    companyName: "Google",
    role: "SDE",
  }),
}));

describe("Email Pipeline", () => {
  it("should process email correctly", async () => {
    const email = {
      subject: "Application received - Google",
      sender: "Google <jobs@google.com>",
      snippet: "Thanks for applying to Google for SDE",
    };

    const result = await emailPipeline(email);

    expect(result.companyName).toBe("Google");
    expect(result.role).toBe("SDE");
  });
});