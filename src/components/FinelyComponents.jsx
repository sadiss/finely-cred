import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// ==========================================
// 1. DATA & CONSTANTS
// ==========================================

export const TRADELINE_INVENTORY = [
  { id: 1, bank: 'TD Bank', limit: '$25,000', limitVal: 25000, age: '10 Years', price: '$850', date: '7th', theme: 'tdbank', type: 'Personal' },
  { id: 2, bank: 'Discover', limit: '$15,000', limitVal: 15000, age: '8 Years', price: '$650', date: '14th', theme: 'gold', type: 'Personal' },
  { id: 3, bank: 'Amex', limit: '$45,000', limitVal: 45000, age: '12 Years', price: '$1,200', date: '21st', theme: 'platinum', type: 'Business' },
  { id: 4, bank: 'Citi', limit: '$35,000', limitVal: 35000, age: '15 Years', price: '$950', date: '12th', theme: 'citi', type: 'Personal' },
  { id: 5, bank: 'Wells Fargo', limit: '$30,000', limitVal: 30000, age: '14 Years', price: '$890', date: '24th', theme: 'wells', type: 'Funding' },
  { id: 6, bank: 'Capital One', limit: '$20,000', limitVal: 20000, age: '11 Years', price: '$750', date: '18th', theme: 'black', type: 'Starter' },
  { id: 7, bank: 'Barclays', limit: '$50,000', limitVal: 50000, age: '6 Years', price: '$1,100', date: '5th', theme: 'black', type: 'Business' },
  { id: 8, bank: 'Chase', limit: '$40,000', limitVal: 40000, age: '9 Years', price: '$950', date: '28th', theme: 'platinum', type: 'Personal' },
];

export const CARD_CONFIGS = {
  black: {
    bg: 'bg-[radial-gradient(circle_at_50%_0%,#222_0%,#0a0f0d_100%)]',
    accent: 'text-[#e2e8f0]',
    chip: 'from-[#cbd5e1] via-[#94a3b8] to-[#cbd5e1]',
    label: 'FINELY BLACK',
    sub: 'INFINITE LEVERAGE',
    subColor: 'text-[#e2e8f0]/60',
    lettering: 'text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-slate-400 to-slate-100'
  },
  gold: {
    bg: 'bg-[conic-gradient(from_135deg_at_50%_50%,#8a6d3b,#c5a059,#ffefbb,#c5a059,#8a6d3b)]',
    accent: 'text-[#2a210f]',
    chip: 'from-white/90 via-white/40 to-white/90',
    label: 'FINELY GOLD',
    sub: 'WEALTH POWER',
    subColor: 'text-[#f59e0b]',
    lettering: 'text-transparent bg-clip-text bg-gradient-to-b from-[#4d3d1a] via-[#8a6d3b] to-[#4d3d1a]'
  },
  platinum: {
    bg: 'bg-[radial-gradient(circle_at_50%_50%,#ffffff_0%,#f8fafc_25%,#cbd5e1_60%,#94a3b8_100%)]',
    accent: 'text-[#0f172a]',
    chip: 'from-black/30 via-black/5 to-black/30',
    label: 'FINELY PLATINUM',
    sub: 'FUNDING READY',
    subColor: 'text-[#0f172a]/50',
    lettering: 'text-transparent bg-clip-text bg-gradient-to-b from-slate-400 via-slate-700 to-slate-400'
  },
  tdbank: {
    bg: 'bg-[radial-gradient(circle_at_50%_0%,#005d37_0%,#0a0f0d_100%)]',
    accent: 'text-green-50',
    chip: 'from-green-100 via-green-300 to-green-100',
    label: 'TD BEYOND',
    sub: 'PRIVATE BANKING',
    subColor: 'text-green-400',
    lettering: 'text-transparent bg-clip-text bg-gradient-to-b from-green-50 via-green-200 to-green-50'
  },
  wells: {
    bg: 'bg-[radial-gradient(circle_at_50%_0%,#7f1d1d_0%,#0a0f0d_100%)]',
    accent: 'text-red-100',
    chip: 'from-yellow-200 via-yellow-400 to-yellow-200',
    label: 'WELLS ADVISOR',
    sub: 'EQUITY LINE',
    subColor: 'text-yellow-500',
    lettering: 'text-transparent bg-clip-text bg-gradient-to-b from-red-100 via-red-300 to-red-100'
  },
  citi: {
    bg: 'bg-[radial-gradient(circle_at_50%_0%,#075985_0%,#0a0f0d_100%)]',
    accent: 'text-sky-100',
    chip: 'from-sky-200 via-sky-400 to-sky-200',
    label: 'CITI PRESTIGE',
    sub: 'GLOBAL ACCESS',
    subColor: 'text-sky-400',
    lettering: 'text-transparent bg-clip-text bg-gradient-to-b from-sky-100 via-sky-300 to-sky-100'
  }
};

// ==========================================
// 2. UI UTILITIES
// ==========================================

export function Button({ children, variant = 'primary', className = '', onClick, disabled = false }) {
  const styles = {
    primary: `bg-gradient-to-b from-[#f59e0b] to-[#d97706] hover:from-[#fbbf24] hover:to-[#b45309] text-black font-bold uppercase tracking-widest text-[10px] shadow-[0_4px_0_rgb(146,64,14),0_15px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_2px_0_rgb(146,64,14),0_8px_15px_rgba(245,158,11,0.4)] active:translate-y-[2px] active:shadow-none border-t border-white/20 disabled:opacity-50 disabled:cursor-not-allowed`,
    secondary: `border border-[#c5a059]/50 bg-[#c5a059]/10 text-[#c5a059] hover:bg-[#c5a059]/20 font-bold uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(197,160,89,0.1)] hover:shadow-[0_0_25px_rgba(197,160,89,0.3)] backdrop-blur-md`,
    outline: `border border-white/20 text-white/70 hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] backdrop-blur-sm`,
  };
  return (
    <button disabled={disabled} onClick={onClick} className={`px-6 md:px-8 py-3 md:py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Reveal({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(node);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function LoopingTypingHeader({ phrases, className = "" }) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === phrases[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 2500);
      return () => clearTimeout(timeout);
    }
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % phrases.length);
      return;
    }
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 40 : 80);
    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, phrases]);

  const currentPhrase = phrases[index].substring(0, subIndex);
  const highlightWords = ["Credit.", "Wealth.", "Future.", "Control."];

  return (
    <span className={className}>
      {currentPhrase.split(' ').map((word, i, arr) => {
        const isHighlight = highlightWords.includes(word);
        return (
          <React.Fragment key={i}>
            <span className={isHighlight ? "text-[#f59e0b] drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" : ""}>{word}</span>
            {i < arr.length - 1 && ' '}
          </React.Fragment>
        );
      })}
      <span className="animate-pulse border-r-2 border-[#f59e0b] ml-1 shadow-[0_0_10px_#f59e0b]">&nbsp;</span>
    </span>
  );
}

export function FlashyIcon({ icon: IconComponent, color = 'amber' }) {
  const colorMap = {
    amber: 'text-[#f59e0b] bg-gradient-to-br from-[#f59e0b]/20 to-transparent border-[#f59e0b]/30 shadow-[0_0_30px_rgba(245,158,11,0.3)]',
    gold: 'text-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/20 to-transparent border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.3)]',
    platinum: 'text-slate-200 bg-gradient-to-br from-white/20 to-transparent border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
  };
  if (!IconComponent) return null;
  return (
    <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border backdrop-blur-xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] ${colorMap[color]}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-700 pointer-events-none" />
      <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-b from-white/40 to-transparent opacity-20" />
      <IconComponent size={32} strokeWidth={1.2} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] relative z-10" />
      <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-500 scale-0 group-hover:scale-100"><Sparkles size={10} className="text-black" /></div>
    </div>
  );
}

export function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right duration-500">
      <div className="bg-[#1a2b26] border border-amber-500/50 text-white px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center gap-4">
        <div className="bg-amber-500/20 p-2 rounded-full text-amber-500"><CheckCircle2 size={18} /></div>
        <p className="text-xs font-bold uppercase tracking-widest">{message}</p>
      </div>
    </div>
  );
}

// ==========================================
// 3. CHARTS & ASSETS
// ==========================================

export function SimpleAreaChart({ data, color = "#f59e0b" }) {
  const max = Math.max(...data);
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d / max) * 80}`).join(" ");
 
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0,100 ${points} 100,100`} fill="url(#gradient)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      {data.map((d, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * 100} cy={100 - (d / max) * 80} r="1.5" fill="white" className="animate-pulse" />
      ))}
    </svg>
  );
}

export function DonutChart({ percent, color = "#f59e0b", label }) {
  const circumference = 2 * Math.PI * 40;
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle cx="50%" cy="50%" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <circle
          cx="50%" cy="50%" r="40" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (percent / 100) * circumference}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-mono font-bold text-white">{percent}%</span>
        <span className="text-[8px] uppercase tracking-widest text-white/40">{label}</span>
      </div>
    </div>
  );
}

export function CreditCardAsset({ type = 'black', rotation = 'default' }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const config = CARD_CONFIGS[type] || CARD_CONFIGS.black;
  const rotationStyles = { default: 'rotate-y-[-22deg] rotate-x-[12deg]', flat: 'rotate-0', angled: 'rotate-y-[18deg] rotate-x-[-8deg]' };

  return (
    <div
      onMouseMove={(e) => {
        const card = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - card.left) / card.width - 0.5) * 25;
        const y = ((e.clientY - card.top) / card.height - 0.5) * -25;
        setTilt({ x, y });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className={`relative w-[280px] sm:w-[320px] h-[175px] sm:h-[200px] rounded-[18px] transition-transform duration-200 p-6 flex flex-col justify-between overflow-hidden group perspective-2000 ${config.bg} ${rotationStyles[rotation]}`}
      style={{
        boxShadow: '0 50px 100px -20px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 2px 0 rgba(255,255,255,0.2)',
        transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(1.0)`,
        zIndex: 10
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none mix-blend-overlay" />
      <div className={`absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]`} />
      <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />

      <div className="flex justify-between items-start relative z-10 text-left text-white">
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-4 text-left">
            <div className={`w-10 h-7 rounded-md bg-gradient-to-br ${config.chip} p-[1px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_1px_2px_rgba(0,0,0,0.5)] border border-black/20`} >
               <div className="w-full h-full border border-white/20 rounded-[5px] opacity-60 grid grid-cols-2">
                 <div className="border-r border-black/30" />
                 <div className="border-l border-black/30" />
               </div>
            </div>
            <Wifi size={18} className={`${config.accent} opacity-60 rotate-90 drop-shadow-md`} />
          </div>
          <p className={`text-[8px] tracking-[0.4em] font-black uppercase ${config.lettering} drop-shadow-sm`}>{config.label}</p>
        </div>
        <Globe size={24} className={`${config.accent} opacity-20`} />
      </div>
      <div className="relative z-10 space-y-3 text-left">
        <p className={`text-lg sm:text-xl tracking-[0.2em] font-mono font-medium ${config.accent} drop-shadow-md`}>4412 8801 9901 0024</p>
        <div className="flex justify-between items-end border-t border-white/10 pt-3">
          <div className="flex gap-4 md:gap-6 text-left">
            <div className="space-y-0.5 text-left"><p className={`text-[5px] uppercase tracking-[0.25em] font-bold opacity-60 ${config.accent}`}>Valid Thru</p><p className={`text-[10px] font-bold ${config.accent}`}>12 / 29</p></div>
          </div>
          <div className="text-right">
             <div className={`text-[8px] font-black tracking-[0.3em] mb-1 ${config.lettering} drop-shadow-sm`}>FINELY CRED</div>
             <p className={`text-[6px] font-extrabold tracking-[0.1em] ${config.subColor} uppercase`}>{config.sub}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhysicalEbook({ title, sub, vol, price, accentColor = "#f59e0b" }) {
  return (
    <div className="flex flex-col items-center group cursor-pointer text-white perspective-1000">
      <div className="relative w-40 h-60 md:w-44 md:h-64 mb-10 transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-4">
        <div className="relative w-full h-full transform-style-3d rotate-y-[-20deg] group-hover:rotate-y-[-5deg] transition-all duration-700 ease-out shadow-2xl">
          <div className="absolute inset-y-0 left-0 w-12 bg-[#0a0f0d] origin-right rotate-y-[-90deg] translate-x-[-12px] border-l border-white/10 flex flex-col items-center py-6 gap-6 text-left shadow-[inset_10px_0_20px_rgba(0,0,0,0.8)] z-10">
             <div className="rotate-90 whitespace-nowrap text-[9px] font-bold text-white/50 tracking-[0.3em] uppercase text-left">{title.split(' ')[0]}</div>
             <Shield size={14} className="text-white/20 mt-auto" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#050807] border-t border-r border-white/20 rounded-r-md shadow-[inset_0_0_30px_rgba(0,0,0,0.8),10px_10px_40px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col justify-between p-6">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.08] pointer-events-none" />
            <div className="relative z-10 flex justify-between items-start text-left">
              <div className="w-8 h-[1px] bg-gradient-to-r from-white/40 to-transparent" />
              <p className="text-[6px] font-black text-white/30 uppercase tracking-[0.3em]">Mastery Manual</p>
            </div>
            <div className="relative z-10 text-left space-y-2">
              <h4 className="text-xl font-light leading-none mb-2 uppercase text-left tracking-tight">{title.split(' ')[0]} <br /><span style={{ color: accentColor }} className="font-bold drop-shadow-md">{title.split(' ').slice(1).join(' ')}</span></h4>
              <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest text-left border-l-2 border-white/10 pl-2">{sub}</p>
            </div>
            <div className="relative z-10 flex justify-between items-end border-t border-white/5 pt-3 text-left text-white">
              <div><p className="text-[5px] text-white/30 uppercase font-black text-left">Volume</p><p className="text-[9px] text-white/80 font-bold uppercase text-left">{vol}</p></div>
              <Sparkles size={12} style={{ color: accentColor }} className="animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      <div className="text-center space-y-3 opacity-60 group-hover:opacity-100 transition-opacity duration-500 transform group-hover:translate-y-[-5px]">
        <h5 className="text-xs font-bold uppercase tracking-[0.25em] text-white">{title}</h5>
        <div className="flex items-center justify-center gap-4 text-white">
          <p className="text-base font-light text-[#f59e0b] text-left drop-shadow-md">{price}</p>
          <div className="flex items-center gap-1.5 text-left bg-white/5 px-2 py-1 rounded-full border border-white/10">
            <CheckCircle2 size={10} className="text-[#10b981]" />
            <span className="text-[8px] text-white/60 font-bold uppercase text-left">Digital Entry</span>
          </div>
        </div>
        <button className="mt-2 px-6 py-2 border border-white/20 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/40 hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]">Secure Access</button>
      </div>
    </div>
  );
}

// ==========================================
// 4. SUB-COMPONENTS
// ==========================================

export function MarketplaceCard({ bank, limit, age, price, date, theme, onSelect }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const themeMap = {
    tdbank: { bg: 'bg-[radial-gradient(circle_at_50%_0%,#005d37_0%,#0a0f0d_100%)]', accent: 'text-green-50', chip: 'from-green-100 via-green-300 to-green-100' },
    gold: { bg: 'bg-[conic-gradient(from_135deg_at_50%_50%,#8a6d3b,#c5a059,#ffefbb,#c5a059,#8a6d3b)]', accent: 'text-[#2a210f]', chip: 'from-white/90 via-white/40 to-white/90' },
    platinum: { bg: 'bg-[radial-gradient(circle_at_50%_50%,#ffffff_0%,#f8fafc_25%,#cbd5e1_60%,#94a3b8_100%)]', accent: 'text-[#0f172a]', chip: 'from-black/30 via-black/5 to-black/30' },
    citi: { bg: 'bg-[radial-gradient(circle_at_50%_0%,#075985_0%,#0a0f0d_100%)]', accent: 'text-sky-100', chip: 'from-sky-200 via-sky-400 to-sky-200' },
    wells: { bg: 'bg-[radial-gradient(circle_at_50%_0%,#7f1d1d_0%,#0a0f0d_100%)]', accent: 'text-red-100', chip: 'from-yellow-200 via-yellow-400 to-yellow-200' },
    black: { bg: 'bg-[radial-gradient(circle_at_50%_0%,#222_0%,#0a0f0d_100%)]', accent: 'text-[#e2e8f0]', chip: 'from-[#cbd5e1] via-[#94a3b8] to-[#cbd5e1]' }
  };
  const config = themeMap[theme] || themeMap.black;

  return (
    <div
      onMouseMove={(e) => {
        const card = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - card.left) / card.width - 0.5) * 15;
        const y = ((e.clientY - card.top) / card.height - 0.5) * -15;
        setTilt({ x, y });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className={`relative p-8 rounded-3xl border-t border-l border-white/20 border-b border-r border-black/60 transition-all duration-500 overflow-hidden text-left shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)] hover:shadow-[0_30px_60px_-10px_rgba(245,158,11,0.15)] group ${config.bg}`}
      style={{ transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale3d(1,1,1)`, transformStyle: 'preserve-3d' }}
    >
      <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-sm pointer-events-none transition-opacity group-hover:opacity-0" />
      <div className="absolute inset-0 opacity-[0.1] bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] pointer-events-none" />
     
      <div className="flex justify-between items-start mb-8 relative z-10 text-left transform group-hover:translate-z-[20px] transition-transform duration-500">
        <div className="space-y-1">
          <p className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${config.accent}`}>Bank Asset</p>
          <h4 className={`text-2xl font-light tracking-tight ${config.accent}`}>{bank}</h4>
        </div>
        <div className={`w-12 h-8 rounded-lg border border-white/20 bg-gradient-to-br ${config.chip} opacity-80 shadow-inner`} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8 relative z-10 text-left">
        <div className="space-y-1 transform group-hover:translate-z-[10px] transition-transform duration-500">
          <div className={`flex items-center gap-2 opacity-50 ${config.accent}`}><BarChart3 size={14} /><span className="text-[9px] uppercase font-bold tracking-widest text-left">Limit</span></div>
          <p className={`text-xl font-medium ${config.accent}`}>{limit}</p>
        </div>
        <div className="space-y-1 transform group-hover:translate-z-[10px] transition-transform duration-500 delay-75">
          <div className={`flex items-center gap-2 opacity-50 ${config.accent}`}><Clock size={14} /><span className="text-[9px] uppercase font-bold tracking-widest text-left">Age</span></div>
          <p className={`text-xl font-medium ${config.accent}`}>{age}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/10 relative z-10 text-left">
        <div className="flex items-center gap-2 text-left">
          <Calendar className="text-[#f59e0b]" size={16} />
          <span className={`text-[10px] uppercase tracking-widest font-bold opacity-60 ${config.accent}`}>Closes {date}</span>
        </div>
        <p className={`text-lg font-bold uppercase tracking-widest ${config.accent}`}>{price}</p>
      </div>

      <button onClick={onSelect} className={`w-full mt-6 py-4 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] ${config.accent} relative z-20`}>
        Secure AU Slot
      </button>
    </div>
  );
}

export function TradelineMarketplace({ onAddToCart, lines }) {
  // Use passed lines or fallback to empty array
  const displayLines = lines || TRADELINE_INVENTORY;

  return (
    <div className="w-full mt-20 md:mt-32 space-y-12">
      <div className="w-full bg-black/40 border-y border-white/10 py-3 overflow-hidden">
         <div className="flex items-center whitespace-nowrap animate-marquee gap-12">
            {[...displayLines, ...displayLines].map((l, i) => (
               <div key={i} className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-white/60">
                  <span className={l.theme === 'platinum' ? 'text-white' : 'text-amber-500'}>{l.bank}</span>
                  <span className="text-white/30">|</span>
                  <span>{l.limit}</span>
                  <span className="text-white/30">|</span>
                  <span className="text-green-500">{l.price}</span>
               </div>
            ))}
         </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayLines.map(line => <MarketplaceCard key={line.id} {...line} onSelect={() => onAddToCart && onAddToCart(line)} />)}
      </div>
    </div>
  );
}

export function ViolationLiveFeed() {
  const violations = [ { code: "FCRA § 604", msg: "UNAUTHORIZED INQUIRY SUPPRESSION: ACTIVE", status: "CLEARED", risk: "LOW" }, { code: "FDCPA § 807", msg: "MISLEADING REPRESENTATION DETECTED // PROTOCOL 19A", status: "ENFORCING", risk: "CRITICAL" }, { code: "UCC § 9-501", msg: "CORPORATE INTEREST VERIFIED: EIN STACKING AUTHORIZED", status: "LOCKED", risk: "STABLE" }, { code: "15 U.S.C. § 1681i", msg: "VACATED DEROGATORY ASSET // DATABASE UPDATE SUCCESS", status: "SUCCESS", risk: "NONE" }, { code: "REMEDY P-1", msg: "CFPB ESCALATION LOGGED // CASE ID #299-MASTER", status: "ACTIVE", risk: "HIGH" }, { code: "METRO2 SCAN", msg: "IDENTIFIED INCONSISTENCY IN EQUIFAX PERSONAL CLUSTER", status: "ISOLATED", risk: "CRITICAL" } ];
  return (
    <div className="w-full bg-black/40 border-y border-white/10 py-6 md:py-8 overflow-hidden relative group">
      <div className="flex items-center whitespace-nowrap animate-marquee text-left">
        {[...violations, ...violations].map((v, i) => (
          <div key={i} className="flex items-center gap-10 px-12 md:px-24 transition-opacity opacity-40 group-hover:opacity-100 text-white">
            <div className={`px-4 py-1.5 text-[9px] font-black rounded-sm tracking-[0.2em] border shadow-sm ${v.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'}`}>{v.code}</div>
            <p className="text-[10px] md:text-[12px] font-mono tracking-[0.4em] text-white/70 uppercase text-left">{v.msg}</p>
            <div className="flex items-center gap-4 text-left"><div className={`w-2 h-2 rounded-full ${v.risk === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-[#10b981]'}`} /><span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] text-left">{v.status}</span></div>
            <span className="text-white/10 px-8 font-light text-xl">||</span>
          </div>
        ))}
      </div>
    </div>
  );
}
