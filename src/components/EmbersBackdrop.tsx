import { useMemo } from 'react';

interface EmberSpec {
  left: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  sway: number;
}

function rand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const EMBER_COUNT = 18;

export function EmbersBackdrop() {
  const embers = useMemo<EmberSpec[]>(() => {
    const r = rand(0x5a17d0);
    return Array.from({ length: EMBER_COUNT }, () => ({
      left: `${(r() * 100).toFixed(2)}%`,
      size: 3 + Math.floor(r() * 5),
      duration: 14 + r() * 18,
      delay: -r() * 24,
      opacity: 0.4 + r() * 0.45,
      sway: (r() * 60 - 30),
    }));
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ contain: 'strict' }}
    >
      <div className="valerius-haze left" />
      <div className="valerius-haze right" />
      {embers.map((e, i) => (
        <span
          key={i}
          className="valerius-ember"
          style={{
            left: e.left,
            width: `${e.size}px`,
            height: `${e.size}px`,
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
            // CSS custom props consumed by the keyframes
            ['--ember-opacity' as never]: e.opacity,
            ['--ember-sway' as never]: `${e.sway}px`,
          }}
        />
      ))}
    </div>
  );
}
