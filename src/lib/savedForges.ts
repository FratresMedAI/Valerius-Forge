import { loadRecent } from './forgeEvents';

export interface SavedForge {
  id: string;
  brief: string;
  mode: 'agent' | 'project' | 'llm';
  name?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  parentId?: string;
}

const KEY = 'valerius.savedForges.v2';
const MIGRATED_KEY = 'valerius.savedForges.migrated';

export function loadAll(): SavedForge[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedForge[];
  } catch {
    return [];
  }
}

function persist(forges: SavedForge[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(forges));
  } catch { /* quota */ }
}

export function save(
  forge: Omit<SavedForge, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): SavedForge {
  const all = loadAll();
  const now = Date.now();
  if (forge.id) {
    const idx = all.findIndex((f) => f.id === forge.id);
    if (idx >= 0) {
      const updated: SavedForge = { ...all[idx], ...forge, id: forge.id, updatedAt: now };
      all[idx] = updated;
      persist(all);
      return updated;
    }
  }
  const created: SavedForge = {
    ...forge,
    id: crypto.randomUUID?.() ?? String(now),
    createdAt: now,
    updatedAt: now,
  };
  persist([created, ...all]);
  return created;
}

export function remove(id: string): void {
  persist(loadAll().filter((f) => f.id !== id));
}

export function migrateFromRecent(): void {
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return;
    const recent = loadRecent();
    if (recent.length === 0) {
      localStorage.setItem(MIGRATED_KEY, '1');
      return;
    }
    const existing = loadAll();
    if (existing.length === 0) {
      const migrated: SavedForge[] = recent.map((r) => ({
        id: r.id,
        brief: r.brief,
        mode: r.mode,
        tags: [],
        createdAt: r.ts,
        updatedAt: r.ts,
      }));
      persist(migrated);
    }
    localStorage.setItem(MIGRATED_KEY, '1');
  } catch { /* ignore */ }
}
