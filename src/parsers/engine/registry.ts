import { domainMatches } from "./sender.js";

export type TextSource = "subject" | "snippet" | "body" | "displayName";

export interface FieldPattern {
  pattern: RegExp;
  source: TextSource;
  confidence: number;
}

export interface SourceRule {
  name: string;
  kind: "ATS" | "JOB_BOARD";
  domains: string[];
  confirmationPatterns?: RegExp[];
  ignorePatterns?: RegExp[];
  company: FieldPattern[];
  role: FieldPattern[];
}

const COMMON_COMPANY: FieldPattern[] = [
  {
    pattern: /(?:thank you|thanks) for applying (?:to|at|with) ([^.,!;\n]+?)(?=\s+for\s|[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.9,
  },
  {
    pattern: /(?:thank you|thanks) for your application (?:to|at|with) ([^.,!;\n]+?)(?=\s+for\s|[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.9,
  },
  {
    pattern: /your application (?:to|at|with) ([^.,!;\n]+?)(?=\s+(?:for|has|was)\s|[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.85,
  },
  {
    pattern: /thank you for your interest in (?:joining |working (?:at|with) )?([^.,!;\n]+?)(?=[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.8,
  },
];

const COMMON_ROLE: FieldPattern[] = [
  {
    pattern: /for the ([^.,!;\n]+?) (?:position|role|opening|opportunity)/i,
    source: "body",
    confidence: 0.85,
  },
  {
    pattern: /(?:position|post|role) of ([^.,!;\n]+?)(?=\s+at\s|[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.85,
  },
  {
    pattern: /your application for (?:the )?([^.,!;\n]+?)(?=\s+at\s|\s+has\s|\s+was\s|[.,!;\n]|$)/i,
    source: "body",
    confidence: 0.8,
  },
  {
    pattern: /interest in the ([^.,!;\n]+?) (?:position|role)/i,
    source: "body",
    confidence: 0.8,
  },
];

const DISPLAY_NAME_COMPANY: FieldPattern[] = [
  {
    pattern: /^([^|@]+?)(?:\s+(?:careers|talent|recruiting|recruitment|hiring team|hiring|team|hr|jobs|notifications?))?$/i,
    source: "displayName",
    confidence: 0.6,
  },
];

export const SOURCE_REGISTRY: SourceRule[] = [

  {
    name: "NAUKRI",
    kind: "JOB_BOARD",
    domains: ["naukri.com", "firstnaukri.com", "naukrigulf.com"],
    confirmationPatterns: [
      /application (?:has been|was) (?:sent|forwarded|submitted)/i,
      /successfully applied/i,
      /\byou applied\b/i,
      /your application (?:has been|was) (?:sent|submitted|forwarded|received)/i,
      /recruiter (?:has )?(?:viewed|downloaded) your (?:resume|profile)/i,
      /interview (?:scheduled|invitation|invite)\b/i,
    ],
    ignorePatterns: [
      /job alert/i,
      /recommended jobs?/i,
      /jobs? (?:for you|matching|based on)/i,
      /update your (?:profile|resume)/i,
      /profile (?:views?|visibility)/i,
      /subscription|premium|fastforward/i,
      /\d+ (?:new )?(?:jobs?|openings|vacancies)/i,
      /top (?:companies|recruiters)/i,
      /jobs? (?:this week|today|near you)/i,
      /hiring in (?:your city|bangalore|mumbai|delhi|pune|hyderabad|chennai)/i,
    ],
    company: [
      {
        pattern: /application (?:has been|was) (?:sent|forwarded) to ([^.,!;\n]+?)(?=\s+for\s|[.,!;\n]|$)/i,
        source: "subject",
        confidence: 0.95,
      },
      {
        pattern: /application (?:has been|was) (?:sent|forwarded) to ([^.,!;\n]+?)(?=\s+for\s|[.,!;\n]|$)/i,
        source: "body",
        confidence: 0.9,
      },
      ...COMMON_COMPANY,
    ],
    role: [
      {
        pattern: /for (?:the )?(?:position|post|role) of ([^.,!;\n]+?)(?=\s+at\s|[.,!;\n]|$)/i,
        source: "body",
        confidence: 0.9,
      },
      {
        pattern: /applied (?:for|to) (?:the )?([^.,!;\n]+?)(?=\s+at\s|\s+-\s|[.,!;\n]|$)/i,
        source: "subject",
        confidence: 0.8,
      },
      ...COMMON_ROLE,
    ],
  },

  {
    name: "LINKEDIN",
    kind: "JOB_BOARD",
    domains: ["linkedin.com"],
    confirmationPatterns: [
      /your application was sent to/i,
      /application sent to/i,
      /viewed your application/i,
      /your application (?:to|for) .{3,} (?:has been|was)/i,
      /application (?:was )?viewed by/i,
      /\byou applied\b/i,
    ],
    ignorePatterns: [
      /invitation|connect|network|endorse/i,
      /viewed your profile|appear(?:ed)? in/i,
      /jobs? (?:you may|for you|similar|alert)/i,
      /hiring in your network|trending|newsletter/i,
      /premium|learning|course/i,
    ],
    company: [
      {
        pattern: /your application was sent to ([^.,!;\n]+?)(?=[.,!;\n]|$)/i,
        source: "subject",
        confidence: 0.95,
      },
      {
        pattern: /your application was sent to ([^.,!;\n]+?)(?=[.,!;\n]|$)/i,
        source: "body",
        confidence: 0.9,
      },
      {
        pattern: /your application to [^.,!;\n]+? at ([^.,!;\n]+?)(?= was| has|[.,!;\n]|$)/i,
        source: "subject",
        confidence: 0.9,
      },
      {
        pattern: /([^.,!;\n]+?) viewed your application/i,
        source: "subject",
        confidence: 0.85,
      },
    ],
    role: [
      {
        pattern: /your application to ([^.,!;\n]+?) at [^.,!;\n]+/i,
        source: "subject",
        confidence: 0.9,
      },
      {
        pattern: /(?:applied|application) (?:for|to) (?:the )?([^.,!;\n]+?)(?=\s+at\s|[.,!;\n]|$)/i,
        source: "body",
        confidence: 0.75,
      },
      ...COMMON_ROLE,
    ],
  },

  {
    name: "INDEED",
    kind: "JOB_BOARD",
    domains: ["indeed.com", "indeedemail.com"],
    confirmationPatterns: [
      /indeed application/i,
      /application (?:was )?submitted/i,
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /employer (?:has )?viewed/i,
    ],
    ignorePatterns: [
      /jobs? (?:for you|alert|matching|similar)/i,
      /new jobs?|newsletter|career guide|salary/i,
    ],
    company: [
      {
        pattern: /(?:submitted|sent) to ([^.,!;\n]+?)(?=[.,!;\n]|$)/i,
        source: "body",
        confidence: 0.85,
      },
      {
        pattern: /indeed application:\s*[^.,!;\n]+? (?:at|@) ([^.,!;\n]+?)(?=[.,!;\n]|$)/i,
        source: "subject",
        confidence: 0.9,
      },
      ...COMMON_COMPANY,
    ],
    role: [
      {
        pattern: /indeed application:\s*([^.,!;\n@]+?)(?=\s+(?:at|@)\s|[.,!;\n]|$)/i,
        source: "subject",
        confidence: 0.9,
      },
      ...COMMON_ROLE,
    ],
  },

  {
    name: "INTERNSHALA",
    kind: "JOB_BOARD",
    domains: ["internshala.com"],
    confirmationPatterns: [
      /application (?:sent|submitted|received)/i,
      /(?:successfully )?applied/i,
      /application (?:for|to)/i,
    ],
    ignorePatterns: [
      /new (?:internships?|jobs?)/i,
      /internships? (?:for you|matching)/i,
      /trainings?|course|certificate|discount/i,
    ],
    company: [
      {
        pattern: /application (?:sent|submitted) to ([^.,!;\n]+?)(?=\s+for\s|[.,!;\n]|$)/i,
        source: "subject",
        confidence: 0.95,
      },
      {
        pattern: /applied (?:to|at) ([^.,!;\n]+?)(?=\s+for\s|[.,!;\n]|$)/i,
        source: "body",
        confidence: 0.85,
      },
      ...COMMON_COMPANY,
    ],
    role: [
      {
        pattern: /for (?:the )?([^.,!;\n]+?) (?:internship|job|role|position)/i,
        source: "subject",
        confidence: 0.85,
      },
      {
        pattern: /for (?:the )?([^.,!;\n]+?) (?:internship|job|role|position)/i,
        source: "body",
        confidence: 0.8,
      },
      ...COMMON_ROLE,
    ],
  },

  {
    name: "INSTAHYRE",
    kind: "JOB_BOARD",
    domains: ["instahyre.com"],
    confirmationPatterns: [
      /\byou applied\b/i,
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /your application (?:has been|was) (?:submitted|sent|received|forwarded)/i,
      /we(?:'ve| have) received your application/i,
      /interview (?:scheduled|invitation|invite)\b/i,
    ],
    ignorePatterns: [
      /jobs? (?:for you|matching)|new opportunities|weekly digest/i,
      /\d+ (?:new )?(?:jobs?|openings)/i,
    ],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "CUTSHORT",
    kind: "JOB_BOARD",
    domains: ["cutshort.io"],
    confirmationPatterns: [
      /\byou applied\b/i,
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /your application (?:has been|was) (?:submitted|sent|received)/i,
      /application (?:sent|submitted|received) (?:to|for)/i,
      /interview (?:scheduled|invitation)\b/i,
    ],
    ignorePatterns: [
      /jobs? (?:for you|matching)|digest|newsletter/i,
      /\d+ (?:new )?(?:jobs?|openings)/i,
    ],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "FOUNDIT",
    kind: "JOB_BOARD",
    domains: ["foundit.in", "foundit.com", "monsterindia.com", "monster.com"],
    confirmationPatterns: [
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /your application (?:has been|was) (?:submitted|sent|received|forwarded)/i,
      /application (?:sent|submitted) (?:to|for)/i,
    ],
    ignorePatterns: [
      /job alert|recommended|jobs? for you|newsletter/i,
      /\d+ (?:new )?(?:jobs?|openings)/i,
    ],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "HIRIST",
    kind: "JOB_BOARD",
    domains: ["hirist.com", "hirist.tech"],
    confirmationPatterns: [
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /your application (?:has been|was) (?:received|sent|submitted)/i,
    ],
    ignorePatterns: [
      /job alert|recommended|jobs? for you/i,
      /\d+ (?:new )?(?:jobs?|openings)/i,
    ],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "SHINE",
    kind: "JOB_BOARD",
    domains: ["shine.com"],
    confirmationPatterns: [
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /your application (?:has been|was) (?:received|sent|submitted)/i,
    ],
    ignorePatterns: [
      /job alert|recommended|matching jobs/i,
      /\d+ (?:new )?(?:jobs?|openings)/i,
    ],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "TIMESJOBS",
    kind: "JOB_BOARD",
    domains: ["timesjobs.com"],
    confirmationPatterns: [
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /your application (?:has been|was) (?:received|sent|submitted)/i,
    ],
    ignorePatterns: [
      /job alert|recommended|newsletter/i,
      /\d+ (?:new )?(?:jobs?|openings)/i,
    ],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "APNA",
    kind: "JOB_BOARD",
    domains: ["apna.co"],
    confirmationPatterns: [
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /your application (?:has been|was) (?:received|submitted)/i,
      /interview (?:scheduled|invitation)\b/i,
    ],
    ignorePatterns: [
      /jobs? (?:for you|near you)|alert/i,
      /\d+ (?:new )?(?:jobs?|openings)/i,
    ],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "WELLFOUND",
    kind: "JOB_BOARD",
    domains: ["wellfound.com", "angel.co"],
    confirmationPatterns: [
      /application (?:was |has been )?(?:submitted|sent|received)/i,
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /viewed your application/i,
      /interview (?:scheduled|invitation)\b/i,
    ],
    ignorePatterns: [
      /jobs? (?:for you|matching|weekly)|digest|trending|featured/i,
    ],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "GLASSDOOR",
    kind: "JOB_BOARD",
    domains: ["glassdoor.com"],
    confirmationPatterns: [
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /your application (?:has been|was) (?:received|submitted|viewed)/i,
    ],
    ignorePatterns: [/jobs? (?:for you|alert)|salaries|reviews|newsletter/i],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "ZIPRECRUITER",
    kind: "JOB_BOARD",
    domains: ["ziprecruiter.com"],
    confirmationPatterns: [
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /your application (?:has been|was) (?:received|submitted|viewed|sent)/i,
      /application (?:sent|submitted|received) to/i,
    ],
    ignorePatterns: [/jobs? (?:for you|alert)|new jobs/i],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "YC_WORK_AT_A_STARTUP",
    kind: "JOB_BOARD",
    domains: ["workatastartup.com", "ycombinator.com"],
    confirmationPatterns: [
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /your application (?:has been|was) (?:received|submitted)/i,
      /interview (?:scheduled|invitation)\b/i,
    ],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "TURING",
    kind: "JOB_BOARD",
    domains: ["turing.com"],
    confirmationPatterns: [
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /your application (?:has been|was) (?:received|submitted|reviewed)/i,
      /(?:coding|technical) assessment\b/i,
      /interview (?:scheduled|invitation)\b/i,
    ],
    ignorePatterns: [/newsletter|webinar/i],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "CROSSOVER",
    kind: "JOB_BOARD",
    domains: ["crossover.com"],
    confirmationPatterns: [
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /your application (?:has been|was) (?:received|submitted)/i,
      /assessment (?:scheduled|invitation)\b/i,
    ],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "REMOTE_BOARDS",
    kind: "JOB_BOARD",
    domains: [
      "remoteok.com",
      "remoteok.io",
      "weworkremotely.com",
      "himalayas.app",
      "remotive.com",
      "otta.com",
      "toptal.com",
    ],
    confirmationPatterns: [
      /(?:you(?:'ve| have)?|successfully) applied/i,
      /your application (?:has been|was) (?:received|submitted)/i,
      /interview (?:scheduled|invitation)\b/i,
    ],
    ignorePatterns: [/newsletter|digest|jobs? (?:for you|this week)/i],
    company: [...COMMON_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "WORKDAY",
    kind: "ATS",
    domains: ["myworkdayjobs.com", "workday.com", "myworkday.com"],
    company: [
      {
        pattern: /^"?([^"|@]+?)\s+(?:careers|talent|recruiting|recruitment)/i,
        source: "displayName",
        confidence: 0.85,
      },
      {
        pattern: /(?:your )?application to ([^.,!;\n]+?)(?=[.,!;\n]|$)/i,
        source: "body",
        confidence: 0.85,
      },
      ...COMMON_COMPANY,
    ],
    role: [
      {
        pattern: /(?:position|role) of ([^.,!;\n]+?)(?=[.,!;\n]|$)/i,
        source: "body",
        confidence: 0.9,
      },
      {
        pattern: /applying to the ([^.,!;\n]+?) position/i,
        source: "body",
        confidence: 0.9,
      },
      ...COMMON_ROLE,
    ],
  },

  {
    name: "ASHBY",
    kind: "ATS",
    domains: ["ashbyhq.com"],
    company: [
      {
        pattern: /(?:your )?application to ([^.,!;\n]+?)(?=[.,!;\n]|$)/i,
        source: "body",
        confidence: 0.9,
      },
      {
        pattern: /^([^"|@]+?)\s+(?:hiring|recruiting|talent)/i,
        source: "displayName",
        confidence: 0.8,
      },
      ...COMMON_COMPANY,
    ],
    role: [
      {
        pattern: /for the ([^.,!;\n]+?)\s+role/i,
        source: "body",
        confidence: 0.9,
      },
      {
        pattern: /interest in the ([^.,!;\n]+?) position/i,
        source: "body",
        confidence: 0.9,
      },
      ...COMMON_ROLE,
    ],
  },

  {
    name: "GREENHOUSE",
    kind: "ATS",
    domains: ["greenhouse.io", "greenhouse-mail.io"],
    company: [
      ...COMMON_COMPANY,
      ...DISPLAY_NAME_COMPANY,
    ],
    role: [...COMMON_ROLE],
  },

  {
    name: "LEVER",
    kind: "ATS",
    domains: ["lever.co"],
    company: [
      {
        pattern: /thank you for your interest in ([^.,!;\n]+?)(?=[.,!;\n]|$)/i,
        source: "body",
        confidence: 0.9,
      },
      ...COMMON_COMPANY,
      ...DISPLAY_NAME_COMPANY,
    ],
    role: [...COMMON_ROLE],
  },

  {
    name: "SMARTRECRUITERS",
    kind: "ATS",
    domains: ["smartrecruiters.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "ICIMS",
    kind: "ATS",
    domains: ["icims.com", "talent.icims.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "TALEO",
    kind: "ATS",
    domains: ["taleo.net"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "SUCCESSFACTORS",
    kind: "ATS",
    domains: ["successfactors.com", "successfactors.eu", "sapsf.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "WORKABLE",
    kind: "ATS",
    domains: ["workable.com", "workablemail.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "BAMBOOHR",
    kind: "ATS",
    domains: ["bamboohr.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "JOBVITE",
    kind: "ATS",
    domains: ["jobvite.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "RECRUITEE",
    kind: "ATS",
    domains: ["recruitee.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "TEAMTAILOR",
    kind: "ATS",
    domains: ["teamtailor.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "JAZZHR",
    kind: "ATS",
    domains: ["applytojob.com", "jazz.co"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "BREEZY",
    kind: "ATS",
    domains: ["breezy.hr", "breezy-mail.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "PERSONIO",
    kind: "ATS",
    domains: ["personio.de", "personio.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "RIPPLING",
    kind: "ATS",
    domains: ["rippling.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "DOVER",
    kind: "ATS",
    domains: ["dover.io", "dover.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "ZOHO_RECRUIT",
    kind: "ATS",
    domains: ["zohorecruit.com", "zohorecruit.in"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "KEKA",
    kind: "ATS",
    domains: ["keka.com", "kekamail.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "DARWINBOX",
    kind: "ATS",
    domains: ["darwinbox.in", "darwinbox.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "FRESHTEAM",
    kind: "ATS",
    domains: ["freshteam.com"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },

  {
    name: "TURBOHIRE",
    kind: "ATS",
    domains: ["turbohire.co"],
    company: [...COMMON_COMPANY, ...DISPLAY_NAME_COMPANY],
    role: [...COMMON_ROLE],
  },
];

export function resolveSource(
  senderDomain: string | null
): SourceRule | null {
  if (!senderDomain) return null;

  for (const rule of SOURCE_REGISTRY) {
    if (rule.domains.some((d) => domainMatches(senderDomain, d))) {
      return rule;
    }
  }
  return null;
}
