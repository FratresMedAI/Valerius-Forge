#!/usr/bin/env node
import { Command } from 'commander';
import * as readline from 'readline';
import { loadConfig, saveConfig, clearConfig } from './config.js';
import { runForge, type ForgeMode } from './stream.js';
import { evaluateContent } from './contentGate.js';
import { c, gold, ember, steel, symbol } from './colors.js';
import { COMMON_MODELS } from './models.js';
import { PROVIDER_LABELS, DEFAULT_LOCAL_BASE_URL, type Provider } from './llm.js';

const VERSION = '0.1.4';

// ─── Banner ───────────────────────────────────────────────────────────────
function banner(): string {
  return [
    '',
    gold('  ╭──────────────────────────────────────╮'),
    gold('  │ ') + c.bold('Valerius') + c.gray(' · ') + steel('the prompt forge') + gold('       │'),
    gold('  │ ') + c.gray(`v${VERSION} · BYOK · ${ember('forged in flame')}`) + gold('     │'),
    gold('  ╰──────────────────────────────────────╯'),
    '',
  ].join('\n');
}

// ─── readline helpers ──────────────────────────────────────────────────────
function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

// Hide input for API keys (best-effort — works on most TTYs)
function askSecret(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    stdout.write(question);
    let buf = '';
    const onData = (data: Buffer) => {
      const s = data.toString('utf-8');
      // Enter
      if (s.includes('\r') || s.includes('\n')) {
        stdout.write('\n');
        stdin.removeListener('data', onData);
        if (typeof (stdin as { setRawMode?: (m: boolean) => void }).setRawMode === 'function') {
          (stdin as unknown as { setRawMode: (m: boolean) => void }).setRawMode(false);
        }
        stdin.pause();
        resolve(buf);
        return;
      }
      // Ctrl+C
      if (s === '\u0003') {
        stdout.write('\n');
        process.exit(130);
      }
      // Backspace
      if (s === '\u007f' || s === '\b') {
        if (buf.length > 0) {
          buf = buf.slice(0, -1);
          stdout.write('\b \b');
        }
        return;
      }
      buf += s;
      stdout.write('•');
    };
    if (typeof (stdin as { setRawMode?: (m: boolean) => void }).setRawMode === 'function') {
      (stdin as unknown as { setRawMode: (m: boolean) => void }).setRawMode(true);
    }
    stdin.resume();
    stdin.on('data', onData);
  });
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    let resolved = false;
    const done = () => { if (!resolved) { resolved = true; resolve(data); } };
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', done);
    process.stdin.on('close', done);
    // Safety timeout — if stdin never closes (e.g. non-TTY shell), bail out after 2s
    setTimeout(done, 2000);
  });
}

// ─── Provider list ────────────────────────────────────────────────────────
const PROVIDERS: { value: Provider; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'google', label: 'Google (Gemini)' },
  { value: 'xai', label: 'xAI (Grok)' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'local', label: 'Local (Ollama / LM Studio)' },
];

const DEFAULT_MODEL_FOR: Record<Provider, string> = {
  openai: 'gpt-5',
  anthropic: 'claude-opus-4-5',
  google: 'gemini-2.5-pro',
  xai: 'grok-4',
  openrouter: 'anthropic/claude-opus-4-5',
  local: 'llama3.3',
};

// ─── init wizard ──────────────────────────────────────────────────────────
async function initWizard(): Promise<void> {
  process.stdout.write(banner());
  process.stdout.write(c.bold('Welcome to Valerius.') + ' ' + c.gray('Let\'s set up your forge.\n\n'));

  // Provider
  process.stdout.write(c.bold('1. Choose your provider:') + '\n\n');
  PROVIDERS.forEach((p, i) => {
    process.stdout.write(`   ${gold(String(i + 1))}. ${p.label}\n`);
  });
  process.stdout.write('\n');
  const pAns = await ask(c.gray('   Enter number (1-6): '));
  const pIdx = parseInt(pAns.trim(), 10) - 1;
  if (pIdx < 0 || pIdx >= PROVIDERS.length) {
    process.stderr.write(`${symbol.err} ${c.red('Invalid selection.')}\n`);
    process.exit(1);
  }
  const provider = PROVIDERS[pIdx]!.value;

  // Base URL (only for local)
  let baseUrl: string | undefined;
  if (provider === 'local') {
    const url = await ask(c.gray(`   Base URL (default ${DEFAULT_LOCAL_BASE_URL}): `));
    baseUrl = url.trim() || DEFAULT_LOCAL_BASE_URL;
  }

  // API key (skip for local if user wants — most local LLMs don't need one)
  process.stdout.write('\n' + c.bold('2. Enter your API key:') + ' ' + c.gray('(input is hidden)') + '\n   ');
  let apiKey = '';
  if (provider === 'local') {
    const skipKey = await ask(c.gray('Local LLMs usually don\'t need a key. Enter one anyway? [y/N]: '));
    if (skipKey.trim().toLowerCase().startsWith('y')) {
      apiKey = await askSecret(c.gray('   Key: '));
    }
  } else {
    apiKey = await askSecret(c.gray('Key: '));
  }

  // Model
  process.stdout.write('\n' + c.bold('3. Choose a model:') + '\n\n');
  const recs = COMMON_MODELS[provider].recommended;
  recs.forEach((m, i) => {
    const tag = i === 0 ? c.gray(' (default)') : '';
    process.stdout.write(`   ${gold(String(i + 1))}. ${m}${tag}\n`);
  });
  process.stdout.write(`   ${gold('c')}. Custom...\n\n`);
  const mAns = await ask(c.gray('   Enter number or "c": '));
  let model: string;
  const trimmed = mAns.trim().toLowerCase();
  if (trimmed === 'c') {
    model = (await ask(c.gray('   Model name: '))).trim() || DEFAULT_MODEL_FOR[provider];
  } else {
    const mIdx = parseInt(trimmed, 10) - 1;
    model = mIdx >= 0 && mIdx < recs.length ? recs[mIdx]! : DEFAULT_MODEL_FOR[provider];
  }

  // Save
  saveConfig({ provider, apiKey: apiKey.trim(), model, baseUrl });
  process.stdout.write('\n');
  process.stdout.write(`${symbol.ok} ${c.green('Setup complete.')}\n`);
  process.stdout.write(c.gray('  Config saved to ~/.valerius/config.json\n\n'));
  process.stdout.write(c.bold('Try it now:\n'));
  process.stdout.write(c.gray('  $ ') + gold('valerius forge ') + c.cyan('"a customer support agent for a SaaS product"') + '\n\n');
}

// ─── program ──────────────────────────────────────────────────────────────
const program = new Command();

program
  .name('valerius')
  .description(`${gold('Valerius')} ${c.gray('·')} forge AI-ready prompts from your terminal ${c.gray('·')} ${ember('BYOK')}`)
  .version(VERSION)
  .addHelpText('beforeAll', banner())
  .addHelpText('after', `
${c.bold('Quick start:')}
  ${c.gray('$')} ${gold('valerius init')}                              ${c.gray('# one-time setup wizard')}
  ${c.gray('$')} ${gold('valerius forge')} ${c.cyan('"build a research assistant agent"')}
  ${c.gray('$')} ${c.gray('echo')} ${c.cyan('"my brief"')} ${c.gray('|')} ${gold('valerius forge -')}            ${c.gray('# read brief from stdin')}
  ${c.gray('$')} ${gold('valerius forge')} ${c.cyan('"..."')} ${c.gray('--mode agent --copy')}    ${c.gray('# force agent mode + copy')}

${c.bold('Privacy:')} your API key is stored only in ~/.valerius/config.json. Requests go directly to your provider. No middlemen.
`);

// ── init ──────────────────────────────────────────────────────────────────
program
  .command('init')
  .description('Run the first-time setup wizard')
  .action(async () => {
    await initWizard();
  });

// ── forge ─────────────────────────────────────────────────────────────────
program
  .command('forge [brief]')
  .description('Forge an AI agent prompt or project brief')
  .option('-m, --mode <mode>', 'Output mode: auto | agent | project', 'auto')
  .option('-c, --copy', 'Copy output to clipboard after forging')
  .option('--model <model>', 'Override the configured model for this run')
  .option('--provider <provider>', 'Override the configured provider for this run')
  .action(async (briefArg: string | undefined, options: {
    mode: string;
    copy?: boolean;
    model?: string;
    provider?: string;
  }) => {
    let brief = briefArg ?? '';

    // stdin support: `-` explicit or piped input (only when no arg was given at all)
    if (brief === '-' || (briefArg === undefined && !process.stdin.isTTY)) {
      brief = (await readStdin()).trim();
    }

    if (!brief.trim()) {
      process.stderr.write(`${symbol.err} ${c.red('No brief provided.')} ${c.gray('Try:')} ${gold('valerius forge "your brief here"')}\n`);
      process.exit(1);
    }
    brief = brief.trim();

    // Validate mode before anything else (fast, no I/O needed)
    if (!['auto', 'agent', 'project'].includes(options.mode)) {
      process.stderr.write(`${symbol.err} ${c.red(`Invalid mode: "${options.mode}"`)}\n  Valid modes: ${gold('auto')} · ${gold('agent')} · ${gold('project')}\n`);
      process.exit(1);
    }
    const mode = options.mode as ForgeMode;

    const gate = evaluateContent(brief);
    if (gate.blocked) {
      process.stdout.write('I cannot assist with that request.\n');
      process.exit(1);
    }

    const config = loadConfig();
    if (options.provider) config.provider = options.provider;
    if (options.model) config.model = options.model;

    if (!config.apiKey && config.provider !== 'local') {
      process.stderr.write(`${symbol.err} ${c.red('No API key set.')} ${c.gray('Run:')} ${gold('valerius init')}\n`);
      process.exit(1);
    }
    if (!config.provider) {
      process.stderr.write(`${symbol.err} ${c.red('No provider set.')} ${c.gray('Run:')} ${gold('valerius init')}\n`);
      process.exit(1);
    }

    const output = await runForge(brief, mode, config);

    if (options.copy && output) {
      await copyToClipboard(output);
    }
  });

// ── models ────────────────────────────────────────────────────────────────
program
  .command('models [provider]')
  .description('List common models for a provider (default: configured)')
  .action((providerArg: string | undefined) => {
    const cfg = loadConfig();
    const provider = (providerArg ?? cfg.provider ?? 'openai') as Provider;

    if (!(provider in COMMON_MODELS)) {
      process.stderr.write(`${symbol.err} ${c.red(`Unknown provider: ${provider}`)}\n`);
      process.stderr.write(c.gray('  Valid: ') + Object.keys(COMMON_MODELS).join(', ') + '\n');
      process.exit(1);
    }

    const list = COMMON_MODELS[provider];
    process.stdout.write('\n' + gold(PROVIDER_LABELS[provider]) + ' ' + c.gray('·') + ' common models:\n\n');
    process.stdout.write('  ' + c.bold('Recommended:') + '\n');
    list.recommended.forEach((m) => process.stdout.write(`    ${symbol.bullet} ${m}\n`));
    process.stdout.write('\n  ' + c.bold('Budget / fast:') + '\n');
    list.budget.forEach((m) => process.stdout.write(`    ${symbol.bullet} ${m}\n`));
    process.stdout.write(`\n  ${c.gray('Set with:')} ${gold('valerius config set-model')}\n\n`);
  });

// ── config ────────────────────────────────────────────────────────────────
const configCmd = program
  .command('config')
  .description('Manage Valerius configuration');

configCmd
  .command('set-key [key]')
  .description('Set your API key (interactively if no argument given)')
  .action(async (keyArg?: string) => {
    let key = keyArg;
    if (!key) {
      key = await askSecret(c.gray('Enter your API key: '));
    }
    saveConfig({ apiKey: key.trim() });
    process.stdout.write(`${symbol.ok} ${c.green('API key saved.')}\n`);
  });

configCmd
  .command('set-provider [provider]')
  .description('Set your LLM provider')
  .action(async (provArg?: string) => {
    let provider: string;
    if (provArg) {
      const valid = PROVIDERS.find((p) => p.value === provArg);
      if (!valid) {
        process.stderr.write(`${symbol.err} ${c.red(`Unknown provider: ${provArg}`)}\n`);
        process.stderr.write(c.gray('  Valid: ') + PROVIDERS.map((p) => p.value).join(', ') + '\n');
        process.exit(1);
      }
      provider = provArg;
    } else {
      process.stdout.write('\nSelect a provider:\n\n');
      PROVIDERS.forEach((p, i) => process.stdout.write(`   ${gold(String(i + 1))}. ${p.label}\n`));
      const ans = await ask(c.gray('\n   Enter number (1-6): '));
      const idx = parseInt(ans.trim(), 10) - 1;
      if (idx < 0 || idx >= PROVIDERS.length) {
        process.stderr.write(`${symbol.err} ${c.red('Invalid selection.')}\n`);
        process.exit(1);
      }
      provider = PROVIDERS[idx]!.value;
    }
    saveConfig({ provider });
    process.stdout.write(`${symbol.ok} ${c.green(`Provider set to: ${provider}`)}\n`);

    if (provider === 'local') {
      const url = await ask(c.gray(`   Base URL (default ${DEFAULT_LOCAL_BASE_URL}): `));
      saveConfig({ baseUrl: url.trim() || DEFAULT_LOCAL_BASE_URL });
      process.stdout.write(`${symbol.ok} ${c.green('Base URL saved.')}\n`);
    }
  });

configCmd
  .command('set-model [model]')
  .description('Set the model name')
  .action(async (modelArg?: string) => {
    let model = modelArg;
    if (!model) {
      model = (await ask(c.gray('Enter model name: '))).trim();
    }
    if (!model) {
      process.stderr.write(`${symbol.err} ${c.red('Model name cannot be empty.')}\n`);
      process.exit(1);
    }
    saveConfig({ model });
    process.stdout.write(`${symbol.ok} ${c.green(`Model set to: ${model}`)}\n`);
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const config = loadConfig();
    if (!config.provider && !config.apiKey && !config.model) {
      process.stdout.write(c.gray('No configuration found. Run: ') + gold('valerius init') + '\n');
      return;
    }
    const redacted = config.apiKey
      ? `${config.apiKey.slice(0, 3)}...${config.apiKey.slice(-4)}`
      : c.gray('(not set)');
    process.stdout.write('\n' + gold('Valerius Configuration') + '\n');
    process.stdout.write(c.gray('─────────────────────────') + '\n');
    process.stdout.write(`  ${c.bold('Provider')} : ${config.provider ?? c.gray('(not set)')}\n`);
    process.stdout.write(`  ${c.bold('Model')}    : ${config.model ?? c.gray('(not set)')}\n`);
    process.stdout.write(`  ${c.bold('API Key')}  : ${redacted}\n`);
    if (config.baseUrl) process.stdout.write(`  ${c.bold('Base URL')} : ${config.baseUrl}\n`);
    process.stdout.write('\n');
  });

configCmd
  .command('clear')
  .description('Remove ~/.valerius/config.json')
  .action(() => {
    clearConfig();
    process.stdout.write(`${symbol.ok} ${c.green('Configuration cleared.')}\n`);
  });

// ─── clipboard ────────────────────────────────────────────────────────────
async function copyToClipboard(output: string): Promise<void> {
  try {
    const { default: clipboardy } = await import('clipboardy');
    await clipboardy.write(output);
    process.stderr.write(`${symbol.ok} ${c.gray('Copied to clipboard.')}\n`);
    return;
  } catch {
    /* fall through */
  }
  try {
    const { execSync } = await import('child_process');
    const platform = process.platform;
    if (platform === 'win32') execSync('clip', { input: output, encoding: 'utf-8' });
    else if (platform === 'darwin') execSync('pbcopy', { input: output, encoding: 'utf-8' });
    else execSync('xclip -selection clipboard', { input: output, encoding: 'utf-8' });
    process.stderr.write(`${symbol.ok} ${c.gray('Copied to clipboard.')}\n`);
  } catch {
    process.stderr.write(`${symbol.warn} ${c.yellow('Could not copy to clipboard.')}\n`);
  }
}

// ─── help fallback ────────────────────────────────────────────────────────
if (process.argv.length <= 2) {
  program.help();
}
program.parse();
