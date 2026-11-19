// Generates fake Gmail mailboxes. Everything is seeded, so the same config and
// user always give the same messages, ids and order in every process.

export interface LoadConfig {
  /** Unique messages across all users. */
  messages: number;
  users: number;
  /** Share of unique messages that are job-application emails. */
  jobShare: number;
  /** Extra exact-duplicate deliveries, as a share of each user's unique messages. */
  dupShare: number;
  seed: number;
}

export const DEFAULT_CONFIG: LoadConfig = {
  messages: 100_000,
  users: 1_000,
  jobShare: 0.1,
  dupShare: 0.05,
  seed: 20261120,
};

export function loadConfigFromEnv(): LoadConfig {
  const raw = process.env.LT_CONFIG;
  if (!raw) return DEFAULT_CONFIG;
  return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<LoadConfig>) };
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailPart {
  mimeType: string;
  headers?: GmailHeader[];
  body?: { data: string; size: number };
  parts?: GmailPart[];
}

export type MessageKind = "job" | "promo";

export interface SyntheticMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: GmailPart;
  /** Only used for reporting, never returned by the fake API. */
  kind: MessageKind;
  template: string;
}

export function userId(u: number): string {
  return `lt-user-${String(u).padStart(5, "0")}`;
}

export function refreshTokenFor(u: number): string {
  return `lt-refresh:${u}`;
}

export function userIndexFromRefreshToken(token: string): number {
  const match = /^lt-refresh:(\d+)$/.exec(token);
  if (!match) throw new Error(`fake gmail: not a load-test token: ${token}`);
  return Number(match[1]);
}

export function messageId(u: number, i: number): string {
  return u.toString(16).padStart(6, "0") + i.toString(16).padStart(10, "0");
}

export function uniqueCountFor(cfg: LoadConfig, u: number): number {
  const base = Math.floor(cfg.messages / cfg.users);
  return base + (u < cfg.messages % cfg.users ? 1 : 0);
}

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFor(cfg: LoadConfig, u: number): Rng {
  return mulberry32((cfg.seed ^ Math.imul(u + 1, 0x9e3779b1)) >>> 0);
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function int(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

function shuffle<T>(rng: Rng, items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
}

const COMPANY_PREFIX = [
  "Arcturus", "Bluefin", "Cobalt", "Driftwood", "Ember", "Fathom", "Granite",
  "Halcyon", "Ironbark", "Juniper", "Keystone", "Lumen", "Meridian", "Northwind",
  "Obsidian", "Pinecone", "Quarry", "Redwood", "Saffron", "Tamarind", "Umbra",
  "Vantage", "Willow", "Xenon", "Yarrow", "Zephyr",
] as const;

const COMPANY_SUFFIX = [
  "Labs", "Systems", "AI", "Technologies", "Robotics", "Health", "Pay", "Cloud",
  "Analytics", "Logistics", "Energy", "Security",
] as const;

const TLDS = ["com", "io", "ai", "tech", "co"] as const;

const ROLES = [
  "Backend Engineer", "Software Engineer Intern", "Platform Engineer", "Data Engineer",
  "Machine Learning Engineer", "Frontend Developer", "Full Stack Engineer",
  "Site Reliability Engineer", "DevOps Engineer", "Software Development Engineer",
  "Backend Engineering Intern", "Infrastructure Engineer",
] as const;

const CITIES = ["Bengaluru", "Gurugram", "Pune", "Hyderabad", "Noida", "Remote"] as const;

const PEOPLE_FIRST = ["Priya", "Rahul", "Ananya", "Arjun", "Meera", "Kabir", "Sara", "Dev"] as const;
const PEOPLE_LAST = ["Sharma", "Iyer", "Mehta", "Rao", "Kapoor", "Nair", "Singh", "Das"] as const;

const SHOPS = [
  { name: "ShopKart", domain: "shopkart.in" },
  { name: "TrendWear", domain: "trendwear.co" },
  { name: "QuickBasket", domain: "quickbasket.in" },
  { name: "GadgetHub", domain: "gadgethub.store" },
] as const;

const JOB_FILLER = [
  "Our recruiting team reviews every application carefully, and we will reach out if your background is a match for the team.",
  "Please do not reply to this email; this mailbox is not monitored.",
  "We are an equal opportunity employer and value diversity. All employment decisions are made without regard to race, colour, religion, gender, sexual orientation, national origin, age, disability or veteran status.",
  "You can review the status of your application at any time by signing in to your account on our careers site.",
  "If you need a reasonable accommodation during the hiring process, let us know and we will work with you.",
  "In the meantime, you can learn more about our engineering culture on our blog.",
  "We receive a high volume of applications, so it may take up to two weeks before you hear back from us.",
  "This message was sent to you because you applied through our careers site.",
] as const;

const PROMO_FILLER = [
  "Free delivery on orders above Rs 499. Easy 30-day returns on most items.",
  "Prices and availability are subject to change without notice. Offer valid while stocks last.",
  "You are receiving this email because you subscribed to updates from us.",
  "Download our app for exclusive app-only deals and early access to sales.",
  "Questions? Our support team is available 24x7 through the help centre.",
  "To stop receiving these emails, update your communication preferences.",
] as const;

interface Draft {
  template: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  labels: string[];
}

function company(rng: Rng) {
  const prefix = pick(rng, COMPANY_PREFIX);
  const suffix = pick(rng, COMPANY_SUFFIX);
  const name = `${prefix} ${suffix}`;
  const slug = `${prefix}${suffix}`.toLowerCase();
  const tld = TLDS[(prefix.length + suffix.length) % TLDS.length]!;
  return { name, slug, domain: `${slug}.${tld}` };
}

function filler(rng: Rng, pool: readonly string[], min: number, max: number): string {
  const lines: string[] = [];
  const n = int(rng, min, max);
  for (let i = 0; i < n; i++) lines.push(pick(rng, pool));
  return lines.join("\n\n");
}

function jobDraft(rng: Rng): Draft {
  const c = company(rng);
  const role = pick(rng, ROLES);
  const city = pick(rng, CITIES);
  const tail = filler(rng, JOB_FILLER, 2, 5);
  const labels = ["INBOX", "UNREAD", "CATEGORY_UPDATES"];
  const roll = rng();

  if (roll < 0.15) {
    return {
      template: "greenhouse-confirmation", labels,
      from: `"${c.name} Recruiting" <no-reply@us.greenhouse-mail.io>`,
      subject: `Thank you for applying to ${c.name}`,
      text: `Hi Alex,\n\nThank you for applying to ${c.name}. We have received your application for the ${role} position and our team is reviewing it.\n\n${tail}\n\nBest,\n${c.name} Recruiting`,
    };
  }
  if (roll < 0.25) {
    return {
      template: "lever-confirmation", labels,
      from: `"${c.name}" <no-reply@hire.lever.co>`,
      subject: `Your application to ${c.name}`,
      text: `Hi Alex,\n\nThanks for your application to ${c.name} for the ${role} role. We will be in touch about next steps.\n\n${tail}`,
    };
  }
  if (roll < 0.35) {
    return {
      template: "workday-confirmation", labels,
      from: `"${c.name} Careers" <${c.slug}@myworkday.com>`,
      subject: "Application Confirmation",
      text: `Thank you for your application to ${c.name}. You are applying to the ${role} position (${city}).\n\n${tail}`,
    };
  }
  if (roll < 0.45) {
    return {
      template: "ashby-confirmation", labels,
      from: `"${c.name} Hiring Team" <jobs@ashbyhq.com>`,
      subject: "Thank you for applying",
      text: `Thank you for your application to ${c.name}. We appreciate your interest in the ${role} position.\n\n${tail}`,
    };
  }
  if (roll < 0.6) {
    return {
      template: "linkedin-easy-apply", labels,
      from: `"LinkedIn" <jobs-noreply@linkedin.com>`,
      subject: `Your application was sent to ${c.name}`,
      text: `Your application was sent to ${c.name}. ${role} · ${city}, India.\n\nApplied on LinkedIn. You can track this application in My Jobs.\n\n${tail}`,
    };
  }
  if (roll < 0.7) {
    return {
      template: "naukri-application", labels,
      from: `"Naukri.com" <info@naukri.com>`,
      subject: `Your application has been sent to ${c.name}`,
      text: `Your application has been sent to ${c.name} for the position of ${role}. The recruiter will contact you if shortlisted.\n\n${tail}`,
    };
  }
  if (roll < 0.8) {
    return {
      template: "interview-invite", labels,
      from: `"${c.name} Talent Team" <talent@${c.domain}>`,
      subject: `Interview invitation: ${role} at ${c.name}`,
      text: `Hi Alex,\n\nThank you for your interest in ${c.name}. We would like to invite you to an interview for the ${role} role. Please pick a slot that works for you using the link below.\n\n${tail}`,
    };
  }
  if (roll < 0.9) {
    return {
      template: "rejection", labels,
      from: `"${c.name} Careers" <careers@${c.domain}>`,
      subject: `Update on your application to ${c.name}`,
      text: `Hi Alex,\n\nThank you for your interest in ${c.name} and the ${role} position. After careful review, we regret to inform you that we will not be moving forward with your application at this time.\n\n${tail}`,
    };
  }
  if (roll < 0.95) {
    return {
      template: "coding-assessment", labels,
      from: `"${c.name} Hiring" <hiring@${c.domain}>`,
      subject: `Coding assessment for the ${role} role`,
      text: `Thank you for applying to ${c.name}. As the next step for the ${role} position, please complete the HackerRank coding assessment within 7 days.\n\n${tail}`,
    };
  }
  // Recruiter mail from a personal address. With a display name the parser uses
  // the person's name as the company; without one, company and role are both
  // empty and the message goes to the LLM fallback.
  const first = pick(rng, PEOPLE_FIRST);
  const last = pick(rng, PEOPLE_LAST);
  const address = `${first.toLowerCase()}.${last.toLowerCase()}@gmail.com`;
  const bare = rng() < 0.5;
  return {
    template: bare ? "vague-recruiter-bare-address" : "vague-recruiter-named",
    labels: ["INBOX", "UNREAD", "CATEGORY_PERSONAL"],
    from: bare ? address : `"${first} ${last}" <${address}>`,
    subject: "Next steps with the hiring team",
    text: `Hi Alex, thanks for speaking with me earlier. The hiring manager would like to schedule your next interview. Could you share your availability for this week?\n\nThanks,\n${first}`,
  };
}

function promoHtml(rng: Rng, heading: string, rows: string[]): string {
  const style =
    "body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0}table{width:100%;max-width:600px;margin:0 auto;background:#fff}" +
    "td{padding:12px 16px;border-bottom:1px solid #eee}.cta{background:#e4572e;color:#fff;padding:10px 18px;border-radius:4px;text-decoration:none}" +
    ".footer{font-size:11px;color:#888;text-align:center}";
  const body = rows
    .map((r) => `<tr><td><p>${r}</p><a class="cta" href="https://example.invalid/r/${int(rng, 1000, 9999)}">View</a></td></tr>`)
    .join("");
  const footer = filler(rng, PROMO_FILLER, 2, 4)
    .split("\n\n")
    .map((p) => `<p class="footer">${p}</p>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${style}</style></head><body><table><tr><td><h1>${heading}</h1></td></tr>${body}<tr><td>${footer}</td></tr></table></body></html>`;
}

function promoDraft(rng: Rng): Draft {
  const roll = rng();

  if (roll < 0.35) {
    const shop = pick(rng, SHOPS);
    const pct = pick(rng, [20, 30, 40, 50, 60, 70]);
    const items = Array.from({ length: int(rng, 4, 8) }, () =>
      `${pick(rng, ["Sneakers", "Headphones", "Backpacks", "Smart watches", "Jackets", "Kitchenware"])} from Rs ${int(rng, 299, 4999)}`);
    return {
      template: "shopping-promo", labels: ["INBOX", "UNREAD", "CATEGORY_PROMOTIONS"],
      from: `"${shop.name}" <offers@${shop.domain}>`,
      subject: `Flat ${pct}% off ends tonight - ${shop.name} Big Sale`,
      html: promoHtml(rng, `Flat ${pct}% off`, items),
    };
  }
  if (roll < 0.55) {
    const role = pick(rng, ROLES);
    const city = pick(rng, CITIES);
    const jobs = Array.from({ length: int(rng, 5, 9) }, () => {
      const c = company(rng);
      return `${pick(rng, ROLES)} at ${c.name}, ${pick(rng, CITIES)}. Apply now`;
    });
    const sender = pick(rng, [
      `"LinkedIn Job Alerts" <jobalerts-noreply@linkedin.com>`,
      `"Naukri Alerts" <naukrialerts@naukri.com>`,
      `"Indeed" <alert@indeed.com>`,
    ]);
    return {
      template: "job-alert", labels: ["INBOX", "UNREAD", "CATEGORY_UPDATES"],
      from: sender,
      subject: `${int(rng, 3, 40)} new jobs for "${role}" in ${city}`,
      html: promoHtml(rng, "Jobs you may be interested in", jobs),
    };
  }
  if (roll < 0.65) {
    const person = `${pick(rng, PEOPLE_FIRST)} ${pick(rng, PEOPLE_LAST)}`;
    return {
      template: "social-notification", labels: ["INBOX", "UNREAD", "CATEGORY_SOCIAL"],
      from: `"LinkedIn" <notifications-noreply@linkedin.com>`,
      subject: `${person} commented on your post`,
      html: promoHtml(rng, `${person} commented on your post`, [
        `"Great write-up on queue backpressure!"`,
        "See all comments and reply.",
      ]),
    };
  }
  if (roll < 0.75) {
    return {
      template: "newsletter", labels: ["INBOX", "UNREAD", "CATEGORY_UPDATES"],
      from: `"Backend Weekly" <newsletter@backendweekly.dev>`,
      subject: `Backend Weekly #${int(rng, 100, 400)}: Postgres connection pooling, explained`,
      html: promoHtml(rng, "This week in backend", [
        "Why your pool size should be smaller than you think.",
        "Idempotency keys in practice.",
        "A field guide to Redis memory usage.",
      ]),
    };
  }
  if (roll < 0.9) {
    const order = int(rng, 100000, 999999);
    return {
      template: "transactional", labels: ["INBOX", "UNREAD", "CATEGORY_UPDATES"],
      from: pick(rng, [`"QuickBite" <noreply@quickbite.in>`, `"Axis Pay" <statements@axispay.in>`]),
      subject: pick(rng, [`Your order #${order} is on the way`, "Your November statement is ready", `Receipt for order #${order}`]),
      html: promoHtml(rng, "Thanks for your order", [
        `Order #${order}: ${int(rng, 1, 5)} items`,
        `Total paid: Rs ${int(rng, 99, 2999)}`,
      ]),
    };
  }
  const repo = pick(rng, ["acme/api", "acme/web", "infra/terraform", "tools/cli"]);
  const pr = int(rng, 100, 999);
  return {
    template: "dev-notification", labels: ["INBOX", "UNREAD", "CATEGORY_UPDATES"],
    from: `"GitHub" <notifications@github.com>`,
    subject: `Re: [${repo}] Fix retry backoff on worker shutdown (#${pr})`,
    text: `@alex approved these changes.\n\nLooks good to me, merging after CI.\n\nReply to this email directly or view it on GitHub. You are receiving this because you authored the thread.`,
  };
}

const EPOCH_MS = Date.UTC(2026, 10, 1); // 2026-11-01, fixed so runs are reproducible

function b64url(s: string): { data: string; size: number } {
  const buf = Buffer.from(s, "utf8");
  return { data: buf.toString("base64url"), size: buf.length };
}

function textOf(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function toMessage(draft: Draft, kind: MessageKind, id: string, rng: Rng): SyntheticMessage {
  const internalMs = EPOCH_MS - Math.floor(rng() * 30 * 24 * 3600 * 1000);
  const headers: GmailHeader[] = [
    { name: "Delivered-To", value: "alex@example.invalid" },
    { name: "From", value: draft.from },
    { name: "To", value: "alex@example.invalid" },
    { name: "Subject", value: draft.subject },
    { name: "Date", value: new Date(internalMs).toUTCString() },
    { name: "Message-ID", value: `<${id}@mail.example.invalid>` },
  ];

  let payload: GmailPart;
  let plain: string;
  if (draft.text !== undefined) {
    plain = draft.text;
    const html = `<html><body>${draft.text.split("\n\n").map((p) => `<p>${p}</p>`).join("")}</body></html>`;
    payload = {
      mimeType: "multipart/alternative",
      headers,
      parts: [
        { mimeType: "text/plain", body: b64url(draft.text) },
        { mimeType: "text/html", body: b64url(html) },
      ],
    };
  } else {
    const html = draft.html ?? "";
    plain = textOf(html);
    payload = { mimeType: "text/html", headers, body: b64url(html) };
  }

  return {
    id,
    threadId: id,
    labelIds: draft.labels,
    snippet: plain.replace(/\s+/g, " ").slice(0, 160),
    internalDate: String(internalMs),
    payload,
    kind,
    template: draft.template,
  };
}

/** A user's mailbox as messages.list returns it, with the duplicates mixed in. */
export function generateMailbox(cfg: LoadConfig, u: number): SyntheticMessage[] {
  const rng = rngFor(cfg, u);
  const count = uniqueCountFor(cfg, u);
  const jobCount = Math.round(count * cfg.jobShare);
  const dupCount = Math.round(count * cfg.dupShare);

  const kinds: MessageKind[] = Array.from({ length: count }, (_, i) => (i < jobCount ? "job" : "promo"));
  shuffle(rng, kinds);

  const unique = kinds.map((kind, i) =>
    toMessage(kind === "job" ? jobDraft(rng) : promoDraft(rng), kind, messageId(u, i), rng));

  const list = [...unique];
  for (let d = 0; d < dupCount; d++) {
    const original = unique[Math.floor(rng() * unique.length)]!;
    list.splice(Math.floor(rng() * (list.length + 1)), 0, original);
  }
  return list;
}
