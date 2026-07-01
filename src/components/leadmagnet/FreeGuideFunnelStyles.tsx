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
    .lm-theme-debt,
    .lm-theme-business,
    .lm-theme-tradeline,
    .lm-theme-score,
    .lm-theme-agency,
    .lm-theme-specialist,
    .lm-theme-affiliate {
      background: linear-gradient(180deg, var(--lm-bg-from, #120a1f) 0%, var(--lm-bg-to, #050308) 55%, #030208 100%);
    }
    .fg-funnel .lm-flyer-page {
      position: relative;
      color: #f8fafc;
    }
    .fg-funnel .lm-flyer-page::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(ellipse 55% 40% at 12% 8%, rgba(var(--lm-mesh-a), 0.18) 0%, transparent 62%),
        radial-gradient(ellipse 45% 35% at 88% 18%, rgba(var(--lm-mesh-b), 0.14) 0%, transparent 58%);
      z-index: 0;
    }
    .fg-funnel .lm-flyer-page > * { position: relative; z-index: 1; }

    .fg-funnel .lm-nav {
      border-bottom: 1px solid rgba(255,255,255,0.08);
      background: rgba(6,8,14,0.9);
      backdrop-filter: blur(12px);
    }
    .fg-funnel .lm-nav-urgency {
      display: block;
      font-size: 11px;
      margin-top: 2px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .fg-funnel .lm-text-theme-gradient {
      background: linear-gradient(135deg, var(--lm-grad-from) 0%, var(--lm-grad-mid) 45%, var(--lm-grad-to) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .fg-funnel .lm-cta-theme,
    .fg-funnel .lm-cta-finely {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #0a0612;
      background: linear-gradient(135deg, var(--lm-accent), var(--lm-accent-2));
      border: 2px solid rgba(0,0,0,0.85);
      box-shadow: 0 4px 24px rgba(var(--lm-accent-rgb), 0.4);
      transition: transform 0.2s ease, filter 0.2s ease;
    }
    .fg-funnel .lm-cta-theme:hover,
    .fg-funnel .lm-cta-finely:hover { transform: translateY(-1px); filter: brightness(1.06); }
    .fg-funnel .lm-cta-theme-lg,
    .fg-funnel .lm-cta-finely-lg { padding: 0.85rem 1.5rem; font-size: 0.875rem; }
    .fg-funnel .lm-cta-banner-btn {
      background: #0a0612 !important;
      color: #fff !important;
      border-color: rgba(255,255,255,0.15) !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.35) !important;
    }

    /* Flyer hero band — atmospheric image, copy-forward */
    .fg-funnel .lm-flyer-hero-band {
      position: relative;
      padding: 1.5rem 0 2rem;
      overflow: hidden;
    }
    .fg-funnel .lm-flyer-hero-band-img {
      position: absolute;
      inset: 0;
      z-index: 0;
    }
    .fg-funnel .lm-flyer-hero-band-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 30%;
      opacity: 0.35;
      filter: saturate(0.85);
    }
    .fg-funnel .lm-flyer-hero-band-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, var(--lm-overlay-from) 0%, rgba(6,8,14,0.92) 48%, var(--lm-overlay-to) 100%);
    }
    .fg-funnel .lm-flyer-hero-band-grid {
      display: grid;
      gap: 1.25rem;
      align-items: center;
    }
    @media (min-width: 900px) {
      .fg-funnel .lm-flyer-hero-band-grid {
        grid-template-columns: minmax(0, 1fr) minmax(140px, 200px);
      }
    }
    .fg-funnel .lm-flyer-hero-thumb {
      display: none;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 4/3;
      border: 1px solid rgba(255,255,255,0.12);
      opacity: 0.55;
    }
    @media (min-width: 900px) {
      .fg-funnel .lm-flyer-hero-thumb { display: block; }
    }
    .fg-funnel .lm-flyer-hero-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .fg-funnel .lm-flyer-hero-thumb-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, transparent, rgba(0,0,0,0.55));
    }
    .fg-funnel .lm-flyer-hero-copy { max-width: 42rem; }
    .fg-funnel .lm-flyer-category {
      font-size: 0.8125rem;
      font-weight: 800;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--lm-accent);
      margin-bottom: 0.75rem;
    }
    .fg-funnel .lm-flyer-headline {
      font-size: clamp(2rem, 5.5vw, 3.25rem);
      font-weight: 900;
      font-style: italic;
      line-height: 1.02;
      letter-spacing: -0.02em;
      text-transform: uppercase;
      color: #fff;
    }
    .fg-funnel .lm-flyer-pill {
      display: inline-block;
      margin-top: 1.1rem;
      padding: 0.55rem 1.1rem;
      border-radius: 9999px;
      background: rgba(0,0,0,0.55);
      border: 1px solid rgba(var(--lm-accent-rgb), 0.55);
      color: var(--lm-accent);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .fg-funnel .lm-flyer-sub {
      margin-top: 1.1rem;
      font-size: clamp(1.125rem, 2.2vw, 1.375rem);
      font-weight: 600;
      line-height: 1.4;
      color: rgba(255,255,255,0.9);
    }
    .fg-funnel .lm-flyer-highlight { color: var(--lm-accent); }
    .fg-funnel .lm-flyer-desc {
      margin-top: 0.85rem;
      font-size: 1rem;
      line-height: 1.65;
      color: rgba(255,255,255,0.52);
      max-width: 38rem;
    }

    /* Flyer tagline strip */
    .fg-funnel .lm-flyer-tagline-bar {
      margin: 0.5rem 0 1.25rem;
      padding: 0.85rem 1.25rem;
      text-align: center;
      font-size: clamp(0.75rem, 2vw, 0.9375rem);
      font-weight: 900;
      font-style: italic;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #fff;
      background: #000;
      border-top: 2px solid rgba(var(--lm-accent-rgb), 0.5);
      border-bottom: 2px solid rgba(var(--lm-accent-rgb), 0.5);
    }

    /* Product stage — video spotlight + ebook overlap + benefits */
    .fg-funnel .lm-showcase-section { margin-top: 0.25rem; }
    .fg-funnel .lm-flyer-stage {
      position: relative;
      display: grid;
      gap: 1rem;
      min-height: 280px;
    }
    @media (min-width: 900px) {
      .fg-funnel .lm-flyer-stage {
        grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
        grid-template-rows: auto auto;
        gap: 1.25rem 1.5rem;
        align-items: start;
        min-height: 340px;
        padding-bottom: 0.5rem;
      }
    }
    .fg-funnel .lm-flyer-stage-video {
      position: relative;
      z-index: 3;
      order: 1;
    }
    @media (min-width: 900px) {
      .fg-funnel .lm-flyer-stage-video {
        grid-column: 1;
        grid-row: 1 / span 2;
        padding-left: clamp(100px, 18%, 200px);
      }
    }
    .fg-funnel .lm-video-spotlight-ring {
      position: absolute;
      inset: -8px -12px -16px -8px;
      border-radius: 20px;
      background: radial-gradient(ellipse at 50% 40%, rgba(var(--lm-accent-rgb), 0.35) 0%, transparent 68%);
      filter: blur(18px);
      z-index: 0;
      pointer-events: none;
    }
    .fg-funnel .lm-video-card {
      position: relative;
      z-index: 1;
      border-radius: 14px;
      overflow: hidden;
      background: #000;
    }
    .fg-funnel .lm-video-card-featured {
      border: 3px solid rgba(var(--lm-accent-rgb), 0.65);
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.08),
        0 24px 64px rgba(0,0,0,0.55),
        0 0 48px rgba(var(--lm-accent-rgb), 0.22);
    }
    .fg-funnel .lm-video-card-inner { aspect-ratio: 16 / 9; width: 100%; }
    .fg-funnel .lm-video-card-featured-inner {
      min-height: 200px;
      max-height: none;
    }
    @media (min-width: 900px) {
      .fg-funnel .lm-video-card-featured-inner { min-height: 300px; }
    }
    .fg-funnel .lm-video-glow {
      background: radial-gradient(circle at 30% 30%, rgba(var(--lm-accent-rgb), 0.35), transparent 60%);
    }
    .fg-funnel .lm-video-placeholder {
      background-size: cover;
      background-position: center;
      width: 100%;
      height: 100%;
      min-height: 200px;
      border: none;
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .fg-funnel .lm-video-placeholder-veil {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.38);
    }
    .fg-funnel .lm-video-play-ring {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 4.5rem;
      height: 4.5rem;
      border-radius: 50%;
      border: 3px solid rgba(var(--lm-accent-rgb), 0.7);
      background: rgba(0,0,0,0.6);
      box-shadow: 0 0 32px rgba(var(--lm-accent-rgb), 0.35);
    }
    .fg-funnel .lm-video-badge {
      border-color: rgba(var(--lm-accent-rgb), 0.45);
      color: var(--lm-accent);
    }

    .fg-funnel .lm-flyer-stage-ebook {
      position: relative;
      z-index: 5;
      order: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: -2rem;
    }
    @media (min-width: 900px) {
      .fg-funnel .lm-flyer-stage-ebook {
        position: absolute;
        left: 0;
        bottom: 1.5rem;
        margin-top: 0;
        align-items: flex-start;
        width: clamp(168px, 22%, 240px);
      }
    }
    .fg-funnel .lm-ebook-hero-wrap.is-stage {
      transform: rotate(-6deg);
      transform-origin: center bottom;
    }
    @media (min-width: 900px) {
      .fg-funnel .lm-ebook-hero-wrap.is-stage {
        transform: rotate(-8deg) translateY(8px);
      }
      .fg-funnel .lm-ebook-hero-wrap.is-stage:hover {
        transform: rotate(-5deg) translateY(4px);
        transition: transform 0.3s ease;
      }
    }
    .fg-funnel .lm-ebook-hero-wrap.is-hero .lm-ebook-gradient-ring {
      position: absolute;
      inset: -14px -18px;
      border-radius: 20px;
      background: linear-gradient(135deg, rgba(var(--lm-accent-rgb), 0.4), rgba(var(--lm-accent-2-rgb), 0.35));
      filter: blur(22px);
      z-index: 0;
    }
    .fg-funnel .lm-ebook-book {
      position: relative;
      z-index: 1;
      filter: drop-shadow(0 32px 56px rgba(0,0,0,0.65)) drop-shadow(0 0 28px rgba(var(--lm-accent-rgb), 0.25));
    }
    .fg-funnel .lm-ebook-free-label { color: var(--lm-accent); }
    .fg-funnel .lm-ebook-ribbon {
      margin-top: 0.85rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
    }
    .fg-funnel .lm-showcase-guide-title {
      margin-top: 0.65rem;
      font-size: 0.8125rem;
      font-weight: 700;
      color: rgba(255,255,255,0.72);
      text-align: center;
      line-height: 1.35;
    }
    @media (min-width: 900px) {
      .fg-funnel .lm-showcase-guide-title { text-align: left; }
    }

    .fg-funnel .lm-benefits-box {
      padding: 1rem 1.25rem;
      border-radius: 12px;
      background: rgba(0,0,0,0.72);
      border: 2px solid rgba(var(--lm-accent-rgb), 0.5);
      backdrop-filter: blur(8px);
    }
    .fg-funnel .lm-benefits-box-flyer {
      order: 3;
      z-index: 2;
    }
    @media (min-width: 900px) {
      .fg-funnel .lm-benefits-box-flyer {
        grid-column: 2;
        grid-row: 1 / span 2;
        align-self: stretch;
      }
    }
    .fg-funnel .lm-benefits-box-title {
      font-size: 0.875rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--lm-accent);
      margin-bottom: 0.85rem;
    }
    .fg-funnel .lm-benefits-check { color: var(--lm-accent); }
    .fg-funnel .lm-benefits-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .fg-funnel .lm-benefits-list li {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.9375rem;
      color: rgba(255,255,255,0.86);
      line-height: 1.4;
    }

    .fg-funnel .lm-flyer-section-title {
      font-size: clamp(1.25rem, 2.8vw, 1.75rem);
      font-weight: 900;
      font-style: italic;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--lm-accent);
    }

    .fg-funnel .lm-process-rail {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding: 1rem 0 0.5rem;
      scroll-snap-type: x mandatory;
    }
    .fg-funnel .lm-process-step {
      position: relative;
      flex: 0 0 min(130px, 30vw);
      scroll-snap-align: start;
      text-align: center;
    }
    .fg-funnel .lm-process-icon {
      width: 3.75rem;
      height: 3.75rem;
      margin: 0 auto;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 900;
      color: #fff;
      background: linear-gradient(135deg, var(--lm-accent-2), var(--lm-accent));
      border: 2px solid rgba(255,255,255,0.2);
    }
    .fg-funnel .lm-process-label {
      margin-top: 0.55rem;
      font-size: 0.6875rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: rgba(255,255,255,0.78);
    }

    .fg-funnel .lm-dual-panel {
      display: grid;
      gap: 1rem;
    }
    @media (min-width: 768px) {
      .fg-funnel .lm-dual-panel { grid-template-columns: 1fr 1.2fr; }
    }
    .fg-funnel .lm-results-panel {
      padding: 1.35rem;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(var(--lm-accent-2-rgb), 0.22), rgba(var(--lm-accent-rgb), 0.08));
      border: 1px solid rgba(var(--lm-accent-rgb), 0.35);
    }
    .fg-funnel .lm-access-panel {
      padding: 1.35rem;
      border-radius: 12px;
      background: #000;
      border: 2px solid rgba(var(--lm-accent-rgb), 0.45);
    }
    .fg-funnel .lm-panel-title {
      font-size: 0.875rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--lm-accent-2);
      margin-bottom: 1rem;
    }
    .fg-funnel .lm-panel-title-light { color: var(--lm-accent); }
    .fg-funnel .lm-metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }
    .fg-funnel .lm-metric-value {
      font-size: clamp(1.35rem, 3vw, 1.75rem);
      font-weight: 900;
      color: #fff;
    }
    .fg-funnel .lm-metric-value-accent { color: var(--lm-accent); }
    .fg-funnel .lm-metric-label {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: rgba(255,255,255,0.5);
      margin-top: 0.25rem;
    }
    .fg-funnel .lm-access-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
    .fg-funnel .lm-access-item { text-align: center; padding: 0.75rem 0.5rem; }
    .fg-funnel .lm-access-icon {
      width: 2.5rem;
      height: 2.5rem;
      margin: 0 auto 0.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--lm-accent-2), var(--lm-accent));
    }
    .fg-funnel .lm-access-title {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      color: #fff;
    }
    .fg-funnel .lm-access-desc {
      font-size: 0.6875rem;
      color: rgba(255,255,255,0.45);
      margin-top: 0.25rem;
      line-height: 1.35;
    }

    .fg-funnel .lm-foundation-row {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      margin-top: 1rem;
    }
    .fg-funnel .lm-foundation-item { text-align: center; }
    .fg-funnel .lm-foundation-icon {
      width: 3rem;
      height: 3rem;
      margin: 0 auto 0.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--lm-accent), var(--lm-accent-2));
      border: 2px solid rgba(255,255,255,0.15);
    }
    .fg-funnel .lm-foundation-title {
      font-size: 0.8125rem;
      font-weight: 800;
      text-transform: uppercase;
      color: #fff;
    }
    .fg-funnel .lm-foundation-desc {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.45);
      margin-top: 0.35rem;
      line-height: 1.4;
    }

    .fg-funnel .lm-kit-grid {
      list-style: none;
      margin: 1rem 0 0;
      padding: 0;
      display: grid;
      gap: 0;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.08);
    }
    @media (min-width: 640px) {
      .fg-funnel .lm-kit-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .fg-funnel .lm-kit-grid li {
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .fg-funnel .lm-kit-num {
      font-size: 1.25rem;
      font-weight: 900;
      color: rgba(var(--lm-accent-rgb), 0.55);
    }
    .fg-funnel .lm-kit-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #fff;
    }
    .fg-funnel .lm-kit-desc {
      font-size: 0.8125rem;
      color: rgba(255,255,255,0.45);
      margin-top: 0.2rem;
    }

    .fg-funnel .lm-track-chip {
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border: 1px solid rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.5);
      background: transparent;
      transition: all 0.15s ease;
    }
    .fg-funnel .lm-track-chip.is-active {
      border-color: var(--lm-accent);
      color: #fff;
      background: linear-gradient(135deg, rgba(var(--lm-accent-2-rgb), 0.35), rgba(var(--lm-accent-rgb), 0.25));
    }

    .fg-funnel .lm-cta-banner {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      align-items: flex-start;
      padding: 1.75rem 2rem;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--lm-accent) 0%, var(--lm-accent-2) 55%, var(--lm-grad-to) 100%);
      border: 2px solid #0a0612;
      box-shadow: 0 20px 60px rgba(var(--lm-accent-rgb), 0.28);
    }
    @media (min-width: 768px) {
      .fg-funnel .lm-cta-banner {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }
    .fg-funnel .lm-cta-banner-headline {
      font-size: clamp(1.35rem, 3.2vw, 2rem);
      font-weight: 900;
      font-style: italic;
      text-transform: uppercase;
      color: #0a0612;
      line-height: 1.08;
    }
    .fg-funnel .lm-cta-banner-sub {
      margin-top: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: rgba(10,6,18,0.78);
    }

    .fg-funnel .lm-capture-card {
      padding: 1.5rem;
      border-radius: 16px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(var(--lm-accent-rgb), 0.3);
      box-shadow: 0 20px 60px rgba(0,0,0,0.35);
    }
    .fg-funnel .lm-faq-item { border-bottom: 1px solid rgba(255,255,255,0.08); }
    .fg-funnel .lm-faq-trigger {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 0;
      text-align: left;
      font-size: 0.9375rem;
      font-weight: 600;
      color: rgba(255,255,255,0.9);
    }
    .fg-funnel .lm-faq-answer {
      padding-bottom: 1rem;
      font-size: 0.875rem;
      color: rgba(255,255,255,0.5);
      line-height: 1.55;
    }
    .fg-funnel .lm-footer-shield { color: var(--lm-accent); }

    .fg-funnel .lm-text-finely-gradient {
      background: linear-gradient(135deg, var(--lm-grad-from) 0%, var(--lm-grad-mid) 45%, var(--lm-grad-to) 100%);
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
`,
      }}
    />
  );
}
