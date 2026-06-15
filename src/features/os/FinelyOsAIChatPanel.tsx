import type { LucideIcon } from 'lucide-react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { FinelyOsIconBadge } from './FinelyOsIconBadge';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsGlassShell,
  finelyOsInlineListItem,
  finelyOsMessageBubble,
} from './finelyOsLightUi';

export type FinelyOsChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

type QuickPrompt = {
  label: string;
  prompt: string;
};

type Props = {
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  messages: FinelyOsChatMessage[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  busy?: boolean;
  error?: string | null;
  placeholder?: string;
  emptyMessage?: string;
  quickPrompts?: QuickPrompt[];
  onQuickPrompt?: (prompt: string) => void;
  footerHint?: string;
};

export function FinelyOsAIChatPanel({
  icon: Icon = Bot,
  title = 'AI Assistant',
  subtitle = 'Grounded in your live workspace data',
  messages,
  draft,
  onDraftChange,
  onSend,
  busy = false,
  error,
  placeholder = 'Ask anything…',
  emptyMessage = 'Start a conversation or pick a quick prompt below.',
  quickPrompts = [],
  onQuickPrompt,
  footerHint,
}: Props) {
  const submit = () => {
    if (busy || !draft.trim()) return;
    onSend();
  };

  return (
    <section className={`flex flex-col min-h-[520px] ${finelyOsGlassShell('panel', 'fuchsia')}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-fuchsia-500/20 pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <FinelyOsIconBadge icon={Icon} accent="fuchsia" size={18} className="p-2.5 shrink-0" />
          <div className="min-w-0">
            <h2 className={FINELY_OS_ENTITY_TITLE}>{title}</h2>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-fuchsia-200">
          <Sparkles size={12} /> AI powered
        </div>
      </div>

      {quickPrompts.length ? (
        <div className="flex flex-wrap gap-2 py-4 border-b border-white/[0.08]">
          {quickPrompts.map((q) => (
            <button
              key={q.label}
              type="button"
              disabled={busy}
              onClick={() => onQuickPrompt?.(q.prompt)}
              className={`${FINELY_OS_SECONDARY_BTN} !py-2 !text-[10px]`}
            >
              {q.label}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <div className={`mt-4 ${FINELY_OS_NOTICE_ERROR}`}>{error}</div> : null}

      <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[280px] max-h-[52vh]">
        {!messages.length ? (
          <div className={`rounded-2xl border border-dashed border-fuchsia-500/25 bg-fuchsia-500/[0.06] p-8 text-center`}>
            <FinelyOsIconBadge icon={Icon} accent="fuchsia" size={20} className="p-3 mx-auto mb-3" />
            <p className={FINELY_OS_ENTITY_BODY}>{emptyMessage}</p>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div key={`${m.createdAt}-${idx}`} className={finelyOsMessageBubble(m.role)}>
              <div className="flex items-center gap-2">
                {m.role === 'assistant' ? (
                  <FinelyOsIconBadge icon={Icon} accent="emerald" size={12} className="p-1.5" />
                ) : (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-[10px] font-black text-emerald-200">
                    You
                  </span>
                )}
                <span className={FINELY_OS_ENTITY_SUBLABEL}>
                  {m.role === 'assistant' ? title : 'You'} • {new Date(m.createdAt).toLocaleString()}
                </span>
              </div>
              <div className={`mt-3 ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{m.content}</div>
            </div>
          ))
        )}
      </div>

      <div className={`mt-auto pt-4 border-t border-white/[0.08] space-y-3`}>
        <div className="flex gap-2 items-end">
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className={`flex-1 min-h-[52px] resize-y ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} placeholder:text-white/35`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button type="button" disabled={busy || !draft.trim()} onClick={submit} className={`${FINELY_OS_SUCCESS_BTN} self-end`}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
          </button>
        </div>
        {footerHint ? (
          <p className={`text-[11px] ${FINELY_OS_ENTITY_SUBLABEL}`}>{footerHint}</p>
        ) : (
          <p className={`text-[11px] ${FINELY_OS_ENTITY_SUBLABEL}`}>Enter to send • Shift+Enter for new line</p>
        )}
      </div>
    </section>
  );
}
