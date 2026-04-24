import { extractCompany } from "./company.parser.js";
import { extractRole } from "./role.parser.js";
import { extractWorkModel } from "./workmodel.parser.js";
import type { EmailInput, ParsedEmail } from "../types/email.types.js";

export function parseWithRules(input: EmailInput): ParsedEmail {
  return {
    companyName: extractCompany(input.sender),
    role: extractRole(input.subject),
    workModel: extractWorkModel(input.subject)
  };
}