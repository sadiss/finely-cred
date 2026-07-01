import { useMemo, useState } from 'react';
import { BarChart3, BrainCircuit, Flame, Target, Wand2 } from 'lucide-react';
import {
  addCmoGrowthEvent,
  getCmoMlModelState,
  getCmoSettings,
  listCmoGrowthEvents,
  saveCmoMlModelState,
} from '../../data/cmoFinalRepo';
import {
  buildTwoHundredLeadPlan,
  classifyGrowthIntent,
  recommendNextChannels,
  scoreConversionCopy150,
  trainLightweightCmoModel,
} from '../../lib/cmo/cmoFinalMlEngine';

export function CMOMLCommandPanel() {
  const [copy, setCopy] = useState('Book a consultation today and get a custom business credit funding readiness roadmap.');
  const [comment, setComment] = useState('How much does it cost and can you help me get funding?');
  const [model, setModel] = useState(() => getCmoMlModelState());
  const settings = useMemo(() => getCmoSettings(), []);
  const score = useMemo(() => scoreConversionCopy150(copy), [copy]);
  const intent = useMemo(() => classifyGrowthIntent(comment), [comment]);
  const channels = useMemo(() => recommendNextChannels(model), [model]);
  const plan = useMemo(() => buildTwoHundredLeadPlan(settings), [settings]);

  const train = () => {
    const trained = trainLightweightCmoModel(listCmoGrowthEvents(), model);
    saveCmoMlModelState(trained);
    setModel(trained);
  };

  const seedEvents = () => {
    addCmoGrowthEvent({ type: 'lead_created', channel: 'shorts', value: 1, metadata: { source: 'demo' } });
    addCmoGrowthEvent({ type: 'lead_created', channel: 'affiliate', value: 1, metadata: { source: 'demo' } });
    addCmoGrowthEvent({ type: 'call_booked', channel: 'shorts', value: 1, metadata: { source: 'demo' } });
    addCmoGrowthEvent({ type: 'asset_scored', channel: 'email', value: 122, metadata: { source: 'demo' } });
    train();
  };

  return (
    <section className="fc-panel rounded-3xl border border-amber-300/15 bg-slate-950/85 p-5 shadow-xl shadow-black/25">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-purple-100">
            <BrainCircuit className="h-3.5 w-3.5" /> ML Command
          </div>
          <h3 className="text-xl font-black text-white">Growth learning engine</h3>
          <p className="mt-1 text-sm text-slate-300">Scores copy, classifies replies, learns channel winners, and keeps the 200-lead target grounded.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={seedEvents} className="fc-button-soft inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold">
            <Flame className="h-4 w-4" /> Seed demo events
          </button>
          <button type="button" onClick={train} className="fc-button-brand inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold">
            <Wand2 className="h-4 w-4" /> Retrain local model
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2 font-bold text-white"><BarChart3 className="h-4 w-4 text-amber-200" /> Copy score</div>
          <textarea value={copy} onChange={(event) => setCopy(event.target.value)} className="min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none focus:border-amber-300/50" />
          <div className="mt-3 text-4xl font-black text-white">{score.score}<span className="text-base text-slate-500">/150</span></div>
          <p className="mt-2 text-sm text-slate-300">{score.recommendedRewriteAngle}</p>
          <div className="mt-3 space-y-1 text-xs text-slate-400">{score.issues.slice(0, 3).map((issue) => <div key={issue}>• {issue}</div>)}</div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2 font-bold text-white"><Target className="h-4 w-4 text-emerald-200" /> Reply intent</div>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} className="min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none focus:border-emerald-300/50" />
          <div className="mt-3 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">
            {intent.intent.replaceAll('_', ' ')} · {Math.round(intent.confidence * 100)}%
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{intent.recommendedReply}</p>
          <p className="mt-2 text-xs text-slate-500">{intent.recommendedCrmAction}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2 font-bold text-white"><Flame className="h-4 w-4 text-orange-200" /> Channel winners</div>
          <div className="space-y-2">
            {channels.map((channel) => (
              <div key={channel.channel} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">{channel.channel.replaceAll('_', ' ')}</span>
                  <span className="text-sm font-black text-amber-100">{channel.score}%</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{channel.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-amber-300/15 bg-amber-300/[0.04] p-4">
        <div className="font-bold text-amber-100">Daily lead math</div>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          {plan.channelPlan.slice(0, 10).map((item) => (
            <div key={item.channel} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.channel.replaceAll('_', ' ')}</div>
              <div className="mt-1 text-2xl font-black text-white">{item.dailyLeadTarget}</div>
              <div className="text-xs text-slate-400">leads/day · {item.contentQuota} assets</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
