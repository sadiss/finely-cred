import React, { useCallback, useMemo, useState } from 'react';
import { Bot, Play, Sparkles, Zap } from 'lucide-react';
import { converseWithFinelyAi } from '../../lib/conversationalAi';
import { FinelyOsAIChatPanel, type FinelyOsChatMessage } from '../os/FinelyOsAIChatPanel';
import type { IntelResult } from './leadIntelModel';
import type { ProspectTarget } from '../../domain/crmProspects';
import {
  buildExecutionAwareSystemPrompt,
  delegateLabel,
  planGrowthExecution,
  runAllSafeGrowthSteps,
  type GrowthExecutionStep,
} from '../../lib/growth/growthExecutionEngine';

function msgId() {
  return `li_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const GREETING =
  'I am your Lead Intelligence Director. I already know the full playbook — swarm, geo scans, CRM routing, CMO handoff. Ask anything; I will answer and execute (or delegate) what is safe.';

type Props = {
  target: ProspectTarget;
  query: string;
  results: IntelResult[];
  selectedUrls: string[];
  importedCount: number;
};

export function LeadIntelCopilot({ target, query, results, selectedUrls, importedCount }: Props) {
  const [busy, setBusy] = useState(false);
  const [execBusy, setExecBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [steps, setSteps] = useState<GrowthExecutionStep[]>([]);
  const [messages, setMessages] = useState<FinelyOsChatMessage[]>([
    { role: 'assistant', content: GREETING, createdAt: new Date().toISOString() },
  ]);

  const contextBlock = useMemo(() => {
    const top = results.slice(0, 12).map((r) => ({
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
        executionReady: ['start_deep_swarm', 'geo_scan', 'stage_playbook', 'import_hot_leads'],
      },
      null,
      2,
    );
  }, [target, query, results, selectedUrls.length, importedCount]);

  const send = useCallback(
    async (text: string, autoExecute = false) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setErr(null);
      setBusy(true);
      setDraft('');
      const userMsg: FinelyOsChatMessage = { role: 'user', content: trimmed, createdAt: new Date().toISOString() };
      const history = [...messages, userMsg];
      setMessages(history);

      const planned = planGrowthExecution(trimmed, 'lead_intel');
      setSteps(planned);

      try {
        const result = await converseWithFinelyAi({
          messages: history.map(({ role, content }) => ({ role, content })),
          userMessage: trimmed,
          systemPromptBase: `${buildExecutionAwareSystemPrompt('lead_intel')}\n\nSession:\n${contextBlock}`,
          taskType: 'lead_intel',
          context: {
            surface: 'lead_intel',
            goal: `Lead intel • target: ${target} • query: ${query.trim() || '(none)'}`,
          },
        });

        let reply = result.text;
        if (autoExecute) {
          setExecBusy(true);
          const ran = await runAllSafeGrowthSteps(trimmed, 'lead_intel');
          setSteps(ran.steps);
          reply += `\n\n**Executed now:**\n${ran.summary}`;
          setExecBusy(false);
        } else {
          reply += `\n\n**Ready to execute:** ${planned.map((s) => `${delegateLabel(s.delegate)} → ${s.label}`).join(' · ')}. Hit "Run plan" to delegate.`;
        }

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: reply, createdAt: new Date().toISOString() },
        ]);
      } catch (e: unknown) {
        setErr((e as Error)?.message || 'Lead copilot unavailable.');
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, contextBlock, target, query],
  );

  const runPlan = async () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? query;
    setExecBusy(true);
    try {
      const ran = await runAllSafeGrowthSteps(lastUser, 'lead_intel');
      setSteps(ran.steps);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Delegation complete (${ran.done} steps):\n${ran.summary}`, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setExecBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {steps.length > 0 ? (
        <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-fuchsia-200 inline-flex items-center gap-2">
              <Bot size={14} /> Execution plan
            </div>
            <button type="button" disabled={execBusy} onClick={() => void runPlan()} className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black disabled:opacity-50">
              <Play size={12} /> {execBusy ? 'Running…' : 'Run plan'}
            </button>
          </div>
          <div className="space-y-2">
            {steps.map((s) => (
              <div key={s.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/75">
                <span className="text-fuchsia-200 font-bold">{delegateLabel(s.delegate)}</span> — {s.label}
                <span className="ml-2 text-[10px] uppercase tracking-widest text-white/40">{s.status}</span>
                {s.result ? <div className="mt-1 text-white/55">{s.result}</div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <button type="button" disabled={busy || execBusy} onClick={() => void send(draft || 'Execute deep swarm and stage growth playbook now', true)} className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-fuchsia-100 disabled:opacity-50">
          <Zap size={14} /> Ask + auto-run safe steps
        </button>
      </div>

      <FinelyOsAIChatPanel
        icon={Sparkles}
        title="Lead Intelligence Director"
        subtitle="Answers + executes: deep swarm, geo scans, CMO playbooks, CRM routing."
        messages={messages}
        draft={draft}
        onDraftChange={setDraft}
        onSend={() => void send(draft, false)}
        busy={busy || execBusy}
        error={err}
        placeholder="What should we find, import, and launch?"
        emptyMessage="Ask anything — I know the full playbook and can delegate to the swarm."
        quickPrompts={[
          { label: 'Deep swarm now', prompt: 'Start deep multi-hour lead intel swarm across all cities and execute geo scans.' },
          { label: 'Import strategy', prompt: 'Which prospects should I import first and route into CRM sequences?' },
          { label: 'Outreach + CMO', prompt: 'Draft outreach and stage a CMO playbook for this target lane — then execute what is safe.' },
          { label: 'Run everything', prompt: 'Execute full discovery: swarm, geo, playbook, comms queue — approval-first.' },
        ]}
        onQuickPrompt={(p) => void send(p, p.includes('Execute') || p.includes('Start deep'))}
        footerHint={`${results.length} results · ${selectedUrls.length} selected · Swarm-ready`}
      />
    </div>
  );
}
