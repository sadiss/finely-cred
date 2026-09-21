import React, { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { callAiGateway, type AiGatewayMessage } from '../../../lib/aiClient';
import { isFeatureEnabled } from '../../../data/settingsRepo';
import { buildAgentSystemPrompt } from '../../../lib/knowledgeBase/agentPersonas';
import { detectKbLang, retrieveKnowledgeSync } from '../../../lib/knowledgeBaseRouter';

export function AcademyCoachChat({ lang }: { lang: 'en' | 'ht' }) {
  const enabled = isFeatureEnabled('aiGateway');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiGatewayMessage[]>([
    {
      role: 'assistant',
      content:
        lang === 'ht'
          ? 'Mwen isit pou ede w ak restore, validasyon, round, ak etap pwodwi. Edikasyon sèlman — pa konsèy legal.'
          : 'Ask about restore sequencing, validation, dispute rounds, or where to click in the portal. Educational only — not legal advice.',
    },
  ]);

  if (!enabled) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput('');
    const replyLang = detectKbLang(text) === 'ht' || lang === 'ht' ? 'ht' : 'en';
    const kb = retrieveKnowledgeSync(text, replyLang);
    const system = buildAgentSystemPrompt('academy_coach', kb, replyLang);
    const next: AiGatewayMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    try {
      const res = await callAiGateway({
        taskType: 'academy_coach',
        messages: [{ role: 'system', content: system }, ...next],
        context: { lane: 'specialist_academy', lang: replyLang },
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.text || '—' }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: lang === 'ht' ? 'Erè koneksyon — li leson an.' : 'Connection error — use the lesson library.' },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-emerald-100 font-semibold"
      >
        <span className="inline-flex items-center gap-2">
          <MessageCircle size={18} /> {lang === 'ht' ? 'Coach Akademi' : 'Academy Coach'}
        </span>
        <span className="text-white/40 text-xs">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="border-t border-white/10 p-4 space-y-3">
          <div className="max-h-48 overflow-y-auto space-y-2 text-sm text-white/75">
            {messages.slice(-4).map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-amber-200' : ''}>{m.content}</div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
              placeholder={lang === 'ht' ? 'Mande…' : 'Ask the coach…'}
              onKeyDown={(e) => e.key === 'Enter' && void send()}
            />
            <button type="button" onClick={() => void send()} disabled={busy} className="p-2 rounded-xl bg-emerald-500 text-black">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
