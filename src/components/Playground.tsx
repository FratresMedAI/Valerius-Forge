import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Send, RotateCcw, Settings } from 'lucide-react';
import { useTier } from '../lib/tier';
import { MastersBadge } from './MastersBadge';
import { MastersGate } from './MastersUpsell';
import { streamForge, loadSettings } from '../lib/llm';
import type { AgentSuggestion } from '../lib/generate';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  suggestion: AgentSuggestion;
  onOpenSettings?: () => void;
}

export function Playground({ suggestion, onOpenSettings }: Props) {
  const [tier] = useTier();
  const [collapsed, setCollapsed] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const settings = loadSettings();
  const isMaster = tier === 'masters';

  useEffect(() => {
    setMessages([]);
  }, [suggestion.systemPrompt]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || streaming || !settings) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setStreaming(true);

    let acc = '';
    setMessages([...next, { role: 'assistant', content: '' }]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      await streamForge({
        config: settings,
        systemPrompt: suggestion.systemPrompt,
        userPrompt: buildConversationPrompt(next),
        onToken: (token) => {
          acc += token;
          setMessages([...next, { role: 'assistant', content: acc }]);
        },
        signal: ctrl.signal,
      });
    } catch (err) {
      if (!ctrl.signal.aborted) {
        const msg = err instanceof Error ? err.message : 'Error';
        setMessages([...next, { role: 'assistant', content: `⚠️ ${msg}` }]);
      }
    } finally {
      setStreaming(false);
    }
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setInput('');
    setStreaming(false);
  };

  if (!isMaster) {
    return (
      <section className="rounded-xl border border-templar-sand/20 bg-white/[0.02] overflow-hidden">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          {collapsed ? <ChevronRight className="h-4 w-4 text-templar-sand/60" /> : <ChevronDown className="h-4 w-4 text-templar-sand/60" />}
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-templar-sand">
            Test in Playground
          </span>
          <MastersBadge size="sm" />
        </button>
        {!collapsed && (
          <div className="px-4 pb-4">
            <MastersGate teaser>
              <div className="space-y-3 p-3">
                <div className="rounded-lg border border-templar-sand/15 bg-black/20 p-3">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-templar-sand/60">User</span>
                  <p className="mt-1 text-sm text-templar-text/50">How can you help me today?</p>
                </div>
                <div className="rounded-lg border border-templar-sand/10 bg-black/10 p-3">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-templar-sand/40">Agent</span>
                  <p className="mt-1 text-sm text-templar-text/30">I'm here to assist you with…</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-lg border border-templar-sand/15 bg-black/20 h-9" />
                  <div className="rounded-lg border border-templar-sand/20 bg-black/20 w-9 h-9" />
                </div>
              </div>
            </MastersGate>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-templar-sand/25 bg-white/[0.02] shadow-[0_0_30px_-12px_rgba(212,199,165,0.2)]">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        {collapsed ? <ChevronRight className="h-4 w-4 text-templar-sand/60" /> : <ChevronDown className="h-4 w-4 text-templar-sand/60" />}
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-templar-sand">
          Test in Playground
        </span>
        <MastersBadge size="sm" />
      </button>

      {!collapsed && (
        <div className="border-t border-templar-sand/15 px-4 pb-4 pt-3">
          {!settings ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-templar-text/60">
                Configure your API key in Settings to enable the Playground.
              </p>
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-2 rounded-lg border border-templar-sand/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-templar-sand transition-colors hover:border-templar-sand hover:bg-templar-sand/10"
              >
                <Settings className="h-3.5 w-3.5" />
                Open Settings
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[0.65rem] text-templar-text/40 italic">
                  Using: {settings.model} · {messages.length} messages
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 rounded border border-templar-sand/20 px-2 py-1 text-[0.62rem] text-templar-text/50 transition-colors hover:border-templar-sand/50 hover:text-templar-sand"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  Reset
                </button>
              </div>

              <div className="mb-3 max-h-80 space-y-2.5 overflow-y-auto scroll-thin rounded-lg border border-templar-sand/15 bg-black/30 p-3">
                {messages.length === 0 && (
                  <p className="text-center text-[0.7rem] italic text-templar-text/30">
                    Send a message to test your forged agent.
                  </p>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={msg.role === 'user' ? 'flex justify-end' : ''}>
                    <div
                      className={
                        'max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ' +
                        (msg.role === 'user'
                          ? 'border border-templar-sand/30 bg-templar-sand/10 text-templar-text/90'
                          : 'border border-templar-sand/15 bg-black/30 text-templar-text/80')
                      }
                    >
                      <span className={
                        'mb-1 block text-[0.58rem] font-semibold uppercase tracking-[0.18em] ' +
                        (msg.role === 'user' ? 'text-templar-sand/60' : 'text-templar-text/40')
                      }>
                        {msg.role === 'user' ? 'You' : 'Agent'}
                      </span>
                      {msg.content || (
                        streaming && i === messages.length - 1
                          ? <span className="inline-block h-3.5 w-[2px] animate-pulse bg-templar-sand/70 align-middle" />
                          : null
                      )}
                      {streaming && i === messages.length - 1 && msg.content && (
                        <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-templar-sand align-middle" />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Send a message to the agent… (Enter to send)"
                  rows={2}
                  disabled={streaming}
                  className="flex-1 resize-none rounded-lg border border-templar-sand/25 bg-black/40 px-3 py-2 text-sm text-templar-text placeholder:text-templar-text/30 focus:border-templar-sand/50 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || streaming}
                  className="self-end rounded-lg border border-templar-sand/40 bg-templar-sand/10 px-3 py-2 text-templar-sand transition-all hover:bg-templar-sand/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function buildConversationPrompt(messages: Message[]): string {
  return messages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
}
