import { useMemo, useState } from 'react';
import { Bot, BrainCircuit, MessageSquare, Send, Sparkles, Target } from 'lucide-react';
import { buildStaffReply, buildTwoHundredLeadPlan, generateCmoCapabilityMatrix } from '../../lib/cmo/cmoFinalMlEngine';
import {
  addCmoMessage,
  getCmoSettings,
  listCmoMessages,
  saveCmoFeatureCapabilities,
  saveCmoLeadGrowthPlan,
  upsertCmoDirective,
} from '../../data/cmoFinalRepo';
import { CmoPageSignal, CmoStaffMessage } from '../../domain/cmoFinal';

interface CMOStaffConsoleProps {
  currentSignal?: CmoPageSignal;
  compact?: boolean;
}

export function CMOStaffConsole({ currentSignal, compact = false }: CMOStaffConsoleProps) {
  const [messages, setMessages] = useState<CmoStaffMessage[]>(() => listCmoMessages());
  const [input, setInput] = useState('');
  const settings = useMemo(() => getCmoSettings(), []);
  const capabilityCount = useMemo(() => generateCmoCapabilityMatrix().length, []);

  const seedPlan = () => {
    const plan = buildTwoHundredLeadPlan(settings);
    saveCmoLeadGrowthPlan(plan);
    const cmo = addCmoMessage({
      role: 'cmo',
      body: `I built the ${plan.dailyLeadTarget}-lead/day operating plan. Channel quotas are now mapped across Shorts, Reels, TikTok, LinkedIn, email, SMS, affiliate, press, webinars, and SEO. The plan is ambitious, not magical — the machine needs tracked CTAs and daily execution.`,
      contextTags: ['lead_plan', '200_daily_leads'],
      actionItems: [],
    });
    setMessages([cmo, ...listCmoMessages()]);
  };

  const installFeatures = () => {
    const features = generateCmoCapabilityMatrix();
    saveCmoFeatureCapabilities(features);
    const cmo = addCmoMessage({
      role: 'cmo',
      body: `Installed ${features.length.toLocaleString()} CMO capability definitions across site intelligence, copy, media, Comms, Lead Intel, affiliates, Shorts, ML, and compliance. Translation: I have more levers than a spaceship, but we still pull them cleanly.`,
      contextTags: ['capabilities', 'cmo_matrix'],
      actionItems: [],
    });
    setMessages([cmo, ...listCmoMessages()]);
  };

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const owner = addCmoMessage({ role: 'owner', body: trimmed, contextTags: ['owner_request'], actionItems: [] });
    const replyDraft = buildStaffReply(trimmed, settings, currentSignal);
    const cmo = addCmoMessage(replyDraft);
    replyDraft.actionItems.forEach(upsertCmoDirective);
    setMessages([cmo, owner, ...messages]);
    setInput('');
  };

  return (
    <section className="fc-panel relative overflow-hidden rounded-3xl border border-amber-300/15 bg-slate-950/90 p-5 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
            <Bot className="h-3.5 w-3.5" /> Staff CMO
          </div>
          <h2 className="text-2xl font-black text-white md:text-3xl">{settings.name}: internal marketing staff room</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Talk to the CMO like staff. It creates directives, calls out weak CTAs, plans daily lead volume, and keeps the Finely Cred machine honest.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <button type="button" onClick={seedPlan} className="fc-button-soft rounded-2xl px-3 py-2 text-left">
            <Target className="mb-1 h-4 w-4" /> 200 leads/day
          </button>
          <button type="button" onClick={installFeatures} className="fc-button-soft rounded-2xl px-3 py-2 text-left">
            <BrainCircuit className="mb-1 h-4 w-4" /> {capabilityCount.toLocaleString()} features
          </button>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300">
            <Sparkles className="mb-1 h-4 w-4 text-amber-200" /> {settings.autonomyMode.replaceAll('_', ' ')}
          </div>
        </div>
      </div>

      <div className={compact ? 'max-h-80 space-y-3 overflow-auto pr-1' : 'max-h-[32rem] space-y-3 overflow-auto pr-1'}>
        {messages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-amber-300/25 bg-amber-300/[0.04] p-5 text-sm leading-6 text-amber-50/85">
            <MessageSquare className="mb-2 h-5 w-5 text-amber-200" />
            Start with: “Audit this page and tell me what blocks conversion,” or “Build the 200-lead daily plan.”
          </div>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={
                message.role === 'owner'
                  ? 'ml-auto max-w-3xl rounded-3xl border border-sky-300/20 bg-sky-300/10 p-4 text-sm leading-6 text-sky-50'
                  : 'max-w-4xl rounded-3xl border border-amber-300/20 bg-white/[0.04] p-4 text-sm leading-6 text-slate-100'
              }
            >
              <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                <span>{message.role === 'owner' ? 'Owner' : settings.name}</span>
                <span>{new Date(message.createdAt).toLocaleString()}</span>
              </div>
              <div className="whitespace-pre-wrap">{message.body}</div>
              {message.actionItems.length > 0 && (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {message.actionItems.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-3">
                      <div className="font-bold text-amber-100">{item.title}</div>
                      <p className="mt-1 text-xs text-slate-300">{item.nextStep}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-3xl border border-white/10 bg-black/25 p-2 sm:flex-row">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Talk to CMO Prime like staff: audit the page, build campaigns, fix CTAs, plan interviews, grow Shorts, route leads..."
          className="min-h-20 flex-1 resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-300/50"
        />
        <button type="button" onClick={send} className="fc-button-brand inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold">
          <Send className="h-4 w-4" /> Send
        </button>
      </div>
    </section>
  );
}
