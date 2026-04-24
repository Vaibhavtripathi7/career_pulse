import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EmailInput, ParsedEmail } from "../types/email.types.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-latest"
});

function extractJSON(text: string): string {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (match?.[1]) return match[1];

  const match2 = text.match(/```\s*([\s\S]*?)```/);
  if (match2?.[1]) return match2[1];

  return text.trim();
}

export async function parseWithGemini(input: EmailInput): Promise<ParsedEmail> {
  const prompt = `
You are a strict JSON generator.

Extract job application details.

Return ONLY valid JSON.

{
  "companyName": string,
  "role": string,
  "workModel": "Remote" | "Hybrid" | "Onsite" | "Unknown"
}

Subject: ${input.subject}
Sender: ${input.sender}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  console.log("\n RAW GEMINI RESPONSE:\n", text);

  const parsed = JSON.parse(extractJSON(text));

  return {
    companyName: parsed.companyName || "",
    role: parsed.role || "",
    workModel: parsed.workModel || "Unknown"
  };
}