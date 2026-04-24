// src/parsers/company.parser.ts

const GENERIC_PREFIXES = [
  "careers",
  "jobs",
  "noreply",
  "no-reply",
  "hr",
  "hiring",
  "team"
];

function normalizeName(name: string): string {
  return name
    .replace(/["']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function cleanCompanyName(raw: string): string {
  let cleaned = raw.toLowerCase();

  for (const prefix of GENERIC_PREFIXES) {
    cleaned = cleaned.replace(new RegExp(`^${prefix}\\s*`, "i"), "");
  }

  return normalizeName(cleaned);
}

export function extractCompany(sender: string): string {
  if (!sender) return "Unknown Company";

  const normalized = sender.trim();

  // ✅ Case 1: "Microsoft Careers <careers@microsoft.com>"
  const nameMatch = normalized.match(/^(.+?)\s*<.+?>$/);
  if (nameMatch?.[1]) {
    return cleanCompanyName(nameMatch[1]);
  }

  // ✅ Case 2: "careers@microsoft.com"
  const emailMatch = normalized.match(/@([a-zA-Z0-9-]+)\./);
  if (emailMatch?.[1]) {
    return normalizeName(emailMatch[1]);
  }

  // ✅ Case 3: fallback plain text
  if (normalized.length > 2) {
    return normalizeName(normalized);
  }

  return "Unknown Company";
}