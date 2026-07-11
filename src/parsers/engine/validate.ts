const COMPANY_STOPLIST = new Set([
  "team", "teams", "careers", "career", "hr", "recruiting", "recruitment",
  "recruiter", "talent", "hiring", "hiring team", "jobs", "job", "noreply",
  "no-reply", "no reply", "do not reply", "donotreply", "notifications",
  "notification", "support", "mail", "email", "info", "admin", "hello",
  "contact", "update", "updates", "applications", "application", "apply",
  "the team", "talent acquisition", "people team", "unknown", "unknown company",
  // ATS / job-board product names — classic wrong-extraction bug
  "workday", "greenhouse", "lever", "ashby", "ashbyhq", "icims", "taleo",
  "successfactors", "smartrecruiters", "workable", "jobvite", "bamboohr",
  "recruitee", "teamtailor", "jazzhr", "breezy", "personio", "rippling",
  "dover", "zoho", "zoho recruit", "keka", "darwinbox", "freshteam",
  "turbohire", "naukri", "linkedin", "indeed", "internshala", "instahyre",
  "cutshort", "foundit", "monster", "hirist", "shine", "timesjobs", "apna",
  "wellfound", "angellist", "glassdoor", "ziprecruiter", "seek", "jobright",
  "hackerrank", "hackerearth", "codility", "codesignal",
  "gmail", "google mail", "outlook", "yahoo",
]);

const ROLE_JUNK = /\b(?:click|unsubscribe|http|www\.|@)\b/i;

const LEGAL_SUFFIX =
  /\s+(?:inc|inc\.|llc|ltd|ltd\.|pvt\.?\s*ltd\.?|private limited|corp|corp\.|corporation|gmbh|co\.|limited)\.?$/i;

const ROLE_CANONICAL: Record<string, string> = {
  "sde": "Software Engineer",
  "sde1": "Software Engineer",
  "sde-1": "Software Engineer",
  "sde i": "Software Engineer",
  "sde2": "Software Engineer II",
  "sde-2": "Software Engineer II",
  "sde ii": "Software Engineer II",
  "swe": "Software Engineer",
  "sdet": "Software Development Engineer in Test",
};

function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stripWrapping(text: string): string {
  return text
    .replace(/^["'\s\-–—:]+|["'\s\-–—:,.!?]+$/g, "")
    .trim();
}

function titleCaseIfMonocase(text: string): string {
  const hasUpper = /[A-Z]/.test(text);
  const hasLower = /[a-z]/.test(text);
  if (hasUpper && hasLower) return text;
  return text
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function cleanCompany(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let cleaned = stripWrapping(collapse(raw));
  cleaned = cleaned.replace(LEGAL_SUFFIX, "").trim();
  cleaned = cleaned.replace(/\s+via\s+.+$/i, "").trim();
  cleaned = cleaned
    .replace(/\s+(?:careers|talent|recruiting|recruitment|hiring team|hiring|team|hr|notifications?|jobs)$/i, "")
    .trim();
  cleaned = stripWrapping(cleaned);

  if (!cleaned) return null;
  cleaned = titleCaseIfMonocase(cleaned);

  return isValidCompany(cleaned) ? cleaned : null;
}

export function isValidCompany(name: string | null | undefined): name is string {
  if (!name) return false;
  const n = collapse(name);
  if (n.length < 2 || n.length > 60) return false;
  if (n.split(" ").length > 6) return false;
  if (/[@]|https?:|www\./i.test(n)) return false;
  if (/^\d+$/.test(n)) return false;
  const lower = n.toLowerCase();
  if (COMPANY_STOPLIST.has(lower)) return false;
  const withoutTld = lower.replace(/(?:\.(?:com|in|io|co|ai|net|org|hr))+$/, "");
  if (COMPANY_STOPLIST.has(withoutTld)) return false;
  return true;
}

export function cleanRole(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let cleaned = stripWrapping(collapse(raw));
  if (!cleaned) return null;

  const canonical = ROLE_CANONICAL[cleaned.toLowerCase()];
  if (canonical) return canonical;

  cleaned = titleCaseIfMonocase(cleaned);

  return isValidRole(cleaned) ? cleaned : null;
}

export function isValidRole(role: string | null | undefined): role is string {
  if (!role) return false;
  const r = collapse(role);
  if (r.length < 2 || r.length > 80) return false;
  if (r.split(" ").length > 8) return false;
  if (ROLE_JUNK.test(r)) return false;
  if (/^\d+$/.test(r)) return false;
  const lower = r.toLowerCase();
  if (lower === "unknown" || lower === "unknown role") return false;
  return true;
}
