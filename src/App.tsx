import { useEffect, useState, useCallback } from 'react';
import { Menu, X, Settings as SettingsIcon, Crown, BookMarked, ArrowUp } from 'lucide-react';
import { Hero } from './components/Hero';
import { Forge } from './components/Forge';
import { SettingsPanel } from './components/SettingsPanel';
import { EmbersBackdrop } from './components/EmbersBackdrop';
import { HammerStrike } from './components/HammerStrike';
import { ForgeLibrary } from './components/ForgeLibrary';
import { MastersBadge } from './components/MastersBadge';
import { MastersModal } from './components/MastersUpsell';
import { loadSettings, type LLMSettings } from './lib/llm';
import { useTier } from './lib/tier';
import { migrateFromRecent } from './lib/savedForges';
import type { OutputPayload } from './components/OutputPanel';

export default function App() {
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mastersOpen, setMastersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);
  const [externalBrief, setExternalBrief] = useState<{ value: string; nonce: number } | null>(null);
  const [currentPayload, setCurrentPayload] = useState<OutputPayload | null>(null);
  const [activeForgeId] = useState<string | undefined>(undefined);
  const [tier] = useTier();

  useEffect(() => {
    setSettings(loadSettings());
    migrateFromRecent();
  }, []);

  return (
    <div className="relative min-h-screen">
      <EmbersBackdrop />
      <HammerStrike />
      <div className="relative z-10">

        {/* ── Hamburger toggle — top-left ── */}
        <div className="sticky top-0 z-50 flex items-start px-4 pt-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="inline-flex items-center justify-center rounded-xl border border-templar-sand/25 bg-black/70 p-3 text-templar-sand/70 backdrop-blur transition-colors hover:border-templar-sand/60 hover:text-templar-sand"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {/* API connected indicator — green dot on button corner */}
            {settings && (
              <span
                className="pointer-events-none absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.7)]"
                aria-label="LLM connected"
              />
            )}
          </div>
        </div>

        {/* ── Slide-down drawer — starts below the button, never overlaps it ── */}
        {menuOpen && (
          <div className="fixed left-4 top-[72px] z-40 w-64 rounded-2xl border border-templar-sand/20 bg-black/85 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.8)] backdrop-blur-md">
            {/* Tier row */}
            <div className="mb-4 flex items-center justify-between">
              {tier === 'masters' ? (
                <div className="flex items-center gap-2">
                  <MastersBadge size="sm" />
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-templar-sand">Master</span>
                </div>
              ) : (
                <span className="text-[0.65rem] italic text-templar-text/50">Member of the Order</span>
              )}
              {settings && (
                <span className="flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.12em] text-green-400/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.8)]" />
                  API on
                </span>
              )}
            </div>

            <div className="mb-3 h-px bg-templar-sand/10" />

            {/* Menu items */}
            <nav className="flex flex-col gap-1">
              <DrawerItem
                icon={<BookMarked className="h-4 w-4" />}
                label="Forge Library"
                sub="Your saved forges"
                onClick={() => { setLibraryOpen(true); setMenuOpen(false); }}
              />
              <DrawerItem
                icon={<SettingsIcon className="h-4 w-4" />}
                label="LLM Settings"
                sub={settings ? settings.model : 'Configure your API key'}
                onClick={() => { setSettingsOpen(true); setMenuOpen(false); }}
              />
              {tier === 'masters' ? (
                <DrawerItem
                  icon={<Crown className="h-4 w-4" />}
                  label="Masters — Active"
                  sub="Full forge unlocked"
                  onClick={() => { setMastersOpen(true); setMenuOpen(false); }}
                />
              ) : (
                <button
                  type="button"
                  disabled
                  className="group relative flex w-full cursor-not-allowed items-start gap-3 rounded-lg px-3 py-2.5 text-left"
                >
                  <span className="mt-0.5 text-templar-text/35">
                    <Crown className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-templar-text/35">
                      Ascend to Masters
                    </span>
                    <span className="text-[0.65rem] text-templar-text/25">Unlock Library, Playground, Diff &amp; Export</span>
                  </span>
                  <span className="absolute right-2.5 top-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <MastersBadge size="sm" />
                  </span>
                </button>
              )}
            </nav>
          </div>
        )}

        {/* backdrop close */}
        {menuOpen && (
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} aria-hidden />
        )}

        <main className="mx-auto w-full max-w-4xl px-6 pb-24">
          <Hero />
          <Forge
            settings={settings}
            externalBrief={externalBrief}
            onPayloadChange={setCurrentPayload}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenLibrary={() => setLibraryOpen(true)}
            resetNonce={resetNonce}
          />
        </main>
        <footer className="border-t border-templar-sand/10 py-8 text-center text-xs uppercase tracking-[0.32em] text-templar-sand/80">
          Powered by Fratres X AI
        </footer>
      </div>

      <ForgeLibrary
        onLoadBrief={(brief) => { setExternalBrief({ value: brief, nonce: Date.now() }); setLibraryOpen(false); }}
        currentBrief={
          currentPayload?.mode === 'agent'
            ? currentPayload.suggestion.systemPrompt
            : currentPayload?.mode === 'project'
            ? currentPayload.suggestion.cursorPrompt
            : undefined
        }
        currentPayloadMode={currentPayload?.mode === 'llm' ? 'llm' : currentPayload?.mode}
        activeForgeId={activeForgeId}
        onFork={(_parentId, brief) => { setExternalBrief({ value: brief, nonce: Date.now() }); setLibraryOpen(false); }}
        externalOpen={libraryOpen}
        onExternalClose={() => setLibraryOpen(false)}
      />

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} onChange={setSettings} />
      {mastersOpen && <MastersModal onClose={() => setMastersOpen(false)} />}

      {/* ── Scroll-to-top FAB ── */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-templar-sand/40 bg-black/70 text-templar-sand/80 shadow-[0_0_20px_rgba(0,0,0,0.6)] backdrop-blur transition-all hover:border-templar-sand hover:text-templar-sand hover:shadow-[0_0_16px_rgba(212,199,165,0.35)]"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* ── Reset FAB ── */}
      <button
        type="button"
        onClick={() => { setResetNonce((n) => n + 1); scrollToTop(); }}
        aria-label="Reset forge"
        title="Reset forge"
        className="fixed bottom-6 right-20 z-50 flex h-10 items-center gap-2 rounded-full border border-templar-sand/25 bg-black/70 px-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-templar-text/50 shadow-[0_0_20px_rgba(0,0,0,0.6)] backdrop-blur transition-all hover:border-templar-sand/50 hover:text-templar-sand/80"
      >
        <span className="text-base leading-none">↺</span>
        Reset
      </button>
    </div>
  );
}

function DrawerItem({
  icon,
  label,
  sub,
  onClick,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ' +
        (highlight
          ? 'border border-templar-sand/25 bg-templar-sand/5 hover:bg-templar-sand/10'
          : 'hover:bg-white/5')
      }
    >
      <span className={highlight ? 'mt-0.5 text-templar-sand' : 'mt-0.5 text-templar-text/50'}>
        {icon}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className={`text-xs font-semibold uppercase tracking-[0.15em] ${highlight ? 'text-templar-sand' : 'text-templar-text/80'}`}>
          {label}
        </span>
        {sub && <span className="text-[0.65rem] text-templar-text/40">{sub}</span>}
      </span>
    </button>
  );
}
