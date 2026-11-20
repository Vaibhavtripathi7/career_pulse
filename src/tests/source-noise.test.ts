import { describe, expect, it, vi } from "vitest";
import { parseEmail } from "../parsers/index.js";
import { resolveSource } from "../parsers/engine/registry.js";

vi.mock("../parsers/gemini.parser.js", () => ({
  parseWithGemini: vi.fn().mockResolvedValue({
    isJobApplicationEvent: true,
    companyName: "",
    role: "",
    workModel: "Unknown",
  }),
}));

function linkedin(company: string, role: string) {
  return {
    subject: `Your application was sent to ${company}`,
    sender: '"LinkedIn" <jobs-noreply@linkedin.com>',
    snippet: `Your application was sent to ${company}. ${role} · Bengaluru, Karnataka, India.`,
  };
}

function internshala(company: string, role: string) {
  return {
    subject: `Application sent to ${company}`,
    sender: '"Internshala" <noreply@internshala.com>',
    snippet: `Your application for the ${role} internship at ${company} has been sent successfully.`,
  };
}

function naukri(company: string, role: string) {
  return {
    subject: `Your application has been sent to ${company}`,
    sender: '"Naukri.com" <info@naukri.com>',
    snippet: `Your application has been sent to ${company} for the position of ${role}. The recruiter will contact you if shortlisted.`,
  };
}

function matchesNoise(domain: string, text: string): boolean {
  const source = resolveSource(domain);
  return (source?.ignorePatterns ?? []).some((p) => p.test(text));
}

describe("job board noise patterns keep real applications", () => {
  it.each([
    ["Sarvam AI", "Machine Learning Engineer"],
    ["Cisco", "Network Engineer"],
    ["Palo Alto Networks", "Security Engineer"],
    ["Network18", "Backend Engineer"],
    ["Coursera", "Software Engineer"],
    ["Great Learning", "Data Analyst"],
    ["ConnectWise", "Support Engineer"],
    ["Freshworks", "Premium Support Engineer"],
  ])("keeps a LinkedIn application to %s for %s", async (company, role) => {
    const result = await parseEmail(linkedin(company, role));
    expect(result.companyName).toBe(company);
    expect(result.role).not.toBe("IGNORE");
  });

  it("extracts the role from a LinkedIn Machine Learning application", async () => {
    const result = await parseEmail(linkedin("Sarvam AI", "Machine Learning Engineer"));
    expect(result.role).toBe("Machine Learning Engineer");
  });

  it.each([
    ["Coursera", "Data Science"],
    ["Zeta", "Training and Development"],
  ])("keeps an Internshala application to %s for %s", async (company, role) => {
    const result = await parseEmail(internshala(company, role));
    expect(result.companyName).toBe(company);
    expect(result.role).toBe(role);
  });

  it("keeps a Naukri application for a Premium Relationship Manager role", async () => {
    const result = await parseEmail(naukri("HDFC Bank", "Premium Relationship Manager"));
    expect(result.companyName).toBe("HDFC Bank");
    expect(result.role).toBe("Premium Relationship Manager");
  });
});

describe("job board noise patterns still catch noise", () => {
  it.each([
    "Rahul wants to connect with you on LinkedIn",
    "You have 3 new invitations",
    "Priya endorsed you for TypeScript",
    "Ananya and 4 others in your network shared a post",
    "Trending now: AI agents in your industry",
    "Try Premium for 0 rupees",
    "Your LinkedIn Premium free trial ends tomorrow",
    "New courses for you on LinkedIn Learning",
    "Read this week's newsletter from Backend Weekly",
  ])("LinkedIn: %s", (text) => {
    expect(matchesNoise("linkedin.com", text)).toBe(true);
  });

  it.each([
    "Get 55% off on all Internshala Trainings",
    "Learn web development online and get a certificate",
    "Special discount on online trainings this week",
  ])("Internshala: %s", (text) => {
    expect(matchesNoise("internshala.com", text)).toBe(true);
  });

  it.each([
    "Upgrade to Naukri Premium and get noticed",
    "Naukri FastForward: reach recruiters faster",
    "Your subscription is about to expire",
  ])("Naukri: %s", (text) => {
    expect(matchesNoise("naukri.com", text)).toBe(true);
  });
});
