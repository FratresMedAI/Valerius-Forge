import { useMemo } from 'react';
import { useTier } from '../lib/tier';
import { MastersBadge } from './MastersBadge';
import { MastersGate } from './MastersUpsell';
import { loadAll } from '../lib/savedForges';
import type { AgentSuggestion } from '../lib/generate';

interface Props {
  suggestion: AgentSuggestion;
  parentId?: string;
}

// Simple line-level LCS diff — no external deps
type DiffLine = { type: 'same' | 'add' | 'remove'; text: string };

function diffLines(a: string, b: string): { left: DiffLine[]; right: DiffLine[] } {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const n = aLines.length;
  const m = bLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (aLines[i] === bLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const left: DiffLine[] = [];
  const right: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && aLines[i] === bLines[j]) {
      left.push({ type: 'same', text: aLines[i] });
      right.push({ type: 'same', text: bLines[j] });
      i++; j++;
    } else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) {
      right.push({ type: 'add', text: bLines[j] });
      left.push({ type: 'same', text: '' }); // placeholder
      j++;
    } else {
      left.push({ type: 'remove', text: aLines[i] });
      right.push({ type: 'same', text: '' }); // placeholder
      i++;
    }
  }

  return { left, right };
}

function DiffPane({ lines, side }: { lines: DiffLine[]; side: 'left' | 'right' }) {
  return (
    <div className="flex-1 overflow-auto font-mono text-[0.68rem] leading-5 max-h-96 scroll-thin">
      {lines.map((line, i) => (
        <div
          key={i}
          className={
            'px-2 py-px whitespace-pre-wrap break-all ' +
            (line.type === 'add'
              ? 'bg-emerald-950/60 text-emerald-400'
              : line.type === 'remove'
              ? 'bg-templar-red/10 text-templar-red/80'
              : 'text-templar-text/70')
          }
        >
          {line.type === 'add' && side === 'right' ? <span className="select-none text-emerald-500 mr-1">+</span> : null}
          {line.type === 'remove' && side === 'left' ? <span className="select-none text-templar-red/70 mr-1">−</span> : null}
          {line.text || '\u200b'}
        </div>
      ))}
    </div>
  );
}

export function ForgeDiff({ suggestion, parentId }: Props) {
  const [tier] = useTier();
  const isMaster = tier === 'masters';

  const parentForge = useMemo(() => {
    if (!parentId) return null;
    return loadAll().find((f) => f.id === parentId) ?? null;
  }, [parentId]);

  if (!parentId) return null;

  const diffContent = (
    <div className="rounded-xl border border-templar-sand/20 bg-white/[0.02] p-4">
      <header className="mb-3 flex items-center gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-templar-sand">
          Forge Diff · vs &lsquo;{parentForge ? (parentForge.name ?? parentForge.brief.slice(0, 30) + '…') : 'Parent'}&rsquo;
        </h3>
        <MastersBadge size="sm" />
      </header>
      {!isMaster ? (
        <MastersGate teaser>
          <div className="py-8 text-center text-sm text-templar-text/40 italic">
            Compare your forks with their parents — see exactly what your refinements changed.
          </div>
        </MastersGate>
      ) : !parentForge ? (
        <p className="text-sm italic text-templar-text/40">Parent forge not found in vault.</p>
      ) : (
        <DiffContent parentBrief={parentForge.brief} currentBrief={suggestion.systemPrompt} />
      )}
    </div>
  );

  return diffContent;
}

function DiffContent({ parentBrief, currentBrief }: { parentBrief: string; currentBrief: string }) {
  const { left, right } = useMemo(() => diffLines(parentBrief, currentBrief), [parentBrief, currentBrief]);

  const addedCount = right.filter((l) => l.type === 'add').length;
  const removedCount = left.filter((l) => l.type === 'remove').length;

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-[0.65rem]">
        <span className="text-emerald-400">+{addedCount} added</span>
        <span className="text-templar-red/80">−{removedCount} removed</span>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-templar-sand/15 bg-black/30 overflow-hidden">
        <div>
          <div className="border-b border-templar-sand/15 bg-black/20 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-templar-sand/50">
            Parent
          </div>
          <DiffPane lines={left} side="left" />
        </div>
        <div className="border-l border-templar-sand/15">
          <div className="border-b border-templar-sand/15 bg-black/20 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-templar-sand/50">
            This Fork
          </div>
          <DiffPane lines={right} side="right" />
        </div>
      </div>
    </div>
  );
}
