import { describe, it, expect } from "vitest";
import { extractCompany } from "../parsers/company.parser.js";

describe("Company Parser", () => {
  it("should extract company name", () => {
    const text = "You applied to Amazon";
    expect(extractCompany(text)).toBe("Amazon");
  });

  it("should handle noisy text", () => {
    const text = "Your application at Microsoft is received";
    expect(extractCompany(text)).toBe("Microsoft");
  });
});