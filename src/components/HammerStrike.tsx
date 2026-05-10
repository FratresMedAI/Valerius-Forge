import { useEffect, useState } from 'react';
import { on, prefersReducedMotion } from '../lib/forgeEvents';

export function HammerStrike() {
  const [playing, setPlaying] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    return on('valerius:forge-strike', () => {
      if (prefersReducedMotion()) return;
      setNonce((n) => n + 1);
      setPlaying(true);
      window.setTimeout(() => setPlaying(false), 650);
    });
  }, []);

  if (!playing) return null;

  const sparks = Array.from({ length: 6 }, (_, i) => {
    const angle = (-60 + i * 30) * (Math.PI / 180);
    const dist = 40 + (i % 2) * 12;
    return {
      sx: Math.cos(angle) * dist,
      sy: Math.sin(angle) * dist - 4,
      delay: 280 + i * 18,
    };
  });

  return (
    <div
      key={nonce}
      aria-hidden
      className="pointer-events-none fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2"
      style={{ width: 0, height: 0 }}
    >
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -85%)',
          animation: 'valerius-hammer 650ms cubic-bezier(.4,.2,.6,1) forwards',
          transformOrigin: '60px 110px',
        }}
      >
        <defs>
          <linearGradient id="hammerHead" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#e6dab8" />
            <stop offset="55%" stopColor="#a89876" />
            <stop offset="100%" stopColor="#46402f" />
          </linearGradient>
        </defs>
        <rect x="55" y="35" width="10" height="70" rx="2" fill="#3a2d1c" stroke="#D4C7A5" strokeWidth="1" />
        <rect x="30" y="14" width="60" height="28" rx="3" fill="url(#hammerHead)" stroke="#D4C7A5" strokeWidth="1.5" />
        <rect x="26" y="20" width="6" height="16" rx="1" fill="#D4C7A5" />
        <rect x="88" y="20" width="6" height="16" rx="1" fill="#D4C7A5" />
      </svg>

      <svg
        width="160"
        height="60"
        viewBox="0 0 160 60"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, 10%)',
        }}
      >
        <path
          d="M10 50 L30 30 L130 30 L150 50 Z"
          fill="#1a1a1a"
          stroke="#D4C7A5"
          strokeWidth="1.5"
        />
        <rect x="40" y="22" width="80" height="10" rx="2" fill="#2a2418" stroke="#D4C7A5" strokeWidth="1" />
      </svg>

      {sparks.map((s, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 5,
            height: 5,
            marginLeft: -2.5,
            marginTop: -2.5,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fff3c2, #d4c7a5 60%, transparent 75%)',
            boxShadow: '0 0 8px rgba(255, 220, 140, 0.9)',
            animation: `valerius-spark 480ms cubic-bezier(.2,.6,.4,1) ${s.delay}ms forwards`,
            ['--sx' as never]: `${s.sx}px`,
            ['--sy' as never]: `${s.sy}px`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
