import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, BookOpen, Trash2, GitFork, ArrowDownToLine, Plus, Tag, Pencil } from 'lucide-react';
import { loadAll, save, remove, type SavedForge } from '../lib/savedForges';
import { useTier } from '../lib/tier';
import { on, emit } from '../lib/forgeEvents';
import { MastersBadge } from './MastersBadge';
import { MastersModal } from './MastersUpsell';

const ORDER_CAP = 5;
const COLLAPSED_KEY = 'valerius.forgeLibrary.collapsed';

function formatTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function deriveName(brief: string): string {
  return brief.slice(0, 50) + (brief.length > 50 ? '…' : '');
}

interface Props {
  onLoadBrief: (brief: string) => void;
  currentBrief?: string;
  currentPayloadMode?: 'agent' | 'project' | 'llm';
  activeForgeId?: string;
  onFork?: (parentId: string, brief: string) => void;
  externalOpen?: boolean;
  onExternalClose?: () => void;
}

export function ForgeLibrary({ onLoadBrief, currentBrief, currentPayloadMode, activeForgeId, onFork, externalOpen, onExternalClose }: Props) {
  const [tier] = useTier();
  const [forges, setForges] = useState<SavedForge[]>(() => loadAll());
  const [open, setOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'open'; } catch { return false; }
  });
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState('');
  const [mastersOpen, setMastersOpen] = useState(false);
  const editNameRef = useRef<HTMLInputElement>(null);

  const refresh = () => setForges(loadAll());

  useEffect(() => {
    if (externalOpen !== undefined) setOpen(externalOpen);
  }, [externalOpen]);

  useEffect(() => {
    const unsub = on('valerius:forge-saved', () => refresh());
    return unsub;
  }, []);

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, open ? 'open' : 'closed'); } catch { /* ignore */ }
  }, [open]);

  const isMaster = tier === 'masters';
  const atCap = !isMaster && forges.length >= ORDER_CAP;

  const filtered = forges.filter((f) => {
    if (activeTag && !f.tags.includes(activeTag)) return false;
    if (search && isMaster) {
      const q = search.toLowerCase();
      const name = (f.name ?? deriveName(f.brief)).toLowerCase();
      if (!name.includes(q) && !f.brief.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleSaveCurrent = () => {
    if (!currentBrief?.trim()) return;
    if (atCap) { setMastersOpen(true); return; }
    const forge = save({
      brief: currentBrief,
      mode: currentPayloadMode ?? 'agent',
      tags: [],
    });
    emit('valerius:forge-saved', forge);
    refresh();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    remove(id);
    refresh();
  };

  const handleLoad = (f: SavedForge) => {
    onLoadBrief(f.brief);
  };

  const handleFork = (f: SavedForge, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMaster) { setMastersOpen(true); return; }
    const fork = save({
      brief: f.brief,
      mode: f.mode,
      name: `Fork of ${f.name ?? deriveName(f.brief)}`,
      tags: [...f.tags],
      parentId: f.id,
    });
    emit('valerius:forge-saved', fork);
    refresh();
    if (onFork) onFork(f.id, f.brief);
    onLoadBrief(f.brief);
  };

  const startEdit = (f: SavedForge, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMaster) { setMastersOpen(true); return; }
    setEditingId(f.id);
    setEditName(f.name ?? deriveName(f.brief));
    setEditTags(f.tags.join(', '));
    setTimeout(() => editNameRef.current?.focus(), 50);
  };

  const commitEdit = (id: string) => {
    const tags = editTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    save({ id, brief: forges.find((f) => f.id === id)?.brief ?? '', mode: forges.find((f) => f.id === id)?.mode ?? 'agent', name: editName.trim() || undefined, tags });
    setEditingId(null);
    refresh();
  };

  const allTags = Array.from(new Set(forges.flatMap((f) => f.tags))).sort();

  const closePanel = () => {
    setOpen(false);
    onExternalClose?.();
  };

  if (!open) return mastersOpen ? <>{mastersOpen && <MastersModal onClose={() => setMastersOpen(false)} />}</> : null;

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={closePanel} aria-hidden />

      <aside
        aria-label="Forge Library"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-templar-sand/25 bg-black/90 shadow-[0_0_80px_-15px_rgba(212,199,165,0.4)] backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full p-4">
          <header className="mb-3 flex items-center justify-between gap-2 border-b border-templar-sand/15 pb-2 pr-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-templar-sand" />
                  <h4 className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-templar-sand">
                    Forge Library
                    <span className="ml-1.5 font-mono text-[0.6rem] text-templar-text/50">
                      {isMaster ? `· ${forges.length}` : `· ${forges.length}/${ORDER_CAP}`}
                    </span>
                  </h4>
                </div>
                {currentBrief && (
                  <button
                    type="button"
                    onClick={handleSaveCurrent}
                    disabled={atCap && !isMaster}
                    title={atCap ? 'Vault full — ascend to Master for unlimited storage' : 'Save current forge'}
                    className="rounded border border-templar-sand/30 p-1 text-templar-sand/70 transition-colors hover:border-templar-sand hover:text-templar-sand disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </header>

              {isMaster && (
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search the vault…"
                  className="mb-2 w-full rounded-md border border-templar-sand/20 bg-black/40 px-2.5 py-1.5 text-[0.7rem] text-templar-text placeholder:text-templar-text/30 focus:border-templar-sand/50 focus:outline-none"
                />
              )}

              {isMaster && allTags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      className={
                        'rounded-full border px-2 py-0.5 text-[0.58rem] font-medium transition-colors ' +
                        (activeTag === tag
                          ? 'border-templar-sand/70 bg-templar-sand/20 text-templar-sand'
                          : 'border-templar-sand/20 text-templar-text/50 hover:border-templar-sand/50 hover:text-templar-sand/80')
                      }
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {!isMaster && atCap && (
                <p className="mb-2 rounded-md border border-templar-sand/20 bg-templar-sand/5 p-2 text-[0.62rem] italic leading-snug text-templar-sand/70">
                  Your Order vault holds {ORDER_CAP} forges.{' '}
                  <button type="button" onClick={() => setMastersOpen(true)} className="underline hover:text-templar-sand">
                    Masters get unlimited storage + tags + naming.
                  </button>
                </p>
              )}

              {filtered.length === 0 ? (
                <p className="text-[0.7rem] italic text-templar-text/40">
                  {search ? 'No forges match your search.' : 'No forges yet. Forge something and save it.'}
                </p>
              ) : (
                <ul className="space-y-2 max-h-[calc(100vh-160px)] overflow-y-auto scroll-thin">
                  {filtered.map((f) => (
                    <li key={f.id}>
                      {editingId === f.id ? (
                        <div className="rounded-md border border-templar-sand/40 bg-white/[0.03] p-2.5 space-y-2">
                          <input
                            ref={editNameRef}
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && commitEdit(f.id)}
                            placeholder="Forge name…"
                            className="w-full rounded border border-templar-sand/25 bg-black/40 px-2 py-1 text-[0.7rem] text-templar-text focus:border-templar-sand/50 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && commitEdit(f.id)}
                            placeholder="Tags: comma, separated"
                            className="w-full rounded border border-templar-sand/25 bg-black/40 px-2 py-1 text-[0.7rem] text-templar-text focus:border-templar-sand/50 focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => commitEdit(f.id)}
                              className="flex-1 rounded border border-templar-sand/50 bg-templar-sand/15 py-1 text-[0.65rem] font-semibold text-templar-sand hover:bg-templar-sand/25"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="flex-1 rounded border border-templar-sand/20 py-1 text-[0.65rem] text-templar-text/60 hover:text-templar-text"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={
                            'group relative rounded-md border bg-white/[0.02] px-2.5 py-2 transition-colors hover:border-templar-sand/45 hover:bg-templar-sand/5 ' +
                            (f.id === activeForgeId
                              ? 'border-l-2 border-l-templar-sand border-templar-sand/30'
                              : 'border-templar-sand/15')
                          }
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="rounded border border-templar-sand/30 px-1.5 py-0.5 font-mono text-[0.52rem] uppercase tracking-wider text-templar-sand/80">
                              {f.mode}
                            </span>
                            <span className="font-mono text-[0.58rem] text-templar-text/40">
                              {formatTime(f.updatedAt)}
                            </span>
                          </div>

                          <p className="text-[0.72rem] leading-snug text-templar-text/80 line-clamp-2">
                            {f.name ?? deriveName(f.brief)}
                          </p>

                          {f.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {f.tags.map((tag) => (
                                <span key={tag} className="rounded-full border border-templar-sand/25 px-1.5 py-0.5 text-[0.55rem] text-templar-text/55">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="mt-2 flex items-center gap-1.5">
                            <button
                              type="button"
                              title="Load this forge"
                              onClick={() => handleLoad(f)}
                              className="flex items-center gap-1 rounded border border-templar-sand/30 px-2 py-0.5 text-[0.62rem] text-templar-sand/70 transition-colors hover:border-templar-sand hover:text-templar-sand"
                            >
                              <ArrowDownToLine className="h-2.5 w-2.5" />
                              Load
                            </button>
                            <button
                              type="button"
                              title={isMaster ? 'Fork this forge' : 'Fork — Masters only'}
                              onClick={(e) => handleFork(f, e)}
                              className="flex items-center gap-1 rounded border border-templar-sand/20 px-2 py-0.5 text-[0.62rem] text-templar-text/50 transition-colors hover:border-templar-sand/50 hover:text-templar-text/80"
                            >
                              <GitFork className="h-2.5 w-2.5" />
                              Fork
                              {!isMaster && <MastersBadge size="sm" />}
                            </button>
                            <button
                              type="button"
                              title={isMaster ? 'Edit name & tags' : 'Edit — Masters only'}
                              onClick={(e) => startEdit(f, e)}
                              className="rounded border border-templar-sand/20 p-0.5 text-templar-text/40 transition-colors hover:border-templar-sand/40 hover:text-templar-sand/80"
                            >
                              {isMaster ? <Pencil className="h-2.5 w-2.5" /> : <Tag className="h-2.5 w-2.5" />}
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={(e) => handleDelete(f.id, e)}
                              className="ml-auto rounded border border-transparent p-0.5 text-templar-text/25 transition-colors hover:border-templar-red/40 hover:text-templar-red/70 opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
        </div>

        {/* close button */}
        <button
          type="button"
          onClick={closePanel}
          aria-label="Close Forge Library"
          className="absolute right-3 top-3 rounded p-1 text-templar-text/40 transition-colors hover:text-templar-sand"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </aside>

      {mastersOpen && <MastersModal onClose={() => setMastersOpen(false)} />}
    </>
  );
}
