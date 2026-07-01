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
    .lm-theme-debt { background: #0a1628; position: relative; }
    .lm-theme-debt::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 50% at 20% 0%, rgba(34,211,238,0.12), transparent); pointer-events: none; }
    .lm-theme-business { background: #1a1208; position: relative; }
    .lm-theme-business::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 70% 45% at 80% 10%, rgba(245,158,11,0.14), transparent); pointer-events: none; }
    .lm-theme-tradeline { background: #120a1f; position: relative; }
    .lm-theme-tradeline::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 75% 50% at 50% 0%, rgba(139,92,246,0.13), transparent); pointer-events: none; }
    .lm-theme-score { background: #0a1410; position: relative; }
    .lm-theme-score::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 55% at 30% 0%, rgba(57,255,20,0.1), transparent); pointer-events: none; }
    .lm-theme-agency { background: #1a0a14; position: relative; }
    .lm-theme-agency::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 70% 50% at 70% 0%, rgba(217,70,239,0.12), transparent); pointer-events: none; }
    .lm-theme-specialist { background: #0a1220; position: relative; }
    .lm-theme-specialist::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 75% 45% at 40% 0%, rgba(56,189,248,0.12), transparent); pointer-events: none; }
    .lm-theme-affiliate { background: #0f1a0a; position: relative; }
    .lm-theme-affiliate::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 50% at 60% 0%, rgba(132,204,22,0.11), transparent); pointer-events: none; }
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

    /* ── Premium lead magnet (vertical cinematic) ── */
    .fg-funnel .lm-page { position: relative; isolation: isolate; }
    .fg-funnel .lm-page > * { position: relative; z-index: 1; }

    .fg-funnel .lm-nav {
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(3,7,18,0.72);
      backdrop-filter: blur(20px) saturate(1.4);
    }

    .fg-funnel .lm-hero {
      position: relative;
      min-height: min(92vh, 920px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      text-align: center;
      overflow: hidden;
      padding: 0 1rem 3.5rem;
    }
    .fg-funnel .lm-hero-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
    }
    .fg-funnel .lm-hero-bg img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scale(1.04);
      animation: lm-kenburns 22s ease-in-out infinite alternate;
    }
    @keyframes lm-kenburns {
      from { transform: scale(1.04) translateY(0); }
      to { transform: scale(1.1) translateY(-1.5%); }
    }
    .fg-funnel .lm-hero-veil {
      position: absolute;
      inset: 0;
      z-index: 1;
    }
    .fg-funnel .lm-hero-glow {
      position: absolute;
      left: 50%;
      top: 18%;
      width: min(720px, 90vw);
      height: 320px;
      transform: translateX(-50%);
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.55;
      z-index: 2;
      pointer-events: none;
    }
    .fg-funnel .lm-hero-inner {
      position: relative;
      z-index: 3;
      max-width: 52rem;
      width: 100%;
      margin: 0 auto;
      padding-top: 7rem;
    }

    .fg-funnel .lm-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      border-radius: 9999px;
      border: 1px solid rgba(255,255,255,0.18);
      transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
    }
    .fg-funnel .lm-cta:hover { transform: translateY(-2px); filter: brightness(1.06); }
    .fg-funnel .lm-cta-cyan { background: linear-gradient(135deg, #22d3ee, #2563eb); color: #fff; box-shadow: 0 16px 48px rgba(34,211,238,0.35); }
    .fg-funnel .lm-cta-gold { background: linear-gradient(135deg, #fbbf24, #ea580c); color: #111; box-shadow: 0 16px 48px rgba(245,158,11,0.35); }
    .fg-funnel .lm-cta-violet { background: linear-gradient(135deg, #a78bfa, #c026d3); color: #fff; box-shadow: 0 16px 48px rgba(139,92,246,0.35); }
    .fg-funnel .lm-cta-emerald { background: linear-gradient(135deg, #39ff14, #059669); color: #041008; box-shadow: 0 16px 48px rgba(57,255,20,0.32); }
    .fg-funnel .lm-cta-fuchsia { background: linear-gradient(135deg, #e879f9, #db2777); color: #fff; box-shadow: 0 16px 48px rgba(217,70,239,0.35); }
    .fg-funnel .lm-cta-sky { background: linear-gradient(135deg, #38bdf8, #4f46e5); color: #fff; box-shadow: 0 16px 48px rgba(56,189,248,0.35); }
    .fg-funnel .lm-cta-lime { background: linear-gradient(135deg, #a3e635, #16a34a); color: #0a1404; box-shadow: 0 16px 48px rgba(132,204,22,0.35); }

    .fg-funnel .lm-glow-cyan { box-shadow: 0 0 0 1px rgba(34,211,238,0.12), 0 24px 80px rgba(34,211,238,0.08); }
    .fg-funnel .lm-glow-gold { box-shadow: 0 0 0 1px rgba(245,158,11,0.12), 0 24px 80px rgba(245,158,11,0.08); }
    .fg-funnel .lm-glow-violet { box-shadow: 0 0 0 1px rgba(139,92,246,0.12), 0 24px 80px rgba(139,92,246,0.08); }
    .fg-funnel .lm-glow-emerald { box-shadow: 0 0 0 1px rgba(57,255,20,0.12), 0 24px 80px rgba(57,255,20,0.08); }
    .fg-funnel .lm-glow-fuchsia { box-shadow: 0 0 0 1px rgba(217,70,239,0.12), 0 24px 80px rgba(217,70,239,0.08); }
    .fg-funnel .lm-glow-sky { box-shadow: 0 0 0 1px rgba(56,189,248,0.12), 0 24px 80px rgba(56,189,248,0.08); }
    .fg-funnel .lm-glow-lime { box-shadow: 0 0 0 1px rgba(132,204,22,0.12), 0 24px 80px rgba(132,204,22,0.08); }

    .fg-funnel .lm-proof-chip {
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(12px);
      border-radius: 1rem;
      padding: 0.85rem 1rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: rgba(255,255,255,0.88);
      line-height: 1.35;
    }

    .fg-funnel .lm-stat-band {
      border-top: 1px solid rgba(255,255,255,0.06);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
      backdrop-filter: blur(8px);
    }
    .fg-funnel .lm-stat-num {
      font-size: clamp(1.5rem, 4vw, 2.25rem);
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1;
    }

    .fg-funnel .lm-glass-panel {
      border: 1px solid rgba(255,255,255,0.09);
      background: linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02));
      backdrop-filter: blur(18px);
      border-radius: 1.75rem;
    }

    .fg-funnel .lm-bento {
      display: grid;
      gap: 0.85rem;
      grid-template-columns: repeat(6, 1fr);
      grid-auto-rows: minmax(120px, auto);
    }
    @media (max-width: 767px) {
      .fg-funnel .lm-bento { grid-template-columns: repeat(2, 1fr); }
    }
    .fg-funnel .lm-bento-card {
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      border-radius: 1.35rem;
      padding: 1.25rem;
      transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
    }
    .fg-funnel .lm-bento-card:hover {
      transform: translateY(-3px);
      border-color: rgba(255,255,255,0.16);
      background: rgba(255,255,255,0.06);
    }

    .fg-funnel .lm-scroll-row {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding-bottom: 0.35rem;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .fg-funnel .lm-scroll-row::-webkit-scrollbar { display: none; }
    .fg-funnel .lm-scroll-card {
      flex: 0 0 min(280px, 78vw);
      scroll-snap-align: start;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      border-radius: 1.25rem;
      padding: 1.15rem;
    }

    .fg-funnel .lm-path-pill {
      border-radius: 9999px;
      padding: 0.55rem 1.1rem;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.5);
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .fg-funnel .lm-path-pill.is-active {
      color: #fff;
      border-color: rgba(255,255,255,0.28);
      background: rgba(255,255,255,0.1);
    }

    .fg-funnel .lm-timeline {
      display: flex;
      gap: 0.65rem;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding: 0.25rem 0 0.5rem;
    }
    .fg-funnel .lm-timeline-step {
      flex: 0 0 min(200px, 70vw);
      scroll-snap-align: center;
      border-radius: 1.15rem;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      padding: 1rem;
      text-align: center;
    }

    .fg-funnel .lm-capture-shell {
      max-width: 32rem;
      margin: 0 auto;
      border-radius: 2rem;
      border: 1px solid rgba(255,255,255,0.12);
      background:
        radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08), transparent 55%),
        linear-gradient(180deg, rgba(15,23,42,0.92), rgba(3,7,18,0.96));
      box-shadow: 0 40px 120px rgba(0,0,0,0.45);
      padding: 1.75rem;
    }
    @media (min-width: 640px) {
      .fg-funnel .lm-capture-shell { padding: 2.25rem; }
    }

    .fg-funnel .lm-feature-rail .lm-feature-tile {
      flex: 0 0 min(220px, 72vw);
      scroll-snap-align: start;
      border-radius: 1.15rem;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.035);
      padding: 1rem;
    }

    .fg-funnel .lm-cert-marquee {
      display: flex;
      width: max-content;
      animation: fg-scroll 28s linear infinite;
      gap: 0.65rem;
    }

    .fg-funnel .lm-value-float {
      position: absolute;
      right: clamp(1rem, 4vw, 2.5rem);
      top: clamp(5.5rem, 12vh, 8rem);
      z-index: 4;
      border-radius: 1.25rem;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(14px);
      padding: 0.85rem 1.1rem;
      text-align: left;
    }
    @media (max-width: 640px) {
      .fg-funnel .lm-value-float {
        position: relative;
        right: auto;
        top: auto;
        margin: 1.25rem auto 0;
        display: inline-block;
      }
    }

    .fg-funnel .lm-announce {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: 9999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(0,0,0,0.35);
      backdrop-filter: blur(10px);
      padding: 0.45rem 1rem;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.75);
      margin-bottom: 1.25rem;
    }

    .fg-funnel .lm-hero-compact {
      min-height: min(72vh, 720px);
      padding-bottom: 2rem;
    }

    .fg-funnel .lm-urgency-rail {
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: linear-gradient(90deg, rgba(234,88,12,0.08), rgba(0,0,0,0.35), rgba(234,88,12,0.08));
      backdrop-filter: blur(10px);
    }

    .fg-funnel .lm-media-stage {
      position: relative;
      border-radius: 1.75rem;
      border: 1px solid rgba(255,255,255,0.1);
      background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.45));
      overflow: hidden;
      padding-bottom: 1.25rem;
      box-shadow: 0 40px 120px rgba(0,0,0,0.45);
    }
    .fg-funnel .lm-media-stage-glow {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }
    .fg-funnel .lm-media-video,
    .fg-funnel .lm-video-shell {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      z-index: 1;
    }
    .fg-funnel .lm-video-placeholder {
      background-size: cover;
      background-position: center;
      border: none;
      cursor: pointer;
      width: 100%;
      display: block;
    }
    .fg-funnel .lm-video-placeholder-veil {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.72));
    }
    .fg-funnel .lm-video-play-ring {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 4.5rem;
      height: 4.5rem;
      border-radius: 9999px;
      border: 2px solid rgba(255,255,255,0.35);
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(8px);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .fg-funnel .lm-video-placeholder:hover .lm-video-play-ring {
      transform: scale(1.06);
      border-color: rgba(255,255,255,0.55);
    }
    .fg-funnel .lm-media-ebook-wrap {
      position: relative;
      z-index: 3;
      margin-top: -4.5rem;
      padding-bottom: 0.5rem;
      pointer-events: none;
    }
    .fg-funnel .lm-media-stage-footer {
      position: relative;
      z-index: 2;
      text-align: center;
      padding: 0 1rem;
    }
    .fg-funnel .lm-ebook-stage {
      position: relative;
      display: flex;
      justify-content: center;
    }
    .fg-funnel .lm-ebook-aura {
      position: absolute;
      left: 50%;
      top: 55%;
      width: 140%;
      height: 120%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, var(--lm-accent, #39ff14) 0%, transparent 65%);
      filter: blur(40px);
      opacity: 0.35;
      pointer-events: none;
    }
    .fg-funnel .lm-ebook-float {
      filter: drop-shadow(0 30px 50px rgba(0,0,0,0.55)) drop-shadow(0 0 30px rgba(57,255,20,0.15));
      animation: lm-ebook-float 5s ease-in-out infinite;
    }
    @keyframes lm-ebook-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    .fg-funnel .lm-ebook-free-badge {
      position: absolute;
      top: -0.35rem;
      right: -0.75rem;
      z-index: 20;
      background: linear-gradient(135deg, #39ff14, #22c55e);
      color: #041008;
      font-size: 0.62rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      padding: 0.35rem 0.55rem;
      border-radius: 0.5rem;
      border: 2px solid rgba(255,255,255,0.55);
      transform: rotate(8deg);
      box-shadow: 0 8px 24px rgba(57,255,20,0.45);
    }
    .fg-funnel .lm-capture-urgency {
      animation: lm-pulse-border 2.5s ease-in-out infinite;
    }
    @keyframes lm-pulse-border {
      0%, 100% { opacity: 0.85; }
      50% { opacity: 1; }
    }
`,
      }}
    />
  );
}
