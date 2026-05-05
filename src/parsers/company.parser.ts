
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

  const textPatterns = [
    /applied to ([a-zA-Z]+)/i,
    /application at ([a-zA-Z]+)/i,
    /from ([a-zA-Z]+)/i,
  ];

  for (const pattern of textPatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return normalizeName(match[1]);
    }
  }
  
  const nameMatch = normalized.match(/^(.+?)\s*<.+?>$/);
  if (nameMatch?.[1]) {
    return cleanCompanyName(nameMatch[1]);
  }

  const emailMatch = normalized.match(/@([a-zA-Z0-9-]+)\./);
  if (emailMatch?.[1]) {
    return normalizeName(emailMatch[1]);
  }

  if (normalized.length > 2) {
    return normalizeName(normalized);
  }

  return "Unknown Company";
}