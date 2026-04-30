import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EmailInput, ParsedEmail } from "../types/email.types.js";
import dotenv from 'dotenv';
import { logger } from "../utils/logger.js";
import { increment } from "../utils/metrices.js";
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite"
});

function extractJSON(text: string): string {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (match?.[1]) return match[1];

  const match2 = text.match(/```\s*([\s\S]*?)```/);
  if (match2?.[1]) return match2[1];

  return text.trim();
}

async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {

  for (let attempt = 1; attempt <= retries; attempt++){
  try {
    return await fn();
  } catch (error) {

    const isQuota = error instanceof Error && error.message.includes("Quota")
    const delay = isQuota
      ? 10000 * attempt
      : 1000 * attempt;

    logger.warn(`retry ${attempt} | waiting ${delay}ms`);

    if (attempt === retries) throw error;

    await new Promise(res => setTimeout(res, delay));

    }
  }
  throw new Error("Retry failed");
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

function isJobEmail(input: EmailInput): boolean{
  const text = (input.subject + input.sender).toLowerCase();

  return [
    "applications",
    "interview",
    "job", 
    "career",
    "opportunity",
    "position",
    "hiring"  
  ].some(keyword => text.includes(keyword));
}


const cache = new Map<string, {data: ParsedEmail; time: number}>();
const CACHE_TTL = 10 * 60 * 1000;

export async function parseWithGemini(input: EmailInput): Promise<ParsedEmail> {

  if (!isJobEmail(input)){
    return {
      companyName: "",
      role: "",
      workModel: "Unkown"
    };
  }
    const key = JSON.stringify(input);
    const cached = cache.get(key);
    if(cached && Date.now() - cached.time < CACHE_TTL) {
        logger.info("cache hit");
        return cached.data;
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
        const result = await retry(() => withTimeout(model.generateContent(prompt),15000));
        const text = result.response.text();
        logger.info({text}, "\n RAW GEMINI RESPONSE:\n");
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

        cache.set(key, { data: finalResult, time: Date.now()});
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

