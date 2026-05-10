export function MasterworkSeal() {
  return (
    <div
      aria-label="Masterwork Forged"
      className="valerius-seal absolute -right-3 -top-3 z-10 flex h-20 w-20 items-center justify-center rounded-full border border-templar-sand/80 bg-gradient-to-br from-[#2a2316] to-[#0f0f0f]"
      style={{ boxShadow: '0 0 22px 4px rgba(212, 199, 165, 0.6)' }}
    >
      <svg viewBox="0 0 100 100" width="80" height="80" className="absolute inset-0">
        <defs>
          <path id="seal-curve-top" d="M 14,50 A 36,36 0 0,1 86,50" fill="none" />
          <path id="seal-curve-bot" d="M 16,52 A 34,34 0 0,0 84,52" fill="none" />
          <radialGradient id="seal-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3a2f1a" />
            <stop offset="100%" stopColor="#100d07" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="40" fill="url(#seal-bg)" stroke="#D4C7A5" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="#D4C7A5" strokeWidth="0.6" strokeDasharray="2 3" />
        {/* Templar cross */}
        <g fill="#D4C7A5">
          <path d="M50 32 L55 40 L62 40 L57 46 L50 44 L43 46 L38 40 L45 40 Z" opacity="0.85" />
          <rect x="47" y="42" width="6" height="20" rx="1" />
          <rect x="40" y="49" width="20" height="6" rx="1" />
        </g>
        <text fill="#D4C7A5" fontSize="7.5" letterSpacing="1.5" fontWeight="700" fontFamily="Georgia, serif">
          <textPath href="#seal-curve-top" startOffset="50%" textAnchor="middle">
            MASTERWORK
          </textPath>
        </text>
        <text fill="#D4C7A5" fontSize="7" letterSpacing="2" fontWeight="700" fontFamily="Georgia, serif">
          <textPath href="#seal-curve-bot" startOffset="50%" textAnchor="middle">
            FORGED
          </textPath>
        </text>
      </svg>
    </div>
  );
}
