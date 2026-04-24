// src/parsers/workmodel.parser.ts

const WORK_MODEL_MAP: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
  "on-site": "Onsite",
  wfh: "Remote",
  "work from home": "Remote"
};

export function extractWorkModel(subject: string): string {
  if (!subject) return "Unknown";

  const lower = subject.toLowerCase();

  for (const key in WORK_MODEL_MAP) {
    if (lower.includes(key)) {
      return WORK_MODEL_MAP[key]!;
    }
  }

  return "Unknown";
}