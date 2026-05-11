// Tiny ANSI color helper — zero dependencies. Respects NO_COLOR env var
// and FORCE_COLOR override. Auto-disables when stdout is not a TTY.

const noColor =
  process.env.NO_COLOR !== undefined ||
  process.env.TERM === 'dumb' ||
  (!process.stdout.isTTY && process.env.FORCE_COLOR === undefined);

function wrap(open: number, close: number) {
  return (s: string): string => (noColor ? s : `\x1b[${open}m${s}\x1b[${close}m`);
}

export const c = {
  reset: '\x1b[0m',
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  italic: wrap(3, 23),

  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39),

  // Templar palette
  sand: wrap(38 /* gold-ish 24-bit */, 39),
};

// 24-bit "templar sand" gold — only emitted when colors are enabled.
export function gold(s: string): string {
  if (noColor) return s;
  return `\x1b[38;2;212;199;165m${s}\x1b[39m`;
}

export function ember(s: string): string {
  if (noColor) return s;
  return `\x1b[38;2;220;120;40m${s}\x1b[39m`;
}

export function steel(s: string): string {
  if (noColor) return s;
  return `\x1b[38;2;160;165;175m${s}\x1b[39m`;
}

export const symbol = {
  ok: c.green('✓'),
  err: c.red('✗'),
  warn: c.yellow('!'),
  info: c.cyan('›'),
  arrow: gold('→'),
  flame: ember('🔥'),
  bullet: c.gray('·'),
};
