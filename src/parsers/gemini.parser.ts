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

async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    console.warn(` Retry... remaining: ${retries}`);
    await new Promise(res => setTimeout(res, 1000));

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
    const key = `${input.subject}-${input.sender}`;
    if(cache.has(key)) {
        console.log("cache hit");
        return cache.get(key)!;
    }    
    
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
        console.log("\n RAW GEMINI RESPONSE:\n", text);
        const parsed = JSON.parse(extractJSON(text));

        const finalResult: ParsedEmail = {
            companyName: parsed.companyName || "",
            role: parsed.role || "",
            workModel: parsed.workModel || "Unknown"
            };

        cache.set(key, finalResult);
        return finalResult;


    } catch (error) {
            console.error(" Gemini parsing failed:", error);
            return {
                companyName: "",
                role: "",
                workModel: "Unknown"};
    }
}

