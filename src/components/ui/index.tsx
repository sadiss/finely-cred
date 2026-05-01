import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Sparkles, Menu, X } from 'lucide-react';
export { FullPageLoader } from './FullPageLoader';
export { AppErrorBoundary } from './AppErrorBoundary';
export { KpiCard, Sparkline } from './KpiCards';
export { ClickableCard } from './ClickableCard';
export { ActionLink } from './ActionLink';
export { CollapsibleSection } from './CollapsibleSection';
export { TimeSeriesAreaChart } from './TimeSeriesAreaChart';
export { EmptyState } from './EmptyState';
export { BarChartCard, LineChartCard, DonutChartCard, ComposedChartCard, FunnelChartCard } from '../charts';
export { Sparkline as SparklineChart } from '../charts/Sparkline';

// --- DESIGN TOKENS - LUXURY CARD CONFIGS ---
export const CARD_CONFIGS: Record<string, any> = {
  black: {
    bg: 'bg-gradient-to-br from-[#2a2a2a] via-[#151515] to-[#0a0a0a]',
    accent: 'text-slate-100',
    chip: 'from-[#ffd700] via-[#daa520] to-[#b8860b]',
    label: 'FINELY BLACK',
    network: 'VISA',
    lettering: 'text-slate-200',
    // Premium metallic gradient for card body
    metalGradient: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 25%, #0d0d0d 50%, #1a1a1a 75%, #2d2d2d 100%)',
    // Glossy overlay
    glossOverlay: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 30%, transparent 50%, rgba(0,0,0,0.3) 100%)',
  },
  chase: {
    bg: 'bg-[radial-gradient(circle_at_50%_0%,#1e3a8a_0%,#0b1220_55%,#05070c_100%)]',
    accent: 'text-slate-100',
    chip: 'from-slate-200 via-slate-300 to-slate-200',
    label: 'CHASE',
    network: 'VISA',
    lettering: 'text-slate-200',
  },
  boa: {
    bg: 'bg-[radial-gradient(circle_at_40%_0%,#1d4ed8_0%,#0b1220_55%,#05070c_100%)]',
    accent: 'text-slate-100',
    chip: 'from-slate-200 via-slate-300 to-slate-200',
    label: 'BANK OF AMERICA',
    network: 'VISA',
    lettering: 'text-slate-200',
  },
  tdbank: {
    bg: 'bg-[radial-gradient(circle_at_50%_0%,#0f766e_0%,#05201d_55%,#030807_100%)]',
    accent: 'text-emerald-50',
    chip: 'from-emerald-100 via-emerald-300 to-emerald-100',
    label: 'TD BANK',
    network: 'VISA',
    lettering: 'text-emerald-100',
  },
  citi: {
    bg: 'bg-[radial-gradient(circle_at_50%_0%,#075985_0%,#0b1220_55%,#05070c_100%)]',
    accent: 'text-sky-100',
    chip: 'from-sky-200 via-sky-400 to-sky-200',
    label: 'CITI',
    network: 'VISA',
    lettering: 'text-sky-100',
  },
  wells: {
    bg: 'bg-[radial-gradient(circle_at_50%_0%,#7f1d1d_0%,#1a0b0b_55%,#070303_100%)]',
    accent: 'text-red-100',
    chip: 'from-yellow-200 via-yellow-400 to-yellow-200',
    label: 'WELLS FARGO',
    network: 'VISA',
    lettering: 'text-red-100',
  },
  gold: {
    bg: 'bg-gradient-to-br from-[#ffd700] via-[#daa520] to-[#b8860b]',
    accent: 'text-[#1a1400]',
    chip: 'from-[#fffacd] via-[#ffd700] to-[#daa520]',
    label: 'FINELY GOLD',
    network: 'MASTERCARD',
    lettering: 'text-[#3d3000]',
    // Luxury gold metallic
    metalGradient: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 15%, #f39c12 35%, #d68910 50%, #f39c12 65%, #fdcb6e 85%, #ffeaa7 100%)',
    glossOverlay: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 50%, rgba(139,69,19,0.2) 100%)',
  },
  platinum: {
    bg: 'bg-gradient-to-br from-[#f5f5f5] via-[#d3d3d3] to-[#a9a9a9]',
    accent: 'text-[#1a1a1a]',
    chip: 'from-[#e8e8e8] via-[#c0c0c0] to-[#a8a8a8]',
    label: 'FINELY PLATINUM',
    network: 'AMEX',
    lettering: 'text-[#2a2a2a]',
    // Silver/platinum metallic
    metalGradient: 'linear-gradient(135deg, #ffffff 0%, #e8e8e8 20%, #c0c0c0 40%, #a8a8a8 60%, #c0c0c0 80%, #e8e8e8 100%)',
    glossOverlay: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.25) 30%, transparent 50%, rgba(0,0,0,0.15) 100%)',
  }
};

// --- BUTTON COMPONENT (FIXED CONTRAST) ---
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'platinum' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  onClick, 
  disabled = false,
  loading = false 
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    onClick?.();
  };

  const styles: Record<string, string> = {
    // Primary: Amber gradient with black text - HIGH CONTRAST
    primary: `fc-button-brand-surface text-[#1a1400] font-black`,
    
    // Secondary: Dark with amber accent
    secondary: `bg-[#1a2b26] border-2 border-[rgba(var(--brand-primary-rgb),0.50)] text-[color:var(--brand-primary)] hover:bg-[rgba(var(--brand-primary-rgb),0.12)] hover:brightness-110 font-bold shadow-lg`,
    
    // Outline: Amber border with amber text - FIXED CONTRAST
    outline: `bg-black/10 border-2 border-[rgba(var(--brand-primary-rgb),0.60)] text-[color:var(--brand-primary)] hover:bg-[rgba(var(--brand-primary-rgb),0.14)] hover:brightness-110 font-bold`,
    
    // Ghost: Subtle hover effect
    ghost: `border border-white/10 bg-black/20 text-white/80 hover:text-white hover:bg-white/[0.06] font-semibold`,

    // Platinum: Metallic silver gradient with dark text
    platinum: `fc-button-platinum-surface font-black`,

    // Gold: Luxury metallic gradient (matches Finely Gold card)
    gold: `bg-[linear-gradient(135deg,#ffeaa7_0%,#fdcb6e_15%,#f39c12_35%,#d68910_50%,#f39c12_65%,#fdcb6e_85%,#ffeaa7_100%)] text-[#1a1400] font-black shadow-lg shadow-black/30 hover:brightness-110 border-t border-white/40`,
  };

  const sizes: Record<string, string> = {
    sm: 'px-5 py-2.5 text-xs min-h-[44px]',
    md: 'px-7 py-3.5 text-sm min-h-[44px]',
    lg: 'px-10 py-4 text-sm min-h-[48px]',
  };

  return (
    <button 
      disabled={disabled || loading} 
      onClick={handleClick} 
      className={`group relative overflow-hidden rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--brand-primary-rgb),0.62)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1110] ${styles[variant]} ${sizes[size]} ${className}`}
    >
      {/* Static metallic highlight so platinum looks "metal" even in screenshots */}
      {variant === 'platinum' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-white/10 to-black/10 opacity-60"
        />
      )}
      {/* Metallic specular streak for platinum buttons */}
      {variant === 'platinum' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[200%] rotate-[35deg] bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-40 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-out"
        />
      )}
      {/* Brand button gets shimmer from CSS pseudo-element */}
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
}

// --- REVEAL COMPONENT ---
interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'zoom';
}

export function Reveal({ children, delay = 0, direction = 'up' }: RevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const transforms: Record<string, string> = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8',
    zoom: 'scale-95',
  };

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-700 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-y-0 translate-x-0 scale-100' 
          : `opacity-0 ${transforms[direction]}`
      }`} 
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// --- ANIMATED COUNTER ---
interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, prefix = '', suffix = '', duration = 2000, className = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

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

  useEffect(() => {
    if (!isVisible) return;
    
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * value));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// --- TYPING HEADER ---
interface LoopingTypingHeaderProps {
  phrases: string[];
  className?: string;
}

export function LoopingTypingHeader({ phrases, className = "" }: LoopingTypingHeaderProps) {
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
  const highlightWords = ["Credit.", "Wealth.", "Future.", "Control.", "Funding.", "Freedom."];

  return (
    <span className={className}>
      {currentPhrase.split(' ').map((word, i, arr) => {
        const isHighlight = highlightWords.includes(word);
        return (
          <React.Fragment key={i}>
            <span className={isHighlight ? "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" : ""}>{word}</span>
            {i < arr.length - 1 && ' '}
          </React.Fragment>
        );
      })}
      <span className="animate-pulse border-r-2 border-amber-500 ml-1 shadow-[0_0_10px_rgba(245,158,11,0.6)]">&nbsp;</span>
    </span>
  );
}

// --- FLASHY ICON ---
interface FlashyIconProps {
  icon: React.ComponentType<any>;
  color?: 'amber' | 'gold' | 'platinum' | 'green' | 'red' | 'blue';
  size?: 'sm' | 'md' | 'lg';
}

export function FlashyIcon({ icon: IconComponent, color = 'amber', size = 'md' }: FlashyIconProps) {
  const colorMap: Record<string, string> = {
    amber: 'text-amber-500 bg-amber-500/15 border-amber-500/30',
    gold: 'text-yellow-500 bg-yellow-500/15 border-yellow-500/30',
    platinum: 'text-slate-300 bg-slate-300/15 border-slate-300/30',
    green: 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30',
    red: 'text-red-500 bg-red-500/15 border-red-500/30',
    blue: 'text-blue-500 bg-blue-500/15 border-blue-500/30',
  };

  const sizeMap: Record<string, { container: string; icon: number }> = {
    sm: { container: 'w-12 h-12 rounded-xl', icon: 22 },
    md: { container: 'w-16 h-16 rounded-2xl', icon: 28 },
    lg: { container: 'w-20 h-20 rounded-2xl', icon: 36 },
  };

  if (!IconComponent) return null;

  return (
    <div className={`flex items-center justify-center border-2 ${colorMap[color]} ${sizeMap[size].container}`}>
      <IconComponent size={sizeMap[size].icon} strokeWidth={1.5} />
    </div>
  );
}

// --- TOAST ---
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeStyles: Record<string, { bg: string; icon: string; border: string }> = {
    success: { bg: 'bg-emerald-500/20', icon: 'text-emerald-500', border: 'border-emerald-500/50' },
    error: { bg: 'bg-red-500/20', icon: 'text-red-500', border: 'border-red-500/50' },
    info: { bg: 'bg-blue-500/20', icon: 'text-blue-500', border: 'border-blue-500/50' },
    warning: { bg: 'bg-amber-500/20', icon: 'text-amber-500', border: 'border-amber-500/50' },
  };

  const style = typeStyles[type];

  return (
    <div className="fixed top-24 right-6 z-[100] animate-in slide-in-from-right duration-500">
      <div className={`bg-[#1a2b26] border ${style.border} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4`}>
        <div className={`${style.bg} p-2 rounded-full ${style.icon}`}>
          <CheckCircle2 size={18} />
        </div>
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

// --- LIVE APPROVAL TICKER (FIXED FOR MOBILE) ---
type ApprovalItem = { name: string; bank: string; amount: string; type: string };

function makeApprovals(): ApprovalItem[] {
  const first = [
    'Jonathan',
    'Alexis',
    'Michael',
    'Sophia',
    'David',
    'Emma',
    'Christopher',
    'Aaliyah',
    'Jordan',
    'Brianna',
    'Marcus',
    'Nia',
    'Derek',
    'Hailey',
    'Anthony',
    'Kayla',
    'Jamal',
    'Maya',
    'Kevin',
    'Savannah',
    'Noah',
    'Zoe',
    'Tyler',
    'Ariana',
    'Xavier',
    'Layla',
    'Ethan',
    'Jasmine',
    'Isaiah',
    'Natalie',
    'Aiden',
    'Amir',
    'Ana',
    'Andre',
    'Aria',
    'Ava',
    'Bella',
    'Brandon',
    'Caleb',
    'Camila',
    'Carlos',
    'Carmen',
    'Carter',
    'Chloe',
    'Daniel',
    'Diego',
    'Dylan',
    'Elena',
    'Elias',
    'Ella',
    'Fatima',
    'Gabriel',
    'Grace',
    'Hannah',
    'Ibrahim',
    'Imani',
    'Jaden',
    'Javier',
    'Jayden',
    'Jocelyn',
    'Jose',
    'Joseph',
    'Joshua',
    'Julian',
    'Khalil',
    'Kiara',
    'Liam',
    'Lina',
    'Logan',
    'Lucas',
    'Madison',
    'Makayla',
    'Maria',
    'Mason',
    'Mateo',
    'Mia',
    'Mohammed',
    'Nora',
    'Omar',
    'Olivia',
    'Parker',
    'Priya',
    'Quinn',
    'Riley',
    'Ryan',
    'Samuel',
    'Santiago',
    'Sarah',
    'Sofia',
    'Tania',
    'Tariq',
    'Tessa',
    'Tristan',
    'Valentina',
    'Victoria',
    'William',
    'Yasmin',
    'Zain',
    'Zara',
  ];
  const lastInitial = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const banks = [
    { bank: 'Chase', type: 'Travel Rewards' },
    { bank: 'Bank of America', type: 'Business Line' },
    { bank: 'Citi', type: 'Credit Line' },
    { bank: 'Wells Fargo', type: '0% APR Card' },
    { bank: 'Discover', type: 'Balance Transfer' },
    { bank: 'US Bank', type: 'Business Card' },
    { bank: 'American Express', type: 'Charge Card' },
    { bank: 'Capital One', type: 'Premium Card' },
    { bank: 'Navy Federal', type: 'High Limit Card' },
    { bank: 'PNC Bank', type: 'Business Card' },
  ];
  const amounts = [
    '$12,500',
    '$18,000',
    '$22,500',
    '$28,000',
    '$30,000',
    '$35,000',
    '$45,000',
    '$55,000',
    '$65,000',
    '$80,000',
    '$95,000',
    '$110,000',
    '$125,000',
    '$150,000',
  ];

  const out: ApprovalItem[] = [];
  for (let i = 0; i < 220; i++) {
    const f = first[i % first.length] ?? 'Client';
    const li = lastInitial[(i * 7) % lastInitial.length] ?? 'K';
    const b = banks[(i * 5) % banks.length] ?? banks[0]!;
    const amt = amounts[(i * 3) % amounts.length] ?? amounts[0]!;
    out.push({ name: `${f} ${li}.`, bank: b.bank, amount: amt, type: b.type });
  }
  return out;
}

const APPROVALS: ApprovalItem[] = makeApprovals();

export function LiveApprovalTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Less frequent + readable: pop in, stay, pop out, wait, then rotate.
    const VISIBLE_MS = 6800;
    const HIDDEN_MS = 14000;
    let mounted = true;
    let t1: any = null;
    let t2: any = null;

    const cycle = () => {
      if (!mounted) return;
      setIsVisible(true);
      t1 = window.setTimeout(() => {
        if (!mounted) return;
        setIsVisible(false);
        t2 = window.setTimeout(() => {
          if (!mounted) return;
          setCurrentIndex((prev) => (prev + 1) % APPROVALS.length);
          cycle();
        }, HIDDEN_MS);
      }, VISIBLE_MS);
    };

    cycle();
    return () => {
      mounted = false;
      if (t1) window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
    };
  }, []);

  const approval = APPROVALS[currentIndex];

  return (
    <div className="fixed bottom-6 left-6 z-50 hidden lg:block">
      <div
        className={`bg-[#0d1512]/95 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 shadow-2xl max-w-xs transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-[#1a2b26] border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white text-xs"
        >
          ×
        </button>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Just Approved</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-sm text-white truncate">
              <span className="font-semibold">{approval.name}</span> got{' '}
              <span className="text-emerald-400 font-bold">{approval.amount}</span>
            </p>
            <p className="text-[11px] text-white/50 truncate">
              {approval.bank} • {approval.type}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- PROGRESS BAR ---
interface ProgressBarProps {
  current: number;
  total: number;
  showSteps?: boolean;
}

export function ProgressBar({ current, total, showSteps = true }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full space-y-3">
      <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
        <div 
          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showSteps && (
        <div className="flex justify-between text-xs text-white/40">
          <span>Step {current} of {total}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}

// --- MOBILE NAVIGATION ---
interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

export function MobileNav({ isOpen, onClose, onNavigate, currentView }: MobileNavProps) {
  if (!isOpen) return null;

  const sections: { title: string; links: { id: string; label: string; activeView?: string }[] }[] = [
    {
      title: 'Explore',
      links: [
        { id: 'landing', label: 'Home' },
        { id: 'tradelines', label: 'Tradelines' },
        { id: 'testimonials', label: 'Testimonials' },
        { id: 'resources', label: 'Resources' },
        { id: 'events', label: 'Events' },
        { id: 'bookstore', label: 'Bookstore' },
      ],
    },
    {
      title: 'Services',
      links: [
        { id: '/services/personal-credit-restore', label: 'Personal Restore', activeView: 'services' },
        { id: '/services/personal-credit-building', label: 'Personal Building', activeView: 'services' },
        { id: '/services/business-credit', label: 'Business Credit', activeView: 'services' },
        { id: '/services/debt-legal', label: 'Debt & Legal', activeView: 'services' },
        { id: '/services/wealth-builder', label: 'Wealth Builder', activeView: 'services' },
        { id: '/services/privacy-id', label: 'Privacy & ID', activeView: 'services' },
        { id: '/services/tradelines', label: 'Tradelines', activeView: 'services' },
        { id: '/services/bundles', label: 'Bundles', activeView: 'services' },
        { id: '/services/agencies', label: 'Agencies', activeView: 'services' },
      ],
    },
    {
      title: 'Company',
      links: [
        { id: 'about', label: 'About Us' },
        { id: 'affiliate', label: 'Affiliate' },
        { id: 'contact', label: 'Contact' },
        { id: 'faq', label: 'FAQ' },
      ],
    },
    {
      title: 'Account',
      links: [{ id: 'onboarding', label: 'Login / Signup' }],
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] lg:hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-[88vw] max-w-[340px] bg-[#0d1512] border-l border-white/10 p-4 sm:p-6 animate-in slide-in-from-right duration-300">
        <div className="grid grid-cols-3 items-center mb-5">
          <div />
          <div className="text-center">
            <span className="text-base sm:text-lg font-bold tracking-wider text-white">
              FINELY <span className="text-amber-500">CRED</span>
            </span>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-white/10">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
                  {section.title}
                </div>
              </div>
              <div className="p-3 space-y-2">
                {section.links.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => {
                      onNavigate(link.id);
                      onClose();
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors text-sm font-semibold ${
                      (link.activeView ? currentView === link.activeView : currentView === link.id)
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'text-white/75 border-white/10 bg-black/30 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

// --- STAT CARD ---
interface StatCardProps {
  value: string | number;
  label: string;
  suffix?: string;
  highlight?: boolean;
}

export function StatCard({ value, label, suffix = '', highlight = false }: StatCardProps) {
  return (
    <div className={`text-center p-6 rounded-2xl border ${highlight ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
      <p className={`text-3xl lg:text-4xl font-light ${highlight ? 'text-amber-500' : 'text-white'}`}>
        {typeof value === 'number' ? <AnimatedCounter value={value} suffix={suffix} /> : value}
      </p>
      <p className="text-xs text-white/50 uppercase tracking-wider mt-2">{label}</p>
    </div>
  );
}
