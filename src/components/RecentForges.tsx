import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Scroll } from 'lucide-react';
import { loadRecent, on, type RecentForge } from '../lib/forgeEvents';

const COLLAPSED_KEY = 'valerius.recentForges.collapsed';

interface Props {
  onLoadBrief: (brief: string) => void;
}

export function RecentForges({ onLoadBrief }: Props) {
  const [entries, setEntries] = useState<RecentForge[]>(() => loadRecent());
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === 'open';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    return on<RecentForge[]>('valerius:forge-recent', (list) => setEntries(list ?? []));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, open ? 'open' : 'closed');
    } catch {
      // ignore
    }
  }, [open]);

  return (
    <aside
      aria-label="Recent forges"
      className="fixed left-0 top-4 z-30 hidden md:block"
    >
      <div className="flex items-stretch">
        <div
          className="overflow-hidden border-r border-templar-sand/25 bg-black/60 backdrop-blur transition-[width] duration-300 ease-out"
          style={{ width: open ? 260 : 0 }}
        >
          <div className="w-[260px] p-3">
            <header className="mb-2 flex items-center gap-2 border-b border-templar-sand/15 pb-2">
              <Scroll className="h-3.5 w-3.5 text-templar-sand" />
              <h4 className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-templar-sand">
                Recent Forges
              </h4>
            </header>
            {entries.length === 0 ? (
              <p className="text-[0.7rem] italic text-templar-text/40">
                No forges yet. Your last 5 briefs will appear here.
              </p>
            ) : (
              <ul className="space-y-2">
                {entries.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => onLoadBrief(e.brief)}
                      className="group w-full rounded-md border border-templar-sand/15 bg-white/[0.02] px-2.5 py-2 text-left transition-colors hover:border-templar-sand/45 hover:bg-templar-sand/5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded border border-templar-sand/30 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-templar-sand/80">
                          {e.mode === 'agent' ? 'Agent' : e.mode === 'project' ? 'Project' : 'LLM'}
                        </span>
                        <span className="font-mono text-[0.6rem] text-templar-text/40">
                          {formatTime(e.ts)}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[0.72rem] leading-snug text-templar-text/80 group-hover:text-templar-text">
                        {e.brief.slice(0, 60)}
                        {e.brief.length > 60 ? '…' : ''}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label={open ? 'Collapse recent forges' : 'Open recent forges'}
          onClick={() => setOpen((v) => !v)}
          className="flex h-24 w-6 items-center justify-center rounded-r-lg border border-l-0 border-templar-sand/30 bg-black/60 text-templar-sand/70 backdrop-blur hover:text-templar-sand"
        >
          {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
