export interface SenderInfo {
  displayName: string | null;
  email: string | null;
  localPart: string | null;
  domain: string | null;
}

const EMAIL_REGEX =
  /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

export function parseSender(sender: string): SenderInfo {
  if (!sender) {
    return { displayName: null, email: null, localPart: null, domain: null };
  }

  const trimmed = sender.trim();

  let displayName: string | null = null;
  let addressPart = trimmed;

  const angleMatch = trimmed.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (angleMatch) {
    displayName = angleMatch[1]?.replace(/^["']+|["']+$/g, "").trim() || null;
    addressPart = angleMatch[2] ?? "";
  }

  const emailMatch = addressPart.match(EMAIL_REGEX);
  if (!emailMatch) {
    return {
      displayName: displayName ?? (trimmed.length > 0 ? trimmed : null),
      email: null,
      localPart: null,
      domain: null,
    };
  }

  const localPart = emailMatch[1]!.toLowerCase();
  const domain = emailMatch[2]!.toLowerCase();

  return {
    displayName,
    email: `${localPart}@${domain}`,
    localPart,
    domain,
  };
}

export function domainMatches(
  senderDomain: string | null,
  ruleDomain: string
): boolean {
  if (!senderDomain) return false;
  const rule = ruleDomain.toLowerCase();
  return senderDomain === rule || senderDomain.endsWith("." + rule);
}
