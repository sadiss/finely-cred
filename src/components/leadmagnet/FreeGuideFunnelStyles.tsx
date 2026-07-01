import React from 'react';

/** Premium lead-magnet funnel styles — high visibility glow + mockup cluster. */
export function FreeGuideFunnelStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
    .fg-funnel {
      --accent-green: #39ff14;
      --accent-green-dim: #10b981;
      --urgent-red: #e93d3d;
      --bg-dark: #141c28;
      --bg-card: #151c2a;
      font-family: Inter, system-ui, sans-serif;
    }
    .fg-funnel .text-accent-green { color: var(--accent-green); }
    .fg-funnel .bg-accent-green { background-color: var(--accent-green); }
    .fg-funnel .shadow-glow {
      box-shadow: 0 0 30px rgba(57, 255, 20, 0.35), 0 0 60px rgba(57, 255, 20, 0.15), 0 4px 20px rgba(0,0,0,0.4);
    }
    .fg-funnel .shadow-glow-hover:hover {
      box-shadow: 0 0 50px rgba(57, 255, 20, 0.55), 0 0 80px rgba(57, 255, 20, 0.2);
      transform: translateY(-2px);
    }
    .fg-funnel .text-gradient-green {
      background: linear-gradient(to right, #39ff14, #10b981, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .fg-funnel .text-gradient-blue {
      background: linear-gradient(to right, #bae6fd, #38bdf8, #fcd34d);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .fg-funnel .text-gradient-gold {
      background: linear-gradient(to right, #fde68a, #f59e0b, #fb923c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .fg-funnel .text-gradient-violet {
      background: linear-gradient(to right, #c4b5fd, #8b5cf6, #e879f9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .fg-funnel .text-gradient-magenta {
      background: linear-gradient(to right, #f0abfc, #d946ef, #fb7185);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .fg-funnel .text-gradient-lime {
      background: linear-gradient(to right, #bef264, #84cc16, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .lm-theme-debt { background: #060a10; }
    .lm-theme-business { background: #06080c; }
    .lm-theme-tradeline { background: #08060e; }
    .lm-theme-score { background: #060a08; }
    .lm-theme-agency { background: #0a0608; }
    .lm-theme-specialist { background: #06080c; }
    .lm-theme-affiliate { background: #060a08; }
    .fg-funnel .bg-mesh {
      position: relative;
      background-color: var(--bg-dark);
      overflow-x: clip;
      overflow-y: visible;
    }
    .fg-funnel .bg-mesh::before {
      content: '';
      position: absolute;
      top: -15%;
      left: -15%;
      width: 70%;
      height: 70%;
      background: radial-gradient(circle, rgba(57, 255, 20, 0.14) 0%, transparent 55%);
      filter: blur(90px);
      pointer-events: none;
    }
    .fg-funnel .bg-mesh::after {
      content: '';
      position: absolute;
      top: 10%;
      right: -10%;
      width: 50%;
      height: 50%;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 60%);
      filter: blur(80px);
      pointer-events: none;
    }
    .fg-funnel .fg-urgency-bar {
      background: linear-gradient(90deg, #e93d3d 0%, #ff6b35 50%, #e93d3d 100%);
      background-size: 200% 100%;
      animation: fg-urgency-shift 3s ease-in-out infinite;
    }
    @keyframes fg-urgency-shift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .fg-funnel .fg-highlight-card {
      border: 1px solid rgba(57, 255, 20, 0.25);
      background: linear-gradient(135deg, rgba(21, 28, 42, 0.95) 0%, rgba(11, 16, 26, 0.98) 100%);
      box-shadow: 0 0 40px rgba(57, 255, 20, 0.08), inset 0 1px 0 rgba(255,255,255,0.05);
    }
    .fg-funnel .fg-highlight-card:hover {
      border-color: rgba(57, 255, 20, 0.45);
      box-shadow: 0 0 50px rgba(57, 255, 20, 0.15);
    }
    .fg-funnel .fg-kicker-pill {
      background: linear-gradient(135deg, rgba(57,255,20,0.12) 0%, rgba(16,185,129,0.08) 100%);
      border: 1px solid rgba(57, 255, 20, 0.35);
      box-shadow: 0 0 20px rgba(57, 255, 20, 0.15);
    }
    .fg-funnel .fg-feature-card {
      border: 1px solid rgba(57, 255, 20, 0.14);
      background: linear-gradient(135deg, rgba(21, 28, 42, 0.92) 0%, rgba(11, 16, 26, 0.96) 100%);
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .fg-funnel .fg-feature-card:hover {
      border-color: rgba(57, 255, 20, 0.4);
      box-shadow: 0 0 34px rgba(57, 255, 20, 0.14);
      transform: translateY(-3px);
    }
    .fg-funnel .fg-price-card {
      position: relative;
      border: 1.5px solid rgba(57, 255, 20, 0.4);
      background: radial-gradient(ellipse at 50% -10%, rgba(57, 255, 20, 0.16) 0%, rgba(11, 16, 26, 0.96) 58%);
      box-shadow: 0 0 70px rgba(57, 255, 20, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06);
    }
    .fg-funnel .fg-stage {
      border: 1px solid rgba(57, 255, 20, 0.22);
      background:
        radial-gradient(ellipse at 72% 50%, rgba(57, 255, 20, 0.12) 0%, transparent 55%),
        linear-gradient(135deg, rgba(21, 28, 42, 0.92) 0%, rgba(8, 12, 10, 0.96) 100%);
      box-shadow: 0 0 60px rgba(57, 255, 20, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }
    .fg-funnel .fg-hero-shell {
      background:
        linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)) border-box,
        radial-gradient(ellipse at 78% 16%, rgba(56,189,248,0.16), transparent 42%),
        radial-gradient(ellipse at 15% 82%, rgba(251,191,36,0.1), transparent 45%),
        linear-gradient(135deg, rgba(17,24,39,0.98), rgba(15,23,42,0.98));
      box-shadow:
        0 34px 100px rgba(0,0,0,0.45),
        inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .fg-funnel .fg-video-hero-panel {
      background:
        radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.12), transparent 52%),
        linear-gradient(145deg, rgba(2,6,23,0.58), rgba(255,255,255,0.04));
      box-shadow:
        0 34px 100px rgba(0,0,0,0.32),
        inset 0 1px 0 rgba(255,255,255,0.07);
    }
    .fg-funnel .fg-offer-display,
    .fg-funnel .fg-capture-card,
    .fg-funnel .fg-conversion-box {
      box-shadow:
        0 26px 70px rgba(0,0,0,0.26),
        inset 0 1px 0 rgba(255,255,255,0.06);
    }
    .fg-funnel .fg-offer-display {
      background:
        radial-gradient(ellipse at 50% 20%, rgba(56,189,248,0.12), transparent 58%),
        radial-gradient(ellipse at 100% 0%, rgba(251,191,36,0.08), transparent 50%),
        linear-gradient(145deg, rgba(15,23,42,0.96), rgba(30,41,59,0.88));
    }
    .fg-funnel .fg-capture-card {
      background:
        radial-gradient(ellipse at 12% 0%, rgba(56,189,248,0.12), transparent 45%),
        radial-gradient(ellipse at 100% 10%, rgba(251,191,36,0.06), transparent 45%),
        linear-gradient(145deg, rgba(248,250,252,0.085), rgba(15,23,42,0.5));
    }
    .fg-funnel .fg-issue-picker {
      background:
        radial-gradient(ellipse at 10% 15%, rgba(56,189,248,0.1), transparent 44%),
        radial-gradient(ellipse at 90% 30%, rgba(251,191,36,0.06), transparent 44%),
        linear-gradient(145deg, rgba(255,255,255,0.07), rgba(15,23,42,0.42));
      box-shadow:
        0 24px 80px rgba(0,0,0,0.22),
        inset 0 1px 0 rgba(255,255,255,0.07);
    }
    .fg-funnel .fg-conversion-box {
      transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
    }
    .fg-funnel .fg-conversion-box:hover {
      transform: translateY(-3px);
      border-color: rgba(57,255,20,0.32);
      background: rgba(255,255,255,0.065);
    }
    .fg-funnel .fg-path-section {
      background:
        radial-gradient(ellipse at 12% 18%, rgba(57,255,20,0.13), transparent 42%),
        radial-gradient(ellipse at 85% 80%, rgba(16,185,129,0.12), transparent 46%),
        linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
      box-shadow:
        0 30px 90px rgba(0,0,0,0.28),
        inset 0 1px 0 rgba(255,255,255,0.07);
    }
    .fg-funnel .marquee-container {
      display: flex;
      width: 200%;
      animation: fg-scroll 20s linear infinite;
    }
    @keyframes fg-scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    /* Frameless ambient glow behind the hero devices — no hard edges */
    .fg-funnel .fg-hero-aura {
      background:
        radial-gradient(ellipse 60% 55% at 55% 45%, rgba(57,255,20,0.22) 0%, rgba(57,255,20,0.08) 38%, transparent 70%),
        radial-gradient(ellipse 45% 40% at 25% 75%, rgba(245,158,11,0.12) 0%, transparent 65%);
      filter: blur(36px);
      animation: fg-aura-pulse 5s ease-in-out infinite;
    }
    @keyframes fg-aura-pulse {
      0%, 100% { opacity: 0.85; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
    }
    /* Standalone guide book */
    .fg-funnel .fg-book {
      filter: drop-shadow(0 26px 40px rgba(0,0,0,0.55)) drop-shadow(0 0 26px rgba(57,255,20,0.4));
      transition: transform 0.5s ease;
      max-width: 100%;
    }
    .fg-funnel .fg-book:hover { transform: translateY(-4px); }
    .fg-funnel .fg-book-pages {
      background: linear-gradient(180deg, #ffffff 0%, #e8edf3 100%);
      box-shadow: 10px 16px 26px -10px rgba(0,0,0,0.5);
    }
    .fg-funnel .fg-book-cover {
      background: #ffffff;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 0 30px rgba(57,255,20,0.18);
      border: 1px solid rgba(57,255,20,0.35);
    }
    .fg-funnel .fg-book-cover-img {
      object-fit: cover;
      object-position: center center;
      background: #ffffff;
      image-rendering: auto;
      filter: contrast(1.05) saturate(1.05);
    }
    .fg-funnel .fg-book-spine {
      background: linear-gradient(180deg, #86efac 0%, #22c55e 45%, #0f7a3a 100%);
      box-shadow: 0 0 14px rgba(34,197,94,0.55), inset 0 0 5px rgba(255,255,255,0.45);
    }
    .fg-funnel .fg-book-proof-strip {
      background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.72) 35%, rgba(0,0,0,0.88) 100%);
      border-top: 1px solid rgba(57,255,20,0.22);
    }
    .fg-funnel .fg-trust-card {
      border: 1px solid rgba(16,185,129,0.25);
      background: linear-gradient(135deg, rgba(255,255,255,0.96), rgba(236,253,245,0.92));
      color: #0f172a;
      box-shadow: 0 24px 70px -45px rgba(16,185,129,0.45);
    }
    .fg-funnel .fg-free-badge {
      background: linear-gradient(135deg, #39ff14 0%, #22c55e 100%);
      box-shadow: 0 0 28px rgba(57,255,20,0.6), 0 8px 20px rgba(0,0,0,0.4);
      border: 2px solid rgba(255,255,255,0.55);
      transform: rotate(-8deg);
      animation: fg-badge-pop 3s ease-in-out infinite;
    }
    @keyframes fg-badge-pop {
      0%, 100% { transform: rotate(-8deg) scale(1); }
      50% { transform: rotate(-8deg) scale(1.07); }
    }
    .fg-funnel .fg-float-chip {
      background: rgba(11,16,26,0.82);
      border: 1px solid rgba(57,255,20,0.4);
      box-shadow: 0 0 20px rgba(57,255,20,0.22);
      backdrop-filter: blur(6px);
    }
    .fg-funnel .fg-video-tile {
      border: 1px solid rgba(57, 255, 20, 0.3);
      background: linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(0,0,0,0.8) 100%);
      box-shadow: 0 0 30px rgba(57,255,20,0.1);
    }
    .fg-funnel .fg-cta-primary {
      background: linear-gradient(135deg, #39ff14 0%, #22c55e 100%);
      color: #000;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .fg-funnel .fg-cta-secondary {
      background: #fff;
      color: #000;
      font-weight: 800;
      border: 2px solid rgba(57,255,20,0.4);
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .fg-funnel .fg-cta-secondary:hover {
      background: var(--accent-green);
      border-color: var(--accent-green);
    }
    .fg-funnel .fg-score-bar-fill {
      animation: fg-score-bar-grow 1.2s ease-out forwards;
      transform-origin: left center;
    }
    .fg-funnel .fg-score-pulse {
      animation: fg-score-glow 2.8s ease-in-out infinite;
    }
    @keyframes fg-score-bar-grow {
      from { transform: scaleX(0.35); opacity: 0.6; }
      to { transform: scaleX(1); opacity: 1; }
    }
    @keyframes fg-score-glow {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.12); }
    }
    .fg-funnel .fg-urgency-strip {
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
    }
    .fg-funnel .fg-sticky-cta {
      box-shadow: 0 -8px 32px rgba(0,0,0,0.45);
    }
    .fg-funnel .fg-book-shell {
      overflow: visible;
      padding-right: 0.65rem;
    }
    @media (min-width: 768px) and (max-width: 1023px) {
      .fg-funnel .fg-offer-display {
        overflow: visible;
      }
      .fg-funnel .fg-capture-card {
        padding: 1rem;
      }
      .fg-funnel .fg-video-hero-panel {
        padding: 0.85rem;
      }
    }
    @media (max-width: 767px) {
      .fg-funnel .fg-hero-shell {
        padding: 0.75rem;
        border-radius: 1.25rem;
      }
      .fg-funnel .fg-video-hero-panel {
        padding: 0.65rem;
      }
      .fg-funnel .fg-capture-card {
        padding: 0.85rem;
      }
      .fg-funnel .fg-offer-display {
        padding: 0.85rem;
      }
      .fg-funnel #fg-dispute-track,
      .fg-funnel .fg-conversion-box {
        padding: 0.85rem;
      }
    }
    /* Portal preview section — frameless, no clipping box */
    .fg-funnel .fg-preview-stage {
      overflow: visible;
      border: none;
      background:
        radial-gradient(ellipse 72% 58% at 82% 38%, rgba(57, 255, 20, 0.07) 0%, transparent 58%),
        linear-gradient(135deg, rgba(21, 28, 42, 0.72) 0%, rgba(8, 12, 10, 0.82) 100%);
      box-shadow: none;
    }
    .fg-funnel .fg-device-showcase {
      position: relative;
      width: 100%;
      max-width: 640px;
      margin-left: auto;
      margin-right: 0;
      overflow: visible;
      background: transparent;
      border: none;
      box-shadow: none;
    }
    @media (max-width: 1023px) {
      .fg-funnel .fg-device-showcase {
        margin-right: auto;
      }
    }
    .fg-funnel .fg-device-composition {
      position: relative;
      width: 100%;
      overflow: visible;
      padding: 0;
      background: transparent;
      border: none;
      box-shadow: none;
    }
    .fg-funnel .fg-device-ambient {
      position: absolute;
      left: 55%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 105%;
      height: 108%;
      pointer-events: none;
      z-index: 0;
      background:
        radial-gradient(ellipse 50% 44% at 50% 48%, rgba(57, 255, 20, 0.11) 0%, transparent 72%),
        radial-gradient(ellipse 38% 34% at 22% 78%, rgba(16, 185, 129, 0.06) 0%, transparent 75%);
      filter: blur(48px);
      opacity: 0.75;
    }
    .fg-funnel .fg-device-browser {
      position: relative;
      z-index: 1;
      border-radius: 1rem;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.07);
      background: #0a0f14;
      box-shadow: 0 32px 64px -28px rgba(0, 0, 0, 0.82);
    }
    .fg-funnel .fg-device-browser-body {
      position: relative;
      padding: 0.65rem 0.75rem 0.85rem;
      background: linear-gradient(165deg, var(--fc-shell, #0f1419) 0%, #0a100e 100%);
    }
    @media (min-width: 640px) {
      .fg-funnel .fg-device-browser-body {
        padding: 0.75rem 0.85rem 1.15rem;
        padding-bottom: clamp(4.5rem, 20%, 6rem);
      }
    }
    .fg-funnel .fg-device-browser-fade {
      pointer-events: none;
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 48%;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(10, 15, 20, 0.25) 45%,
        rgba(10, 15, 20, 0.72) 78%,
        rgba(10, 15, 20, 0.92) 100%
      );
      z-index: 2;
    }
    .fg-funnel .fg-device-phone-float {
      position: absolute;
      z-index: 4;
      width: clamp(92px, 24%, 124px);
      right: clamp(10px, 3.5%, 18px);
      bottom: clamp(10px, 4.5%, 18px);
      filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.45));
    }
    @media (max-width: 639px) {
      .fg-funnel .fg-device-phone-float {
        position: relative;
        right: auto;
        bottom: auto;
        width: min(132px, 38vw);
        margin: 1rem auto 0;
        filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.42));
      }
      .fg-funnel .fg-device-browser-body {
        padding-right: 0.75rem;
        padding-bottom: 0.85rem;
      }
      .fg-funnel .fg-device-browser-fade {
        height: 24%;
      }
    }
    .fg-funnel .fg-device-phone-bezel {
      border-radius: 1.65rem;
      padding: 5px;
      background: linear-gradient(155deg, #3d3d3d 0%, #141414 48%, #222 100%);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.14),
        0 0 0 1px rgba(255, 255, 255, 0.06);
    }
    .fg-funnel .fg-device-phone-screen {
      container-type: inline-size;
      container-name: fgphone;
      border-radius: 1.35rem;
      overflow: hidden;
      background: linear-gradient(180deg, #0f1419 0%, #0a100e 100%);
      aspect-ratio: 9 / 19;
      display: flex;
      flex-direction: column;
    }
    .fg-funnel .fg-phone-notch {
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%);
      width: 32%;
      height: 11px;
      border-radius: 9999px;
      background: #000;
      z-index: 3;
    }
    .fg-funnel .fg-phone-ui {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 1.65rem 0.5rem 0.45rem;
      font-size: clamp(6.5px, 2.8cqw, 9.5px);
      line-height: 1.3;
    }
    .fg-funnel .fg-phone-ui .fg-phone-label {
      font-size: 0.72em;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.42);
    }
    .fg-funnel .fg-phone-ui .fg-phone-title {
      font-size: 1.05em;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.92);
    }
    .fg-funnel .fg-phone-ui .fg-phone-stat {
      font-size: 1.05em;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: rgba(255, 255, 255, 0.95);
    }
    .fg-funnel .fg-phone-score {
      font-size: clamp(1.2rem, 8.5cqw, 1.55rem);
      font-weight: 200;
      line-height: 1;
      color: #6ee7b7;
      font-variant-numeric: tabular-nums;
      margin: 0.15em 0;
    }
    .fg-funnel .fg-mock-nav-row {
      display: flex;
      flex-wrap: nowrap;
      gap: 0.25rem;
      overflow: hidden;
      mask-image: linear-gradient(to right, black 85%, transparent 100%);
    }
    .fg-funnel .fg-mock-nav-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      white-space: nowrap;
      padding: 0.2rem 0.45rem;
      border-radius: 0.45rem;
      font-size: 0.62rem;
      font-weight: 700;
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.55);
      background: rgba(255, 255, 255, 0.03);
    }
    .fg-funnel .fg-mock-nav-pill.is-active {
      border-color: rgba(52, 211, 153, 0.35);
      background: rgba(16, 185, 129, 0.14);
      color: #a7f3d0;
    }

    /* ── Premium lead magnets — editorial / institutional ── */
    .fg-funnel .lm-page { background: inherit; color: #f8fafc; }
    .fg-funnel .lm-nav {
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(4,6,10,0.88);
      backdrop-filter: blur(16px);
    }
    .fg-funnel .lm-nav-urgency {
      display: block;
      font-size: 10px;
      letter-spacing: 0.06em;
      margin-top: 2px;
      opacity: 0.7;
    }

    .fg-funnel .lm-hero-pro {
      position: relative;
      overflow: hidden;
      max-height: 340px;
    }
    .fg-funnel .lm-hero-pro-bg {
      position: absolute;
      inset: 0;
    }
    .fg-funnel .lm-hero-pro-bg img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 30%;
    }
    .fg-funnel .lm-hero-pro-veil {
      position: absolute;
      inset: 0;
    }

    .fg-funnel .lm-text-accent {
      color: rgba(255,255,255,0.92);
    }
    .fg-funnel .lm-text-gold-refined {
      background: linear-gradient(135deg, #f5f0e6 0%, #c9a227 55%, #a88b2a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .fg-funnel .lm-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 0.8125rem;
      letter-spacing: 0.02em;
      border-radius: 6px;
      transition: background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
    }
    .fg-funnel .lm-cta-champagne {
      background: #c9a227;
      color: #0a0c10;
      border: 1px solid #d4b84a;
    }
    .fg-funnel .lm-cta-champagne:hover { background: #d4b84a; }
    .fg-funnel .lm-cta-slate {
      background: rgba(255,255,255,0.95);
      color: #0a0c10;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .fg-funnel .lm-cta-slate:hover { background: #fff; }

    .fg-funnel .lm-media-wrap { margin-top: -1rem; }
    .fg-funnel .lm-media-frame {
      position: relative;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.08);
      background: #0a0c10;
      box-shadow: 0 24px 64px rgba(0,0,0,0.4);
    }
    .fg-funnel .lm-media-video,
    .fg-funnel .lm-video-shell {
      width: 100%;
      aspect-ratio: 16 / 9;
      display: block;
    }
    .fg-funnel .lm-video-placeholder {
      background-size: cover;
      background-position: center;
      border: none;
      cursor: pointer;
      width: 100%;
      min-height: 100%;
    }
    .fg-funnel .lm-video-placeholder-veil {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.45);
    }
    .fg-funnel .lm-video-play-ring {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.35);
      background: rgba(0,0,0,0.5);
    }
    .fg-funnel .lm-media-ebook {
      position: absolute;
      right: 1rem;
      bottom: -1.75rem;
      z-index: 2;
      pointer-events: none;
    }
    .fg-funnel .lm-ebook {
      filter: drop-shadow(0 16px 32px rgba(0,0,0,0.5));
    }
    .fg-funnel .lm-media-wrap { padding-bottom: 2rem; }

    .fg-funnel .lm-section-title {
      font-size: 1.125rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: rgba(255,255,255,0.95);
    }
    .fg-funnel .lm-section-body {
      margin-top: 0.75rem;
      font-size: 0.9375rem;
      line-height: 1.65;
      color: rgba(255,255,255,0.48);
    }
    .fg-funnel .lm-pro-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .fg-funnel .lm-pro-list li {
      display: grid;
      gap: 0.25rem;
      padding: 0.85rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .fg-funnel .lm-pro-list li:last-child { border-bottom: none; }
    .fg-funnel .lm-pro-list-title {
      font-size: 0.9375rem;
      font-weight: 500;
      color: rgba(255,255,255,0.9);
    }
    .fg-funnel .lm-pro-list-desc {
      font-size: 0.8125rem;
      color: rgba(255,255,255,0.42);
      line-height: 1.5;
    }

    .fg-funnel .lm-tab {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: rgba(255,255,255,0.4);
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color 0.15s ease, border-color 0.15s ease;
    }
    .fg-funnel .lm-tab.is-active {
      color: rgba(255,255,255,0.92);
      border-bottom-color: rgba(255,255,255,0.5);
    }
    .fg-funnel .lm-tab:hover { color: rgba(255,255,255,0.7); }

    .fg-funnel .lm-capture-pro {
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      background: rgba(255,255,255,0.02);
      padding: 1.25rem;
    }
`,
`,
      }}
    />
  );
}
