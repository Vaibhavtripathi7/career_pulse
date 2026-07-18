import { describe, expect, it } from "vitest";
import {
  cleanCompany,
  isValidCompany,
  cleanRole,
  isValidRole,
} from "../parsers/engine/validate.js";

describe("company validation", () => {

  it("rejects generic mailbox words", () => {
    expect(isValidCompany("Careers")).toBe(false);
    expect(isValidCompany("noreply")).toBe(false);
    expect(isValidCompany("Team")).toBe(false);
  });

  it("rejects ATS/job-board product names as companies", () => {
    expect(isValidCompany("Workday")).toBe(false);
    expect(isValidCompany("Greenhouse")).toBe(false);
    expect(isValidCompany("Naukri")).toBe(false);
    expect(isValidCompany("LinkedIn")).toBe(false);
  });

  it("accepts real company names", () => {
    expect(isValidCompany("Stripe")).toBe(true);
    expect(isValidCompany("Tata Consultancy Services")).toBe(true);
  });

  it("strips legal suffixes and team words", () => {
    expect(cleanCompany("Acme Pvt Ltd")).toBe("Acme");
    expect(cleanCompany("Freshworks Careers")).toBe("Freshworks");
    expect(cleanCompany('"Stripe, Inc."')).toBe("Stripe");
  });

  it("strips 'via platform' suffixes", () => {
    expect(cleanCompany("Meesho via LinkedIn")).toBe("Meesho");
  });

  it("returns null when nothing valid remains", () => {
    expect(cleanCompany("Careers")).toBeNull();
    expect(cleanCompany("")).toBeNull();
  });
});

describe("role validation", () => {

  it("canonicalizes common abbreviations", () => {
    expect(cleanRole("SDE")).toBe("Software Engineer");
    expect(cleanRole("sde-2")).toBe("Software Engineer II");
    expect(cleanRole("SWE")).toBe("Software Engineer");
  });

  it("title-cases monocase roles but preserves mixed case", () => {
    expect(cleanRole("backend engineer")).toBe("Backend Engineer");
    expect(cleanRole("SDE 2 - Platform")).toBe("SDE 2 - Platform");
  });

  it("rejects sentence-like garbage", () => {
    expect(
      isValidRole("we are pleased to inform you that your profile has been shortlisted for review")
    ).toBe(false);
    expect(isValidRole("click here to unsubscribe")).toBe(false);
  });

  it("rejects empty/unknown", () => {
    expect(cleanRole("")).toBeNull();
    expect(cleanRole("Unknown")).toBeNull();
  });
});
