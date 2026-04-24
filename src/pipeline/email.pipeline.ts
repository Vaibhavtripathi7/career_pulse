import { parseEmail } from "../parsers/index.js";
import type { EmailInput, ParsedEmail } from "../types/email.types.js";

export async function emailPipeline(input: EmailInput): Promise<ParsedEmail> {
  return await parseEmail(input);
}