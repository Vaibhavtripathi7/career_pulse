import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { GenerativeModel } from "@google/generative-ai";
import type { EmailInput } from "../types/email.types.js";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";
import { llmCallsTotal, llmCallDuration } from "../utils/metrics.js";
dotenv.config();

export interface GeminiParseResult {
  isJobApplicationEvent: boolean;
  companyName: string;
  role: string;
  workModel: string;
}

const FAILURE_RESULT: GeminiParseResult = {
  isJobApplicationEvent: true,
  companyName: "",
  role: "",
  workModel: "Unknown",
};

let model: GenerativeModel | null = null;

function getModel(): GenerativeModel | null {
  if (model) return model;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          isJobApplicationEvent: {
            type: SchemaType.BOOLEAN,
            description:
              "true only if this email is about a job application the recipient made: a confirmation, interview, assessment, offer or rejection. false for job alerts, recommendations, newsletters, promotions.",
          },
          companyName: {
            type: SchemaType.STRING,
            description:
              "The hiring company's name. Empty string if not determinable. Never the name of the ATS or job board (Workday, Greenhouse, LinkedIn, Naukri...).",
          },
          role: {
            type: SchemaType.STRING,
            description:
              "The job title applied for. Empty string if not determinable. Never invent one.",
          },
          workModel: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["Remote", "Hybrid", "Onsite", "Unknown"],
          },
        },
        required: ["isJobApplicationEvent", "companyName", "role", "workModel"],
      },
    },
  });
  return model;
}

async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isQuota =
        error instanceof Error && error.message.includes("Quota");
      const delay = isQuota ? 10000 * attempt : 1000 * attempt;

      logger.warn(`retry ${attempt} | waiting ${delay}ms`);

      if (attempt === retries) throw error;

      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error("Retry failed");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout")), ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const cache = new Map<string, { data: GeminiParseResult; time: number }>();
const CACHE_TTL = 10 * 60 * 1000;

const CALL_INTERVAL_MS = 6_000;
let _lastCallAt = 0;
let _serializer: Promise<void> = Promise.resolve();

function _enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = _serializer.then(async () => {
    const gap = CALL_INTERVAL_MS - (Date.now() - _lastCallAt);
    if (gap > 0) await new Promise<void>((r) => setTimeout(r, gap));
    _lastCallAt = Date.now();
    return fn();
  });
  _serializer = next.then(
    () => {},
    () => {}
  );
  return next;
}

export async function parseWithGemini(
  input: EmailInput
): Promise<GeminiParseResult> {

  const activeModel = getModel();
  if (!activeModel) {
    logger.warn("GEMINI_API_KEY not set — skipping LLM fallback");
    return FAILURE_RESULT;
  }

  const key = JSON.stringify([input.subject, input.sender, input.snippet]);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    logger.info("gemini cache hit");
    llmCallsTotal.inc({ outcome: "cache_hit" });
    return cached.data;
  }

  return _enqueue(async () => {
    const hot = cache.get(key);
    if (hot && Date.now() - hot.time < CACHE_TTL) {
      llmCallsTotal.inc({ outcome: "cache_hit" });
      return hot.data;
    }

    const endTimer = llmCallDuration.startTimer();

    const body = (input.body ?? "").slice(0, 2000);

    const prompt = `
Extract job application details from this email received by a job seeker.

Subject: ${input.subject}
Sender: ${input.sender}
Snippet: ${input.snippet}
Body: ${body}
`;

    try {
      const result = await retry(() =>
        withTimeout(activeModel.generateContent(prompt), 15000)
      );
      const text = result.response.text();

      let parsed: Partial<GeminiParseResult>;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON from gemini");
      }

      const finalResult: GeminiParseResult = {
        isJobApplicationEvent: parsed.isJobApplicationEvent !== false,
        companyName:
          typeof parsed.companyName === "string" ? parsed.companyName : "",
        role: typeof parsed.role === "string" ? parsed.role : "",
        workModel:
          typeof parsed.workModel === "string" && parsed.workModel
            ? parsed.workModel
            : "Unknown",
      };

      cache.set(key, { data: finalResult, time: Date.now() });
      endTimer();
      llmCallsTotal.inc({ outcome: "success" });
      return finalResult;
    } catch (error: unknown) {
      endTimer();
      llmCallsTotal.inc({ outcome: "failure" });
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage }, "Gemini parsing failed:");
      return FAILURE_RESULT;
    }
  });
}
