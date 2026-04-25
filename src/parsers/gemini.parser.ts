import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EmailInput, ParsedEmail } from "../types/email.types.js";
import dotenv from 'dotenv';
import { logger } from "../utils/logger.js";
import { increment } from "../utils/metrices.js";
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

function extractJSON(text: string): string {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (match?.[1]) return match[1];

  const match2 = text.match(/```\s*([\s\S]*?)```/);
  if (match2?.[1]) return match2[1];

  return text.trim();
}

async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    if (error instanceof Error && error.message.includes("Quota")) {
      logger.warn("Quota hit, waiting 50s... ");
      await new Promise(res => setTimeout(res, 50000));

    } else {
      await new Promise(res => setTimeout(res, 1000));
    }
    return retry(fn, retries - 1);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout")), ms);

    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const cache = new Map<string, ParsedEmail>();


export async function parseWithGemini(input: EmailInput): Promise<ParsedEmail> {
    const key = JSON.stringify(input);
    if(cache.has(key)) {
        logger.info("cache hit");
        return cache.get(key)!;
    }    
    increment("llmCalls");
    
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
    try {
        const result = await retry(() => withTimeout(model.generateContent(prompt),5000));
        const text = result.response.text();
        logger.info("\n RAW GEMINI RESPONSE:\n");
        let parsed;
        try {
          parsed = JSON.parse(extractJSON(text));
        } catch (error) {
          throw new Error("Invalid JSON from gemini");
        }
        const finalResult: ParsedEmail = {
            companyName: parsed.companyName || "",
            role: parsed.role || "",
            workModel: parsed.workModel || "Unknown"
            };

        cache.set(key, finalResult);
        return finalResult;

    } catch (error: unknown) {
        increment("llmFailures");
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({error: errorMessage }," Gemini parsing failed:");
        return {
            companyName: "",
            role: "",
            workModel: "Unknown"};
    }
}

