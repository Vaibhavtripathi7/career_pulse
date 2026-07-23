import type { gmail_v1 } from "googleapis";

const MAX_BODY_LENGTH = 4000;

function decodeBase64Url(data: string): string {
  try {
    return Buffer.from(data, "base64url").toString("utf-8");
  } catch {
    return "";
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function findPart(
  part: gmail_v1.Schema$MessagePart | undefined,
  mimeType: string
): string | null {
  if (!part) return null;

  if (part.mimeType === mimeType && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }

  for (const child of part.parts ?? []) {
    const found = findPart(child, mimeType);
    if (found) return found;
  }
  return null;
}

export function extractEmailBody(
  payload: gmail_v1.Schema$MessagePart | null | undefined
): string {
  if (!payload) return "";

  const plain = findPart(payload, "text/plain");
  if (plain) {
    return plain.replace(/\s+/g, " ").trim().slice(0, MAX_BODY_LENGTH);
  }

  const html = findPart(payload, "text/html");
  if (html) {
    return htmlToText(html).replace(/\s+/g, " ").trim().slice(0, MAX_BODY_LENGTH);
  }

  return "";
}
