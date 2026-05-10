interface Props {
  size?: 'sm' | 'md';
  inline?: boolean;
}

export function MastersBadge({ size = 'sm', inline = false }: Props) {
  const isSmall = size === 'sm';
  const crown = (
    <svg
      aria-hidden
      viewBox="0 0 16 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'}
    >
      <path
        d="M1 11h14M2 11 1 4l4 3 3-6 3 6 4-3-1 7H2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );

  if (inline) {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-templar-sand/50 bg-templar-sand/10 px-1.5 py-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.2em] text-templar-sand shadow-[0_0_8px_rgba(212,199,165,0.25)]">
        {crown}
        Masters
      </span>
    );
  }

  return (
    <span
      className={
        'inline-flex items-center gap-1 rounded border border-templar-sand/60 bg-templar-sand/10 font-mono font-bold uppercase tracking-[0.2em] text-templar-sand shadow-[0_0_10px_rgba(212,199,165,0.3)] ' +
        (isSmall ? 'px-1.5 py-0.5 text-[0.55rem]' : 'px-2 py-1 text-[0.65rem]')
      }
    >
      {crown}
      Masters
    </span>
  );
}
