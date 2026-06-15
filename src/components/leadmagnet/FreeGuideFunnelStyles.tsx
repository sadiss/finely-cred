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
    }
    .fg-funnel .fg-book:hover { transform: translateY(-4px); }
    .fg-funnel .fg-book-pages {
      background: linear-gradient(180deg, #ffffff 0%, #e8edf3 100%);
      box-shadow: 10px 16px 26px -10px rgba(0,0,0,0.5);
    }
    .fg-funnel .fg-book-cover {
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), inset -8px 0 18px -8px rgba(0,0,0,0.25), 0 0 30px rgba(57,255,20,0.18);
      border: 1px solid rgba(57,255,20,0.35);
    }
    .fg-funnel .fg-book-cover-img {
      image-rendering: auto;
      filter: contrast(1.08) saturate(1.08) sharpen(0.2);
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
    `,
      }}
    />
  );
}
