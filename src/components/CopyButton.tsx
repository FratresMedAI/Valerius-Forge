import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label = 'Copy', className }: Props) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      // Optional audio hook lives here — left unwired intentionally.
      // window.dispatchEvent(new CustomEvent('valerius:copy-ting'));
      showToast();
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore clipboard failures
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'valerius-shine inline-flex items-center gap-1.5 rounded-md border border-templar-sand/40 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-templar-text/90 transition-all hover:border-templar-sand hover:bg-templar-sand/15 ' +
        (className ?? '')
      }
    >
      <span
        className="relative inline-flex h-3.5 w-3.5 items-center justify-center"
        aria-hidden
      >
        <Copy
          className={
            'absolute h-3.5 w-3.5 transition-all duration-200 ' +
            (copied ? 'scale-50 opacity-0' : 'scale-100 opacity-100')
          }
        />
        <Check
          className={
            'absolute h-3.5 w-3.5 text-templar-sand transition-all duration-200 ' +
            (copied ? 'scale-100 opacity-100' : 'scale-50 opacity-0')
          }
        />
      </span>
      <span className="min-w-[3ch]">{copied ? 'Forged' : label}</span>
    </button>
  );
}

function showToast() {
  const id = 'valerius-toast-root';
  let root = document.getElementById(id);
  if (!root) {
    root = document.createElement('div');
    root.id = id;
    root.style.position = 'fixed';
    root.style.right = '20px';
    root.style.bottom = '20px';
    root.style.zIndex = '60';
    root.style.pointerEvents = 'none';
    document.body.appendChild(root);
  }
  const toast = document.createElement('div');
  toast.textContent = 'Forged to clipboard';
  toast.className = 'valerius-toast';
  toast.style.cssText = [
    'margin-top:8px',
    'padding:8px 14px',
    'border-radius:8px',
    'background:rgba(15,15,15,0.92)',
    'border:1px solid rgba(212,199,165,0.4)',
    'color:#D4C7A5',
    'font-size:11px',
    'letter-spacing:0.18em',
    'text-transform:uppercase',
    'font-weight:600',
    'box-shadow:0 0 24px -8px rgba(212,199,165,0.55)',
    'backdrop-filter:blur(6px)',
  ].join(';');
  root.appendChild(toast);
  window.setTimeout(() => toast.remove(), 1700);
}
