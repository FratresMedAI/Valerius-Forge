import { useEffect, useMemo, useState } from 'react';
import { Flame } from 'lucide-react';

const RICH_KEYWORDS = [
  'audience', 'user', 'customer', 'tone', 'voice', 'style',
  'guardrail', 'safety', 'constraint', 'example', 'format',
  'output', 'must', 'should', 'avoid', 'include', 'support',
  'build', 'design', 'generate', 'analyze',
];

const ACTION_VERBS = ['build', 'design', 'generate', 'analyze', 'create', 'forge', 'plan'];

function scoreBrief(text: string): number {
  const length = text.length;
  const lower = text.toLowerCase();
  let kw = 0;
  for (const k of RICH_KEYWORDS) if (lower.includes(k)) kw += 1;
  for (const v of ACTION_VERBS) if (lower.includes(v)) kw += 0.5;
  // Numbers and capitalized "named entities" boost slightly
  if (/\d/.test(text)) kw += 1;
  const namedEntities = (text.match(/\b[A-Z][a-z]{2,}/g) ?? []).length;
  kw += Math.min(2, namedEntities * 0.3);
  return Math.min(1, (length / 280) * 0.7 + (kw / 10) * 0.3);
}

const FLAME_COLORS = ['#7a2a1f', '#c46a1c', '#d49b3a', '#f2e4b2'];
const FLAME_GLOWS = [
  'rgba(178, 34, 34, 0.55)',
  'rgba(212, 130, 40, 0.6)',
  'rgba(220, 170, 70, 0.75)',
  'rgba(242, 228, 178, 0.95)',
];

interface Props {
  text: string;
}

export function ForgeTemperature({ text }: Props) {
  const [debounced, setDebounced] = useState(text);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(text), 80);
    return () => window.clearTimeout(id);
  }, [text]);

  // Score still computed for future use; flames always burn.
  void useMemo(() => scoreBrief(debounced), [debounced]);

  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => {
        const color = FLAME_COLORS[i];
        const glow = FLAME_GLOWS[i];
        return (
          <Flame
            key={i}
            className="valerius-flame is-lit h-3.5 w-3.5"
            style={{
              color,
              fill: color,
              filter: `drop-shadow(0 0 4px ${glow})`,
            }}
          />
        );
      })}
    </div>
  );
}
