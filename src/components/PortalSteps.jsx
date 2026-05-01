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

// ==========================================
// 5. PORTAL STEP COMPONENTS
// ==========================================

export function SovereignIdentity({ next, data, update }) {
  return (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Initialization // Identity</p>
      <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
        Who is the architect of this <br /> <span className="text-amber-500">Wealth Vector?</span>
      </h2>
      <p className="text-white/40 text-lg font-light">Identifying the primary node for statutory mapping.</p>
    </div>
    <div className="relative max-w-xl group">
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-transparent blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
      <input
        type="text"
        value={data.name || ''}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="ENTER FULL LEGAL NAME"
        className="relative w-full bg-transparent border-b-2 border-white/10 py-6 text-2xl md:text-4xl font-light text-white placeholder:text-white/5 focus:outline-none focus:border-amber-500 transition-all duration-700 font-mono uppercase tracking-wider"
      />
      <div className="absolute right-0 bottom-6 opacity-20 group-hover:opacity-100 transition-opacity">
        <Fingerprint size={48} strokeWidth={1} className="text-amber-500" />
      </div>
    </div>
    <Button onClick={next} className="px-12 py-5" disabled={!data.name}>Authorize Identity</Button>
  </div>
);
}

export function ArchitecturalIntent({ next, data, update }) {
  const goals = [
    { id: 'funding', title: 'Institutional Funding', desc: 'Secure high-limit lines of credit for empire scaling.', icon: Trophy },
    { id: 'debt', title: 'Liability Liquidation', desc: 'Vacate derogatory assets via statutory enforcement.', icon: Gavel },
    { id: 'business', title: 'Corporate Stacking', desc: 'Architect EIN-only profiles for zero-liability capital.', icon: Building2 },
    { id: 'legacy', title: 'Generational Legacy', desc: 'Total profile preservation and credit sovereignty.', icon: ShieldCheck }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000 text-left">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 02 // Intent</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          What are we <span className="text-amber-500">building?</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {goals.map((g) => {
          const GoalIcon = g.icon;
          return (
            <div
              key={g.id}
              onClick={() => { update({ goal: g.id }); next(); }}
              className={`group cursor-pointer p-10 rounded-2xl border-t border-l border-white/10 border-b border-r border-black/50 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(245,158,11,0.15)] text-left ${data.goal === g.id ? 'border-amber-500/50 bg-amber-500/10' : 'hover:border-white/20'}`}
            >
              <GoalIcon className={`mb-6 transition-all duration-500 ${data.goal === g.id ? 'text-amber-500 scale-110' : 'text-white/40 group-hover:text-white group-hover:scale-110'}`} size={36} strokeWidth={1} />
              <h4 className="text-2xl font-light mb-2">{g.title}</h4>
              <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">{g.desc}</p>
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
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 03 // Synchronization</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Connect <span className="text-amber-500">Bureau Data.</span>
        </h2>
        <p className="text-white/40 text-lg font-light">Securely import your tri-merge report for fracture analysis.</p>
      </div>
     
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
        {['IdentityIQ', 'SmartCredit', 'MyScoreIQ'].map(provider => (
          <div key={provider} onClick={!synced ? handleSync : undefined} className={`group relative p-8 rounded-2xl border-t border-l border-white/10 border-b border-r border-black/50 transition-all duration-500 cursor-pointer text-left hover:-translate-y-2 ${synced ? 'border-green-500/50 bg-green-500/10' : 'bg-white/[0.02] hover:bg-white/[0.05]'}`}>
            <div className="flex justify-between items-start mb-6">
              <Server size={32} className={synced ? "text-green-500" : "text-white/40 group-hover:text-amber-500 transition-colors"} />
              {synced && <CheckCircle2 size={20} className="text-green-500" />}
            </div>
            <h4 className="text-xl font-light text-white mb-2">{provider}</h4>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{synced ? 'Connected' : 'Connect Account'}</p>
            {syncing && !synced && (
               <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm rounded-2xl">
                 <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
               </div>
            )}
          </div>
        ))}
      </div>
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
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Terrain Audit // Fractures</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Locate the <span className="text-amber-500">Foundation Fractures.</span>
        </h2>
        <p className="text-white/40 text-lg font-light">Mark every derogatory asset currently limiting your borrowing power.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl text-left">
        {issues.map((i) => {
          const FractureIcon = i.icon;
          const isActive = (data.fractures || []).includes(i.id);
          return (
            <div
              key={i.id}
              onClick={() => toggle(i.id)}
              className={`group cursor-pointer p-8 rounded-xl border-t border-l border-white/10 border-b border-r border-black/50 transition-all duration-500 text-left flex flex-col items-center justify-center gap-4 hover:-translate-y-1 hover:shadow-lg ${isActive ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-white/[0.02] hover:bg-white/[0.05]'}`}
            >
              <FractureIcon className={isActive ? 'text-amber-500' : 'text-white/20 group-hover:text-white'} size={32} strokeWidth={1.5} />
              <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>{i.label}</span>
            </div>
          );
        })}
      </div>
      <Button onClick={next} className="px-12 py-5" disabled={!(data.fractures?.length > 0)}>Validate Fractures</Button>
    </div>
  );
}

export function LiabilityVolume({ next, data, update }) {
  return (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Assessment // Liability Volume</p>
      <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
        Total <span className="text-amber-500 text-left">Derogatory Volume.</span>
      </h2>
      <p className="text-white/40 text-lg font-light">Estimate the aggregate dollar amount of items requiring vacation.</p>
    </div>
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
      {[
        { id: 'low', label: 'Under $10,000', rate: 'Standard' },
        { id: 'mid', label: '$10k - $50k', rate: 'Institutional' },
        { id: 'high', label: '$50k - $1M+', rate: 'High Stakes' }
      ].map(opt => (
        <div
          key={opt.id}
          onClick={() => { update({ liabilityTier: opt.id }); next(); }}
          className={`p-10 rounded-2xl border-t border-l border-white/10 border-b border-r border-black/50 transition-all duration-500 cursor-pointer text-left hover:-translate-y-2 hover:shadow-2xl ${data.liabilityTier === opt.id ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'bg-white/[0.02] hover:bg-white/[0.05]'}`}
        >
          <p className="text-3xl font-light text-white mb-4">{opt.label}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500/60">{opt.rate} Remediation</p>
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
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 05 // Terrain</p>
      <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
        Current <span className="text-amber-500">Structural Integrity.</span>
      </h2>
      <p className="text-white/40 text-lg font-light max-w-xl text-left">Move the slider to indicate your estimated score threshold.</p>
    </div>
   
    <div className="py-24 max-w-2xl relative text-left">
      <div className="h-2 w-full bg-black/50 rounded-full relative border-b border-white/10 shadow-inner">
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
          className="absolute top-[-60px] -translate-x-1/2 w-20 h-14 bg-[#1a1a1a] border border-white/10 rounded-xl flex items-center justify-center shadow-xl pointer-events-none transition-all duration-100 ease-out"
          style={{ left: `${((data.score || 550) - 300) / 5.5}%` }}
        >
          <span className="text-xl font-bold text-white">{data.score || 550}</span>
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1a1a] border-b border-r border-white/10 rotate-45" />
        </div>
      </div>
      <div className="flex justify-between mt-6 text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
          <span>Sub-Prime (300)</span>
          <span>Prime (850)</span>
      </div>
    </div>
   
    <Button onClick={next} className="px-12 py-5">Analyze Structural Depth</Button>
  </div>
);
}

export function FinancialVelocity({ next, data, update }) {
  return (
  <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000 text-left">
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 06 // Velocity</p>
      <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
        Target <span className="text-amber-500">Asset Liquidity.</span>
      </h2>
      <p className="text-white/40 text-lg font-light max-w-xl text-left">Define the capital requirement for your next wealth deployment.</p>
    </div>
   
    <div className="py-24 max-w-2xl relative text-left">
      <div className="h-2 w-full bg-black/50 rounded-full relative border-b border-white/10 shadow-inner">
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
          className="absolute top-[-60px] -translate-x-1/2 px-5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl flex items-center justify-center shadow-xl pointer-events-none transition-all duration-100 ease-out"
          style={{ left: `${(data.target || 50000) / 10000}%` }}
        >
          <span className="text-lg font-bold text-white">${(data.target || 50000).toLocaleString()}</span>
           <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1a1a] border-b border-r border-white/10 rotate-45" />
        </div>
      </div>
    </div>
   
    <Button onClick={next} className="px-12 py-5">Validate Liquidity Vector</Button>
  </div>
);
}

export function StrategicUrgency({ next, data, update }) {
  return (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Deployment // Urgency</p>
      <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
        Restoration <span className="text-amber-500 text-left">Timeline.</span>
      </h2>
      <p className="text-white/40 text-lg font-light">How rapidly do you require the vacation of liabilities for funding?</p>
    </div>
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl text-left">
      {[
        { id: 'rapid', label: 'ASAP', desc: 'Critical funding window closing.', icon: FastForward },
        { id: 'planned', label: '30-60 Days', desc: 'Strategic scaling phase.', icon: Target },
        { id: 'build', label: 'Long Term', desc: 'Total foundational overhaul.', icon: Building2 }
      ].map(opt => {
        const UrgencyIcon = opt.icon;
        return (
          <div
            key={opt.id}
            onClick={() => { update({ urgency: opt.id }); next(); }}
            className={`p-10 rounded-2xl border-t border-l border-white/10 border-b border-r border-black/50 transition-all duration-500 cursor-pointer text-left hover:-translate-y-2 hover:shadow-2xl ${data.urgency === opt.id ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'bg-white/[0.02] hover:bg-white/[0.05]'}`}
          >
            <UrgencyIcon className={`mb-6 transition-colors ${data.urgency === opt.id ? 'text-amber-500' : 'text-white/40'}`} size={36} />
            <p className="text-2xl font-light text-white mb-2">{opt.label}</p>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{opt.desc}</p>
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
    "Initializing Statutory Engine...",
    "Scanning FCRA § 611 Compliance...",
    "Cross-referencing FDCPA § 807 Violations...",
    "Identifying Reporting Fragments...",
    "Calibrating Wealth Projection..."
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
        <h2 className="text-2xl font-light text-white tracking-widest uppercase text-center">AI Statutory Calibration</h2>
        <p className="text-amber-500/60 font-mono text-xs tracking-[0.3em] uppercase h-4 text-center">{logs[logIdx]}</p>
      </div>
    </div>
  );
}

export function WealthHorizon({ next }) {
  return (
  <div className="space-y-12 animate-in fade-in slide-in-from-top-8 duration-1000 text-left">
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Analysis Complete</p>
      <h2 className="text-4xl md:text-7xl font-extralight tracking-tight text-white leading-tight">
        Architecture <span className="text-amber-500">Locked.</span>
      </h2>
    </div>
    <div className="grid md:grid-cols-3 gap-8 text-left">
      {[
        { label: 'Asset Potential', val: '$150k+', sub: 'Institutional Lines' },
        { label: 'Remedy Velocity', val: '45-90', sub: 'Day Restoration' },
        { label: 'Compliance Level', val: 'High', sub: 'Lender Readiness' }
      ].map((p, i) => (
        <div key={i} className="p-8 rounded-2xl border-t border-l border-white/10 border-b border-r border-black/50 bg-white/[0.02] backdrop-blur-md space-y-2 hover:-translate-y-1 transition-transform duration-500">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-left">{p.label}</p>
          <p className="text-4xl text-white font-light text-left">{p.val}</p>
          <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest text-left">{p.sub}</p>
        </div>
      ))}
    </div>
    <div className="space-y-6 pt-12 border-t border-white/10 text-left">
      <p className="text-white/40 max-w-xl text-left">This blueprint is now encrypted within the Secure Vault. Initialize your credentials to access the legal pathways and deployment strategies.</p>
      <Button onClick={next} className="px-12 py-5 bg-white text-black hover:bg-amber-500">Initialize Vault Credentials</Button>
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
            <p className="text-xs font-mono uppercase tracking-[0.4em] text-white/60">Analyzing Funding Capacity...</p>
         </div>
       ) : (
         <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
            <p className="text-[10px] font-black tracking-[0.6em] text-green-500 uppercase">Preliminary Scan Complete</p>
            <h2 className="text-5xl md:text-7xl font-light text-white tracking-tight">
               Potential Capacity: <br /><span className="text-amber-500 font-bold drop-shadow-[0_0_30px_rgba(245,158,11,0.4)]">$85,000+</span>
            </h2>
            <p className="text-white/40 max-w-md mx-auto text-sm leading-relaxed">Based on your initial profile, you are a candidate for Tier-1 institutional funding upon restoration completion.</p>
            <Button onClick={next} className="mx-auto px-12 py-4">Unlock Full Blueprint</Button>
         </div>
       )}
    </div>
  );
}

export function FinanceActivation({ next, data, update }) {
  return (
  <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000 text-left">
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 09 // Primary Anchor</p>
      <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
        Activate Your <span className="text-amber-500">Credit Builder.</span>
      </h2>
      <p className="text-white/40 text-lg font-light max-w-2xl">We don't just fix credit; we build it. Your service payments are reported to Equifax as a primary installment tradeline, creating positive history while we work.</p>
     
      {/* DOUBLE DIP GRAPH SVG */}
      <div className="w-full h-48 mt-8 mb-4 relative bg-black/20 rounded-xl border border-white/5 p-4 overflow-hidden">
        <p className="absolute top-2 left-4 text-[9px] font-black uppercase text-white/30 tracking-[0.2em]">Growth Velocity Projection</p>
        <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
          {/* Grid Lines */}
          <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="0" y1="40" x2="400" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
         
          {/* Dispute Only Line (Slower) */}
          <path d="M0,120 Q100,110 200,90 T400,60" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4 4" />
          <text x="350" y="55" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">Disputes Only</text>
         
          {/* Double Dip Line (Faster) */}
          <defs>
             <linearGradient id="velocityGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
             </linearGradient>
          </defs>
          <path d="M0,120 Q100,80 200,40 T400,10" fill="url(#velocityGradient)" stroke="#f59e0b" strokeWidth="3" />
         
          {/* Intersection Point */}
          <circle cx="200" cy="40" r="4" fill="white" className="animate-pulse" />
          <text x="210" y="35" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="monospace">VELOCITY ZONE</text>
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
             <div className="space-y-3 pt-4 border-t border-white/10">
                <li className="flex items-center gap-3 text-xs text-white/80"><CheckCircle2 size={14} className="text-amber-500" /> <b>$2,500 Primary Tradeline</b> Reported</li>
                <li className="flex items-center gap-3 text-xs text-white/80"><CheckCircle2 size={14} className="text-amber-500" /> Unlimited Statutory Disputes</li>
                <li className="flex items-center gap-3 text-xs text-white/80"><CheckCircle2 size={14} className="text-amber-500" /> 24/7 Portal Access</li>
             </div>
             <p className="text-[10px] text-white/30 italic pt-2">Financed at 0% APR. No credit check required.</p>
          </div>
       </div>
       <div className="p-10 rounded-3xl border border-white/10 bg-white/[0.02] relative overflow-hidden group cursor-pointer hover:border-white/30 transition-all" onClick={() => { update({ plan: 'standard' }); next(); }}>
          <div className="space-y-6 relative z-10">
             <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-4"><Gavel size={32} /></div>
             <h3 className="text-3xl font-light text-white">Standard Dispute</h3>
             <div className="flex items-baseline gap-2">
               <span className="text-4xl font-bold text-white">$99</span>
               <span className="text-sm text-white/40 uppercase tracking-widest">/ Month</span>
             </div>
             <div className="space-y-3 pt-4 border-t border-white/10">
                <li className="flex items-center gap-3 text-xs text-white/80"><X size={14} className="text-white/30" /> No Tradeline Reporting</li>
                <li className="flex items-center gap-3 text-xs text-white/80"><CheckCircle2 size={14} className="text-white" /> Standard Disputes</li>
                <li className="flex items-center gap-3 text-xs text-white/80"><CheckCircle2 size={14} className="text-white" /> Monthly Updates</li>
             </div>
          </div>
       </div>
    </div>
  </div>
);
}
