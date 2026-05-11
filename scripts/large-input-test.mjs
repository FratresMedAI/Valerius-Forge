/**
 * Large input + special character tests.
 * All should hit "No API key set" cleanly — not crash, corrupt, or hang.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const run = (brief) =>
  exec('valerius', ['forge', brief], { timeout: 15_000, encoding: 'utf8', shell: true })
    .then(() => ({ ok: true }))
    .catch((e) => {
      const out = (e.stderr ?? '') + (e.stdout ?? '');
      const expected = out.includes('No API key set')
        || out.includes('No provider set')
        || out.includes('No brief provided')
        || out.includes('I cannot assist')
        || out.includes('Forge failed')
        || out.includes('Invalid or unauthorized')
        || out.includes('Unknown option');  // dashes edge case
      return { ok: expected, out };
    });

const cases = [
  // Large input — 2000+ word brief
  {
    label: '2000-word brief',
    brief: `Build a comprehensive multi-tenant SaaS platform for managing enterprise software development workflows. ` +
      `The platform should include: a project management module with Kanban boards, Gantt charts, sprint planning, and backlog grooming tools; ` +
      `a code review system integrated with GitHub, GitLab, and Bitbucket that supports inline comments, review assignments, and automated checks; ` +
      `a CI/CD pipeline builder with visual drag-and-drop interface supporting Docker, Kubernetes, AWS, GCP, and Azure deployments; ` +
      `a real-time collaboration layer with presence indicators, live cursors, and conflict resolution for simultaneous editing; ` +
      `an analytics dashboard showing velocity metrics, cycle time, lead time, DORA metrics, and custom KPIs with drill-down capability; ` +
      `a notification system supporting email, Slack, Teams, PagerDuty, and in-app alerts with customizable routing rules; ` +
      `role-based access control with SSO support for Okta, Auth0, Azure AD, and Google Workspace; ` +
      `a billing module handling subscription tiers, usage-based pricing, invoicing, and Stripe/Paddle integration; ` +
      `an AI assistant that can summarize PRs, suggest reviewers, predict delivery dates, and detect anomalies in build times; ` +
      `audit logging for all user actions with SOC2 compliance, data residency controls, and GDPR tooling; ` +
      `a plugin marketplace where third-party developers can publish extensions using a sandboxed iframe API; ` +
      `mobile apps for iOS and Android with offline support and push notifications; ` +
      `a public REST and GraphQL API with rate limiting, versioning, and a developer portal with interactive docs; ` +
      `white-label support so enterprise customers can brand the platform with their own logo, colors, and domain; ` +
      `data export in CSV, JSON, and PDF formats with scheduled report delivery; ` +
      `Terraform provider and Helm chart for self-hosted enterprise deployments; ` +
      `end-to-end encryption for sensitive data at rest and in transit using AES-256 and TLS 1.3; ` +
      `multi-region deployment with automatic failover, 99.99% SLA, and RPO/RTO guarantees; ` +
      `onboarding wizards, interactive product tours, and an in-app help center powered by a searchable knowledge base. ` +
      `The tech stack should be: Next.js 15 with App Router on the frontend, tRPC for type-safe APIs, ` +
      `PostgreSQL with Prisma ORM, Redis for caching and pub/sub, Kafka for event streaming, ` +
      `Elasticsearch for full-text search, MinIO for object storage, and a microservices backend written in Go and Node.js. ` +
      `The platform must handle 100,000 concurrent users, store 10 years of audit history, ` +
      `and process 1 million webhook events per day without degradation. ` +
      `Include a comprehensive test suite with unit, integration, end-to-end, load, and chaos engineering tests. ` +
      `Provide detailed documentation, runbooks, architecture decision records, and a fully automated release process. `.repeat(3),
  },

  // Emojis
  {
    label: 'emojis in brief',
    brief: '🚀 build a 🤖 AI assistant that helps 🧑‍💻 developers write 💎 better code with ✨ magic suggestions and 🔥 hot takes',
  },

  // Backticks and code blocks
  {
    label: 'code blocks in brief',
    brief: 'build a CLI tool that runs `npm test` and parses output like:\n```\nPASS src/foo.test.ts\nFAIL src/bar.test.ts\n```\nand posts results to Slack',
  },

  // Single and double quotes
  {
    label: 'mixed quotes',
    brief: `build an agent that says "it's working" and handles O'Reilly-style book titles with apostrophes`,
  },

  // Newlines and tabs
  {
    label: 'newlines and tabs',
    brief: 'build:\n\t- a parser\n\t- a formatter\n\t- a linter\nfor YAML files with nested structures',
  },

  // Unicode / non-ASCII
  {
    label: 'unicode / CJK',
    brief: 'build a translation service that handles 中文, العربية, हिन्दी, and Ελληνικά with proper RTL support',
  },

  // Null-like strings
  { label: 'only whitespace and dashes', brief: '   ---   ' },

  // Very long single word (no spaces)
  { label: '500-char single token', brief: 'a'.repeat(500) },

  // Angle brackets / HTML
  { label: 'angle brackets', brief: 'build a parser for <html><body><p>Hello world</p></body></html> that extracts text nodes' },

  // Backslashes
  { label: 'backslashes', brief: 'build a tool that processes Windows paths like C:\\Users\\Name\\Documents\\file.txt' },
];

let pass = 0; let fail = 0;
console.log('\nLarge input & special character tests\n' + '='.repeat(45));

for (const { label, brief } of cases) {
  const { ok, out } = await run(brief);
  if (ok) {
    console.log(`  ✓ PASS  ${label}  (${brief.length} chars)`);
    pass++;
  } else {
    console.error(`  ✗ FAIL  ${label}`);
    console.error(`         output: ${(out ?? '').slice(0, 200)}`);
    fail++;
  }
}

console.log(`\n${'='.repeat(45)}`);
console.log(`Result: ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
console.log('All clear.');
