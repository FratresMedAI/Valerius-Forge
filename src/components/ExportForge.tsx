import { useState } from 'react';
import { X, Download, Copy, Check } from 'lucide-react';
import { useTier } from '../lib/tier';
import { MastersBadge } from './MastersBadge';
import { MastersGate } from './MastersUpsell';
import { exportAsJSON, exportAsLangChain, exportAsCrewAI, exportAsAgno } from '../lib/exporters';
import type { AgentSuggestion } from '../lib/generate';

type ExportFormat = 'json' | 'langchain' | 'crewai' | 'agno';

interface ExportModalProps {
  format: ExportFormat;
  content: string;
  onClose: () => void;
}

function ExportModal({ format, content, onClose }: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const ext = format === 'json' ? '.json' : '.py';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valerius-forge${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const FORMAT_LABEL: Record<ExportFormat, string> = {
    json: 'JSON',
    langchain: 'LangChain',
    crewai: 'CrewAI',
    agno: 'Agno',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-templar-sand/30 bg-templar-bg shadow-[0_0_60px_-15px_rgba(212,199,165,0.5)]" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between border-b border-templar-sand/15 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-templar-sand">
            Export · {FORMAT_LABEL[format]}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-templar-sand/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-templar-sand transition-colors hover:border-templar-sand hover:bg-templar-sand/10"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-templar-sand/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-templar-sand transition-colors hover:border-templar-sand hover:bg-templar-sand/10"
            >
              <Download className="h-3.5 w-3.5" />
              Download {format === 'json' ? '.json' : '.py'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-templar-text/60 transition-colors hover:text-templar-sand"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="scroll-thin font-mono text-xs leading-relaxed text-templar-text/85 whitespace-pre-wrap">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
}

interface Props {
  suggestion: AgentSuggestion;
}

export function ExportForge({ suggestion }: Props) {
  const [tier] = useTier();
  const [active, setActive] = useState<ExportFormat | null>(null);
  const isMaster = tier === 'masters';

  const generate = (fmt: ExportFormat): string => {
    switch (fmt) {
      case 'json': return exportAsJSON(suggestion);
      case 'langchain': return exportAsLangChain(suggestion);
      case 'crewai': return exportAsCrewAI(suggestion);
      case 'agno': return exportAsAgno(suggestion);
    }
  };

  const buttons = (
    <div className="flex flex-wrap gap-2">
      {(['json', 'langchain', 'crewai', 'agno'] as ExportFormat[]).map((fmt) => (
        <button
          key={fmt}
          type="button"
          onClick={() => isMaster && setActive(fmt)}
          disabled={!isMaster}
          className="rounded-lg border border-templar-sand/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-templar-sand transition-all hover:border-templar-sand hover:bg-templar-sand/10 disabled:cursor-not-allowed"
        >
          {fmt === 'json' ? 'JSON' : fmt === 'langchain' ? 'LangChain' : fmt === 'crewai' ? 'CrewAI' : 'Agno'}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <section className="rounded-xl border border-templar-sand/20 bg-white/[0.02] p-4">
        <header className="mb-3 flex items-center gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-templar-sand">
            Export Forge
          </h3>
          <MastersBadge size="sm" />
        </header>

        {isMaster ? (
          buttons
        ) : (
          <MastersGate teaser>
            <div className="space-y-2">
              <p className="text-[0.7rem] text-templar-text/50 italic">
                Export to your favorite framework — Ascend to Master.
              </p>
              {buttons}
            </div>
          </MastersGate>
        )}
      </section>

      {active && (
        <ExportModal
          format={active}
          content={generate(active)}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
