import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Sparkles, Menu, X } from 'lucide-react';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyThemeToggle } from '../../features/os/FinelyThemeToggle';
import {
  PUBLIC_CAREER_PATHS,
  PUBLIC_CONTACT_LINKS,
  PUBLIC_CORE_NAV,
  PUBLIC_HOS_NAV,
  PUBLIC_RESOURCES_SECTIONS,
  SITE_WAYFINDER_LANES,
} from '../../config/siteWayfinderLanes';
import { FinelyCredLogo } from '../brand/FinelyCredLogo';
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
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'platinum' | 'gold' | 'emerald' | 'royal';
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
    outline: `bg-white/[0.04] border-2 border-[rgba(var(--brand-primary-rgb),0.60)] text-[color:var(--brand-primary)] hover:bg-[rgba(var(--brand-primary-rgb),0.14)] hover:brightness-110 font-bold`,
    
    // Ghost: Subtle hover effect
    ghost: `fc-light-glass-panel fc-light-chrome-panel border text-white/80 hover:text-white hover:bg-white/[0.06] font-semibold`,

    // Platinum: theme-aware — silver on dark, obsidian on light (CSS)
    platinum: `fc-button-platinum-surface font-black`,

    // Gold: Luxury metallic gradient (matches Finely Gold card)
    gold: `bg-[linear-gradient(135deg,#ffeaa7_0%,#fdcb6e_15%,#f39c12_35%,#d68910_50%,#f39c12_65%,#fdcb6e_85%,#ffeaa7_100%)] text-[#1a1400] font-black shadow-lg shadow-black/30 hover:brightness-110 border-t border-white/40`,

    // Emerald: shiny green metallic (same material treatment as gold, green hue)
    emerald: `bg-[linear-gradient(135deg,#ecfdf5_0%,#a7f3d0_15%,#34d399_35%,#059669_50%,#34d399_65%,#a7f3d0_85%,#ecfdf5_100%)] text-[#04130c] font-black shadow-lg shadow-black/30 hover:brightness-110 border-t border-white/40`,

    // Royal: shiny violet metallic (distinct premium accent)
    royal: `bg-[linear-gradient(135deg,#f5f3ff_0%,#ddd6fe_15%,#a78bfa_35%,#7c3aed_50%,#a78bfa_65%,#ddd6fe_85%,#f5f3ff_100%)] text-[#1a0b2e] font-black shadow-lg shadow-black/30 hover:brightness-110 border-t border-white/40`,
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
      className={`group relative overflow-hidden rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--brand-primary-rgb),0.62)] focus-visible:ring-offset-2 focus-visible:ring-offset-fc-shell ${styles[variant]} ${sizes[size]} ${className}`}
    >
      <span className="relative z-[1] flex items-center justify-center gap-2.5">
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
      </span>
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
  color?: 'amber' | 'gold' | 'platinum' | 'green' | 'emerald' | 'red' | 'blue' | 'violet' | 'fuchsia' | 'sky' | 'cyan';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function FlashyIcon({ icon: IconComponent, color = 'amber', size = 'md', className = '' }: FlashyIconProps) {
  const [isLight, setIsLight] = useState(
    () => typeof document !== 'undefined' && document.documentElement.getAttribute('data-fc-theme') === 'light',
  );

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsLight(root.getAttribute('data-fc-theme') === 'light');
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ['data-fc-theme'] });
    return () => obs.disconnect();
  }, []);


  const colorMap: Record<string, { shell: string; glow: string; icon: string; aura: string }> = {
    amber: {
      shell: 'border-amber-300/55 bg-gradient-to-br from-amber-300/28 via-amber-500/12 to-black/20',
      glow: 'shadow-[0_0_42px_-8px_rgba(245,158,11,0.78),inset_0_1px_0_rgba(255,255,255,0.20)]',
      icon: 'text-amber-200',
      aura: 'bg-amber-400/34',
    },
    gold: {
      shell: 'border-yellow-300/55 bg-gradient-to-br from-yellow-300/28 via-yellow-500/12 to-black/20',
      glow: 'shadow-[0_0_42px_-8px_rgba(234,179,8,0.72),inset_0_1px_0_rgba(255,255,255,0.22)]',
      icon: 'text-yellow-200',
      aura: 'bg-yellow-300/32',
    },
    platinum: {
      shell: 'border-white/35 bg-gradient-to-br from-white/24 via-slate-300/12 to-black/10',
      glow: 'shadow-[0_0_38px_-10px_rgba(255,255,255,0.46),inset_0_1px_0_rgba(255,255,255,0.32)]',
      icon: 'text-white',
      aura: 'bg-white/24',
    },
    green: {
      shell: 'border-emerald-300/55 bg-gradient-to-br from-emerald-300/28 via-emerald-500/12 to-black/20',
      glow: 'shadow-[0_0_42px_-8px_rgba(16,185,129,0.70),inset_0_1px_0_rgba(255,255,255,0.20)]',
      icon: 'text-emerald-200',
      aura: 'bg-emerald-400/30',
    },
    emerald: {
      shell: 'border-emerald-300/55 bg-gradient-to-br from-emerald-300/28 via-emerald-500/12 to-black/20',
      glow: 'shadow-[0_0_42px_-8px_rgba(16,185,129,0.70),inset_0_1px_0_rgba(255,255,255,0.20)]',
      icon: 'text-emerald-200',
      aura: 'bg-emerald-400/30',
    },
    red: {
      shell: 'border-rose-300/55 bg-gradient-to-br from-rose-300/28 via-rose-500/12 to-black/20',
      glow: 'shadow-[0_0_42px_-8px_rgba(244,63,94,0.66),inset_0_1px_0_rgba(255,255,255,0.20)]',
      icon: 'text-rose-200',
      aura: 'bg-rose-400/30',
    },
    blue: {
      shell: 'border-sky-300/55 bg-gradient-to-br from-sky-300/28 via-sky-500/12 to-black/20',
      glow: 'shadow-[0_0_42px_-8px_rgba(14,165,233,0.68),inset_0_1px_0_rgba(255,255,255,0.20)]',
      icon: 'text-sky-200',
      aura: 'bg-sky-400/30',
    },
    violet: {
      shell: 'border-violet-300/55 bg-gradient-to-br from-violet-300/28 via-violet-500/12 to-black/20',
      glow: 'shadow-[0_0_42px_-8px_rgba(139,92,246,0.72),inset_0_1px_0_rgba(255,255,255,0.20)]',
      icon: 'text-violet-200',
      aura: 'bg-violet-400/32',
    },
    fuchsia: {
      shell: 'border-fuchsia-300/55 bg-gradient-to-br from-fuchsia-300/28 via-fuchsia-500/12 to-black/20',
      glow: 'shadow-[0_0_42px_-8px_rgba(217,70,239,0.70),inset_0_1px_0_rgba(255,255,255,0.20)]',
      icon: 'text-fuchsia-200',
      aura: 'bg-fuchsia-400/30',
    },
    sky: {
      shell: 'border-cyan-300/55 bg-gradient-to-br from-cyan-300/28 via-cyan-500/12 to-black/20',
      glow: 'shadow-[0_0_42px_-8px_rgba(34,211,238,0.62),inset_0_1px_0_rgba(255,255,255,0.20)]',
      icon: 'text-cyan-200',
      aura: 'bg-cyan-400/28',
    },
    cyan: {
      shell: 'border-cyan-300/55 bg-gradient-to-br from-cyan-300/28 via-cyan-500/12 to-black/20',
      glow: 'shadow-[0_0_42px_-8px_rgba(34,211,238,0.62),inset_0_1px_0_rgba(255,255,255,0.20)]',
      icon: 'text-cyan-200',
      aura: 'bg-cyan-400/28',
    },
  };

  const sizeMap: Record<string, { container: string; icon: number }> = {
    xs: { container: 'w-10 h-10 rounded-xl', icon: 17 },
    sm: { container: 'w-14 h-14 rounded-2xl', icon: 24 },
    md: { container: 'w-[4.5rem] h-[4.5rem] rounded-[1.4rem]', icon: 31 },
    lg: { container: 'w-24 h-24 rounded-3xl', icon: 40 },
    xl: { container: 'w-28 h-28 rounded-[2rem]', icon: 48 },
  };

  const palette = colorMap[color] ?? colorMap.amber;
  const dim = sizeMap[size] ?? sizeMap.md;

  if (!IconComponent) return null;

  if (isLight) {
    return (
      <div
        data-fc-flashy-icon={color}
        className={`fc-flashy-icon fc-flashy-icon-light-luxury relative isolate flex items-center justify-center overflow-hidden border backdrop-blur-md ring-1 ring-inset ring-white/20 ${palette.shell} ${palette.glow} ${dim.container} ${className}`}
      >
        <div className={`absolute -inset-5 rounded-full blur-2xl ${palette.aura} opacity-80 pointer-events-none`} />
        <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.42),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.22),transparent_45%,rgba(0,0,0,0.18))] pointer-events-none" />
        <div className="absolute inset-[3px] rounded-[inherit] border border-white/20 pointer-events-none" />
        <div className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full bg-white/55 blur-[1px] pointer-events-none" />
        <IconComponent
          size={dim.icon}
          strokeWidth={2.15}
          className={`relative z-[1] ${palette.icon} drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)]`}
        />
      </div>
    );
  }

  return (
    <div
      data-fc-flashy-icon={color}
      className={`fc-flashy-icon relative isolate flex items-center justify-center overflow-hidden border backdrop-blur-md ring-1 ring-inset ring-white/15 ${palette.shell} ${palette.glow} ${dim.container} ${className}`}
    >
      <div className={`absolute -inset-5 rounded-full blur-2xl ${palette.aura} opacity-70 pointer-events-none`} />
      <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.34),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.16),transparent_45%,rgba(0,0,0,0.26))] pointer-events-none" />
      <div className="absolute inset-[3px] rounded-[inherit] border border-white/12 pointer-events-none" />
      <div className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-white/45 blur-[1px] pointer-events-none" />
      <IconComponent size={dim.icon} strokeWidth={1.85} className={`relative z-[1] ${palette.icon} drop-shadow-[0_0_14px_rgba(255,255,255,0.22)]`} />
    </div>
  );
}

/** Public marketing pages — premium icon badge (alias) */
export const FcPublicIcon = FlashyIcon;

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
    const f = first[i % first.length] ?? 'Customer';
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
        className={`bg-fc-section/95 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 shadow-2xl max-w-xs transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-[#1a2b26] border border-white/[0.08] rounded-full flex items-center justify-center text-white/40 hover:text-white text-xs"
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
  showThemeToggle?: boolean;
}

export function MobileNav({ isOpen, onClose, onNavigate, showThemeToggle = false }: MobileNavProps) {
  const location = useLocation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] lg:hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-[88vw] max-w-[340px] bg-fc-section border-l border-white/[0.08] p-4 sm:p-6 animate-in slide-in-from-right duration-300 overflow-y-auto fc-mobile-nav-panel">
        <div className="grid grid-cols-3 items-center mb-5">
          <div />
          <div className="text-center">
            <FinelyCredLogo size="sm" />
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {showThemeToggle ? (
          <div className="mb-4">
            <FinelyThemeToggle />
          </div>
        ) : null}

        <nav className="space-y-3">
          <div className="fc-mobile-nav-section">
            <div className="fc-public-nav-section-title px-1 mb-2">Main</div>
            {PUBLIC_CORE_NAV.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  onNavigate(link.path);
                  onClose();
                }}
                className={`w-full text-left fc-nav-pill-compact mb-1 ${link.match(location.pathname) ? 'fc-nav-pill-active' : ''}`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="fc-mobile-nav-section">
            <div className="fc-public-nav-section-title px-1 mb-2">Resources</div>
            {PUBLIC_RESOURCES_SECTIONS.map((section) => (
              <div key={section.id} className="mb-3">
                <p className="px-1 mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">{section.title}</p>
                {section.links.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => {
                      onNavigate(link.path);
                      onClose();
                    }}
                    className="fc-public-nav-row w-full text-left mb-0.5"
                  >
                    <span className="text-sm font-semibold text-white/90">{link.label}</span>
                    {link.hint ? <span className="mt-0.5 block text-xs text-white/48">{link.hint}</span> : null}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="fc-mobile-nav-section">
            <div className="fc-public-nav-section-title px-1 mb-2">{PUBLIC_HOS_NAV.label}</div>
            <p className="px-1 text-xs text-white/50">Separate member entrance — disputes, business credit, and the free guide.</p>
            <button
              type="button"
              onClick={() => {
                onNavigate(PUBLIC_HOS_NAV.path);
                onClose();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors text-sm font-semibold ${
                PUBLIC_HOS_NAV.match(location.pathname) ? 'fc-nav-pill-hos-active' : 'fc-nav-pill-hos'
              }`}
            >
              Join {PUBLIC_HOS_NAV.shortLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate(PUBLIC_HOS_NAV.loginPath);
                onClose();
              }}
              className="w-full text-left fc-nav-pill text-sm"
            >
              HOS member login
            </button>
          </div>

          <div className="fc-mobile-nav-section">
            <div className="fc-public-nav-section-title px-1 mb-2">Careers</div>
            {PUBLIC_CAREER_PATHS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  onNavigate(link.path);
                  onClose();
                }}
                className="w-full text-left fc-nav-pill !rounded-xl !py-2.5 text-sm"
              >
                <div className="font-semibold">{link.label}</div>
                {link.hint ? <div className="text-xs opacity-70 font-normal">{link.hint}</div> : null}
              </button>
            ))}
          </div>

          <div className="fc-mobile-nav-section">
            <div className="fc-public-nav-section-title px-1 mb-2">Contact</div>
            {PUBLIC_CONTACT_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  onNavigate(link.path);
                  onClose();
                }}
                className="fc-public-nav-row w-full text-left mb-0.5"
              >
                <span className="text-sm font-semibold text-white/90">{link.label}</span>
                {link.hint ? <span className="mt-0.5 block text-xs text-white/48">{link.hint}</span> : null}
              </button>
            ))}
          </div>

          <div className="fc-mobile-nav-section">
            <div className="fc-public-nav-section-title px-1 mb-2">Pick a lane</div>
            <div className="space-y-2">
              {SITE_WAYFINDER_LANES.map((lane) => (
                <button
                  key={lane.id}
                  type="button"
                  onClick={() => {
                    onNavigate(lane.path);
                    onClose();
                  }}
                  className="w-full text-left fc-nav-pill !rounded-xl !p-3"
                >
                  <div className="font-semibold">{lane.label}</div>
                  <div className="text-xs opacity-70">{lane.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onNavigate('onboarding');
              onClose();
            }}
            className="w-full fc-nav-pill-ghost mt-2"
          >
            Login / Signup
          </button>
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
    <div className={`text-center p-6 rounded-2xl border ${highlight ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/[0.08]'}`}>
      <p className={`text-3xl lg:text-4xl font-light ${highlight ? 'text-amber-500' : 'text-white'}`}>
        {typeof value === 'number' ? <AnimatedCounter value={value} suffix={suffix} /> : value}
      </p>
      <p className="text-xs text-white/50 uppercase tracking-wider mt-2">{label}</p>
    </div>
  );
}
