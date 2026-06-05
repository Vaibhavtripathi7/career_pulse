
export function extractSenderDomain(
    sender: string
): string | null {

    const emailMatch = sender.match(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    );

    const email = emailMatch?.[1];

    if (!email) {
        return null;
    }

    const domain = email.split("@")[1];

    if (!domain) {
        return null;
    }

    return domain.toLowerCase();

}



export function normalizeCompany(
  company: string
): string {

  return company
    .toLowerCase()
    .trim()
    .replace(
      /\b(inc|inc\.|llc|ltd|ltd\.|corp|corp\.|corporation)\b/gi,
      ""
    )
    .replace(/[^\w\s]/g, "")
    .trim();
}