import { type ReactNode, useState } from 'react';
import { X, Check, Zap, Library, FileDown, LayoutTemplate, GitCompare, Share2, Wand2, Lock, BarChart2, Rocket } from 'lucide-react';
import { useTier, setTier } from '../lib/tier';
import { MastersBadge } from './MastersBadge';

// ─── Feature definitions ────────────────────────────────────────────────────

interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
  soon?: boolean;
}

export const MASTERS_FEATURES: Feature[] = [
  {
    icon: <Zap className="h-4 w-4" />,
    title: 'Priority Queue & Best Models First',
    desc: 'Skip the line. Faster responses and first access to the latest LLM models as they drop.',
  },
  {
    icon: <Library className="h-4 w-4" />,
    title: 'Full Prompt History & Library',
    desc: 'Save, search, tag, and organize every forge you\'ve ever made. Add notes, star favorites, and never lose a great prompt.',
  },
  {
    icon: <FileDown className="h-4 w-4" />,
    title: 'One-Click Export',
    desc: 'Export any forge as JSON, Markdown, LangChain, CrewAI, AutoGen, or raw system prompt instantly.',
  },
  {
    icon: <LayoutTemplate className="h-4 w-4" />,
    title: 'Custom Agent Templates',
    desc: 'Save your own reusable templates — "My PM Style", "YouTube Script Formula", "Support Agent v2" — and reuse in one click.',
  },
  {
    icon: <GitCompare className="h-4 w-4" />,
    title: 'Prompt Versioning & Diffs',
    desc: 'Full refinement history for every agent. Compare any two versions side-by-side with highlighted diffs.',
  },
  {
    icon: <Share2 className="h-4 w-4" />,
    title: 'Shared Forges & Collaboration',
    desc: 'Share agents with teammates or clients via view-only or editable links. Build together.',
  },
  {
    icon: <Wand2 className="h-4 w-4" />,
    title: 'Advanced Refinement Tools',
    desc: 'Smart one-click upgrades: "Make 50% more concise", "Add memory", "Add cost guardrails", "Convert to multi-agent", and more.',
  },
  {
    icon: <Lock className="h-4 w-4" />,
    title: 'Private & Encrypted Forges',
    desc: 'Mark any forge private. Encrypted at rest — your proprietary agent logic stays yours.',
    soon: true,
  },
  {
    icon: <BarChart2 className="h-4 w-4" />,
    title: 'Agent Usage Analytics',
    desc: 'See how your shared agents are being used. View counts, copy rates, and engagement over time.',
    soon: true,
  },
  {
    icon: <Rocket className="h-4 w-4" />,
    title: 'Early Access to New Features',
    desc: 'Masters get every new forge capability first — playground updates, new export targets, model integrations.',
  },
];

export const MASTERS_PERKS = MASTERS_FEATURES.map((f) => `${f.title} — ${f.desc}`);

// ─── Gate wrapper ────────────────────────────────────────────────────────────

interface GateProps {
  children: ReactNode;
  teaser?: boolean;
}

export function MastersGate({ children, teaser = false }: GateProps) {
  const [tier] = useTier();
  const [modalOpen, setModalOpen] = useState(false);

  if (tier === 'masters') return <>{children}</>;

  return (
    <>
      <div className="relative rounded-xl border border-templar-sand/25 bg-black/20 shadow-[0_0_24px_-8px_rgba(212,199,165,0.2)]">
        <div className="absolute right-2.5 top-2.5 z-10">
          <MastersBadge size="sm" />
        </div>

        {teaser ? (
          <div className="pointer-events-none select-none overflow-hidden rounded-xl" style={{ filter: 'blur(3px)', opacity: 0.45 }}>
            {children}
          </div>
        ) : (
          <div className="min-h-[120px]" />
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/40 backdrop-blur-[2px]">
          <p className="text-center text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-templar-sand/70">
            Masters only
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-lg border border-templar-sand/60 bg-templar-sand/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-templar-sand shadow-[0_0_16px_rgba(212,199,165,0.15)] transition-all hover:bg-templar-sand/20 hover:shadow-[0_0_24px_rgba(212,199,165,0.25)]"
          >
            Ascend to Masters · Unlock
          </button>
        </div>
      </div>

      {modalOpen && <MastersModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void;
}

export function MastersModal({ onClose }: ModalProps) {
  const [tier, setTierState] = useTier();
  const [confirmed, setConfirmed] = useState(false);

  const handleAscend = () => {
    setTier('masters');
    setTierState('masters');
    setConfirmed(true);
    setTimeout(onClose, 1600);
  };

  const handleRevert = () => {
    setTier('order');
    setTierState('order');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-xl rounded-2xl border border-templar-sand/35 bg-templar-bg shadow-[0_0_100px_-20px_rgba(212,199,165,0.5)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-templar-sand/15 px-6 py-4">
          <div className="flex items-center gap-3">
            <MastersBadge size="md" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-templar-sand">
                Valerius Masters
              </h2>
              <p className="text-[0.6rem] text-templar-text/45 uppercase tracking-[0.15em]">
                The full forge. No limits.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-templar-text/50 transition-colors hover:text-templar-sand"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {confirmed ? (
          <div className="flex flex-col items-center gap-4 px-6 py-14">
            <span className="text-5xl">⚔️</span>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-templar-sand">
              You have ascended. Welcome, Master.
            </p>
          </div>
        ) : (
          <>
            {/* Price callout */}
            <div className="flex items-baseline justify-center gap-2 border-b border-templar-sand/10 py-5">
              <span className="font-title text-5xl text-templar-sand">$10</span>
              <span className="text-sm text-templar-text/50">/ month</span>
              <span className="ml-3 rounded-full border border-templar-sand/30 bg-templar-sand/10 px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-templar-sand">
                Cancel anytime
              </span>
            </div>

            {/* Feature grid */}
            <div className="max-h-[52vh] overflow-y-auto scroll-thin px-6 py-4">
              <p className="mb-4 text-[0.7rem] uppercase tracking-[0.18em] text-templar-text/40">
                Everything in Order (free) · plus:
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {MASTERS_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl border border-templar-sand/12 bg-white/[0.02] p-3">
                    <span className={`mt-0.5 shrink-0 ${f.soon ? 'text-templar-text/30' : 'text-templar-sand'}`}>
                      {f.icon}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className={`text-[0.72rem] font-semibold leading-snug ${f.soon ? 'text-templar-text/45' : 'text-templar-text/90'}`}>
                        {f.title}
                        {f.soon && (
                          <span className="ml-1.5 rounded border border-templar-sand/25 px-1 py-px text-[0.55rem] font-bold uppercase tracking-wider text-templar-sand/50">
                            Soon
                          </span>
                        )}
                      </span>
                      <span className="text-[0.65rem] leading-snug text-templar-text/45">{f.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="border-t border-templar-sand/10 px-6 py-4">
              <div className="mb-3 flex items-center gap-2 text-[0.65rem] text-templar-text/40">
                <Check className="h-3.5 w-3.5 text-templar-sand/60" />
                Free tier stays unlimited — no paywalls on forging
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAscend}
                  className="valerius-shine rounded-lg bg-templar-sand px-6 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-templar-bg shadow-[0_0_28px_rgba(212,199,165,0.45)] transition-all hover:brightness-110"
                >
                  Ascend to Masters · $10/mo
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-templar-sand/25 px-4 py-2.5 text-xs text-templar-text/55 transition-colors hover:border-templar-sand/50 hover:text-templar-sand/80"
                >
                  Stay with the Order
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[0.58rem] italic text-templar-text/30">
                  Demo mode — no payment required. Real checkout coming soon.
                </p>
                {tier === 'masters' && (
                  <button
                    type="button"
                    onClick={handleRevert}
                    className="text-[0.58rem] text-templar-text/30 underline transition-colors hover:text-templar-text/55"
                  >
                    Revert to Order (demo)
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
