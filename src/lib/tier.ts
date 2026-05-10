import { useEffect, useState } from 'react';

export type Tier = 'order' | 'masters';

const TIER_KEY = 'valerius.tier';
const TIER_EVENT = 'valerius:tier-change';

export function loadTier(): Tier {
  try {
    const v = localStorage.getItem(TIER_KEY);
    if (v === 'masters') return 'masters';
  } catch { /* ignore */ }
  return 'order';
}

export function setTier(t: Tier): void {
  try {
    localStorage.setItem(TIER_KEY, t);
  } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(TIER_EVENT, { detail: t }));
}

export function isMaster(): boolean {
  return loadTier() === 'masters';
}

export function useTier(): [Tier, (t: Tier) => void] {
  const [tier, setTierState] = useState<Tier>(loadTier);

  useEffect(() => {
    const handler = (e: Event) => setTierState((e as CustomEvent).detail as Tier);
    window.addEventListener(TIER_EVENT, handler);
    return () => window.removeEventListener(TIER_EVENT, handler);
  }, []);

  const update = (t: Tier) => {
    setTier(t);
    setTierState(t);
  };

  return [tier, update];
}
