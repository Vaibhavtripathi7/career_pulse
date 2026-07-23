import type { EmailInput, ParsedEmail } from "../types/email.types.js";
import { parseSender } from "./engine/sender.js";
import { resolveSource } from "./engine/registry.js";
import { triageEmail } from "./engine/triage.js";
import {
  runFieldPatterns,
  extractCompanyFromSender,
  extractWorkModel,
  pickBest,
  GENERIC_COMPANY_PATTERNS,
  GENERIC_ROLE_PATTERNS,
} from "./engine/extractors.js";
import { cleanCompany, cleanRole } from "./engine/validate.js";
import { parseWithGemini } from "./gemini.parser.js";
import { logger } from "../utils/logger.js";

const IGNORED: ParsedEmail = {
  companyName: "IGNORE",
  role: "IGNORE",
  workModel: "Unknown",
};

export async function parseEmail(input: EmailInput): Promise<ParsedEmail> {

  const sender = parseSender(input.sender);
  const source = resolveSource(sender.domain);

  const triage = triageEmail(input, source, sender);
  if (triage.decision === "IGNORE") {
    logger.info(
      { subject: input.subject, reason: triage.reason },
      "Triage ignored email"
    );
    return IGNORED;
  }

  let company = pickBest([
    source ? runFieldPatterns(input, sender, source.company, cleanCompany) : null,
    runFieldPatterns(input, sender, GENERIC_COMPANY_PATTERNS, cleanCompany),
    extractCompanyFromSender(sender, source),
  ]);

  let role = pickBest([
    source ? runFieldPatterns(input, sender, source.role, cleanRole) : null,
    runFieldPatterns(input, sender, GENERIC_ROLE_PATTERNS, cleanRole),
  ]);

  let workModel = extractWorkModel(input);

  const companyMissing = !company;
  const roleMissing = !role;

  if (companyMissing && roleMissing) {
    try {
      const llm = await parseWithGemini(input);

      if (llm.isJobApplicationEvent === false) {
        logger.info(
          { subject: input.subject },
          "LLM overruled triage — not an application event"
        );
        return IGNORED;
      }

      const llmCompany = cleanCompany(llm.companyName);
      if (companyMissing && llmCompany) {
        company = { value: llmCompany, confidence: 0.7 };
      }

      const llmRole = cleanRole(llm.role);
      if (roleMissing && llmRole) {
        role = { value: llmRole, confidence: 0.7 };
      }

      if (workModel === "Unknown" && llm.workModel && llm.workModel !== "Unknown") {
        workModel = llm.workModel;
      }
    } catch (err) {
      logger.warn({ err }, "LLM fallback failed — keeping deterministic result");
    }
  }

  const confidence = Math.min(
    company?.confidence ?? 0,
    role?.confidence ?? 0
  );

  return {
    companyName: company?.value ?? "Unknown",
    role: role?.value ?? "Unknown",
    workModel,
    confidence,
    source: source?.name ?? "DIRECT",
  };
}
