import { describe, expect, it } from "vitest";
import { parseSender, domainMatches } from "../parsers/engine/sender.js";
import { resolveSource } from "../parsers/engine/registry.js";

describe("parseSender", () => {

  it("parses display name + address", () => {
    expect(parseSender('"Naukri.com" <info@naukri.com>')).toEqual({
      displayName: "Naukri.com",
      email: "info@naukri.com",
      localPart: "info",
      domain: "naukri.com",
    });
  });

  it("parses unquoted display name", () => {
    const result = parseSender("Google Careers <no-reply@google.com>");
    expect(result.displayName).toBe("Google Careers");
    expect(result.domain).toBe("google.com");
  });

  it("parses bare address", () => {
    const result = parseSender("careers@stripe.com");
    expect(result.displayName).toBeNull();
    expect(result.domain).toBe("stripe.com");
  });

  it("handles empty input", () => {
    expect(parseSender("").domain).toBeNull();
  });
});

describe("domainMatches", () => {

  it("matches exact domain", () => {
    expect(domainMatches("linkedin.com", "linkedin.com")).toBe(true);
  });

  it("matches subdomains", () => {
    expect(domainMatches("email.seek.com", "seek.com")).toBe(true);
    expect(domainMatches("us.greenhouse-mail.io", "greenhouse-mail.io")).toBe(true);
  });

  it("rejects lookalike suffix domains (the old includes() bug)", () => {
    expect(domainMatches("linkedin.com.evil.com", "linkedin.com")).toBe(false);
    expect(domainMatches("notlinkedin.com", "linkedin.com")).toBe(false);
  });
});

describe("resolveSource", () => {

  it("resolves workday", () => {
    expect(resolveSource("myworkdayjobs.com")?.name).toBe("WORKDAY");
  });

  it("resolves greenhouse mail domain", () => {
    expect(resolveSource("us.greenhouse-mail.io")?.name).toBe("GREENHOUSE");
  });

  it("resolves naukri", () => {
    expect(resolveSource("naukri.com")?.name).toBe("NAUKRI");
  });

  it("returns null for direct company domains", () => {
    expect(resolveSource("stripe.com")).toBeNull();
  });
});
