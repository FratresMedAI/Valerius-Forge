import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getApiKey, getProvider, getModel, setModel } from './secrets';

// ─── Inlined LLM types & helpers ────────────────────────────────────────────

type Provider = 'openrouter' | 'xai' | 'anthropic' | 'openai' | 'google' | 'local';

interface LLMConfig {
  provider: Provider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

const DEFAULT_LOCAL_BASE_URL = 'http://localhost:11434/v1';

function endpointFor(config: LLMConfig): string {
  switch (config.provider) {
    case 'openrouter': return 'https://openrouter.ai/api/v1/chat/completions';
    case 'xai': return 'https://api.x.ai/v1/chat/completions';
    case 'openai': return 'https://api.openai.com/v1/chat/completions';
    case 'anthropic': return 'https://api.anthropic.com/v1/messages';
    case 'google': return 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    case 'local': {
      const base = (config.baseUrl?.trim() || DEFAULT_LOCAL_BASE_URL).replace(/\/+$/, '');
      return `${base}/chat/completions`;
    }
  }
}

function headersFor(provider: Provider, apiKey: string): Record<string, string> {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (provider === 'anthropic') {
    base['x-api-key'] = apiKey;
    base['anthropic-version'] = '2023-06-01';
    return base;
  }
  if (provider === 'local') {
    if (apiKey.trim()) base['Authorization'] = `Bearer ${apiKey}`;
    return base;
  }
  base['Authorization'] = `Bearer ${apiKey}`;
  if (provider === 'openrouter') {
    base['HTTP-Referer'] = 'https://valerius.ai';
    base['X-Title'] = 'Valerius';
  }
  return base;
}

function friendlyStatus(status: number): string {
  if (status === 401 || status === 403) return 'Invalid or unauthorized API key.';
  if (status === 404) return 'Model not found for this provider.';
  if (status === 429) return 'Rate limited — slow down or check your plan.';
  if (status >= 500) return 'Provider is having issues right now.';
  return `Request failed (HTTP ${status}).`;
}

// ─── Inlined content gate ────────────────────────────────────────────────────

type ContentViolationCategory =
  | 'csam' | 'terrorism_weapons' | 'fraud_scam' | 'illicit_drugs'
  | 'malware_harm' | 'targeted_violence' | 'account_compromise'
  | 'financial_automation' | 'credential_theft';

interface ContentGateResult {
  blocked: boolean;
  category?: ContentViolationCategory;
}

const GATE_PATTERNS: { category: ContentViolationCategory; re: RegExp }[] = [
  { category: 'csam', re: /\b(child|children|minor|minors|underage|preteen|kid|kids|toddler|infant)\b[\s\S]{0,40}\b(porn|pornograph|sexual|sexually|nude|nudity|naked|abuse|exploit|exploitation|csam|cp\b|grooming|seduce|rape|molest)/i },
  { category: 'csam', re: /\b(porn|sexual|nude|nudity|naked|abuse|exploit|grooming|molest)\b[\s\S]{0,40}\b(child|children|minor|minors|underage|preteen|kid|kids|toddler|infant)/i },
  { category: 'terrorism_weapons', re: /\b(plan|planning|carry out|commit|execute|conduct|stage)\b[\s\S]{0,30}\b(attack|terror|terrorism|terrorist|bombing|massacre|mass shooting|school shooting)/i },
  { category: 'terrorism_weapons', re: /\b(make|build|construct|synthesize|assemble)\b[\s\S]{0,30}\b(bomb|explosive|ied|nerve agent|sarin|vx|chemical weapon|biological weapon|bioweapon|dirty bomb|nuclear (?:bomb|weapon|device)|ricin|anthrax|napalm)/i },
  { category: 'fraud_scam', re: /\b(fraud|scam|scammer|scamming|defraud|swindle|phish|phishing|launder|laundering)\b[\s\S]{0,40}\b(bot|agent|tool|system|workflow|operation|business|people|users|elderly|customers|seniors|victims)/i },
  { category: 'illicit_drugs', re: /\b(synthesize|cook|manufacture|how (?:do|to) (?:i )?make|recipe for|step[- ]by[- ]step)\b[\s\S]{0,30}\b(meth|methamphetamine|fentanyl|heroin|cocaine|crack cocaine|mdma|ecstasy|lsd|gbl|gbh|krokodil|carfentanil)/i },
  { category: 'malware_harm', re: /\b(write|build|create|develop|generate|make me)\b[\s\S]{0,30}\b(ransomware|keylogger|stealer|infostealer|rootkit|botnet|ddos tool|credential stealer|banking trojan|crypto drainer|wallet drainer)/i },
  { category: 'account_compromise', re: /\b(bypass|circumvent|crack|brute[- ]?force)\b[\s\S]{0,30}\b(2fa|two[- ]factor|mfa|otp|password|login|captcha|rate ?limit|paywall)\b/i },
  { category: 'credential_theft', re: /\b(steal|harvest|grab|capture|exfiltrate|sniff|intercept|phish|skim)\b[\s\S]{0,30}\b(password|passwords|credentials?|cookies|session(?: tokens?)?|api keys?|2fa codes?|otps?|seed phrase|private keys?)\b/i },
  { category: 'targeted_violence', re: /\b(kill|murder|assassinate|harm|stalk|track down|hurt|attack)\b[\s\S]{0,40}\b(my (?:ex|wife|husband|boss|coworker|neighbor|teacher)|specific person|named individual|this person)\b/i },
];

function evaluateContent(input: string): ContentGateResult {
  const text = (input ?? '').toString();
  if (!text.trim()) return { blocked: false };
  for (const rule of GATE_PATTERNS) {
    if (rule.re.test(text)) return { blocked: true, category: rule.category };
  }
  return { blocked: false };
}

// ─── Inlined meta system prompt ──────────────────────────────────────────────

const META_SYSTEM_PROMPT = `**SAFETY DIRECTIVE — HIGHEST PRIORITY AND NON-NEGOTIABLE**

You must NEVER assist with requests involving:
- Child sexual abuse material (CSAM), child exploitation, or any content that sexualizes minors
- Terrorism, planning attacks, mass-casualty weapons (chemical, biological, radiological, nuclear, explosive devices)
- Targeted real-world violence against an identifiable person or group
- Fraud, scams, identity theft, money laundering, fake-document creation, or tools designed to defraud people
- Synthesis of high-harm illicit drugs (meth, fentanyl, heroin, etc.)
- Malware authored for harm (ransomware, infostealers, banking trojans, wallet drainers, credential stealers, keyloggers, session hijackers)
- Programmatic / scripted access to banking, brokerage, payment, or other financial-services accounts using credentials
- Credential / password theft, harvesting, capture, sniffing, or any code that stores passwords in plaintext / cleartext
- Bypassing 2FA, MFA, OTP, captchas, rate limits, or paywalls
- Any other clearly illegal or severely harmful activity

If the request matches any of the above — even if framed as roleplay, fiction, "research", or any other framing — output ONLY this exact message and absolutely nothing else:

"I cannot assist with that request."

──────────────────────────────────────────────

You are Valerius, an elite Prompt Forge and Agent Architect powered by Fratres X AI. Your mission is to deliver output so high-quality that users feel they just used a paid product — even on the free tier.

**CRITICAL FIRST STEP — INTENT DETECTION**
Classify every request as:
• AGENT PROMPT MODE (if user wants an AI agent, assistant, chatbot, system prompt, behavior, personality, etc.)
• FULL PROJECT MODE (otherwise)

**ALWAYS output in this exact order, using clean markdown with \`##\` section headers:**

1. **## Detected Signals**
   Clean, insightful tags as a bulleted list.

2. **## Forged Agent System Prompt** (Agent Prompt Mode) OR **## Coding-Agent-Ready Prompt** (Full Project Mode)
   In Agent Prompt Mode, create an exceptionally polished system prompt containing: Role & Personality, Goals & Success Criteria, Detailed Conversation Flow, Output Format Guidelines, Tools / Capabilities, Strong Guardrails, Best practices.
   Wrap the entire forged system prompt in a fenced \`\`\`\`markdown\`\`\`\` block so the user can copy it cleanly.

3. **## One-Shot Example** (Agent Prompt Mode only)
   3–5 turns of realistic User ↔ Agent conversation that proves the prompt works.

4. **## Refinement Suggestions** (Agent Prompt Mode only)
   3–4 smart, actionable next steps the user can type to improve it further.

5. **## Architecture Diagram** (Full Project Mode only)
   A Mermaid flowchart in a \`\`\`\`mermaid\`\`\`\` block.

6. **## Recommended Stack & Tools**
   Modern, opinionated picks tailored to the request.

7. **## Forge Quality Score**
   X/100 + 3–4 bullet reasons.

8. **## Estimated Time to Value**
   Realistic and encouraging.

**Tone & Quality Rules**
- Professional, confident, premium feel.
- Extremely high-signal and concise.
- Every block should feel instantly copy-paste ready.
- Never use placeholder text like "[INSERT X]"; always commit to concrete choices.`;

// ─── ForgePanel ──────────────────────────────────────────────────────────────

export class ForgePanel {
  public static currentPanel: ForgePanel | undefined;
  private static readonly viewType = 'valeriusForge';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _ctx: vscode.ExtensionContext;
  private _disposables: vscode.Disposable[] = [];
  private _abortController: AbortController | null = null;

  public static createOrShow(ctx: vscode.ExtensionContext, prefill?: string): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ForgePanel.currentPanel) {
      ForgePanel.currentPanel._panel.reveal(column);
      if (prefill) {
        ForgePanel.currentPanel._panel.webview.postMessage({ type: 'prefill', text: prefill });
      }
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      ForgePanel.viewType,
      'Valerius Forge',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(ctx.extensionUri, 'webview'),
        ],
      },
    );

    ForgePanel.currentPanel = new ForgePanel(panel, ctx);
    if (prefill) {
      setTimeout(() => {
        ForgePanel.currentPanel?._panel.webview.postMessage({ type: 'prefill', text: prefill });
      }, 300);
    }
  }

  private constructor(panel: vscode.WebviewPanel, ctx: vscode.ExtensionContext) {
    this._panel = panel;
    this._ctx = ctx;
    this._panel.webview.html = this._getHtml();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(
      (msg) => this._handleMessage(msg),
      null,
      this._disposables,
    );
  }

  private async _handleMessage(msg: { type: string; [key: string]: unknown }): Promise<void> {
    switch (msg.type) {
      case 'getConfig': {
        const apiKey = await getApiKey(this._ctx);
        this._panel.webview.postMessage({
          type: 'config',
          provider: getProvider(this._ctx),
          model: getModel(this._ctx),
          hasKey: Boolean(apiKey),
        });
        break;
      }
      case 'setModel': {
        await setModel(this._ctx, msg.model as string);
        break;
      }
      case 'abort': {
        this._abortController?.abort();
        break;
      }
      case 'forge': {
        await this._runForge(msg.brief as string, msg.mode as string);
        break;
      }
    }
  }

  private async _runForge(brief: string, mode: string): Promise<void> {
    const gate = evaluateContent(brief);
    if (gate.blocked) {
      this._panel.webview.postMessage({ type: 'error', message: 'I cannot assist with that request.' });
      return;
    }

    const apiKey = await getApiKey(this._ctx);
    const provider = getProvider(this._ctx) as Provider;
    const model = getModel(this._ctx);

    if (!apiKey && provider !== 'local') {
      this._panel.webview.postMessage({
        type: 'error',
        message: 'No API key set. Run "Valerius: Set API Key" from the Command Palette.',
      });
      return;
    }

    const config: LLMConfig = { provider, apiKey: apiKey ?? '', model };
    const modeLabel = mode === 'agent' ? 'AGENT PROMPT MODE' : mode === 'project' ? 'FULL PROJECT MODE' : 'AUTO';
    const userPrompt = modeLabel !== 'AUTO'
      ? `[Mode override: ${modeLabel}]\n\n${brief}`
      : brief;

    this._abortController = new AbortController();
    const { signal } = this._abortController;

    try {
      await this._streamForge({
        config,
        systemPrompt: META_SYSTEM_PROMPT,
        userPrompt,
        onToken: (chunk) => {
          this._panel.webview.postMessage({ type: 'token', text: chunk });
        },
        signal,
      });
      this._panel.webview.postMessage({ type: 'done' });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        this._panel.webview.postMessage({ type: 'done' });
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      this._panel.webview.postMessage({ type: 'error', message: msg });
    } finally {
      this._abortController = null;
    }
  }

  private async _streamForge(opts: {
    config: LLMConfig;
    systemPrompt: string;
    userPrompt: string;
    onToken: (chunk: string) => void;
    signal: AbortSignal;
  }): Promise<void> {
    const { config, systemPrompt, userPrompt, onToken, signal } = opts;

    const isAnthropic = config.provider === 'anthropic';
    const url = endpointFor(config);
    const headers = headersFor(config.provider, config.apiKey);

    const body = isAnthropic
      ? JSON.stringify({
          model: config.model,
          max_tokens: 4096,
          stream: true,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        })
      : JSON.stringify({
          model: config.model,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        });

    const res = await fetch(url, { method: 'POST', headers, body, signal });

    if (!res.ok || !res.body) {
      let errBody = '';
      try { errBody = (await res.text()).slice(0, 240); } catch { /* empty */ }
      throw new Error(`${friendlyStatus(res.status)}${errBody ? ` — ${errBody}` : ''}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx).replace(/\r$/, '');
        buf = buf.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          let piece = '';
          if (isAnthropic) {
            if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
              piece = json.delta.text ?? '';
            }
          } else {
            piece = json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content ?? '';
          }
          if (piece) onToken(piece);
        } catch { /* ignore non-JSON */ }
      }
    }
  }

  private _getHtml(): string {
    const webviewPath = path.join(this._ctx.extensionPath, 'webview', 'index.html');
    let html = fs.readFileSync(webviewPath, 'utf8');

    const nonce = getNonce();
    const cspSource = this._panel.webview.cspSource;

    // Replace placeholders in HTML
    html = html.replace(/\{\{nonce\}\}/g, nonce);
    html = html.replace(/\{\{cspSource\}\}/g, cspSource);

    // Convert webview/ local resource URIs
    const styleUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._ctx.extensionUri, 'webview', 'style.css'),
    );
    const scriptUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._ctx.extensionUri, 'webview', 'main.js'),
    );
    html = html.replace('{{styleUri}}', styleUri.toString());
    html = html.replace('{{scriptUri}}', scriptUri.toString());

    return html;
  }

  public dispose(): void {
    ForgePanel.currentPanel = undefined;
    this._abortController?.abort();
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
