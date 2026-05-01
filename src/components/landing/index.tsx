import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  Wifi, Globe, BarChart3, Clock, Calendar, Shield, CheckCircle2, 
  Sparkles, Verified, TrendingUp, Cpu, Activity, Users, Heart, Target,
  Award, Star, ArrowRight, CreditCard, Building2, DollarSign, Zap,
  Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Youtube,
  BadgeCheck, Lock, FileText, AlertCircle
} from 'lucide-react';
import { CARD_CONFIGS, Button, Reveal, FlashyIcon, AnimatedCounter, LoopingTypingHeader } from '../ui';
import { loadSettings, getPricingControls } from '../../data/settingsRepo';
import { listAuSellersByTenant } from '../../data/auSellerRepo';
import { getActiveTenant, getActiveTenantId } from '../../tenancy/activeTenant';

// ============================================================================
// REALISTIC CREDIT CARD - Horizontal display optimized
// ============================================================================
interface CreditCardAssetProps {
  type?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Override the top-right two-line label (default: CREDIT CARD + Finely tier). */
  metaTop?: string;
  metaBottom?: string;
  /** Override the "card number" line (used for AU details). */
  numberText?: string;
  /** Override bottom row labels/values. */
  bottomLeftLabel?: string;
  bottomLeftValue?: string;
  bottomRightLabel?: string;
  bottomRightValue?: string;
  /** Override microtext band. */
  microText?: string;
}

export function CreditCardAsset({
  type = 'black',
  className = '',
  style,
  metaTop,
  metaBottom,
  numberText,
  bottomLeftLabel,
  bottomLeftValue,
  bottomRightLabel,
  bottomRightValue,
  microText,
}: CreditCardAssetProps) {
  const config = CARD_CONFIGS[type] || CARD_CONFIGS.black;
  const isBlack = type === 'black';
  const isGold = type === 'gold';
  const isPlatinum = type === 'platinum';
  const cardNumber =
    type === 'gold'
      ? '4275 3156 0372 5493'
      : type === 'platinum'
        ? '4000 5775 6875 3456'
        : '4275 3156 0372 5493';
  const cardHolder = type === 'black' ? 'ALEX MORGAN' : type === 'gold' ? 'FINELY MEMBER' : 'FINELY MEMBER';
  const validThru = type === 'black' ? '01/29' : type === 'gold' ? '01/29' : '05/29';
  const numberStyle: React.CSSProperties = {
    textShadow:
      isGold
        ? '0 1px 0 rgba(255,255,255,0.40), 0 -1px 0 rgba(0,0,0,0.35), 0 2px 10px rgba(0,0,0,0.22)'
        : isPlatinum
          ? '0 1px 0 rgba(255,255,255,0.60), 0 -1px 0 rgba(0,0,0,0.25), 0 2px 12px rgba(0,0,0,0.16)'
          : '0 1px 0 rgba(255,255,255,0.18), 0 -1px 0 rgba(0,0,0,0.60), 0 2px 14px rgba(0,0,0,0.36)',
  };
  const foilTextStyle: React.CSSProperties | undefined = (isGold || isBlack)
    ? {
        // Lighter, higher-contrast foil so the AU numbers stay readable.
        backgroundImage: isGold
          ? 'linear-gradient(180deg, #fff9dc 0%, #ffe8a3 22%, #ffd36a 48%, #fff0bf 72%, #ffbf2f 100%)'
          : 'linear-gradient(180deg, #fff6d0 0%, #ffe39b 22%, #ffc957 50%, #fff0bf 74%, #ffb020 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        textShadow: '0 1px 0 rgba(255,255,255,0.32), 0 -1px 0 rgba(0,0,0,0.55), 0 3px 14px rgba(0,0,0,0.40)',
      }
    : undefined;
  const titleFoilClass = isBlack ? 'text-amber-200/90' : isGold ? 'text-[#2a210f]/85' : 'text-white/70';
  const metaTopText = (metaTop || 'CREDIT CARD').toUpperCase();
  const metaBottomText = (metaBottom || config.label).toUpperCase();
  const isAu = typeof numberText === 'string' || typeof metaBottom === 'string' || typeof metaTop === 'string';
  const cardNumberText = numberText ?? cardNumber;
  const auParts =
    isAu && typeof cardNumberText === 'string' && cardNumberText.includes('•')
      ? cardNumberText
          .split('•')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;
  const leftLabel = bottomLeftLabel ?? 'CARD HOLDER';
  const leftValue = bottomLeftValue ?? cardHolder;
  const rightLabel = bottomRightLabel ?? 'VALID THRU';
  const rightValue = bottomRightValue ?? validThru;
  const micro = microText ?? 'AUTHORIZED USE ONLY • FINELY CRED • MEMBER SERVICES • VOID IF ALTERED';

  const NetworkMark = () => {
    // Simple, “logo-like” marks (no trademarked logos)
    if (type === 'platinum') {
      return (
        <div className="px-2.5 py-1 rounded-md bg-black/10 border border-black/10 text-[9px] font-black tracking-[0.22em] uppercase text-slate-900/80">
          AMEX
        </div>
      );
    }
    if (type === 'gold') {
      return (
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-4">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#b45309]/60" />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#7c2d12]/55" />
          </div>
          <span className="text-[9px] font-black tracking-[0.2em] uppercase text-[#2a210f]/70">MC</span>
        </div>
      );
    }
    return (
      <div className="text-[10px] font-black tracking-[0.22em] uppercase text-amber-200/80 italic">
        VISA
      </div>
    );
  };

  return (
    <div 
      className={`group relative w-[330px] h-[210px] rounded-[20px] p-5 flex flex-col justify-between overflow-hidden ${config.bg} ${className} transition-transform duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.01]`}
      style={{ 
        boxShadow: '0 38px 78px -24px rgba(0,0,0,0.82), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -2px 0 rgba(0,0,0,0.52)',
        ...style
      }}
    >
      {/* Material layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/22 via-transparent to-black/40 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-80"
        style={{
          background:
            'radial-gradient(180px 120px at 14% 18%, rgba(255,255,255,0.16), transparent 60%), radial-gradient(220px 150px at 86% 10%, rgba(255,255,255,0.08), transparent 60%)'
        }}
      />
      <div className={`absolute inset-0 pointer-events-none ${isBlack ? 'opacity-[0.06]' : isGold ? 'opacity-[0.14]' : 'opacity-[0.12]'} bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]`} />
      {/* Metallic micro-texture (match the premium button metal, keep base colors) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isBlack ? 0.18 : isGold ? 0.20 : 0.16,
          mixBlendMode: isGold ? ('overlay' as any) : ('soft-light' as any),
          backgroundImage: [
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 26px)',
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 18px)',
            'radial-gradient(280px 190px at 76% 14%, rgba(255,255,255,0.18), transparent 62%)',
            'radial-gradient(320px 220px at 18% 86%, rgba(0,0,0,0.18), transparent 70%)',
          ].join(', '),
        }}
      />
      {isGold && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.18]"
          style={{
            backgroundImage: 'radial-gradient(rgba(0,0,0,0.16) 1px, transparent 1px)',
            backgroundSize: '6px 6px',
            mixBlendMode: 'multiply'
          }}
        />
      )}
      {/* Black matte + glossy wave band */}
      {isBlack && (
        <>
          <div className="absolute inset-0 pointer-events-none bg-black/25 mix-blend-multiply" />
          <div
            className="absolute -right-20 top-16 w-[460px] h-[160px] pointer-events-none opacity-80 transition-transform duration-700 ease-out group-hover:translate-x-3"
            style={{
              background:
                'radial-gradient(closest-side at 30% 50%, rgba(255,255,255,0.14), transparent 70%), linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 55%, rgba(255,255,255,0.10))',
              borderRadius: '999px',
              filter: 'blur(0.2px)',
              transform: 'rotate(-4deg)'
            }}
          />
          {/* Signature strip (subtle) */}
          <div className="absolute left-5 right-16 top-[128px] h-6 rounded-md bg-white/10 border border-white/10 pointer-events-none opacity-35" />
        </>
      )}
      {/* Platinum guilloché rings */}
      {isPlatinum && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.22]"
          style={{
            background:
              'radial-gradient(circle at 72% 68%, rgba(15,23,42,0.12) 0 1px, transparent 1px 10px), radial-gradient(circle at 72% 68%, rgba(15,23,42,0.10) 0 1px, transparent 1px 18px)',
            maskImage: 'radial-gradient(circle at 72% 68%, black 0 55%, transparent 72%)'
          }}
        />
      )}
      {/* Moving specular streak on hover */}
      <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/22 to-transparent rotate-[35deg] translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-1000 ease-out pointer-events-none" />
      {/* Edge thickness illusion */}
      <div className="absolute inset-0 pointer-events-none rounded-[20px]"
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 -10px 18px rgba(0,0,0,0.22), inset 0 10px 16px rgba(255,255,255,0.06)'
        }}
      />
      <div className="absolute inset-0 pointer-events-none rounded-[20px] opacity-70"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.10), transparent 22%, transparent 78%, rgba(0,0,0,0.25))'
        }}
      />
      {/* Hologram mark */}
      <div className="absolute bottom-5 right-5 w-10 h-10 rounded-full opacity-55 pointer-events-none bg-[conic-gradient(from_180deg,#fbbf24,#a78bfa,#22c55e,#38bdf8,#fbbf24)] blur-[0.2px] transition-transform duration-700 ease-out group-hover:scale-110" />
      <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full opacity-25 pointer-events-none bg-white blur-[0.5px]" />
      <div className="absolute bottom-5 right-5 w-10 h-10 rounded-full pointer-events-none opacity-0 group-hover:opacity-20 transition-opacity duration-500"
        style={{
          background: 'conic-gradient(from 180deg, #fbbf24, #a78bfa, #22c55e, #38bdf8, #fbbf24)',
          filter: 'hue-rotate(35deg)',
          borderRadius: '999px'
        }}
      />
      
      {/* Top row */}
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-3">
          {/* EMV chip */}
          <div className="relative w-12 h-9 rounded-md bg-black/35 border border-black/50 shadow-[inset_0_2px_5px_rgba(0,0,0,0.65)]">
            <div className={`absolute inset-[2px] rounded-[6px] bg-gradient-to-br ${config.chip} shadow-inner border border-black/35`}>
              <div className="absolute inset-[3px] border border-white/30 rounded-[4px] opacity-60" />
              <div className="w-full h-full grid grid-cols-3 gap-px p-1 opacity-85">
                <div className="bg-black/25 rounded-sm" />
                <div className="bg-black/25 rounded-sm" />
                <div className="bg-black/25 rounded-sm" />
                <div className="bg-black/25 rounded-sm" />
                <div className="bg-black/25 rounded-sm" />
                <div className="bg-black/25 rounded-sm" />
              </div>
              <div className="absolute inset-0 pointer-events-none opacity-35">
                <div className="absolute left-1 top-1 bottom-1 w-px bg-black/60" />
                <div className="absolute right-1 top-1 bottom-1 w-px bg-black/60" />
                <div className="absolute left-1 right-1 top-1 h-px bg-black/60" />
                <div className="absolute left-1 right-1 bottom-1 h-px bg-black/60" />
              </div>
            </div>
            <div className="absolute inset-0 rounded-md ring-1 ring-white/10 pointer-events-none" />
          </div>
          <Wifi size={18} className={`${config.accent} opacity-70 rotate-90`} />
        </div>
        <div className="text-right max-w-[170px]">
          <p className={`text-[11px] font-semibold tracking-[0.22em] uppercase ${titleFoilClass} truncate`}>{metaTopText}</p>
          <p className={`text-[9px] font-bold tracking-[0.32em] uppercase ${config.lettering} truncate`}>{metaBottomText}</p>
        </div>
      </div>

      {/* Card Number */}
      <div className="relative z-10">
        {auParts && auParts.length >= 2 ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <div className={`text-[8px] uppercase tracking-widest opacity-60 ${config.accent}`}>Limit</div>
              <div
                className={`mt-0.5 text-[18px] sm:text-[19px] font-black tracking-[0.06em] ${config.accent}`}
                style={{
                  ...(foilTextStyle || {}),
                  textShadow: isBlack ? '0 1px 0 rgba(255,255,255,0.10), 0 -1px 0 rgba(0,0,0,0.65)' : '0 1px 0 rgba(255,255,255,0.18), 0 -1px 0 rgba(0,0,0,0.35)',
                }}
              >
                {auParts[0]}
              </div>
            </div>
            <div className="text-right min-w-0">
              <div className={`text-[8px] uppercase tracking-widest opacity-60 ${config.accent}`}>Age</div>
              <div
                className={`mt-0.5 text-[18px] sm:text-[19px] font-black tracking-[0.06em] ${config.accent}`}
                style={{
                  ...(foilTextStyle || {}),
                  textShadow: isBlack ? '0 1px 0 rgba(255,255,255,0.10), 0 -1px 0 rgba(0,0,0,0.65)' : '0 1px 0 rgba(255,255,255,0.18), 0 -1px 0 rgba(0,0,0,0.35)',
                }}
              >
                {auParts[1]}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Embossed digits (double-layer) */}
            <p
              className={`${isAu ? 'text-[18px] sm:text-[19px] tracking-[0.08em] font-black' : 'text-[21px] tracking-[0.22em] font-mono'} ${
                config.accent
              }`}
              style={{ ...numberStyle, ...(foilTextStyle || {}) }}
            >
              {cardNumberText}
            </p>
            {/* Tiny highlight pass for extra emboss pop */}
            <p
              className={`absolute left-0 top-0 pointer-events-none ${
                isAu ? 'text-[18px] sm:text-[19px] tracking-[0.08em] font-black' : 'text-[21px] tracking-[0.22em] font-mono'
              }`}
              style={{
                color: 'rgba(255,255,255,0.14)',
                transform: 'translateY(-0.6px)',
                opacity: isGold ? 0.25 : isPlatinum ? 0.22 : 0.14,
                mixBlendMode: 'overlay'
              }}
            >
              {cardNumberText}
            </p>
          </>
        )}
      </div>

      {/* Bottom row */}
      <div className="relative z-10 space-y-1">
        <div className="flex justify-between items-end">
          <div>
            <p className={`text-[8px] uppercase tracking-wider opacity-60 ${config.accent}`}>{leftLabel}</p>
            <p
              className={`text-[9px] font-semibold ${
                isAu ? 'tracking-[0.14em]' : 'tracking-[0.35em]'
              } uppercase ${config.accent} opacity-85`}
              style={{
                textShadow: isBlack ? '0 1px 0 rgba(255,255,255,0.12), 0 -1px 0 rgba(0,0,0,0.6)' : '0 1px 0 rgba(255,255,255,0.25), 0 -1px 0 rgba(0,0,0,0.35)'
              }}
            >
              {leftValue}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-[8px] uppercase tracking-wider opacity-60 ${config.accent}`}>{rightLabel}</p>
            <p className={`text-[11px] font-semibold ${config.accent}`}>{rightValue}</p>
          </div>
          <div className="flex items-end justify-end">
            <NetworkMark />
          </div>
        </div>

        {/* Microtext band (kept clean; no overlap) */}
        <div className={`text-[6px] tracking-[0.45em] uppercase ${config.accent} opacity-30`}>
          {micro}
        </div>
      </div>

      {/* Edge highlight + bevel */}
      <div className="absolute inset-0 rounded-[20px] ring-1 ring-white/12 pointer-events-none" />
      <div className="absolute inset-0 rounded-[20px] border border-black/20 pointer-events-none" />
    </div>
  );
}

// ============================================================================
// HERO SECTION - With banner background and horizontal card fan
// ============================================================================
interface HeroSectionProps {
  onGetStarted: () => void;
  onViewTradelines: () => void;
}

export function HeroSection({ onGetStarted, onViewTradelines }: HeroSectionProps) {
  const tenant = useMemo(() => getActiveTenant(), []);
  const brand = (tenant.settings.brandName || tenant.name || 'Finely Cred').trim();
  const heroKicker = (tenant.settings.content?.landingHeroKicker || 'Full Credit Solution Company').trim();
  const heroSubtitle = (
    tenant.settings.content?.landingHeroSubtitle ||
    'Institutional credit solutions across personal, business, debt kill, tradelines, and wealth builder paths — choose DIY access or Done‑For‑You execution.'
  ).trim();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0d1512]" />
      {/* Aerial skyline (sky-view) */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1483653364400-eedcfb9f1f88?auto=format&fit=crop&w=2400&q=80')] bg-cover bg-top opacity-50 saturate-125 contrast-110 animate-skyline-pan" />
      {/* Moving clouds overlay (subtle, premium) */}
      <div className="absolute inset-0 hero-clouds pointer-events-none" />
      {/* Premium non-bubble motion layers */}
      <div className="finely-prism-motion" />
      <div className="finely-diagonal-strata" />
      {/* Readability overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d1512] via-[#0d1512]/90 to-[#0d1512]/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1512] via-transparent to-transparent" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Shield size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">{heroKicker}</span>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-white">
                {brand} Is A
                <span className="block text-amber-500 font-medium min-h-[1.4em]">
                  <LoopingTypingHeader
                    phrases={[
                      "Full On Credit Solution Company",
                      "Full Credit Solution Company",
                      "Institutional Credit Solutions"
                    ]}
                  />
                </span>
              </h1>
            </Reveal>

            <Reveal delay={300}>
              <p className="text-lg text-white/60 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {heroSubtitle}
              </p>
            </Reveal>

            <Reveal delay={450}>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Button variant="gold" onClick={onGetStarted} size="lg">
                  Learn More <ArrowRight size={18} />
                </Button>
                <Button variant="platinum" onClick={onViewTradelines} size="lg">
                  View Tradelines
                </Button>
              </div>
            </Reveal>

            {/* Stats */}
            <Reveal delay={600}>
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-light text-white">
                    <AnimatedCounter value={98} suffix="%" />
                  </p>
                  <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Success Rate</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-light text-white">
                    24<span className="text-amber-500">hrs</span>
                  </p>
                  <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Fast Results</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-light text-white">
                    $<AnimatedCounter value={500} />K+
                  </p>
                  <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Debt plan volume</p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Content - Credit Cards in stacked layout */}
          <Reveal delay={300} direction="right">
            <div className="relative h-[420px] lg:h-[460px] w-[520px] max-w-full ml-auto lg:translate-x-14 scale-[1.06] origin-right">
              {/* Card 1 - Top (Orange/Gold) */}
              <div 
                className="absolute transition-all duration-500 hover:translate-y-[-6px]"
                style={{ 
                  top: 0,
                  left: 0,
                  zIndex: 2
                }}
              >
                <CreditCardAsset type="gold" />
              </div>
              
              {/* Card 2 - Bottom (Platinum) */}
              <div 
                className="absolute transition-all duration-500 hover:translate-y-[-6px]"
                style={{ 
                  top: 220,
                  left: 0,
                  zIndex: 1
                }}
              >
                <CreditCardAsset type="platinum" />
              </div>
              
              {/* Card 3 - Overlapping (Black, offset right) */}
              <div 
                className="absolute transition-all duration-500 hover:translate-y-[-6px]"
                style={{ 
                  top: 110,
                  left: 160,
                  zIndex: 3
                }}
              >
                <CreditCardAsset type="black" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// VIOLATION LIVE FEED
// ============================================================================
export function ViolationLiveFeed() {
  const violations = [
    { code: "FCRA § 604", msg: "UNAUTHORIZED INQUIRY SUPPRESSION ACTIVE", status: "CLEARED" },
    { code: "FDCPA § 807", msg: "MISLEADING REPRESENTATION DETECTED", status: "ENFORCING" },
    { code: "15 U.S.C. § 1681i", msg: "DEROGATORY ITEM VACATED", status: "SUCCESS" },
    { code: "CFPB REG", msg: "COMPLIANCE VIOLATION LOGGED", status: "ACTIVE" },
  ];

  return (
    <div className="w-full bg-black/80 border-y border-amber-500/20 py-3 overflow-hidden">
      <div className="flex items-center whitespace-nowrap animate-marquee">
        {[...violations, ...violations].map((v, i) => (
          <div key={i} className="flex items-center gap-6 px-8">
            <span className="px-3 py-1 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {v.code}
            </span>
            <span className="text-xs text-white/50 uppercase tracking-wider">{v.msg}</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-400 font-semibold">{v.status}</span>
            </span>
            <span className="text-white/20">|</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// QUALIFY FOR FUNDING SECTION
// ============================================================================
export function QualifyFundingSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-[#0d1512] to-[#0f1a16]">
      <div className="container mx-auto px-6 max-w-4xl text-center">
        <Reveal>
          <h2 className="text-3xl lg:text-5xl font-light text-white mb-6">
            Eliminate Debt <span className="text-amber-500">Rapidly</span>
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="text-lg text-white/50 leading-relaxed mb-8">
            Change the way you view credit. Debt elimination and fundability prep start with clean reporting, disciplined utilization,
            and strategic sequencing — we build the plan and the workflow so you stop guessing.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <Zap size={20} className="text-emerald-400" />
            <span className="text-emerald-400 font-semibold">Get a debt + fundability gameplan in as little as 24 hours.</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ============================================================================
// SERVICES SECTION
// ============================================================================
export function ServicesSection({ onNavigate }: { onNavigate: (page: string) => void }) {
  const services = [
    { 
      icon: Building2, 
      title: "Business Credit", 
      desc: "Build your EIN credit separate from your SSN for stronger approvals and long-term fundability.",
      color: "amber" as const
    },
    { 
      icon: CreditCard, 
      title: "Personal Credit", 
      desc: "Restore and optimize your personal credit profile for better rates and approvals.",
      color: "green" as const
    },
    { 
      icon: DollarSign, 
      title: "Debt Kill", 
      desc: "Organize collections/summons, build a payoff & dispute strategy, and track the path to relief.",
      color: "blue" as const
    },
  ];

  return (
    <section className="py-24 bg-[#0f1a16]">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase mb-4">Our Services</p>
            <h2 className="text-3xl lg:text-5xl font-light text-white">
              Complete Credit <span className="text-amber-500">Solutions</span>
            </h2>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <Reveal key={i} delay={i * 100}>
              <div 
                onClick={() => onNavigate('services')}
                className="group cursor-pointer p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300"
              >
                <FlashyIcon icon={service.icon} color={service.color} />
                <h3 className="text-xl font-medium text-white mt-6 mb-3">{service.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{service.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-amber-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn More <ArrowRight size={16} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// TRADELINE DUAL SECTION (Primary + AU)
// ============================================================================
export function TradelineDualSection({
  onNavigate,
  onAddToCart,
}: {
  onNavigate: (page: string) => void;
  onAddToCart?: (line: any) => void;
}) {
  return (
    <section className="py-24 bg-[#0d1512]">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-16">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase mb-4">Premium Tradelines</p>
            <h2 className="text-3xl lg:text-5xl font-light text-white mb-6">
              Choose your lane — <span className="text-amber-500">AU</span> or <span className="text-emerald-400">Primary</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              One section. Two options. If you want an instant AU boost, shop inventory. If you need a primary tradeline,
              we keep it education‑first so it’s used as a credit‑building path (not “swap debt for debt”).
            </p>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Primary Tradelines */}
          <Reveal delay={100}>
            <div 
              onClick={() => onNavigate('tradelines_primary')}
              className="group cursor-pointer relative p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent hover:border-emerald-500/40 transition-all duration-300"
            >
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Available</span>
              </div>
              
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                <CreditCard size={28} className="text-emerald-400" />
              </div>
              
              <h3 className="text-2xl font-medium text-white mb-3">Primary Tradelines</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                In‑house financing can report to Equifax as a primary installment tradeline. Education‑first, used for
                credit building and lender readiness — not debt swapping.
              </p>
              
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                Explore Options <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Reveal>

          {/* AU Marketplace */}
          <Reveal delay={200}>
            <div 
              onClick={() => onNavigate('tradelines_au')}
              className="group cursor-pointer relative p-8 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent hover:border-amber-500/40 transition-all duration-300"
            >
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Popular</span>
              </div>
              
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-6">
                <Users size={28} className="text-amber-400" />
              </div>
              
              <h3 className="text-2xl font-medium text-white mb-3">AU Marketplace</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                Get added to seasoned tradelines with high limits and perfect payment history. Instant score boost.
              </p>
              
              <div className="flex items-center gap-2 text-amber-400 font-medium">
                Browse Assets <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Reveal>
        </div>

        {/* Education-first positioning (kept on homepage) */}
        <div
          className="mt-10 rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl p-8 platinum-shimmer fc-platinum-frame"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <Shield size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Education‑first primary lane</span>
              </div>
              <div className="text-white text-xl font-semibold">Use financing as a credit‑building tool</div>
              <p className="text-white/55 text-sm leading-relaxed">
                We confirm fit before any in‑house financing is used. The goal is a safer path to approvals and borrowing
                power over time — with clear disclaimers and responsible use.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => onNavigate('consultation')} size="sm">
                Book a free enlightenment session <ArrowRight size={16} />
              </Button>
              <Button variant="outline" onClick={() => onNavigate('tradelines_primary')} size="sm">
                Explore primary options
              </Button>
              <Button variant="outline" onClick={() => onNavigate('services_tradelines')} size="sm">
                View tradeline promo packages <ArrowRight size={16} />
              </Button>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Education-first strategy', note: 'We confirm the safest path before any financing.' },
              { title: 'Credit-building reporting', note: 'Adds a positive installment tradeline to your profile.' },
              { title: 'Lender readiness', note: 'When ready, we can route you to lender pathways (no guarantees).' },
              { title: 'Built for thin/new credit', note: 'Ideal when 6‑month plans are not realistic upfront.' },
            ].map((x) => (
              <div key={x.title} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-white font-semibold text-sm">{x.title}</div>
                <div className="mt-1 text-white/60 text-sm">{x.note}</div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-white/35 text-xs leading-relaxed">
            Financing availability, terms, and approvals vary. We do not promise outcomes, approvals, or income.
          </p>
        </div>

        {/* AU inventory preview (credit-card visuals) */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <Zap size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">AU inventory preview</span>
              </div>
              <div className="text-white text-xl font-semibold">Authorized User seats available now</div>
              <p className="text-white/55 text-sm leading-relaxed max-w-2xl">
                Pick a bank, limit, and age — then checkout. If you’re not sure which asset fits your goal, book a quick
                session and we’ll match you.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => onNavigate('tradelines_au')} size="sm">
                View full AU inventory <ArrowRight size={16} />
              </Button>
              <Button onClick={() => onNavigate('consultation')} size="sm">
                Get matched <ArrowRight size={16} />
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <TradelineMarketplace onAddToCart={onAddToCart} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// WHAT MAKES US DIFFERENT
// ============================================================================
export function WhatMakesDifferentSection() {
  const items = [
    { icon: Target, title: "Solution Driven", desc: "We have you covered in any credit situation. Solutions for any economic status." },
    { icon: Award, title: "Unique Services", desc: "Our products and services are second to none with an unmatched approach." },
    { icon: Heart, title: "Truly Care", desc: "We go above and beyond to ensure your personal success and growth." },
  ];

  return (
    <section className="py-24 bg-[#0f1a16]">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase mb-4">Why Choose Us</p>
            <h2 className="text-3xl lg:text-5xl font-light text-white">
              What Makes Us <span className="text-amber-500">Different</span>
            </h2>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="text-center p-8 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
                  <item.icon size={28} className="text-amber-500" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// BUSINESS CREDIT SECTION WITH BUREAU LOGOS
// ============================================================================
export function BusinessCreditSection() {
  const bureaus = [
    { name: 'Equifax', sub: 'Business' },
    { name: 'Dun & Bradstreet', sub: 'D&B' },
    { name: 'Experian', sub: 'Business' },
  ];

  return (
    <section className="py-24 bg-[#0d1512]">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div className="space-y-6">
              <p className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase">Corporate Credit</p>
              <h2 className="text-3xl lg:text-5xl font-light text-white leading-tight">
                Advanced <span className="text-amber-500">Business Credit</span>
              </h2>
              <p className="text-white/50 leading-relaxed">
                Start building your EIN's credit which is separate from your SSN. Corporate Credit 
                is a powerful way to get funding without investors or savings.
              </p>
              <p className="text-white/50 leading-relaxed">
                Many thriving businesses take advantage of this to increase their borrowing power into the{' '}
                <span className="text-amber-500 font-semibold">multi-millions</span>.
              </p>
              <Button size="lg">
                Learn More <ArrowRight size={18} />
              </Button>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="space-y-8">
              {/* Bureau Logos */}
              <div className="grid grid-cols-3 gap-4">
                {bureaus.map((bureau, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center hover:border-amber-500/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                      <Building2 size={20} className="text-amber-500" />
                    </div>
                    <p className="text-sm font-semibold text-white">{bureau.name}</p>
                    <p className="text-[10px] text-amber-500 uppercase tracking-wider">{bureau.sub}</p>
                  </div>
                ))}
              </div>

              {/* Progress Bars */}
              <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                {[
                  { label: 'Business Credit Score', value: 80 },
                  { label: 'Payment History', value: 95 },
                  { label: 'Credit Utilization', value: 25 },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">{item.label}</span>
                      <span className="text-amber-500 font-semibold">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-1000"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// MASTERY OS SECTION - Premium realistic device mockups
// ============================================================================
export function MasteryOSSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [creditScore, setCreditScore] = useState(812);
  const [scoreChange, setScoreChange] = useState(0);
  
  const approvals = [
    { name: "Derrick M.", bank: "Navy Federal Credit Union", amount: "$85,000", type: "Business Line" },
    { name: "Monique S.", bank: "PenFed Credit Union", amount: "$42,000", type: "Term Loan" },
    { name: "Carlos V.", bank: "Alliant Credit Union", amount: "$60,000", type: "Business Card" },
    { name: "Tanya R.", bank: "First Tech Federal CU", amount: "$75,000", type: "SBA Express" },
    { name: "Evan P.", bank: "Suncoast Credit Union", amount: "$38,000", type: "Equipment Loan" },
    { name: "Jasmine L.", bank: "Cross River Bank", amount: "$50,000", type: "Unsecured LOC" },
    { name: "Noah G.", bank: "Celtic Bank", amount: "$120,000", type: "Startup Funding" },
    { name: "Alicia B.", bank: "WebBank", amount: "$28,000", type: "Personal Credit" },
    { name: "Bryan H.", bank: "Blue Ridge Bank", amount: "$35,000", type: "Business Card" },
    { name: "Kiara D.", bank: "Sutton Bank", amount: "$40,000", type: "ISO Program" },
  ];

  const liveNotifications = [
    { icon: "check", text: "Tradeline posted to Experian", time: "2m ago" },
    { icon: "trending", text: "Score increased +12 pts", time: "5m ago" },
    { icon: "shield", text: "Identity monitoring active", time: "12m ago" },
    { icon: "dollar", text: "New funding offer available", time: "18m ago" },
  ];

  const phoneStories = [
    { icon: 'trending', title: 'Score movement', line: 'Utilization tuned + reporting optimized', value: '+52 pts', time: 'today' },
    { icon: 'check', title: 'Dispute result', line: 'Verification failed — item deleted', value: '11 items', time: '48h' },
    { icon: 'shield', title: 'Identity defense', line: 'Freeze + fraud lock completed', value: 'Secure', time: '10m' },
    { icon: 'dollar', title: 'Funding', line: 'Approved with high‑approval lender', value: '$75K LOC', time: '1w' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % approvals.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [approvals.length]);

  // Simulate live credit score updates
  useEffect(() => {
    const scoreInterval = setInterval(() => {
      const change = Math.floor(Math.random() * 5) - 1; // -1 to +3
      if (change !== 0) {
        setScoreChange(change);
        setCreditScore(prev => Math.min(850, Math.max(300, prev + change)));
        setTimeout(() => setScoreChange(0), 2000);
      }
    }, 8000);
    return () => clearInterval(scoreInterval);
  }, []);

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Platinum background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#ffffff_0%,#f8fafc_26%,#e5e4e2_52%,#c0c0c0_78%,#94a3b8_100%)]" />
      {/* Brushed metallic texture */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(15,23,42,0.10) 0 1px, transparent 1px 4px), repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 42px)',
        }}
      />
      {/* Vignette for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/14 to-black/35" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="text-center mb-16">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase mb-4">
              <Cpu size={14} className="inline mr-2" /> The Mastery OS
            </p>
            <h2 className="text-3xl lg:text-5xl font-light text-white mb-4">
              Freedom <span className="text-amber-500">in Your Pocket</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Institutional-grade autonomous capital architecture at your fingertips.
            </p>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <div className="relative flex justify-center items-center min-h-[540px] lg:min-h-[620px]">
            
            {/* ==================== PREMIUM TABLET MOCKUP ==================== */}
            <div className="relative w-full max-w-[820px] aspect-[4/3]">
              {/* Tablet outer frame - metallic silver */}
              <div 
                className="absolute inset-0 rounded-[28px] lg:rounded-[36px]"
                style={{
                  background: 'linear-gradient(145deg, #3a3a3a 0%, #1a1a1a 50%, #2a2a2a 100%)',
                  boxShadow: '0 50px 100px -20px rgba(0,0,0,0.8), 0 30px 60px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              />
              
              {/* Tablet inner bezel */}
              <div className="absolute inset-[6px] lg:inset-[8px] rounded-[22px] lg:rounded-[28px] bg-[#0a0a0a]" />
              
              {/* Front camera */}
              <div className="absolute top-[14px] lg:top-[18px] left-1/2 -translate-x-1/2 w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                <div className="absolute inset-[2px] rounded-full bg-[#0d1117]" />
                <div className="absolute top-[1px] left-[1px] w-1 h-1 rounded-full bg-[#1e3a5f]/50" />
              </div>
              
              {/* Screen area */}
              <div className="absolute inset-[10px] lg:inset-[14px] rounded-[18px] lg:rounded-[22px] overflow-hidden bg-gradient-to-br from-[#0d1512] to-[#080c0a]">
                
                {/* Screen glass reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none z-20" />
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-20" />
                
                {/* Status bar */}
                <div className="absolute top-0 left-0 right-0 h-8 lg:h-10 bg-black/30 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] lg:text-[10px] text-white/70 font-medium">9:41</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wifi size={10} className="text-white/70" />
                    <div className="flex items-center gap-[2px]">
                      <div className="w-[3px] h-[6px] bg-white/70 rounded-sm" />
                      <div className="w-[3px] h-[8px] bg-white/70 rounded-sm" />
                      <div className="w-[3px] h-[10px] bg-white/70 rounded-sm" />
                      <div className="w-[3px] h-[12px] bg-white/40 rounded-sm" />
                    </div>
                    <div className="w-6 h-3 rounded-sm border border-white/70 flex items-center p-[1px]">
                      <div className="w-3/4 h-full bg-emerald-500 rounded-[1px]" />
                    </div>
                  </div>
                </div>
                
                {/* App header */}
                <div className="absolute top-8 lg:top-10 left-0 right-0 px-4 lg:px-6 py-3 border-b border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                      <Cpu size={16} className="text-black" />
                    </div>
                    <div>
                      <span className="text-white text-xs lg:text-sm font-semibold">Finely Vault</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-400 text-[9px] lg:text-[10px]">Live</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                      <span className="text-[9px] lg:text-[10px] text-emerald-400 font-semibold">CONNECTED</span>
                    </div>
                  </div>
                </div>

                {/* Main content area - Approval Display */}
                {/* Reserve space on the right when the phone is visible so text never sits "under" it */}
                <div className="absolute top-24 lg:top-28 bottom-16 left-0 right-0 flex items-center justify-center pr-0 sm:pr-[150px] md:pr-[170px] lg:pr-[210px]">
                  {approvals.map((app, idx) => (
                    <div 
                      key={idx}
                      className={`absolute text-center transition-all duration-700 ease-out ${
                        idx === activeIdx ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
                      }`}
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/40 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span className="text-emerald-400 text-[10px] lg:text-xs font-bold uppercase tracking-wider">Approved</span>
                      </div>
                      <h3 className="text-xl lg:text-3xl font-light text-white mb-1">
                        {app.name} <span className="text-white/60">secured</span>
                      </h3>
                      <p className="text-3xl lg:text-5xl font-bold text-emerald-400 mb-2">{app.amount}</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-white/50 text-xs lg:text-sm">{app.bank}</span>
                        <span className="text-white/30">•</span>
                        <span className="text-amber-400/80 text-xs lg:text-sm">{app.type}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live notifications ticker */}
                <div className="absolute bottom-0 left-0 right-0 h-14 lg:h-16 bg-black/40 backdrop-blur-sm border-t border-white/10 overflow-hidden">
                  <div className="flex items-center h-full px-4 lg:px-6 gap-6 animate-marquee-slow">
                    {[...liveNotifications, ...liveNotifications].map((notif, i) => (
                      <div key={i} className="flex items-center gap-2 whitespace-nowrap">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          {notif.icon === 'check' && <CheckCircle2 size={12} className="text-emerald-400" />}
                          {notif.icon === 'trending' && <TrendingUp size={12} className="text-emerald-400" />}
                          {notif.icon === 'shield' && <Shield size={12} className="text-emerald-400" />}
                          {notif.icon === 'dollar' && <DollarSign size={12} className="text-amber-400" />}
                        </div>
                        <span className="text-[10px] lg:text-xs text-white/70">{notif.text}</span>
                        <span className="text-[9px] text-white/40">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Home indicator */}
              <div className="absolute bottom-[3px] lg:bottom-[4px] left-1/2 -translate-x-1/2 w-24 lg:w-32 h-1 rounded-full bg-white/20" />
            </div>

            {/* ==================== PREMIUM PHONE MOCKUP ==================== */}
            {/* Phone sitting straight on tablet - half on, half off right edge */}
            <div 
              className="hidden sm:block absolute bottom-8 sm:bottom-12 lg:bottom-16 w-[150px] md:w-[170px] lg:w-[210px] z-30 right-[-10px] sm:right-[-16px] lg:right-[-22px]"
            >
              {/* Phone outer frame - titanium style */}
              <div 
                className="relative aspect-[9/19.5] rounded-[32px] sm:rounded-[38px] lg:rounded-[44px]"
                style={{
                  background: 'linear-gradient(145deg, #2d2d2d 0%, #1a1a1a 30%, #252525 70%, #1f1f1f 100%)',
                  boxShadow: '0 50px 100px -20px rgba(0,0,0,0.9), 0 30px 60px -10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.5)'
                }}
              >
                {/* Side buttons - left */}
                <div className="absolute -left-[2px] top-[70px] lg:top-[90px] w-[3px] h-6 lg:h-8 rounded-l-sm bg-gradient-to-b from-[#3a3a3a] to-[#2a2a2a]" />
                <div className="absolute -left-[2px] top-[100px] lg:top-[130px] w-[3px] h-10 lg:h-14 rounded-l-sm bg-gradient-to-b from-[#3a3a3a] to-[#2a2a2a]" />
                <div className="absolute -left-[2px] top-[145px] lg:top-[185px] w-[3px] h-10 lg:h-14 rounded-l-sm bg-gradient-to-b from-[#3a3a3a] to-[#2a2a2a]" />
                
                {/* Side button - right */}
                <div className="absolute -right-[2px] top-[100px] lg:top-[130px] w-[3px] h-12 lg:h-16 rounded-r-sm bg-gradient-to-b from-[#3a3a3a] to-[#2a2a2a]" />
                
                {/* Inner bezel */}
                <div className="absolute inset-[3px] sm:inset-[4px] rounded-[29px] sm:rounded-[34px] lg:rounded-[40px] bg-[#0a0a0a]" />
                
                {/* Screen */}
                <div className="absolute inset-[5px] sm:inset-[6px] lg:inset-[7px] rounded-[27px] sm:rounded-[32px] lg:rounded-[37px] overflow-hidden bg-[#0a0a0a]">
                  
                  {/* Dynamic Island */}
                  <div className="absolute top-2 lg:top-3 left-1/2 -translate-x-1/2 w-20 sm:w-24 lg:w-28 h-6 sm:h-7 lg:h-8 rounded-full bg-black flex items-center justify-center gap-2 z-30">
                    <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                      <div className="w-full h-full rounded-full bg-[#0d1117] flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-[#1e3a5f]/60" />
                      </div>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0d1117]" />
                  </div>
                  
                  {/* VIDEO PLAYER - Finely Cred Promo */}
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    poster="/videos/finely-poster.jpg"
                  >
                    <source src="/videos/finely-promo.mp4" type="video/mp4" />
                    <source src="/videos/finely-promo.webm" type="video/webm" />
                  </video>

                  {/* Phone overlay: multi-service success story */}
                  <div className="absolute inset-x-2.5 top-[44px] bottom-3 z-20 rounded-2xl bg-black/45 border border-white/10 backdrop-blur-md p-2.5 flex flex-col gap-2 min-h-0">
                    <div className="flex items-center justify-between">
                      <div className="text-[9px] uppercase tracking-[0.26em] text-white/60 font-bold">Live outcomes</div>
                      <div className="px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                        <span className="text-[8px] uppercase tracking-widest text-emerald-300 font-bold">active</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 flex-1 min-h-0 overflow-hidden">
                      {(() => {
                        const s = phoneStories[activeIdx % phoneStories.length]!;
                        const iconEl =
                          s.icon === 'check' ? (
                            <CheckCircle2 size={12} className="text-emerald-300" />
                          ) : s.icon === 'trending' ? (
                            <TrendingUp size={12} className="text-emerald-300" />
                          ) : s.icon === 'shield' ? (
                            <Shield size={12} className="text-emerald-300" />
                          ) : (
                            <DollarSign size={12} className="text-amber-300" />
                          );
                        return (
                          <div className="space-y-1.5 min-h-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className="inline-flex items-center gap-2 text-white/80">
                                <span className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                                  {iconEl}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-widest">{s.title}</span>
                              </div>
                              <span className="text-[8px] text-white/50">{s.time}</span>
                            </div>
                            <div className="text-[9px] text-white/70 leading-tight max-h-[30px] overflow-hidden">
                              {s.line}
                            </div>
                            <div className="flex items-end justify-between">
                              <span className="text-[9px] uppercase tracking-widest text-white/40">Result</span>
                              <span className="text-[12px] font-black text-amber-300">{s.value}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2">
                      {[
                        { label: 'Tradelines', icon: TrendingUp },
                        { label: 'Restoration', icon: FileText },
                        { label: 'Business', icon: Building2 },
                        { label: 'Funding', icon: DollarSign },
                      ].map((x) => (
                        <div key={x.label} className="rounded-xl border border-white/10 bg-black/30 px-2 py-1.5 flex items-center gap-2">
                          <x.icon size={10} className="text-white/60" />
                          <span className="text-[8px] uppercase tracking-widest text-white/60 font-bold">{x.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Fallback content if video doesn't load */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0d1512] to-[#080c0a] video-fallback">
                    <div className="text-center px-4">
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wider text-white mb-1">
                        FINELY <span className="text-amber-500">CRED</span>
                      </p>
                      <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto my-3" />
                      <p className={`text-2xl sm:text-3xl lg:text-4xl font-light text-white tabular-nums mb-1`}>
                        {creditScore}
                      </p>
                      <p className="text-[7px] sm:text-[8px] text-emerald-400 uppercase tracking-wider">Credit Score</p>
                      <div className="mt-4 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 inline-flex items-center gap-1.5">
                        <Lock size={10} className="text-emerald-400" />
                        <span className="text-[6px] sm:text-[7px] text-emerald-400 font-bold uppercase">Vault Active</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Screen glass reflection - always on top */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-20" />
                  
                  {/* Home indicator */}
                  <div className="absolute bottom-1.5 lg:bottom-2 left-1/2 -translate-x-1/2 w-10 sm:w-12 lg:w-14 h-1 rounded-full bg-white/30 z-20" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ============================================================================
// MARKETPLACE CARD (Fixed button contrast)
// ============================================================================
interface MarketplaceCardProps {
  bank: string;
  limit: string;
  age: string;
  price: string;
  date: string;
  theme?: 'tdbank' | 'gold' | 'platinum' | 'citi' | 'wells' | 'black' | 'chase' | 'boa';
  cardType?: 'black' | 'gold' | 'platinum' | 'tdbank' | 'citi' | 'wells' | 'boa' | 'chase';
  hot?: boolean;
  onSelect: () => void;
}

export function MarketplaceCard({ bank, limit, age, price, date, theme = 'platinum', cardType = 'platinum', hot, onSelect }: MarketplaceCardProps) {
  const glowMap: Record<string, string> = {
    tdbank: 'from-emerald-500/25 via-emerald-500/0 to-transparent',
    citi: 'from-sky-500/25 via-sky-500/0 to-transparent',
    wells: 'from-red-500/25 via-red-500/0 to-transparent',
    chase: 'from-indigo-500/25 via-indigo-500/0 to-transparent',
    boa: 'from-blue-500/25 via-blue-500/0 to-transparent',
    gold: 'from-amber-500/25 via-amber-500/0 to-transparent',
    platinum: 'from-slate-200/20 via-slate-200/0 to-transparent',
    black: 'from-violet-500/15 via-violet-500/0 to-transparent',
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Ambient color glow (restores multi-color vibe) */}
      <div className={`absolute -inset-8 bg-gradient-to-br ${glowMap[theme] || glowMap.platinum} blur-3xl opacity-80`} />

      <CreditCardAsset
        type={cardType}
        className="w-[360px] h-[230px] sm:w-[390px] sm:h-[250px]"
        metaTop={hot ? 'HIGH DEMAND' : 'AUTHORIZED USER'}
        metaBottom={bank}
        numberText={`${limit} • ${age}`}
        bottomLeftLabel="PRICE"
        bottomLeftValue={price}
        bottomRightLabel="CLOSES"
        bottomRightValue={date}
        microText="AUTHORIZED USER • VERIFIED ASSET • FINELY CRED • DO NOT COPY"
        style={{
          boxShadow:
            '0 34px 80px -26px rgba(0,0,0,0.88), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -2px 0 rgba(0,0,0,0.48)',
        }}
      />

      {/* AU CTA — single button (no doubling) */}
      <div className="mt-4 w-full max-w-[390px] relative z-10">
        <Button variant="platinum" size="sm" onClick={onSelect} className="w-full">
          Secure authorized user seat
        </Button>
      </div>

      {/* Bottom info (restore the 4 black boxes with high-signal details) */}
      <div className="mt-3 w-full max-w-[390px] grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-3">
          <div className="text-[9px] font-black uppercase tracking-[0.28em] text-white/45">Utilization</div>
          <div className="mt-1 text-[11px] text-white/60 leading-snug">
            Inventory is curated for <span className="text-white/80 font-semibold">low utilization optics</span> (best when balances stay low).
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-3">
          <div className="text-[9px] font-black uppercase tracking-[0.28em] text-white/45">Verified</div>
          <div className="mt-1 text-[11px] text-white/60 leading-snug">
            <span className="text-white/80 font-semibold">Verified inventory</span> with timeline discipline after intake.
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-3">
          <div className="text-[9px] font-black uppercase tracking-[0.28em] text-white/45">Reports to</div>
          <div className="mt-1 text-[11px] text-white/60 leading-snug">
            Typically <span className="text-white/80 font-semibold">Experian</span> /{' '}
            <span className="text-white/80 font-semibold">Equifax</span> /{' '}
            <span className="text-white/80 font-semibold">TransUnion</span>
            <span className="text-white/40"> (issuer‑dependent; not guaranteed)</span>.
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-3">
          <div className="text-[9px] font-black uppercase tracking-[0.28em] text-white/45">DTI</div>
          <div className="mt-1 text-[11px] text-white/60 leading-snug">
            Helps utilization signals; <span className="text-white/80 font-semibold">does not change income</span> or DTI.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TRADELINE MARKETPLACE
// ============================================================================
export function TradelineMarketplace({ onAddToCart }: { onAddToCart?: (line: any) => void }) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const pricing = useMemo(() => getPricingControls(), [version]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'hot' | 'price_low' | 'price_high' | 'age_high'>('hot');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<6 | 9 | 12>(9);

  const applyControls = (baseCents: number) => {
    const markup = Number.isFinite(pricing.tradelineAuMarkupPct) ? pricing.tradelineAuMarkupPct : 0;
    const discount = Number.isFinite(pricing.tradelineAuDiscountPct) ? pricing.tradelineAuDiscountPct : 0;
    const markedUp = Math.round(baseCents * (1 + markup / 100));
    const discounted = Math.round(markedUp * (1 - discount / 100));
    return Math.max(0, discounted);
  };

  const fmtUsd = (cents: number) =>
    `$${(Math.round(cents) / 100).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const pickTheme = (bank: string) => {
    const b = String(bank || '').toLowerCase();
    if (b.includes('chase')) return { theme: 'chase' as const, cardType: 'chase' as const };
    if (b.includes('bank of america') || b.includes('bofa')) return { theme: 'boa' as const, cardType: 'boa' as const };
    if (b.includes('td')) return { theme: 'tdbank' as const, cardType: 'tdbank' as const };
    if (b.includes('citi')) return { theme: 'citi' as const, cardType: 'citi' as const };
    if (b.includes('wells')) return { theme: 'wells' as const, cardType: 'wells' as const };
    if (b.includes('american express') || b.includes('amex')) return { theme: 'platinum' as const, cardType: 'platinum' as const };
    if (b.includes('discover')) return { theme: 'gold' as const, cardType: 'gold' as const };
    if (b.includes('capital one')) return { theme: 'black' as const, cardType: 'black' as const };
    if (b.includes('navy')) return { theme: 'black' as const, cardType: 'black' as const };
    if (b.includes('barclay')) return { theme: 'black' as const, cardType: 'black' as const };
    return { theme: 'platinum' as const, cardType: 'platinum' as const };
  };

  const sellerLines = useMemo(() => {
    const tenantId = getActiveTenantId();
    const sellers = listAuSellersByTenant(tenantId);
    const inventory: Array<any> = [];
    for (const s of sellers) {
      const contractOk = Boolean(s.contract.acceptedAt);
      const sellerOk = s.status === 'active' && s.verification.status === 'verified' && contractOk;
      if (!sellerOk) continue;
      for (const l of s.listings) {
        if (l.status !== 'approved') continue;
        const pick = pickTheme(l.bank);
        inventory.push({
          id: `seller:${s.id}:${l.id}`,
          bank: l.bank,
          limit: l.limit,
          age: l.age,
          basePriceCents: Math.max(0, Math.round(l.priceCents)),
          date: 'Schedule after intake',
          theme: pick.theme,
          cardType: pick.cardType,
          hot: false,
          sellerId: s.id,
          listingId: l.id,
          source: 'seller',
        });
      }
    }
    return inventory;
  }, [version]);

  const baseLines = [
    { id: 1, bank: 'American Express', limit: '$45,000', age: '12 Years', basePriceCents: 120000, date: '21st', theme: 'platinum' as const, cardType: 'platinum' as const, hot: true },
    { id: 2, bank: 'Chase', limit: '$30,000', age: '12 Years', basePriceCents: 98000, date: '6th', theme: 'chase' as const, cardType: 'chase' as const, hot: true },
    { id: 3, bank: 'TD Bank', limit: '$25,000', age: '10 Years', basePriceCents: 85000, date: '7th', theme: 'tdbank' as const, cardType: 'tdbank' as const, hot: true },
    { id: 4, bank: 'Citi', limit: '$35,000', age: '15 Years', basePriceCents: 95000, date: '12th', theme: 'citi' as const, cardType: 'citi' as const },
    { id: 5, bank: 'Wells Fargo', limit: '$30,000', age: '14 Years', basePriceCents: 89000, date: '24th', theme: 'wells' as const, cardType: 'wells' as const },
    { id: 6, bank: 'Bank of America', limit: '$22,500', age: '9 Years', basePriceCents: 79000, date: '13th', theme: 'boa' as const, cardType: 'boa' as const },
    { id: 7, bank: 'Discover', limit: '$15,000', age: '8 Years', basePriceCents: 65000, date: '14th', theme: 'gold' as const, cardType: 'gold' as const },
    { id: 8, bank: 'Capital One', limit: '$20,000', age: '11 Years', basePriceCents: 75000, date: '18th', theme: 'black' as const, cardType: 'black' as const },
    { id: 9, bank: 'Navy Federal', limit: '$50,000', age: '9 Years', basePriceCents: 110000, date: '5th', theme: 'black' as const, cardType: 'black' as const, hot: true },
  ];

  const lines = [...sellerLines, ...baseLines].map((l) => {
    const finalCents = applyControls(l.basePriceCents);
    return {
      ...l,
      price: fmtUsd(finalCents),
      finalPriceCents: finalCents,
      pricingApplied: { ...pricing },
    };
  });

  useEffect(() => {
    // Reset pagination when query/sort changes.
    setPage(1);
  }, [query, sort, pageSize]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = lines.slice();
    if (q) {
      list = list.filter((l) => {
        const hay = `${l.bank} ${l.limit} ${l.age} ${l.price} ${l.date}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (sort === 'price_low') list.sort((a, b) => a.finalPriceCents - b.finalPriceCents);
    else if (sort === 'price_high') list.sort((a, b) => b.finalPriceCents - a.finalPriceCents);
    else if (sort === 'age_high') {
      const ageNum = (s: string) => {
        const m = String(s || '').match(/(\d+)/);
        return m ? Number(m[1]) : 0;
      };
      list.sort((a, b) => ageNum(b.age) - ageNum(a.age));
    } else {
      // hot-first, then highest limit (best-effort)
      const limNum = (s: string) => {
        const m = String(s || '').replace(/[, $]/g, '').match(/(\d+)/);
        return m ? Number(m[1]) : 0;
      };
      list.sort((a, b) => Number(Boolean(b.hot)) - Number(Boolean(a.hot)) || limNum(b.limit) - limNum(a.limit));
    }
    return list;
  }, [lines, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.max(1, Math.min(totalPages, page));
  const start = (clampedPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Inventory</div>
          <div className="text-white/70 text-sm">
            Showing <span className="text-white font-mono">{pageItems.length}</span> of{' '}
            <span className="text-white font-mono">{filtered.length}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bank / limit / age…"
            className="w-64 max-w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors text-sm"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
            title="Sort"
          >
            <option value="hot">Hot / best value</option>
            <option value="price_low">Price: low → high</option>
            <option value="price_high">Price: high → low</option>
            <option value="age_high">Age: highest first</option>
          </select>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) as any)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
            title="Per page"
          >
            <option value={6}>6 / page</option>
            <option value={9}>9 / page</option>
            <option value={12}>12 / page</option>
          </select>
        </div>
      </div>

      {/* Marketplace info (kept compact; high-signal details) */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">How this helps</div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-[10px] font-black uppercase tracking-widest">
              Utilization &lt; 15%
            </span>
            <span className="px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200 text-[10px] font-black uppercase tracking-widest">
              Verified inventory
            </span>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-white font-semibold">Reporting (AU seats)</div>
            <p className="mt-2 text-white/60 leading-relaxed">
              AU tradelines typically report to <span className="text-white/80 font-semibold">Experian</span>,{' '}
              <span className="text-white/80 font-semibold">Equifax</span>, and <span className="text-white/80 font-semibold">TransUnion</span>{' '}
              on the creditor’s normal cycle.
              <span className="text-white/40"> Reporting can vary by issuer and is not guaranteed.</span>
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-white font-semibold">Why buyers choose AU inventory</div>
            <ul className="mt-2 space-y-2 text-white/65">
              <li className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>
                  <span className="text-white/85 font-semibold">Lower utilization ratio</span> by adding a higher limit (when balances are kept low).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>
                  <span className="text-white/85 font-semibold">Thicker profile factors</span> (age + limit) to support better approvals.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>
                  <span className="text-white/85 font-semibold">Underwriting optics</span>: utilization can influence lending decisions and score factors during application windows.
                </span>
              </li>
            </ul>
            <p className="mt-3 text-[12px] text-white/45 leading-relaxed">
              Note: utilization is different from <span className="text-white/60 font-semibold">debt-to-income (DTI)</span>. AU seats don’t change your income.
              Some lenders may treat AU accounts differently during underwriting.
            </p>
          </div>
        </div>
      </div>

      {pageItems.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">
          No matches. Try a different search (e.g. “Chase”, “$30,000”, “12 years”).
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageItems.map((line) => (
            <MarketplaceCard
              key={line.id}
              bank={line.bank}
              limit={line.limit}
              age={line.age}
              price={line.price}
              date={line.date}
              theme={line.theme}
              cardType={line.cardType}
              hot={line.hot}
              onSelect={() => onAddToCart && onAddToCart(line)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={clampedPage <= 1}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <div className="text-[10px] uppercase tracking-widest text-white/40">
            Page <span className="text-white/70 font-mono">{clampedPage}</span> /{' '}
            <span className="text-white/70 font-mono">{totalPages}</span>
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={clampedPage >= totalPages}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PHYSICAL EBOOK
// ============================================================================
export function PhysicalEbook({ title, sub, vol, price, accentColor = "#f59e0b" }: {
  title: string;
  sub: string;
  vol: string;
  price: string;
  accentColor?: string;
}) {
  return (
    <div className="flex flex-col items-center group cursor-pointer">
      <div className="relative w-40 h-56 mb-6 transition-transform duration-300 group-hover:scale-105">
        {/* Book spine */}
        <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#1a1a1a] to-[#0d0d0d] rounded-l-lg border-l border-t border-b border-white/10" />
        
        {/* Book cover */}
        <div className="absolute inset-0 left-4 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-r-lg border border-white/10 p-4 flex flex-col justify-between">
          <p className="text-[8px] text-white/30 uppercase tracking-wider text-right">Vol {vol}</p>
          <div>
            <h4 className="text-sm font-light text-white uppercase leading-tight">
              {title.split(' ')[0]}
              <br />
              <span style={{ color: accentColor }} className="font-semibold">
                {title.split(' ').slice(1).join(' ')}
              </span>
            </h4>
            <p className="text-[8px] text-white/40 uppercase tracking-wider mt-2">{sub}</p>
          </div>
          <Sparkles size={14} style={{ color: accentColor }} />
        </div>
      </div>
      
      <h5 className="text-sm font-medium text-white mb-2">{title}</h5>
      <p className="text-amber-500 font-bold mb-4">{price}</p>
      <Button variant="outline" size="sm">Get Access</Button>
    </div>
  );
}

// ============================================================================
// TESTIMONIAL WITH CARD VISUAL
// ============================================================================
export function TestimonialDossier({
  id,
  service,
  name,
  review,
  milestone,
  resultLabel,
  resultValue,
  amount,
}: {
  id: string;
  service?: string;
  name: string;
  review: string;
  milestone: string;
  resultLabel?: string;
  resultValue?: string;
  amount?: string;
}) {
  const value = resultValue ?? amount;
  const label = resultLabel ?? (amount ? 'Funded' : undefined);
  return (
    <div
      className="platinum-shimmer card-lift h-full min-h-[340px] p-6 rounded-3xl border border-white/20 transition-all hover:shadow-2xl"
      style={{
        backgroundImage: [
          // Platinum base
          'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(229,228,226,0.88) 30%, rgba(192,192,192,0.84) 55%, rgba(168,169,173,0.78) 100%)',
          // Diamond grid (soft)
          'repeating-linear-gradient(45deg, rgba(15,23,42,0.06) 0 1px, transparent 1px 48px)',
          'repeating-linear-gradient(-45deg, rgba(15,23,42,0.05) 0 1px, transparent 1px 48px)',
          // Specular highlight
          'radial-gradient(240px 160px at 72% 22%, rgba(255,255,255,0.55), transparent 62%)',
          // Depth vignette
          'radial-gradient(320px 220px at 18% 78%, rgba(0,0,0,0.12), transparent 72%)',
        ].join(', '),
        boxShadow: '0 24px 70px -30px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.55)',
      }}
    >
      {/* Mini Credit Card Visual */}
      {value && (
        <div className="mb-6 p-4 rounded-2xl bg-black/5 border border-black/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-700" />
              <span className="text-xs text-emerald-800 font-semibold uppercase">{label || 'Result'}</span>
            </div>
            <span className="text-xl font-bold text-emerald-800">{value}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-black/5 border border-black/10 flex items-center justify-center">
          <Star size={16} className="text-amber-700" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0d1512] truncate">{name}</p>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={10} className="text-amber-700 fill-amber-500" />
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {service ? (
            <span className="text-[9px] px-2 py-1 rounded-full border border-black/10 bg-white/60 text-[#0d1512]/80 uppercase tracking-widest font-bold whitespace-nowrap">
              {service}
            </span>
          ) : null}
          <Verified size={16} className="text-emerald-800" />
        </div>
      </div>

      <p className="text-sm text-black/70 leading-relaxed italic mb-4">"{review}"</p>

      <div className="mt-auto px-3 py-1.5 rounded-full bg-black/5 border border-black/10 inline-block">
        <span className="text-[10px] font-bold text-[#0d1512]/80 uppercase tracking-wider">{milestone}</span>
      </div>
    </div>
  );
}

// ============================================================================
// AFFILIATE SECTION - Platinum with Green Tint
// ============================================================================
export function AffiliateSection({ onVisitAffiliate }: { onVisitAffiliate?: () => void }) {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Platinum gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-[#252525] to-[#1a1a1a]" />
      
      {/* Subtle green ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(16,185,129,0.12),transparent_70%)]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/8 rounded-full blur-[100px]" />
      
      {/* Platinum shimmer lines */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
      
      {/* Metallic texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)`
      }} />
      
      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <Reveal>
          {/* Platinum badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-white/20"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 20px rgba(0,0,0,0.3)'
            }}>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-[0.3em] uppercase"
              style={{
                background: 'linear-gradient(180deg, #f0f0f0 0%, #a8a9ad 50%, #e5e4e2 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent'
              }}>
              Partner With Us
            </span>
          </div>
          
          {/* Platinum gradient headline */}
          <h2 className="text-3xl lg:text-5xl font-light mb-8">
            <span style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #e5e4e2 30%, #c0c0c0 60%, #a8a9ad 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 2px 20px rgba(255,255,255,0.1)'
            }}>
              Become
            </span>{' '}
            <span className="text-emerald-400 font-medium">Affiliated</span>
          </h2>
          
          {/* Quote with platinum styling */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <div className="absolute -top-4 -left-4 text-6xl text-white/10 font-serif">"</div>
            <blockquote className="text-xl lg:text-2xl italic leading-relaxed px-8"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.5) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent'
              }}>
              The day I realized that residual income is far more profitable than chasing the next check, 
              was the day my mentality shifted towards wealth.
            </blockquote>
            <div className="absolute -bottom-4 -right-4 text-6xl text-white/10 font-serif rotate-180">"</div>
          </div>
          
          <p className="text-emerald-400 font-semibold mb-2">— Sanz St Louis</p>
          <p className="text-sm uppercase tracking-wider mb-10"
            style={{
              background: 'linear-gradient(180deg, #c0c0c0 0%, #808080 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
            Income Built Different
          </p>
          
          {/* Platinum button with green accent */}
          <button 
            onClick={onVisitAffiliate}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(145deg, #e5e4e2 0%, #c0c0c0 50%, #a8a9ad 100%)',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.2)'
            }}
          >
            <span className="text-[#1a1a1a]">Visit Affiliate Portal</span>
            <ArrowRight size={18} className="text-[#1a1a1a] group-hover:translate-x-1 transition-transform" />
            
            {/* Green glow on hover */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                boxShadow: '0 0 30px rgba(16,185,129,0.4), 0 0 60px rgba(16,185,129,0.2)'
              }} />
          </button>
        </Reveal>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================
export function Footer({ onNavigate }: { onNavigate: (page: string) => void }) {
  const site = useMemo(() => loadSettings().site, []);
  const socialLinks = site.socialLinks ?? {};
  const tenant = useMemo(() => getActiveTenant(), []);
  const brand = (tenant.settings.brandName || tenant.name || 'Finely Cred').trim();
  const displayDomain = (tenant.settings.customDomain || 'finelycred.com').trim();

  const XIcon = (props: { size?: number; className?: string }) => {
    const s = props.size ?? 16;
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        className={props.className}
        aria-hidden="true"
      >
        <path
          d="M18.9 2H22l-6.8 7.8L23 22h-6.7l-5.2-6.7L5.2 22H2l7.4-8.5L1 2h6.9l4.7 6.1L18.9 2ZM17.7 19.8h1.7L7.2 4.1H5.4l12.3 15.7Z"
          fill="currentColor"
        />
      </svg>
    );
  };

  const TikTokIcon = (props: { size?: number; className?: string }) => {
    const s = props.size ?? 16;
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        className={props.className}
        aria-hidden="true"
      >
        <path
          d="M14 3c.3 2.6 1.9 4.8 4.2 5.8.9.4 1.8.6 2.8.7v3.5c-1.8 0-3.5-.4-5-1.2v6.7c0 3.6-3 6.5-6.5 6.5S3 22.1 3 18.5 6 12 9.5 12c.4 0 .8 0 1.2.1v3.7c-.4-.2-.8-.2-1.2-.2-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9 3.0-1.3 3.0-2.9V3h3.5Z"
          fill="currentColor"
        />
      </svg>
    );
  };

  const socials = [
    { key: 'facebook', Icon: Facebook, url: socialLinks.facebook },
    { key: 'instagram', Icon: Instagram, url: socialLinks.instagram },
    { key: 'linkedin', Icon: Linkedin, url: socialLinks.linkedin },
    { key: 'youtube', Icon: Youtube, url: socialLinks.youtube },
    { key: 'tiktok', Icon: TikTokIcon, url: socialLinks.tiktok },
    { key: 'x', Icon: XIcon, url: socialLinks.x },
  ].filter((s) => Boolean(s.url));

  return (
    <footer className="bg-[#080c0a] pt-16 pb-28 md:pb-20 border-t border-white/5">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <span className="text-xl font-bold tracking-wider text-white">
              FINELY <span className="text-amber-500">CRED</span>
            </span>
            <p className="text-white/40 text-sm leading-relaxed">
              Full Credit Solution Company providing institutional-grade credit services.
            </p>
            <div className="flex gap-3">
              {socials.length > 0 ? (
                socials.map(({ key, Icon, url }) => (
                  <a
                    key={key}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-amber-500 hover:border-amber-500/30 transition-colors"
                    title={key}
                  >
                    <Icon size={16} />
                  </a>
                ))
              ) : (
                <a
                  href="/admin/settings"
                  className="text-xs text-white/30 hover:text-amber-500 transition-colors"
                  title="Add social links in Admin Settings"
                >
                  Add socials in Admin Settings
                </a>
              )}
            </div>
          </div>
          
          {/* Services */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-white uppercase tracking-wider">Services</p>
            <ul className="space-y-3 text-sm text-white/40">
              {['Personal Restore', 'Personal Building', 'Business Credit', 'Debt & Legal', 'Tradelines'].map(item => (
                <li key={item}>
                  <button onClick={() => onNavigate('services')} className="hover:text-amber-500 transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-white uppercase tracking-wider">Resources</p>
            <ul className="space-y-3 text-sm text-white/40">
              <li>
                <button onClick={() => onNavigate('bookstore')} className="hover:text-amber-500 transition-colors">
                  e-Books
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('resources')} className="hover:text-amber-500 transition-colors">
                  Videos
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('resources')} className="hover:text-amber-500 transition-colors">
                  DIY
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-amber-500 transition-colors">
                  FAQs
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-white uppercase tracking-wider">Contact</p>
            <ul className="space-y-3 text-sm text-white/40">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-amber-500" />
                {site.supportPhone || '800-307-4057'}
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-amber-500" />
                {site.supportEmail || 'info@finelycred.com'}
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-amber-500 mt-0.5" />
                <span>224 W 35th St Ste 500<br />#1035, New York, NY 10001</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 py-8 border-y border-white/5 mb-8">
          {[
            { icon: Lock, label: 'SSL Secured' },
            { icon: BadgeCheck, label: 'Verified Business' },
            { icon: Shield, label: 'Data Protected' },
            { icon: FileText, label: 'FCRA Compliant' },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-white/30 text-xs">
              <badge.icon size={14} />
              <span>{badge.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/30">© 2026 {displayDomain} All Rights Reserved</p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs text-white/30">
            <span className="font-mono text-amber-500/70" title={`${brand} build version`}>
              Build: {brand} · v1.0.0
            </span>
            <button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors">Terms & Conditions</button>
            <button onClick={() => onNavigate('disclaimer')} className="hover:text-white transition-colors">Disclaimer</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
