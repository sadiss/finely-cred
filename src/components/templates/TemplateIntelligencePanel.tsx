import React, { useMemo, useState } from 'react';
import { Brain, Lightbulb, Sparkles, Wand2 } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import { TEMPLATE_BASES } from '../../templates';
import { callAiGateway } from '../../lib/aiClient';
import { isFeatureEnabled } from '../../data/settingsRepo';

type Props = {
  partner: Partner;
  vaultCount: number;
  savedReasonCount: number;
  onOpenReasons: () => void;
  onOpenBases: () => void;
  onUseBase: (baseId: string) => void;
};

export function TemplateIntelligencePanel({ partner, vaultCount, savedReasonCount, onOpenReasons, onOpenBases, onUseBase }: Props) {
  const aiOn = isFeatureEnabled('aiGateway');
  const [busy, setBusy] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const picks = useMemo(() => {
    const stage = partner.journeyStage ?? 'intake';
    const lane = partner.lane ?? 'other';
    const bases = TEMPLATE_BASES.filter((b) => {
      if (stage === 'letters' || stage === 'mailing') return b.category === 'credit_dispute' || b.category === 'furnisher_dispute';
      if (lane.includes('debt')) return b.category === 'debt_collection' || b.category === 'court_filing';
      if (lane.includes('business')) return b.category === 'business_funding' || b.category === 'contracts';
      return b.category === 'credit_dispute' || b.category === 'furnisher_dispute';
    }).slice(0, 4);
    return bases;
  }, [partner.journeyStage, partner.lane]);

  const runAdvisor = async () => {
    if (!aiOn) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await callAiGateway({
        taskType: 'template_advisor',
        providerHint: 'openai',
        context: {
          partnerId: partner.id,
          journeyStage: partner.journeyStage,
          lane: partner.lane,
          vaultCount,
          savedReasonCount,
        },
        messages: [
          {
            role: 'system',
            content:
              'You are Finely Cred Template Library advisor. User is in the portal. Give 3-4 short actionable bullets: which template type to set up, which dispute reasons to save, tone (formal/firm), and when to open Letter Studio. No legal advice. Under 500 chars total.',
          },
          {
            role: 'user',
            content: `Stage: ${partner.journeyStage ?? 'intake'}. Lane: ${partner.lane ?? 'other'}. Vault templates: ${vaultCount}. Saved reasons: ${savedReasonCount}.`,
          },
        ],
      });
      setTip(res.text?.trim() || 'Focus on one bureau-ready intro template and 3 saved reasons before Round 1.');
    } catch (e: any) {
      setErr(e?.message || 'Advisor unavailable.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fc-spotlight-panel space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 text-violet-300">
            <Brain size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Template intelligence</span>
          </div>
          <p className="mt-2 text-sm text-white/60 max-w-2xl leading-relaxed">
            Smart picks from your journey stage ({partner.journeyStage ?? 'intake'}) and lane — configure here, execute in Letter Studio.
          </p>
        </div>
        {aiOn && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void runAdvisor()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/90 text-white font-black uppercase tracking-widest text-[10px] hover:bg-violet-500 disabled:opacity-50 ring-1 ring-violet-400/30"
          >
            <Wand2 size={14} /> {busy ? 'Thinking…' : 'AI advisor'}
          </button>
        )}
      </div>

      {tip ? (
        <div className="rounded-2xl border border-violet-500/20 bg-white/[0.07] p-4 text-sm text-white/80 whitespace-pre-wrap">{tip}</div>
      ) : null}
      {err ? <div className="text-xs text-red-200">{err}</div> : null}

      <div className="grid md:grid-cols-2 gap-3">
        {picks.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onUseBase(b.id)}
            className="text-left fc-light-glass-panel fc-light-chrome-panel hover:border-violet-500/30 p-4 transition-all"
          >
            <div className="flex items-center gap-2 text-violet-200 text-[10px] font-black uppercase tracking-widest">
              <Lightbulb size={12} /> Recommended base
            </div>
            <div className="mt-2 text-white font-semibold text-sm">{b.title}</div>
            <div className="mt-1 text-xs text-white/50 line-clamp-2">{b.description}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onOpenReasons} className="px-3 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-[10px] font-black uppercase text-emerald-200">
          Reasons library
        </button>
        <button type="button" onClick={onOpenBases} className="px-3 py-2 rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/10 text-[10px] font-black uppercase text-fuchsia-200">
          All starter bases
        </button>
        {vaultCount === 0 && (
          <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-500/20 text-[10px] text-rose-200">
            <Sparkles size={12} /> Upload your first vault template for faster letters
          </span>
        )}
      </div>
    </div>
  );
}
