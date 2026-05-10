// Simple window-level pub/sub for cross-component forge state.
// We keep this dependency-free: no zustand/context, just CustomEvents.

export type ForgeEventName =
  | 'valerius:forge-start'
  | 'valerius:forge-end'
  | 'valerius:forge-strike'
  | 'valerius:forge-recent'
  | 'valerius:forge-saved';

export interface RecentForge {
  id: string;
  brief: string;
  mode: 'project' | 'agent' | 'llm';
  ts: number;
}

export function emit(name: ForgeEventName, detail?: unknown): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on<T = unknown>(name: ForgeEventName, fn: (detail: T) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent).detail as T);
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}

const RECENT_KEY = 'valerius.recentForges';
const RECENT_CAP = 5;

export function loadRecent(): RecentForge[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, RECENT_CAP);
  } catch {
    return [];
  }
}

export function pushRecent(entry: Omit<RecentForge, 'id' | 'ts'>): RecentForge[] {
  const list = loadRecent();
  const next: RecentForge = { ...entry, id: crypto.randomUUID?.() ?? String(Date.now()), ts: Date.now() };
  // Dedup: drop prior entries with identical brief.
  const filtered = list.filter((r) => r.brief.trim() !== entry.brief.trim());
  const out = [next, ...filtered].slice(0, RECENT_CAP);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(out));
  } catch {
    // ignore quota
  }
  emit('valerius:forge-recent', out);
  return out;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
