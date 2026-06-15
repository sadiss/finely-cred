import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight, Shield, Zap, BarChart3, CreditCard as CardIcon,
  CheckCircle2, Wifi, Globe, TrendingUp, Gavel, Building2,
  Monitor, Cpu, Trophy, Activity, Fingerprint,
  Home, Users, Database, Check, Verified, ShieldCheck,
  Library, Sparkles, Navigation, Clock, Calendar, UserPlus,
  ArrowRight, UserCheck, Briefcase, Lock, Mail, User, X,
  Search, ArrowLeft, Target, Layers, HardHat, Eye, Command,
  AlertCircle, ChevronUp, MessageSquare, Flame, TrendingDown,
  DollarSign, PieChart, ShieldAlert, FastForward,
  FileText, Scale, Crosshair, AlertTriangle, ShoppingBag, Filter,
  Server, Key, ScanLine, Download, ExternalLink, ScrollText,
  Calculator, Percent
} from 'lucide-react';
import { TRADELINE_INVENTORY } from './FinelyComponents';
import { Button } from './ui';
import { CreditMonitoringPartnerGrid } from './resources/CreditMonitoringPartnerGrid';
import { FinelyNowDoThisStrip } from './tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from './tours/FinelyNoticedStrip';
import { buildOnboardingMonitoringNoticedItems } from '../lib/finelyProactiveSignals';
import { ONBOARDING_MONITORING_NOW_DO_ITEMS } from '../config/onboardingMonitoringHelp';

// ==========================================
// 5. PORTAL STEP COMPONENTS (legacy mirror — keep plain-language in sync with portal/index.tsx)
// ==========================================

export function SovereignIdentity({ next, data, update }) {
  return (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 01 // Your name</p>
      <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
        Who are we building <br /> <span className="text-amber-500">results</span> for?
      </h2>
      <p className="text-white/55 text-lg font-light">This takes about a minute. We use your answers to recommend the safest next step.</p>
    </div>
    <div className="relative max-w-xl group">
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-transparent blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
      <input
        type="text"
        value={data.name || ''}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="Full legal name"
        className="relative w-full bg-transparent border-b-2 border-white/[0.08] py-6 text-2xl md:text-4xl font-light text-white placeholder:text-white/45 focus:outline-none focus:border-amber-500 transition-all duration-700"
      />
      <div className="absolute right-0 bottom-6 opacity-20 group-hover:opacity-100 transition-opacity">
        <Fingerprint size={48} strokeWidth={1} className="text-amber-500" />
      </div>
    </div>
    <Button onClick={next} className="px-12 py-5" disabled={!data.name}>Continue</Button>
  </div>
);
}

export function ArchitecturalIntent({ next, data, update }) {
  const goals = [
    { id: 'funding', title: 'Funding readiness', desc: 'Raise your score and prepare for loans or credit lines.', icon: Trophy },
    { id: 'debt', title: 'Debt & collections', desc: 'Challenge debts and collections with documented letters.', icon: Gavel },
    { id: 'business', title: 'Business credit', desc: 'Build business credit separate from your personal file.', icon: Building2 },
    { id: 'legacy', title: 'Long-term building', desc: 'Steady credit improvement and profile protection.', icon: ShieldCheck }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000 text-left">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 02 // Your goal</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          What do you want to <span className="text-amber-500">work on?</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {goals.map((g) => {
          const GoalIcon = g.icon;
          return (
            <div
              key={g.id}
              onClick={() => { update({ goal: g.id }); next(); }}
              className={`group cursor-pointer p-10 fc-light-glass-panel fc-light-chrome-panel ring-1 ring-inset ring-white/5 transition-all duration-500 hover:brightness-[1.03] hover:shadow-lg hover:shadow-[0_20px_40px_-10px_rgba(245,158,11,0.15)] text-left ${data.goal === g.id ? 'border-amber-500/50 bg-amber-500/10' : 'hover:border-white/20'}`}
            >
              <GoalIcon className={`mb-6 transition-all duration-500 ${data.goal === g.id ? 'text-amber-500 scale-110' : 'text-white/40 group-hover:text-white group-hover:scale-110'}`} size={36} strokeWidth={1} />
              <h4 className="text-2xl font-light mb-2">{g.title}</h4>
              <p className="text-sm text-white/55 leading-relaxed group-hover:text-white/70 transition-colors">{g.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BureauSync({ next }) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
      setTimeout(next, 1000);
    }, 2500);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 03 // Credit monitoring</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Connect your <span className="text-amber-500">credit monitoring</span>
        </h2>
        <p className="text-white/55 text-lg font-light max-w-2xl">Pick a monitoring site below — same links as our Resources page. Upload an HTML report when you are ready.</p>
        <button
          type="button"
          onClick={() => window.open('/resources#monitoring', '_blank', 'noopener,noreferrer')}
          className="text-sm text-amber-400/90 underline underline-offset-4 hover:text-amber-300"
        >
          View all monitoring partners on Resources
        </button>
      </div>

      <FinelyNoticedStrip items={buildOnboardingMonitoringNoticedItems({ synced })} />

      <FinelyNowDoThisStrip
        title="Pick monitoring"
        items={ONBOARDING_MONITORING_NOW_DO_ITEMS}
        currentIndex={synced ? 2 : 0}
      />
     
      <CreditMonitoringPartnerGrid
        variant="onboarding"
        synced={synced}
        syncing={syncing}
        onPartnerOpened={!synced ? handleSync : undefined}
      />
    </div>
  );
}

export function FoundationalFractures({ next, data, update }) {
  const issues = [
    { id: 'late', label: 'Late Payments', icon: Clock },
    { id: 'charge', label: 'Charge-Offs', icon: ShieldAlert },
    { id: 'bk', label: 'Bankruptcies', icon: Gavel },
    { id: 'repo', label: 'Repossessions', icon: Briefcase },
    { id: 'coll', label: 'Collections', icon: Flame },
    { id: 'inq', label: 'Excessive Inquiries', icon: Activity }
  ];

  const toggle = (id) => {
    const list = data.fractures || [];
    const newList = list.includes(id) ? list.filter(i => i !== id) : [...list, id];
    update({ fractures: newList });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000 text-left">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 04 // Credit issues</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          What holds your <span className="text-amber-500">score back?</span>
        </h2>
        <p className="text-white/55 text-lg font-light">Tap everything on your reports today.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl text-left">
        {issues.map((i) => {
          const FractureIcon = i.icon;
          const isActive = (data.fractures || []).includes(i.id);
          return (
            <div
              key={i.id}
              onClick={() => toggle(i.id)}
              className={`group cursor-pointer p-8 fc-light-glass-panel fc-light-chrome-panel rounded-xl ring-1 ring-inset ring-white/5 transition-all duration-500 text-left flex flex-col items-center justify-center gap-4 hover:brightness-[1.02] hover:shadow-md hover:shadow-lg ${isActive ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'hover:brightness-[1.02]'}`}
            >
              <FractureIcon className={isActive ? 'text-amber-500' : 'text-white/20 group-hover:text-white'} size={32} strokeWidth={1.5} />
              <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>{i.label}</span>
            </div>
          );
        })}
      </div>
      <Button onClick={next} className="px-12 py-5" disabled={!(data.fractures?.length > 0)}>Continue</Button>
    </div>
  );
}

export function LiabilityVolume({ next, data, update }) {
  return (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 05 // Amount owed</p>
      <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
        About how much is on your <span className="text-amber-500">reports?</span>
      </h2>
      <p className="text-white/55 text-lg font-light">A rough total helps us pick the right dispute pace.</p>
    </div>
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
      {[
        { id: 'low', label: 'Under $10,000', rate: 'Standard plan' },
        { id: 'mid', label: '$10k - $50k', rate: 'Full review' },
        { id: 'high', label: '$50k - $1M+', rate: 'Complex case' }
      ].map(opt => (
        <div
          key={opt.id}
          onClick={() => { update({ liabilityTier: opt.id }); next(); }}
          className={`p-10 fc-light-glass-panel fc-light-chrome-panel ring-1 ring-inset ring-white/5 transition-all duration-500 cursor-pointer text-left hover:brightness-[1.03] hover:shadow-lg hover:shadow-2xl ${data.liabilityTier === opt.id ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'hover:brightness-[1.02]'}`}
        >
          <p className="text-3xl font-light text-white mb-4">{opt.label}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500/60">{opt.rate}</p>
        </div>
      ))}
    </div>
  </div>
);
}

export function LandscapeAudit({ next, data, update }) {
  return (
  <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000 text-left">
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 06 // Credit score</p>
      <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
        What&apos;s your score <span className="text-amber-500">today?</span>
      </h2>
      <p className="text-white/55 text-lg font-light max-w-xl text-left">Slide to your best guess — you can update this later.</p>
    </div>
   
    <div className="py-24 max-w-2xl relative text-left">
      <div className="h-2 w-full bg-black/50 rounded-full relative border-b border-white/[0.08] shadow-inner">
        <div className="h-full bg-gradient-to-r from-amber-700 to-amber-500 rounded-full relative" style={{ width: `${((data.score || 300) - 300) / 5.5}%` }}>
           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(245,158,11,1)]" />
        </div>
        <input
          type="range" min="300" max="850" step="10"
          value={data.score || 550}
          onChange={(e) => update({ score: parseInt(e.target.value) })}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-[-60px] -translate-x-1/2 w-20 h-14 fc-light-tooltip-shell fc-light-chrome-panel border border-white/[0.08] rounded-xl flex items-center justify-center shadow-xl pointer-events-none transition-all duration-100 ease-out"
          style={{ left: `${((data.score || 550) - 300) / 5.5}%` }}
        >
          <span className="text-xl font-bold text-white">{data.score || 550}</span>
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 fc-light-tooltip-shell fc-light-chrome-panel border-b border-r border-white/[0.08] rotate-45" />
        </div>
      </div>
      <div className="flex justify-between mt-6 text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
          <span>Low (300)</span>
          <span>High (850)</span>
      </div>
    </div>
   
    <Button onClick={next} className="px-12 py-5">Continue</Button>
  </div>
);
}

export function FinancialVelocity({ next, data, update }) {
  return (
  <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000 text-left">
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 07 // Funding goal</p>
      <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
        How much do you <span className="text-amber-500">need?</span>
      </h2>
      <p className="text-white/55 text-lg font-light max-w-xl text-left">Pick a target loan or credit line amount.</p>
    </div>
   
    <div className="py-24 max-w-2xl relative text-left">
      <div className="h-2 w-full bg-black/50 rounded-full relative border-b border-white/[0.08] shadow-inner">
        <div className="h-full bg-gradient-to-r from-emerald-900 to-emerald-500 rounded-full relative" style={{ width: `${(data.target || 50000) / 10000}%` }}>
           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(16,185,129,1)]" />
        </div>
        <input
          type="range" min="10000" max="1000000" step="10000"
          value={data.target || 50000}
          onChange={(e) => update({ target: parseInt(e.target.value) })}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-[-60px] -translate-x-1/2 px-5 py-3 fc-light-tooltip-shell fc-light-chrome-panel border border-white/[0.08] rounded-xl flex items-center justify-center shadow-xl pointer-events-none transition-all duration-100 ease-out"
          style={{ left: `${(data.target || 50000) / 10000}%` }}
        >
          <span className="text-lg font-bold text-white">${(data.target || 50000).toLocaleString()}</span>
           <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 fc-light-tooltip-shell fc-light-chrome-panel border-b border-r border-white/[0.08] rotate-45" />
        </div>
      </div>
    </div>
   
    <Button onClick={next} className="px-12 py-5">Continue</Button>
  </div>
);
}

export function StrategicUrgency({ next, data, update }) {
  return (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 08 // Timeline</p>
      <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
        When do you need <span className="text-amber-500">results?</span>
      </h2>
      <p className="text-white/55 text-lg font-light">This helps us prioritize your dispute schedule.</p>
    </div>
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl text-left">
      {[
        { id: 'rapid', label: 'ASAP', desc: 'I need funding soon.', icon: FastForward },
        { id: 'planned', label: '30-60 Days', desc: 'I have a planned purchase or refinance.', icon: Target },
        { id: 'build', label: 'Long Term', desc: 'I am building credit over time.', icon: Building2 }
      ].map(opt => {
        const UrgencyIcon = opt.icon;
        return (
          <div
            key={opt.id}
            onClick={() => { update({ urgency: opt.id }); next(); }}
            className={`p-10 fc-light-glass-panel fc-light-chrome-panel ring-1 ring-inset ring-white/5 transition-all duration-500 cursor-pointer text-left hover:brightness-[1.03] hover:shadow-lg hover:shadow-2xl ${data.urgency === opt.id ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'hover:brightness-[1.02]'}`}
          >
            <UrgencyIcon className={`mb-6 transition-colors ${data.urgency === opt.id ? 'text-amber-500' : 'text-white/40'}`} size={36} />
            <p className="text-2xl font-light text-white mb-2">{opt.label}</p>
            <p className="text-[10px] text-white/55 font-bold uppercase tracking-widest">{opt.desc}</p>
          </div>
        );
      })}
    </div>
  </div>
);
}

export function StatutoryScan({ next }) {
  const [progress, setProgress] = useState(0);
  const logs = [
    'Reading your answers…',
    'Checking dispute options…',
    'Matching a recommended package…',
    'Building your next-step plan…',
    'Almost done…',
  ];
  const [logIdx, setLogIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(next, 1000);
          return 100;
        }
        return p + 1;
      });
    }, 40);

    const logTimer = setInterval(() => {
      setLogIdx(i => (i + 1) % logs.length);
    }, 800);

    return () => { clearInterval(timer); clearInterval(logTimer); };
  }, [next, logs.length]);

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-12 animate-in fade-in duration-1000 text-center">
      <div className="relative w-64 h-64 md:w-96 md:h-96 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-white/5 animate-ping"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
          <Cpu className="text-amber-500 animate-pulse" size={64} strokeWidth={1} />
          <p className="text-3xl font-light tabular-nums text-white">{progress}%</p>
        </div>
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%" cy="50%" r="48%"
            fill="none" stroke="currentColor" strokeWidth="2"
            className="text-amber-500 transition-all duration-300"
            style={{ strokeDashoffset: `${100 - progress}%`, strokeDasharray: '301.59' }}
          />
        </svg>
      </div>
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-light text-white tracking-wide text-center">Building your plan</h2>
        <p className="text-amber-500/70 font-mono text-xs tracking-[0.2em] uppercase h-4 text-center">{logs[logIdx]}</p>
      </div>
    </div>
  );
}

export function WealthHorizon({ next }) {
  return (
  <div className="space-y-12 animate-in fade-in slide-in-from-top-8 duration-1000 text-left">
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Your plan is ready</p>
      <h2 className="text-4xl md:text-7xl font-extralight tracking-tight text-white leading-tight">
        Here&apos;s what we <span className="text-amber-500">recommend.</span>
      </h2>
    </div>
    <div className="grid md:grid-cols-3 gap-8 text-left">
      {[
        { label: 'Funding potential', val: '$150k+', sub: 'After restoration' },
        { label: 'Typical timeline', val: '45-90', sub: 'Days to first results' },
        { label: 'Readiness', val: 'High', sub: 'With monitoring + letters' }
      ].map((p, i) => (
        <div key={i} className="p-8 fc-light-glass-panel fc-light-chrome-panel ring-1 ring-inset ring-white/5 fc-light-glass-panel fc-light-chrome-panel space-y-2 hover:brightness-[1.02] hover:shadow-md transition-transform duration-500">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-left">{p.label}</p>
          <p className="text-4xl text-white font-light text-left">{p.val}</p>
          <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest text-left">{p.sub}</p>
        </div>
      ))}
    </div>
    <div className="space-y-6 pt-12 border-t border-white/[0.08] text-left">
      <p className="text-white/55 max-w-xl text-left">Create your login to save this plan, upload reports, and start dispute letters in your secure portal.</p>
      <Button onClick={next} className="px-12 py-5 bg-white text-black hover:bg-amber-500">Create my account</Button>
    </div>
  </div>
);
}

export function FundingCapacityScan({ next }) {
  const [scanning, setScanning] = useState(true);
  useEffect(() => { setTimeout(() => setScanning(false), 3000) }, []);
 
  return (
    <div className="space-y-12 animate-in fade-in zoom-in duration-1000 flex flex-col items-center justify-center text-center h-full">
       {scanning ? (
         <div className="text-center space-y-8">
            <div className="relative w-32 h-32 mx-auto">
               <div className="absolute inset-0 rounded-full border-t-2 border-amber-500 animate-spin" />
               <div className="absolute inset-4 rounded-full border-r-2 border-white/20 animate-spin-slow" />
               <div className="absolute inset-0 flex items-center justify-center"><BarChart3 className="text-amber-500 animate-pulse" /></div>
            </div>
            <p className="text-xs font-mono uppercase tracking-[0.4em] text-white/60">Estimating funding capacity…</p>
         </div>
       ) : (
         <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
            <p className="text-[10px] font-black tracking-[0.6em] text-green-500 uppercase">Preview complete</p>
            <h2 className="text-5xl md:text-7xl font-light text-white tracking-tight">
               Possible capacity: <br /><span className="text-amber-500 font-bold drop-shadow-[0_0_30px_rgba(245,158,11,0.4)]">$85,000+</span>
            </h2>
            <p className="text-white/55 max-w-md mx-auto text-sm leading-relaxed">Based on your answers, you may qualify for stronger funding after restoration work is complete.</p>
            <Button onClick={next} className="mx-auto px-12 py-4">See full recommendation</Button>
         </div>
       )}
    </div>
  );
}

export function FinanceActivation({ next, data, update }) {
  return (
  <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000 text-left">
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 09 // Choose a plan</p>
      <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
        Pick your <span className="text-amber-500">restoration plan.</span>
      </h2>
      <p className="text-white/55 text-lg font-light max-w-2xl">We fix inaccurate items and can report your monthly payments as positive credit history on the premium plan.</p>
     
      <div className="w-full h-48 mt-8 mb-4 relative bg-black/20 rounded-xl border border-white/5 p-4 overflow-hidden">
        <p className="absolute top-2 left-4 text-[9px] font-black uppercase text-white/30 tracking-[0.2em]">Score growth with premium plan</p>
        <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
          <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="0" y1="40" x2="400" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <path d="M0,120 Q100,110 200,90 T400,60" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4 4" />
          <text x="350" y="55" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">Disputes only</text>
          <defs>
             <linearGradient id="velocityGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
             </linearGradient>
          </defs>
          <path d="M0,120 Q100,80 200,40 T400,10" fill="url(#velocityGradient)" stroke="#f59e0b" strokeWidth="3" />
          <circle cx="200" cy="40" r="4" fill="white" className="animate-pulse" />
          <text x="210" y="35" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="monospace">Premium plan</text>
        </svg>
      </div>
    </div>
   
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl">
       <div className="p-10 rounded-3xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden group cursor-pointer hover:bg-amber-500/10 transition-all" onClick={() => { update({ plan: 'builder' }); next(); }}>
          <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">Most Popular</div>
          <div className="space-y-6 relative z-10">
             <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 mb-4"><ShieldCheck size={32} /></div>
             <h3 className="text-3xl font-light text-white">Premium Restoration</h3>
             <div className="flex items-baseline gap-2">
               <span className="text-4xl font-bold text-white">$149</span>
               <span className="text-sm text-white/40 uppercase tracking-widest">/ Month</span>
             </div>
             <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                <li className="flex items-center gap-3 text-xs text-white/80"><CheckCircle2 size={14} className="text-amber-500" /> <b>$2,500 tradeline</b> reported monthly</li>
                <li className="flex items-center gap-3 text-xs text-white/80"><CheckCircle2 size={14} className="text-amber-500" /> Unlimited dispute letters</li>
                <li className="flex items-center gap-3 text-xs text-white/80"><CheckCircle2 size={14} className="text-amber-500" /> 24/7 portal access</li>
             </div>
             <p className="text-[10px] text-white/30 italic pt-2">Financed at 0% APR. No credit check required.</p>
          </div>
       </div>
       <div className="p-10 fc-light-glass-panel fc-light-chrome-panel rounded-3xl relative overflow-hidden group cursor-pointer hover:border-white/30 transition-all" onClick={() => { update({ plan: 'standard' }); next(); }}>
          <div className="space-y-6 relative z-10">
             <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-4"><Gavel size={32} /></div>
             <h3 className="text-3xl font-light text-white">Standard Dispute</h3>
             <div className="flex items-baseline gap-2">
               <span className="text-4xl font-bold text-white">$99</span>
               <span className="text-sm text-white/40 uppercase tracking-widest">/ Month</span>
             </div>
             <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                <li className="flex items-center gap-3 text-xs text-white/80"><X size={14} className="text-white/30" /> No tradeline reporting</li>
                <li className="flex items-center gap-3 text-xs text-white/80"><CheckCircle2 size={14} className="text-white" /> Standard disputes</li>
                <li className="flex items-center gap-3 text-xs text-white/80"><CheckCircle2 size={14} className="text-white" /> Monthly updates</li>
             </div>
          </div>
       </div>
    </div>
  </div>
);
}
