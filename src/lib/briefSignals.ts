// ─────────────────────────────────────────────
// Brief signal extractor — pulls user's actual nouns, verbs,
// numbers, and goals so demo-mode output can echo them verbatim.
// Pure regex + word-class heuristics, no NLP libs.
// ─────────────────────────────────────────────

export type NumberKind = 'budget' | 'count' | 'duration' | 'percent' | 'unknown';

export interface ExtractedNumber {
  raw: string;
  kind: NumberKind;
}

export interface BriefSignals {
  subject: string;
  audience: string | null;
  verbs: string[];
  entities: string[];
  numbers: ExtractedNumber[];
  goals: string[];
  constraints_text: string[];
  quoted_phrase: string;
  // convenience derived flags
  hasBudget: boolean;
  hasAudience: boolean;
  hasExample: boolean;
  hasOutputStyleHint: boolean;
  hasFailureMode: boolean;
  hasToneHint: boolean;
}

const STOPWORDS = new Set([
  'the','a','an','of','for','to','and','or','but','with','that','this','these','those','it','its',
  'in','on','at','by','as','is','are','was','were','be','being','been','i','you','we','they','my',
  'your','our','their','me','us','them','so','if','then','than','from','into','about','some','any',
  'such','also','very','more','most','can','will','would','should','could','may','might','do','does',
  'did','done','build','make','create','help','helps','help','build','please','want','need',
]);

const VERB_HINT_RE = /\b([a-z]{3,})(ate|ize|ise|end|ing|ate|ify)\b/i;
const COMMON_VERBS = new Set([
  'track','warn','log','summarize','suggest','recommend','generate','plan','manage','handle',
  'analyze','convert','translate','match','filter','sort','search','find','book','schedule',
  'remind','notify','export','import','sync','update','review','tag','classify','rank','pay',
  'process','train','teach','tutor','coach','guide','review','debug','refactor','test',
  'monitor','optimize','propose','show','display','calculate','compute','estimate','forecast',
  'split','merge','clean','validate','check','approve','reject','draft','rewrite','rephrase',
  'ask','answer','greet','respond','explain','quiz','grade','score','flag','escalate',
]);

const KNOWN_ENTITIES = [
  'Stripe','Postgres','PostgreSQL','MySQL','MongoDB','Redis','Supabase','Firebase','Neon',
  'PlanetScale','Vercel','Netlify','Cloudflare','AWS','GCP','Azure','Notion','Slack','Discord',
  'Twilio','SendGrid','Resend','OpenAI','Anthropic','Claude','GPT-4','GPT-4o','Grok','Gemini',
  'Next.js','React','Vue','Svelte','Astro','Remix','Hono','Fastify','Express','Django','Rails',
  'Python','Rust','Go','TypeScript','JavaScript','Java','Kotlin','Swift','Ruby','PHP','C++',
  'Tailwind','shadcn','Prisma','Drizzle','tRPC','GraphQL','Docker','Kubernetes','Terraform',
  'S3','R2','BigQuery','Snowflake','DuckDB','Algolia','Meilisearch','Pinecone','Weaviate',
  'PostHog','Mixpanel','Amplitude','Plausible','HubSpot','Salesforce','Shopify','WordPress',
  'GitHub','GitLab','Bitbucket','Linear','Jira','Asana','Trello','Excel','Google Sheets',
  'Lisbon','Tokyo','Paris','Lisbon','New York','London','Bangkok','Madrid','Rome','Barcelona',
  'Mexico City','San Francisco','Berlin','Amsterdam',
];

const COUNTRY_CITY_RE = /\b(?:Lisbon|Tokyo|Paris|Bangkok|London|New\s?York|Madrid|Rome|Barcelona|Mexico\s?City|San\s?Francisco|Berlin|Amsterdam|Portugal|Japan|France|Thailand|Spain|Italy|USA|UK|Germany|Netherlands|Mexico)\b/g;

const AUDIENCE_RE = /\b(?:for|to help|that helps?|aimed at|targeting|targeted at)\s+((?:[a-z][a-z-]+\s+){0,2}(?:powerlifters|runners|cyclists|developers|engineers|designers|founders|students|teachers|kids|parents|seniors|nurses|doctors|patients|travelers|tourists|gamers|musicians|writers|freelancers|recruiters|investors|traders|small business owners|owners|smbs|managers|marketers|analysts|researchers|operators|users|customers|clients|powerlifters|crossfitters|yogis|athletes|beginners|professionals|consultants|teams|companies|startups))\b/i;

const GOAL_LEAD_RE = /\b(?:so (?:that|they can)|in order to|to (?:help|let|enable|allow)|that (?:lets?|helps?|allows?|enables?))\s+([^.,;!?]{4,140})/gi;

const CONSTRAINT_PATTERNS: { re: RegExp; label: (m: string) => string }[] = [
  { re: /must (?:work )?offline|offline[- ]?first|no internet/i, label: () => 'Must work offline' },
  { re: /low[- ]?cost|cheap|free tier|minimal cost|under \$\d+/i, label: (m) => `Low cost (${m.toLowerCase()})` },
  { re: /hipaa|gdpr|soc ?2|pci|ferpa/i, label: (m) => `${m.toUpperCase()} compliant` },
  { re: /accessib(?:le|ility)|wcag|screen reader|keyboard nav/i, label: () => 'Accessible (WCAG-grade)' },
  { re: /multi[- ]?tenant|per[- ]?org|workspace isolation/i, label: () => 'Multi-tenant isolation' },
  { re: /real[- ]?time|live updates?|streaming/i, label: () => 'Real-time updates' },
  { re: /mobile[- ]?(?:friendly|first)|responsive/i, label: () => 'Mobile-responsive' },
  { re: /no llm|no ai|without ai|without an? llm/i, label: () => 'No LLM dependency' },
  { re: /open[- ]?source|self[- ]?hosted/i, label: () => 'Self-hostable / open-source' },
  { re: /enterprise|sso/i, label: () => 'Enterprise-ready (SSO)' },
];

const TONE_HINTS = /\b(friendly|warm|terse|casual|professional|playful|empathetic|witty|formal|concise|verbose|sarcastic|encouraging|stoic)\b/i;
const OUTPUT_STYLE_HINTS = /\b(markdown|json|table|yaml|csv|bullet[s]?|numbered list|code block|step[- ]?by[- ]?step)\b/i;
const FAILURE_HINTS = /\b(refuse|do not|never|must not|forbidden|reject|escalate|handoff|hand off|defer)\b/i;
const EXAMPLE_HINTS = /\b(for example|e\.?g\.?|like|such as|imagine)\b/i;

function classifyNumber(raw: string, ctx: string): NumberKind {
  if (/^\$/.test(raw) || /\b(usd|eur|gbp|budget|cost|price)\b/i.test(ctx)) return 'budget';
  if (/%$/.test(raw)) return 'percent';
  if (/\b(day|days|week|weeks|month|months|year|years|hour|hours|minute|minutes|sec|seconds|night|nights)\b/i.test(ctx)) return 'duration';
  if (/\b(people|users|customers|members|reps|sets|items|products|tickets|orders)\b/i.test(ctx)) return 'count';
  return 'unknown';
}

function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }

export function extractBriefSignals(input: string): BriefSignals {
  const text = input.trim();
  const words = text.split(/\s+/).filter(Boolean);

  // Subject: try to grab "<verb> me|us a/an <subject head>" or first noun-phrase near start.
  let subject = '';
  const subjectRe = /\b(?:build|make|create|forge|design|generate|ship)\s+(?:me\s+|us\s+|a\s+|an\s+|the\s+)*([a-z][a-z0-9 +\-/.&]{2,80}?)(?=\s+(?:that|which|for|to|so|in|with|using|—|-|,|\.|$))/i;
  const sm = text.match(subjectRe);
  if (sm) subject = sm[1].trim();
  if (!subject) {
    // Fall back: first 4-7 content words
    const head = words.slice(0, 8).join(' ').replace(/[.,;:!?]/g, '');
    subject = head;
  }
  subject = subject.replace(/\s+/g, ' ').trim();

  // Quoted phrase: prefer real quotes, else a short excerpt around the subject.
  let quoted = '';
  const qm = text.match(/["“”'`]([^"“”'`]{6,80})["“”'`]/);
  if (qm) {
    quoted = qm[1].trim();
  } else {
    // pick a 6-15 word slice that contains the subject if possible
    const sliceLen = Math.min(12, Math.max(6, words.length));
    quoted = words.slice(0, sliceLen).join(' ').replace(/[.,;:!?]+$/, '');
  }

  // Audience
  let audience: string | null = null;
  const am = text.match(AUDIENCE_RE);
  if (am) audience = am[1].trim().replace(/\s+/g, ' ');

  // Verbs: detect from common verb set + suffix heuristic
  const verbs: string[] = [];
  const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z-]/g, ''));
  for (const w of lowerWords) {
    if (!w || STOPWORDS.has(w)) continue;
    const stem = w.replace(/(s|ed|ing)$/, '');
    if (COMMON_VERBS.has(w) || COMMON_VERBS.has(stem)) verbs.push(stem);
    else if (VERB_HINT_RE.test(w) && w.length >= 5) verbs.push(w);
  }

  // Entities: known list + capitalized mid-sentence words + tech-ish tokens with dots
  const entities: string[] = [];
  for (const e of KNOWN_ENTITIES) {
    const re = new RegExp(`\\b${e.replace(/[.+]/g, (c) => `\\${c}`)}\\b`, 'i');
    if (re.test(text)) entities.push(e);
  }
  // Capitalized phrases mid-sentence (skip first word of a sentence)
  const sentSplit = text.split(/(?<=[.!?])\s+/);
  for (const sent of sentSplit) {
    const tokens = sent.split(/\s+/);
    tokens.forEach((tok, i) => {
      const clean = tok.replace(/[^A-Za-z0-9.+-]/g, '');
      if (i === 0) return;
      if (/^[A-Z][A-Za-z0-9.+-]{2,}$/.test(clean) && !STOPWORDS.has(clean.toLowerCase())) {
        entities.push(clean);
      }
    });
  }
  // City/country grab
  const countries = text.match(COUNTRY_CITY_RE);
  if (countries) entities.push(...countries.map((c) => c.replace(/\s+/g, ' ')));

  // Numbers
  const numbers: ExtractedNumber[] = [];
  const numRe = /(\$\s?\d[\d,]*(?:\.\d+)?|\d+(?:\.\d+)?%?|\d[\d,]*(?:\.\d+)?)/g;
  let nm: RegExpExecArray | null;
  while ((nm = numRe.exec(text)) !== null) {
    const raw = nm[1].replace(/\s+/g, '');
    const start = Math.max(0, nm.index - 24);
    const end = Math.min(text.length, nm.index + raw.length + 24);
    const ctx = text.slice(start, end);
    numbers.push({ raw, kind: classifyNumber(raw, ctx) });
  }

  // Goals
  const goals: string[] = [];
  let gm: RegExpExecArray | null;
  while ((gm = GOAL_LEAD_RE.exec(text)) !== null) {
    const g = gm[1].trim();
    if (g.length >= 4) goals.push(g);
  }

  // Constraints (free-text)
  const constraints_text: string[] = [];
  for (const { re, label } of CONSTRAINT_PATTERNS) {
    const m = text.match(re);
    if (m) constraints_text.push(label(m[0]));
  }

  const lower = text.toLowerCase();
  const hasBudget = numbers.some((n) => n.kind === 'budget') || /\bbudget\b/.test(lower);
  const hasAudience = !!audience;
  const hasExample = EXAMPLE_HINTS.test(text) || /["“”'`].{6,}["”'`]/.test(text);
  const hasOutputStyleHint = OUTPUT_STYLE_HINTS.test(text);
  const hasFailureMode = FAILURE_HINTS.test(text);
  const hasToneHint = TONE_HINTS.test(text);

  return {
    subject,
    audience,
    verbs: uniq(verbs).slice(0, 8),
    entities: uniq(entities).slice(0, 12),
    numbers: numbers.slice(0, 8),
    goals: uniq(goals).slice(0, 5),
    constraints_text: uniq(constraints_text),
    quoted_phrase: quoted,
    hasBudget,
    hasAudience,
    hasExample,
    hasOutputStyleHint,
    hasFailureMode,
    hasToneHint,
  };
}

// ─────────────────────────────────────────────
// Convenience: pretty-print signal references for echoing into prose.
// ─────────────────────────────────────────────

export function listOr(items: string[], fallback: string): string {
  if (items.length === 0) return fallback;
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function pickEntity(signals: BriefSignals, kinds: RegExp): string | null {
  for (const e of signals.entities) if (kinds.test(e)) return e;
  return null;
}

export function pickNumber(signals: BriefSignals, kind: NumberKind): string | null {
  const n = signals.numbers.find((x) => x.kind === kind);
  return n ? n.raw : null;
}
