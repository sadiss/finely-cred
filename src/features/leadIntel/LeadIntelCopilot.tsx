import React, { useCallback, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { converseWithFinelyAi } from '../../lib/conversationalAi';
import { FinelyOsAIChatPanel, type FinelyOsChatMessage } from '../os/FinelyOsAIChatPanel';
import type { IntelResult } from './leadIntelModel';
import type { ProspectTarget } from '../../domain/crmProspects';

function msgId() {
  return `li_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const GREETING =
  'I am your Lead Intelligence copilot. Ask for prioritization, outreach angles, qualification rubrics, or routing suggestions based on your current search session.';

type Props = {
  target: ProspectTarget;
  query: string;
  results: IntelResult[];
  selectedUrls: string[];
  importedCount: number;
};

export function LeadIntelCopilot({ target, query, results, selectedUrls, importedCount }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<FinelyOsChatMessage[]>([
    { role: 'assistant', content: GREETING, createdAt: new Date().toISOString() },
  ]);

  const contextBlock = useMemo(() => {
    const top = results.slice(0, 8).map((r) => ({
      title: r.title,
      domain: r.domain,
      score: r.score,
      emails: r.emails?.length ?? 0,
      phones: r.phones?.length ?? 0,
      robotsOk: r.robotsOk,
    }));
    return JSON.stringify(
      {
        target,
        query: query.trim(),
        resultCount: results.length,
        selectedCount: selectedUrls.length,
        importedCount,
        topResults: top,
      },
      null,
      2,
    );
  }, [target, query, results, selectedUrls.length, importedCount]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setErr(null);
      setBusy(true);
      setDraft('');
      const userMsg: FinelyOsChatMessage = { role: 'user', content: trimmed, createdAt: new Date().toISOString() };
      const history = [...messages, userMsg];
      setMessages(history);
      try {
        const result = await converseWithFinelyAi({
          messages: history.map(({ role, content }) => ({ role, content })),
          userMessage: trimmed,
          systemPromptBase: `You are Finely Cred Lead Intelligence copilot for admin prospecting. Be concise and actionable. Current session context:\n${contextBlock}`,
          taskType: 'admin_ops',
          context: {
            surface: 'lead_intel',
            goal: `Lead intel • target: ${target} • query: ${query.trim() || '(none)'}`,
          },
          providerHint: 'openai',
        });
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: result.text, createdAt: new Date().toISOString() },
        ]);
      } catch (e: unknown) {
        setErr((e as Error)?.message || 'Lead copilot unavailable.');
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, contextBlock, target, query],
  );

  return (
    <FinelyOsAIChatPanel
      icon={Sparkles}
      title="Lead Intelligence copilot"
      subtitle="Prioritization, outreach angles, and CRM routing — grounded in your live search session."
      messages={messages}
      draft={draft}
      onDraftChange={setDraft}
      onSend={() => void send(draft)}
      busy={busy}
      error={err}
      placeholder="Which prospects should I import first?"
      emptyMessage="Ask for scoring tips, outreach copy, or how to route imported prospects into CRM sequences."
      quickPrompts={[
        { label: 'Prioritize imports', prompt: 'Which of my current results should I import first and why?' },
        { label: 'Outreach email', prompt: 'Draft a short compliant outreach email for the top-scored prospect in this session.' },
        { label: 'Qualification rubric', prompt: 'Give me a 5-point rubric to qualify these prospects for our target lane.' },
        { label: 'CRM routing', prompt: 'After import, which CRM pipeline and next action should I use for this target?' },
      ]}
      onQuickPrompt={(p) => void send(p)}
      footerHint={`Session: ${results.length} results • ${selectedUrls.length} selected • ${importedCount} in CRM library`}
    />
  );
}
