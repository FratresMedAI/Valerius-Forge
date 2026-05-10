import { type ReactNode, useState } from 'react';
import { X } from 'lucide-react';
import { useTier, setTier } from '../lib/tier';
import { MastersBadge } from './MastersBadge';

export const MASTERS_PERKS = [
  'Unlimited Forge Library — no vault cap, full naming & tagging',
  'Test in Playground — chat with your forged agent system prompt live',
  'Fork & Diff — create variant forges and compare them line-by-line',
  'Export Forge — one-click Python skeletons for LangChain, CrewAI, Agno & JSON',
  'Higher quality forges — deeper heuristic pass, richer signals',
  'Priority support from the brotherhood',
  'Custom templates — save your own forge patterns to the vault',
];

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
            Ascend to Master · Unlock the full forge
          </button>
        </div>
      </div>

      {modalOpen && <MastersModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

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
    setTimeout(onClose, 1400);
  };

  const handleRevert = () => {
    setTier('order');
    setTierState('order');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg rounded-2xl border border-templar-sand/40 bg-templar-bg p-6 shadow-[0_0_80px_-15px_rgba(212,199,165,0.6)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-templar-sand">
            <MastersBadge size="md" />
            Ascend to Master
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-templar-text/60 transition-colors hover:text-templar-sand"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {confirmed ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <span className="text-4xl">⚔️</span>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-templar-sand">
              You have ascended. Welcome, Master.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-templar-text/75 leading-relaxed">
              The Order forges strong blades — but Masters forge <em>legendary</em> ones.
              As a Master of the brotherhood, you command the full power of the Valerius forge:
            </p>

            <ul className="mb-6 space-y-2.5">
              {MASTERS_PERKS.map((perk, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-templar-text/85">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-templar-sand" />
                  {perk}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAscend}
                className="rounded-lg bg-templar-sand px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-templar-bg shadow-[0_0_24px_rgba(212,199,165,0.4)] transition-all hover:brightness-110"
              >
                Become a Master (Demo)
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-templar-sand/30 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-templar-text/70 transition-colors hover:border-templar-sand/60 hover:text-templar-sand"
              >
                Stay with the Order
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-[0.6rem] text-templar-text/35 italic">
                Demo mode — no payment. Real checkout coming soon.
              </p>
              {tier === 'masters' ? (
                <button
                  type="button"
                  onClick={handleRevert}
                  className="text-[0.6rem] text-templar-text/35 underline transition-colors hover:text-templar-text/60"
                >
                  Revert to Order (demo)
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
