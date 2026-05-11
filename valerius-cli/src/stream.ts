import { streamForge } from './llm.js';
import { evaluateContent } from './contentGate.js';
import { META_SYSTEM_PROMPT } from './metaPrompt.js';
import type { ValeriusConfig } from './config.js';
import type { LLMConfig, Provider } from './llm.js';
import { c, gold, ember, steel, symbol } from './colors.js';

export type ForgeMode = 'auto' | 'agent' | 'project';

function buildUserPrompt(brief: string, mode: ForgeMode): string {
  switch (mode) {
    case 'agent':
      return `[AGENT PROMPT MODE] ${brief}`;
    case 'project':
      return `[FULL PROJECT MODE] ${brief}`;
    default:
      return brief;
  }
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const CLEAR_LINE = '\x1b[2K\r';

function printHeader(config: LLMConfig, mode: ForgeMode): void {
  const provider = config.provider;
  const model = config.model;
  const modeLabel =
    mode === 'agent' ? 'agent prompt' : mode === 'project' ? 'full project' : 'auto';

  // Stylized banner — a single subtle line so output is the star.
  const line = `${gold('⚒  Valerius')} ${c.gray('·')} ${steel(provider)} ${c.gray('·')} ${steel(model)} ${c.gray('·')} ${c.cyan(modeLabel)}`;
  process.stderr.write(line + '\n');
  process.stderr.write(c.gray('─'.repeat(60)) + '\n');
}

function printError(message: string): void {
  process.stderr.write(`\n${symbol.err} ${c.red('Forge failed')} ${c.gray('—')} ${message}\n`);
}

export async function runForge(
  brief: string,
  mode: ForgeMode,
  config: Partial<ValeriusConfig>,
): Promise<string> {
  const gate = evaluateContent(brief);
  if (gate.blocked) {
    process.stdout.write('I cannot assist with that request.\n');
    return '';
  }

  const llmConfig: LLMConfig = {
    provider: (config.provider ?? 'openai') as Provider,
    apiKey: config.apiKey ?? '',
    model: config.model ?? 'gpt-4o',
    baseUrl: config.baseUrl,
  };

  printHeader(llmConfig, mode);

  // ── Abort handling: Ctrl+C cleanly cancels the in-flight stream ──────────
  const controller = new AbortController();
  const onSigint = () => {
    controller.abort();
    process.stderr.write(`\n${symbol.warn} ${c.yellow('Aborted.')}\n`);
    process.exit(130);
  };
  process.once('SIGINT', onSigint);

  let spinnerIdx = 0;
  let firstToken = false;
  const spinner = setInterval(() => {
    if (!firstToken) {
      process.stderr.write(`${CLEAR_LINE}${ember(SPINNER_FRAMES[spinnerIdx++ % SPINNER_FRAMES.length]!)} ${c.dim('Forging...')}`);
    }
  }, 80);

  let fullText = '';

  try {
    const result = await streamForge({
      config: llmConfig,
      systemPrompt: META_SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(brief, mode),
      signal: controller.signal,
      onToken: (chunk) => {
        if (!firstToken) {
          firstToken = true;
          clearInterval(spinner);
          process.stderr.write(CLEAR_LINE);
        }
        process.stdout.write(chunk);
        fullText += chunk;
      },
    });
    fullText = result.fullText;
  } catch (err) {
    clearInterval(spinner);
    process.stderr.write(CLEAR_LINE);
    if (controller.signal.aborted) return fullText;
    const msg = err instanceof Error ? err.message : String(err);
    printError(msg);
    process.exit(1);
  } finally {
    clearInterval(spinner);
    process.removeListener('SIGINT', onSigint);
  }

  process.stdout.write('\n');
  process.stderr.write(c.gray('─'.repeat(60)) + '\n');
  process.stderr.write(`${symbol.ok} ${c.gray('Forged.')}\n`);
  return fullText;
}
