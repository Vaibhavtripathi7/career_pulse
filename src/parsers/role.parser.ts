// src/parsers/role.parser.ts

const ROLE_PATTERNS: RegExp[] = [
  /application for\s+(.*?)(?:\s+at|\s+-|\s+in|$)/i,
  /applied for\s+(.*?)(?:\s+at|\s+-|\s+in|$)/i,
  /position[:\s]+(.*?)(?:\s+at|\s+-|\s+in|$)/i,
  /role[:\s]+(.*?)(?:\s+at|\s+-|\s+in|$)/i,
  /(software engineer|backend engineer|frontend engineer|full stack engineer|data scientist|ml engineer|intern)/i
];

function normalizeRole(role: string): string {
  return role
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function extractRole(subject: string): string {
  if (!subject) return "Unknown Role";

  const cleaned = subject.replace(/re:|fw:/gi, "").trim();

  for (const pattern of ROLE_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match?.[1]) {
      return normalizeRole(match[1]);
    }
  }

  return "Software Engineer";
}