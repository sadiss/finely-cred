import type { PremiumSpreadViewModel } from './buildPremiumSpreadViewModel';
import type { SpreadColorKey } from './premiumSpreadPalette';
import {
  accentCover,
  creamCover,
  darkCover,
  footerLabel,
  forestCover,
  glassCover,
  partnerBanner,
  partnerBannerLight,
  z,
  type SpreadTextZone,
} from './spreadZoneRenderer';

export const PREMIUM_SPREAD_FILES = [
  '01_sophisticated_credit_analysis_spread.png',
  '02_credit_readiness_and_analysis_overview.png',
  '03_financial_report_analysis_spread_design.png',
  '04_credit_analysis_report_spread_4_of_10.png',
  '05_corporate_credit_action_plan_overview.png',
  '06_credit_analysis_report_overview.png',
  '07_credit_insights_for_a_brighter_future.png',
  '08_building_freedom_through_strategic_credit.png',
  '09_luxurious_financial_report_design_spread.png',
  '10_elite_credit_positioning_path_guide.png',
] as const;

/** Alias for legacy imports */
export const PREMIUM_CREDIT_ANALYSIS_SPREADS = PREMIUM_SPREAD_FILES;

export type SpreadPageSpec = {
  file: string;
  buildZones: (vm: PremiumSpreadViewModel, ctx?: SpreadPageContext) => SpreadTextZone[];
};

export type SpreadPageContext = {
  positivePage?: number;
  priorityPage?: number;
  inquiryPage?: number;
  pageNumber?: number;
  pageTotal?: number;
};

const missing = 'Not reported in this file';

function scoreText(score: number | null) {
  return score == null ? missing : String(score);
}

function scoreAccent(score: number | null): SpreadColorKey {
  if (score == null) return 'muted';
  if (score >= 720) return 'emerald';
  if (score >= 660) return 'green';
  if (score >= 580) return 'amber';
  return 'rose';
}

function impactAccent(impact?: string): SpreadColorKey {
  if (/highest|high/i.test(String(impact))) return 'rose';
  if (/medium|moderate/i.test(String(impact))) return 'amber';
  if (/low/i.test(String(impact))) return 'violet';
  return 'emerald';
}

function titleBlock(title: string, subtitle: string, dark = false): SpreadTextZone[] {
  return [
    z('', 0.07, 0.22, 1, { cover: accentCover(0.07, 0.218, 0.018, 0.088, dark ? 'emerald' : 'amber') }),
    z(title, 0.102, 0.238, 16, {
      color: dark ? 'goldLight' : 'greenDark',
      bold: true,
      maxWidth: 0.72,
      cover: dark ? forestCover(0.085, 0.214, 0.78, 0.07) : glassCover(0.085, 0.214, 0.78, 0.07, 'amber'),
    }),
    z(subtitle, 0.102, 0.28, 8.5, {
      color: dark ? 'white' : 'soft',
      maxWidth: 0.72,
      maxLines: 2,
    }),
  ];
}

function metricCard(args: {
  label: string;
  value: string;
  detail?: string;
  x: number;
  y: number;
  w?: number;
  accent?: SpreadColorKey;
  dark?: boolean;
}): SpreadTextZone[] {
  const w = args.w ?? 0.19;
  const bg = args.dark ? forestCover(args.x, args.y, w, 0.108) : glassCover(args.x, args.y, w, 0.108, args.accent ?? 'amber');
  const numericValue = Number(String(args.value).replace(/[^\d.]/g, ''));
  const valueColor = args.accent ?? (Number.isFinite(numericValue) && numericValue > 0 ? scoreAccent(numericValue) : 'greenDark');
  return [
    z('', args.x, args.y, 1, { cover: bg }),
    z('', args.x, args.y, 1, { cover: accentCover(args.x, args.y, 0.008, 0.108, args.accent ?? 'amber') }),
    z(args.label.toUpperCase(), args.x + 0.018, args.y + 0.024, 6.8, {
      color: args.dark ? 'goldLight' : 'muted',
      bold: true,
      maxWidth: w - 0.03,
    }),
    z(args.value, args.x + 0.018, args.y + 0.055, 17, {
      color: args.dark ? 'white' : valueColor,
      bold: true,
      maxWidth: w - 0.03,
      maxLines: 1,
      minSize: 12,
    }),
    ...(args.detail
      ? [
          z(args.detail, args.x + 0.018, args.y + 0.086, 7.2, {
            color: args.dark ? 'white' : 'soft',
            maxWidth: w - 0.03,
            maxLines: 1,
            minSize: 6,
          }),
        ]
      : []),
  ];
}

function insightCard(args: {
  label: string;
  body: string;
  x: number;
  y: number;
  w: number;
  h?: number;
  accent?: SpreadColorKey;
  dark?: boolean;
  lines?: number;
}): SpreadTextZone[] {
  const h = args.h ?? 0.09;
  return [
    z('', args.x, args.y, 1, { cover: args.dark ? forestCover(args.x, args.y, args.w, h) : glassCover(args.x, args.y, args.w, h, args.accent ?? 'emerald') }),
    z('', args.x, args.y, 1, { cover: accentCover(args.x, args.y, 0.007, h, args.accent ?? 'emerald') }),
    z(args.label.toUpperCase(), args.x + 0.018, args.y + 0.023, 7.2, {
      color: args.dark ? 'goldLight' : args.accent ?? 'greenDark',
      bold: true,
      maxWidth: args.w - 0.03,
      maxLines: 1,
    }),
    z(args.body, args.x + 0.018, args.y + 0.052, 8.1, {
      color: args.dark ? 'white' : 'ink',
      maxWidth: args.w - 0.035,
      maxLines: args.lines ?? 2,
      minSize: 6.7,
    }),
  ];
}

function spread01(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const inq =
    vm.inquiriesImpacting > 0 ? `${vm.inquiriesTotal} (${vm.inquiriesImpacting} impacting)` : String(vm.inquiriesTotal);
  return [
    ...partnerBanner(vm),
    z('PREMIUM CREDIT ANALYSIS', 0.09, 0.28, 21, {
      color: 'goldLight',
      bold: true,
      maxWidth: 0.46,
      cover: forestCover(0.065, 0.245, 0.52, 0.09),
    }),
    z(`A dynamic bureau-by-bureau strategy report prepared for ${vm.partnerName}.`, 0.09, 0.35, 10, {
      color: 'white',
      maxWidth: 0.46,
      maxLines: 2,
    }),
    z('', 0.66, 0.235, 1, { cover: forestCover(0.64, 0.235, 0.27, 0.5) }),
    z('', 0.64, 0.235, 1, { cover: accentCover(0.64, 0.235, 0.01, 0.5, 'emerald') }),
    z('FILE SNAPSHOT', 0.68, 0.275, 8, { color: 'goldLight', bold: true, maxWidth: 0.18 }),
    ...metricCard({ label: 'Headline score', value: scoreText(vm.headlineScore), detail: `${vm.scoreBandLabel} band`, x: 0.68, y: 0.31, w: 0.19, accent: scoreAccent(vm.headlineScore), dark: true }),
    ...metricCard({ label: 'Readiness', value: vm.approvalReadiness, detail: `${vm.readinessPercent}% strategy score`, x: 0.68, y: 0.44, w: 0.19, accent: 'emerald', dark: true }),
    ...metricCard({ label: 'Negatives', value: String(vm.negativeItemsCount), detail: 'items to sequence', x: 0.68, y: 0.57, w: 0.19, accent: vm.negativeItemsCount ? 'rose' : 'emerald', dark: true }),
    ...metricCard({ label: 'Utilization', value: vm.utilizationPct != null ? `${vm.utilizationPct}%` : missing, detail: vm.utilizationBand, x: 0.68, y: 0.7, w: 0.19, accent: 'amber', dark: true }),
    ...insightCard({
      label: 'Application timing',
      body: `${inq} inquiry record(s). Hold new applications while priority updates are active unless your strategist clears timing.`,
      x: 0.09,
      y: 0.74,
      w: 0.46,
      h: 0.105,
      accent: 'fuchsia',
      dark: true,
      lines: 3,
    }),
    ...footerLabel(vm, ctx),
  ];
}

function spread02(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock('Credit Readiness Snapshot', `${vm.partnerFirstName}'s score, bureau spread, and immediate movement strategy.`, false),
    z('', 0.08, 0.34, 1, { cover: glassCover(0.08, 0.34, 0.38, 0.25, scoreAccent(vm.headlineScore)) }),
    z('HEADLINE SCORE', 0.12, 0.385, 8, { color: 'muted', bold: true, maxWidth: 0.18 }),
    z(scoreText(vm.headlineScore), 0.12, 0.45, 34, {
      color: scoreAccent(vm.headlineScore),
      bold: true,
      maxWidth: 0.22,
      maxLines: 1,
    }),
    z(`${vm.scoreBandLabel} band - ${vm.approvalReadiness} readiness`, 0.12, 0.525, 10, {
      color: 'ink',
      bold: true,
      maxWidth: 0.29,
      maxLines: 2,
    }),
    z(vm.readinessTagline, 0.12, 0.57, 8, { color: 'soft', maxWidth: 0.3, maxLines: 2 }),
    ...metricCard({ label: 'Readiness', value: `${vm.readinessPercent}%`, detail: vm.readinessStatus, x: 0.5, y: 0.34, w: 0.17, accent: 'emerald' }),
    ...metricCard({ label: 'Target', value: `${vm.readinessTargetPercent}%+`, detail: 'before major applications', x: 0.7, y: 0.34, w: 0.18, accent: 'amber' }),
  ];
  let y = 0.63;
  zones.push(z('BUREAU SCORE CARDS', 0.1, y - 0.04, 8, { color: 'greenDark', bold: true, maxWidth: 0.28 }));
  let x = 0.1;
  for (const b of vm.bureauScores) {
    const delta = b.delta != null ? `  +${b.delta} pts` : '';
    zones.push(...metricCard({ label: b.label, value: scoreText(b.score), detail: delta.trim() || 'bureau score', x, y, w: 0.235, accent: scoreAccent(b.score) }));
    x += 0.265;
  }
  zones.push(
    ...insightCard({ label: "What's helping", body: vm.quickRead.helping, x: 0.1, y: 0.78, w: 0.25, accent: 'emerald', lines: 3 }),
    ...insightCard({ label: "What's hurting", body: vm.quickRead.hurting, x: 0.385, y: 0.78, w: 0.25, accent: 'rose', lines: 3 }),
    ...insightCard({ label: 'Improve first', body: vm.quickRead.improveFirst, x: 0.67, y: 0.78, w: 0.24, accent: 'violet', lines: 3 }),
    ...footerLabel(vm, ctx),
  );
  return zones;
}

function spread03(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock('Negative Item Strategy', 'Risk areas are organized into clear, attractive action cards instead of dense negative lists.', false),
  ];
  let y = 0.34;
  zones.push(z('CATEGORY IMPACT', 0.1, 0.32, 8, { color: 'greenDark', bold: true, maxWidth: 0.25 }));
  for (const row of vm.negativeSummary) {
    zones.push(
      z('', 0.09, y, 1, { cover: glassCover(0.09, y, 0.36, 0.08, impactAccent(row.impact)) }),
      z(row.label, 0.115, y + 0.026, 8.5, {
        color: 'ink',
        bold: true,
        maxWidth: 0.21,
        maxLines: 1,
      }),
      z(String(row.count), 0.39, y + 0.023, 18, { color: row.count === 0 ? 'emerald' : impactAccent(row.impact), bold: true, align: 'center', maxWidth: 0.04 }),
      z(`Impact: ${row.impact}`, 0.115, y + 0.055, 7.2, { color: 'soft', maxWidth: 0.24 }),
    );
    y += 0.09;
  }
  zones.push(z('HIGHEST PRIORITY REVIEWS', 0.54, 0.32, 8, { color: 'greenDark', bold: true, maxWidth: 0.3 }));
  let ry = 0.36;
  for (const p of vm.reviewPriorities) {
    zones.push(
      ...insightCard({ label: p.title, body: p.description, x: 0.53, y: ry, w: 0.38, h: 0.08, accent: 'amber', lines: 2 }),
    );
    ry += 0.088;
  }
  return [...zones, ...footerLabel(vm, ctx)];
}

function spread04(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock('Utilization & Tradeline Health', 'A clean view of available credit, account mix, and what supports lender confidence.', false),
    ...metricCard({
      label: 'Utilization',
      value: vm.utilizationPct != null ? `${vm.utilizationPct}%` : missing,
      detail: vm.utilizationBand,
      x: 0.1,
      y: 0.34,
      w: 0.22,
      accent: vm.utilizationPct != null && vm.utilizationPct <= 30 ? 'emerald' : 'amber',
    }),
  ];
  let ry = 0.5;
  zones.push(z('REVOLVING SNAPSHOTS', 0.1, 0.47, 8, { color: 'greenDark', bold: true, maxWidth: 0.28 }));
  for (const r of vm.revolvingSnapshots) {
    zones.push(
      ...insightCard({
        label: r.creditor,
        body: `Available ${r.available} | Balance ${r.balance} | Utilization ${r.utilPct}`,
        x: 0.1,
        y: ry,
        w: 0.36,
        h: 0.076,
        accent: 'emerald',
        lines: 2,
      }),
    );
    ry += 0.085;
  }
  const th = vm.tradelineHealth;
  zones.push(
    ...metricCard({ label: 'Open accts', value: String(th.openAccounts), detail: 'active accounts', x: 0.53, y: 0.34, w: 0.15, accent: 'emerald' }),
    ...metricCard({ label: 'Avg age', value: th.avgAgeLabel, detail: 'credit depth', x: 0.72, y: 0.34, w: 0.17, accent: 'violet' }),
    ...metricCard({ label: 'Revolving', value: String(th.revolving), detail: 'cards/lines', x: 0.53, y: 0.47, w: 0.15, accent: 'sky' }),
    ...metricCard({ label: 'Payment', value: `${th.paymentHistoryPct}%`, detail: 'positive pattern', x: 0.72, y: 0.47, w: 0.17, accent: 'emerald' }),
  );
  let wy = 0.63;
  zones.push(z('WORKING WELL', 0.53, 0.6, 8, { color: 'emerald', bold: true, maxWidth: 0.2 }));
  for (const w of vm.workingWell) {
    zones.push(z(w, 0.55, wy, 7.5, { color: 'ink', maxWidth: 0.34, maxLines: 2, cover: glassCover(0.53, wy - 0.012, 0.37, 0.042, 'emerald') }));
    wy += 0.055;
  }
  let wa = 0.79;
  zones.push(z('WATCH AREAS', 0.53, 0.76, 8, { color: 'rose', bold: true, maxWidth: 0.2 }));
  for (const w of vm.watchAreas) {
    zones.push(z(w, 0.55, wa, 7.5, { color: 'ink', maxWidth: 0.34, maxLines: 2, cover: glassCover(0.53, wa - 0.012, 0.37, 0.042, 'rose') }));
    wa += 0.055;
  }
  return [...zones, ...footerLabel(vm, ctx)];
}

function spread05(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const zones: SpreadTextZone[] = [
    ...partnerBanner(vm),
    ...titleBlock('Priority Action Plan', `${vm.partnerFirstName}'s fastest movement comes from sequencing the right items first.`, true),
  ];
  const bulletSets = [vm.stabilizeBullets, vm.correctBullets, vm.strengthenBullets];
  const labels = ['Stabilize', 'Correct', 'Strengthen'];
  let bx = 0.08;
  for (let i = 0; i < bulletSets.length; i++) {
    zones.push(...insightCard({ label: labels[i], body: bulletSets[i].slice(0, 2).join(' '), x: bx, y: 0.36, w: 0.26, h: 0.13, accent: i === 0 ? 'emerald' : i === 1 ? 'amber' : 'violet', dark: true, lines: 4 }));
    bx += 0.29;
  }
  let wy = 0.55;
  zones.push(z('FASTEST WINS', 0.1, 0.525, 8, { color: 'goldLight', bold: true, maxWidth: 0.25 }));
  for (const win of vm.fastestWins.slice(0, 4)) {
    const accent = impactAccent(win.impact);
    zones.push(
      z('', 0.09, wy, 1, { cover: forestCover(0.09, wy, 0.78, 0.078) }),
      z('', 0.09, wy, 1, { cover: accentCover(0.09, wy, 0.008, 0.078, accent) }),
      z(String(win.rank).padStart(2, '0'), 0.118, wy + 0.028, 12, { color: accent, bold: true, maxWidth: 0.04 }),
      z(win.title, 0.17, wy + 0.024, 9.2, { color: 'goldLight', bold: true, maxWidth: 0.2 }),
      z(win.description, 0.17, wy + 0.052, 7.5, { color: 'white', maxWidth: 0.5, maxLines: 2, minSize: 6.4 }),
      z(win.impact, 0.72, wy + 0.03, 6.6, { color: 'white', bold: true, maxWidth: 0.12, maxLines: 1, cover: { ...darkCover(0.7, wy + 0.012, 0.14, 0.033), borderColor: accent, borderOpacity: 0.45 } }),
    );
    wy += 0.09;
  }
  zones.push(
    ...metricCard({ label: 'Current readiness', value: `${vm.readinessPercent}%`, detail: vm.overallReadiness, x: 0.18, y: 0.89, w: 0.22, accent: 'emerald', dark: true }),
    ...metricCard({ label: 'Target readiness', value: `${vm.readinessTargetPercent}%+`, detail: 'before funding push', x: 0.52, y: 0.89, w: 0.24, accent: 'amber', dark: true }),
    ...footerLabel(vm, ctx),
  );
  return zones;
}

function spread06(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock('Credit Factor Review', `${vm.partnerName} - ${vm.scoreBandLabel} score band with ${vm.approvalReadiness.toLowerCase()} readiness.`, false),
    ...metricCard({ label: 'Headline', value: scoreText(vm.headlineScore), detail: `${vm.scoreBandLabel} band`, x: 0.1, y: 0.34, w: 0.18, accent: scoreAccent(vm.headlineScore) }),
    ...metricCard({ label: 'Open accts', value: String(vm.openAccountsCount), detail: 'active depth', x: 0.31, y: 0.34, w: 0.16, accent: 'emerald' }),
    ...metricCard({ label: 'Inquiries', value: String(vm.inquiriesTotal), detail: `${vm.inquiriesImpacting} impacting`, x: 0.5, y: 0.34, w: 0.16, accent: vm.inquiriesTotal > 3 ? 'rose' : 'violet' }),
    ...metricCard({ label: 'Negatives', value: String(vm.negativeItemsCount), detail: 'review targets', x: 0.69, y: 0.34, w: 0.18, accent: vm.negativeItemsCount ? 'amber' : 'emerald' }),
  ];
  let y = 0.51;
  zones.push(z('BUREAU POSITION', 0.1, 0.485, 8, { color: 'greenDark', bold: true, maxWidth: 0.22 }));
  let x = 0.1;
  for (const b of vm.bureauScores) {
    zones.push(...metricCard({ label: b.label, value: scoreText(b.score), detail: 'reported score', x, y, w: 0.235, accent: scoreAccent(b.score) }));
    x += 0.265;
  }
  let fy = 0.67;
  zones.push(z('FACTOR STATUS', 0.1, 0.642, 8, { color: 'greenDark', bold: true, maxWidth: 0.22 }));
  for (const f of vm.factorRows.slice(0, 4)) {
    zones.push(
      ...insightCard({ label: `${f.label}: ${f.status}`, body: f.detail, x: fy < 0.78 ? 0.1 : 0.53, y: fy < 0.78 ? fy : fy - 0.11, w: 0.37, h: 0.085, accent: /fair|review/i.test(f.status) ? 'amber' : 'emerald', lines: 2 }),
    );
    fy += 0.055;
  }
  zones.push(
    ...insightCard({ label: 'Near-term strategist note', body: vm.quickRead.nearTerm, x: 0.1, y: 0.86, w: 0.78, h: 0.075, accent: 'fuchsia', lines: 2 }),
    ...footerLabel(vm, ctx),
  );
  return zones;
}

function spread07(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const zones: SpreadTextZone[] = [
    ...partnerBanner(vm),
    ...titleBlock(`${vm.partnerFirstName}'s Momentum Map`, `Readiness ${vm.readinessPercent}% toward a ${vm.readinessTargetPercent}%+ target.`, true),
    ...metricCard({ label: 'Readiness', value: `${vm.readinessPercent}%`, detail: vm.readinessStatus, x: 0.1, y: 0.36, w: 0.2, accent: 'emerald', dark: true }),
    ...metricCard({ label: 'Target', value: `${vm.readinessTargetPercent}%+`, detail: 'approval posture', x: 0.34, y: 0.36, w: 0.2, accent: 'amber', dark: true }),
    ...metricCard({ label: 'Score band', value: vm.scoreBandLabel, detail: 'current lane', x: 0.58, y: 0.36, w: 0.2, accent: scoreAccent(vm.headlineScore), dark: true }),
  ];
  let y = 0.55;
  zones.push(z('STRENGTHS TO PROTECT', 0.1, 0.52, 8, { color: 'goldLight', bold: true, maxWidth: 0.3 }));
  for (const w of vm.workingWell.slice(0, 3)) {
    zones.push(...insightCard({ label: 'Positive signal', body: w, x: 0.1, y, w: 0.36, h: 0.085, accent: 'emerald', dark: true, lines: 2 }));
    y += 0.095;
  }
  let wy = 0.55;
  zones.push(z('WATCH AREAS TO MANAGE', 0.54, 0.52, 8, { color: 'goldLight', bold: true, maxWidth: 0.3 }));
  for (const w of vm.watchAreas.slice(0, 3)) {
    zones.push(...insightCard({ label: 'Strategic caution', body: w, x: 0.54, y: wy, w: 0.36, h: 0.085, accent: 'rose', dark: true, lines: 2 }));
    wy += 0.095;
  }
  return [...zones, ...footerLabel(vm, ctx)];
}

function spread08(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock('Strategic Credit Roadmap', vm.quickRead.improveFirst, false),
  ];
  const cols = [
    { title: 'Stabilize', items: vm.stabilizeBullets, accent: 'emerald' as SpreadColorKey },
    { title: 'Correct', items: vm.correctBullets, accent: 'amber' as SpreadColorKey },
    { title: 'Strengthen', items: vm.strengthenBullets, accent: 'violet' as SpreadColorKey },
  ];
  let cx = 0.1;
  for (const col of cols) {
    zones.push(
      z('', cx - 0.015, 0.42, 1, { cover: glassCover(cx - 0.015, 0.42, 0.255, 0.36, col.accent) }),
      z('', cx - 0.015, 0.42, 1, { cover: accentCover(cx - 0.015, 0.42, 0.008, 0.36, col.accent) }),
      z(col.title.toUpperCase(), cx + 0.005, 0.455, 9, { color: col.accent, bold: true, maxWidth: 0.2 }),
      z(col.items.slice(0, 3).join(' '), cx + 0.005, 0.51, 8, { color: 'ink', maxWidth: 0.21, maxLines: 8, minSize: 6.5 }),
    );
    cx += 0.3;
  }
  zones.push(...insightCard({ label: 'Operating principle', body: 'The report is a snapshot. The portal stays live: upload updates, track evidence, and regenerate after bureau changes post.', x: 0.1, y: 0.84, w: 0.78, h: 0.075, accent: 'fuchsia', lines: 2 }));
  return [...zones, ...footerLabel(vm, ctx)];
}

function spread09(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock('More Than A Score', `Prepared ${vm.preparedDateLong}. This page translates the file into lender-facing positioning.`, false),
    ...metricCard({ label: 'Headline score', value: scoreText(vm.headlineScore), detail: `${vm.scoreBandLabel} band`, x: 0.1, y: 0.34, w: 0.2, accent: scoreAccent(vm.headlineScore) }),
    ...metricCard({ label: 'Utilization', value: vm.utilizationPct != null ? `${vm.utilizationPct}%` : missing, detail: vm.utilizationBand, x: 0.34, y: 0.34, w: 0.2, accent: 'amber' }),
    ...metricCard({ label: 'Open accounts', value: String(vm.openAccountsCount), detail: 'depth signal', x: 0.58, y: 0.34, w: 0.2, accent: 'emerald' }),
  ];
  let y = 0.5;
  zones.push(z('RISK CONCENTRATION', 0.1, 0.475, 8, { color: 'greenDark', bold: true, maxWidth: 0.3 }));
  for (const row of vm.negativeSummary) {
    zones.push(
      ...insightCard({ label: `${row.label}: ${row.count}`, body: `Impact level: ${row.impact}. ${row.count ? 'Sequence with documentation and bureau-specific accuracy review.' : 'No major blocker reported in this category.'}`, x: 0.1, y, w: 0.72, h: 0.07, accent: impactAccent(row.impact), lines: 2 }),
    );
    y += 0.078;
  }
  zones.push(...insightCard({ label: 'Positioning note', body: vm.quickRead.nearTerm, x: 0.1, y: 0.89, w: 0.72, h: 0.06, accent: 'violet', lines: 2 }));
  return [...zones, ...footerLabel(vm, ctx)];
}

function spread10(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const steps = [
    { title: 'Build', detail: 'Document your file and upload three-bureau reports to Finely Cred.' },
    { title: 'Stabilize', detail: `Lower utilization (${vm.utilizationPct ?? '—'}%) and protect ${vm.openAccountsCount} open accounts.` },
    { title: 'Optimize', detail: `Address ${vm.negativeItemsCount} negative item(s) with evidence-backed disputes.` },
    { title: 'Expand', detail: 'Sequence funding lanes after bureau updates post.' },
    { title: 'Qualify', detail: `Target ${vm.readinessTargetPercent}%+ readiness before major applications.` },
  ];
  const zones: SpreadTextZone[] = [
    ...partnerBanner(vm),
    ...titleBlock('Elite Positioning Path', `${vm.partnerFirstName}'s next moves from report insight to action.`, true),
  ];
  let y = 0.36;
  steps.forEach((s, i) => {
    const accent: SpreadColorKey = i === 0 ? 'emerald' : i === 1 ? 'amber' : i === 2 ? 'rose' : i === 3 ? 'violet' : 'sky';
    zones.push(
      z('', 0.1, y, 1, { cover: forestCover(0.1, y, 0.74, 0.075) }),
      z('', 0.1, y, 1, { cover: accentCover(0.1, y, 0.009, 0.075, accent) }),
      z(String(i + 1).padStart(2, '0'), 0.13, y + 0.03, 12, { color: accent, bold: true, maxWidth: 0.04 }),
      z(s.title, 0.19, y + 0.024, 10, { color: 'goldLight', bold: true, maxWidth: 0.15 }),
      z(s.detail, 0.19, y + 0.052, 8, { color: 'white', maxWidth: 0.56, maxLines: 2, minSize: 6.6 }),
    );
    y += 0.092;
  });
  zones.push(...insightCard({ label: 'Final standard', body: 'Act in sequence, protect positive depth, and re-run analysis when new bureau data arrives.', x: 0.12, y: 0.84, w: 0.68, h: 0.075, accent: 'fuchsia', dark: true, lines: 2 }));
  return [...zones, ...footerLabel(vm, ctx)];
}

function extensionBureauGrid(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock('Bureau Comparison Grid', 'Category counts by bureau - use this to see where risk is concentrated.', false),
  ];
  let y = 0.38;
  zones.push(
    z('', 0.09, y, 1, { cover: glassCover(0.09, y, 0.49, 0.052, 'amber') }),
    z('Category', 0.11, y + 0.032, 8, { color: 'greenDark', bold: true, maxWidth: 0.2 }),
    z('EQF', 0.35, y + 0.032, 8, { color: 'amber', bold: true, align: 'center' }),
    z('EXP', 0.43, y + 0.032, 8, { color: 'amber', bold: true, align: 'center' }),
    z('TUC', 0.51, y + 0.032, 8, { color: 'amber', bold: true, align: 'center' }),
  );
  y += 0.064;
  for (const [cat, counts] of Object.entries(vm.bureauGrid)) {
    zones.push(
      z('', 0.09, y, 1, { cover: glassCover(0.09, y, 0.49, 0.052, 'emerald') }),
      z(cat, 0.11, y + 0.032, 8, { color: 'ink', maxWidth: 0.21, maxLines: 1 }),
      z(String(counts.Equifax ?? 0), 0.35, y + 0.032, 9, { color: 'ink', bold: true, align: 'center' }),
      z(String(counts.Experian ?? 0), 0.43, y + 0.032, 9, { color: 'ink', bold: true, align: 'center' }),
      z(String(counts.TransUnion ?? 0), 0.51, y + 0.032, 9, { color: 'ink', bold: true, align: 'center' }),
    );
    y += 0.058;
  }
  let sy = 0.39;
  zones.push(z('BUREAU SCORES', 0.64, 0.36, 8, { color: 'greenDark', bold: true, maxWidth: 0.2 }));
  for (const b of vm.bureauScores) {
    zones.push(...metricCard({ label: b.label, value: scoreText(b.score), detail: 'reported score', x: 0.63, y: sy, w: 0.24, accent: scoreAccent(b.score) }));
    sy += 0.125;
  }
  return [...zones, ...footerLabel(vm, ctx)];
}

/** Extension: positive accounts (reuses spread 04 art) */
function extensionPositives(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const page = ctx?.positivePage ?? 0;
  const chunk = vm.positiveSnapshots.slice(page * 3, page * 3 + 3);
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock(`Positive Accounts - Page ${page + 1}`, 'These are the account strengths to protect while strategy work is active.', false),
  ];
  let y = 0.38;
  for (const p of chunk) {
    zones.push(
      ...insightCard({
        label: p.creditor,
        body: `${p.status} | Available ${p.available} | Balance ${p.balance} | Utilization ${p.utilPct}`,
        x: 0.1,
        y,
        w: 0.72,
        h: 0.105,
        accent: 'emerald',
        lines: 3,
      }),
    );
    y += 0.125;
  }
  return [...zones, ...footerLabel(vm, ctx)];
}

function extensionPriorities(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const page = ctx?.priorityPage ?? 0;
  const chunk = vm.priorityTargets.slice(page * 4, page * 4 + 4);
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock(`Priority Targets - Page ${page + 1}`, 'Ranked review targets with impact level and reason for attention.', false),
  ];
  let y = 0.37;
  for (const p of chunk) {
    const accent = impactAccent(p.impact);
    zones.push(
      z('', 0.09, y, 1, { cover: glassCover(0.09, y, 0.78, 0.105, accent) }),
      z('', 0.09, y, 1, { cover: accentCover(0.09, y, 0.009, 0.105, accent) }),
      z(String(p.rank).padStart(2, '0'), 0.12, y + 0.04, 13, { color: accent, bold: true, maxWidth: 0.04 }),
      z(p.creditor, 0.18, y + 0.032, 9.5, { color: 'ink', bold: true, maxWidth: 0.42, maxLines: 1 }),
      z(p.subtitle, 0.18, y + 0.06, 7.2, { color: 'soft', maxWidth: 0.42, maxLines: 1 }),
      z(p.why, 0.18, y + 0.083, 7.3, { color: 'ink', maxWidth: 0.48, maxLines: 2, minSize: 6.3 }),
      z(p.impact, 0.72, y + 0.04, 6.6, { color: 'ink', bold: true, maxWidth: 0.12, maxLines: 1, cover: glassCover(0.7, y + 0.018, 0.14, 0.033, accent) }),
    );
    y += 0.12;
  }
  return [...zones, ...footerLabel(vm, ctx)];
}

function extensionInquiries(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const page = ctx?.inquiryPage ?? 0;
  const chunk = vm.inquiries.slice(page * 6, page * 6 + 6);
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock(`Hard Inquiry Timing - Page ${page + 1}`, 'Hold new applications during active dispute rounds unless your strategist clears timing.', false),
  ];
  let y = 0.38;
  for (const row of chunk) {
    zones.push(
      z('', 0.1, y, 1, { cover: glassCover(0.1, y, 0.7, 0.07, 'violet') }),
      z('', 0.1, y, 1, { cover: accentCover(0.1, y, 0.008, 0.07, 'violet') }),
      z(row.company.slice(0, 42), 0.125, y + 0.027, 8.6, { color: 'ink', bold: true, maxWidth: 0.4, maxLines: 1 }),
      z(row.date, 0.58, y + 0.027, 7.4, { color: 'soft', maxWidth: 0.1, maxLines: 1 }),
      z(row.bureau, 0.7, y + 0.027, 7.4, { color: 'soft', maxWidth: 0.08, maxLines: 1 }),
    );
    y += 0.08;
  }
  if (!chunk.length) {
    zones.push(...insightCard({ label: 'No inquiry rows extracted', body: 'No hard inquiry detail was reported in the parsed file. Keep application timing conservative until the next report upload confirms activity.', x: 0.1, y: 0.4, w: 0.68, h: 0.11, accent: 'emerald', lines: 3 }));
  }
  return [...zones, ...footerLabel(vm, ctx)];
}

function extensionRoadmap(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const now = [
    'Upload three-bureau reports if not already on file.',
    'Capture evidence for each priority negative.',
    'Generate Round 1 letters — one tradeline per letter.',
  ];
  const next = [
    'Mail letters; track certified dates in Finely Cred.',
    'Re-upload reports when bureau updates post.',
    'Avoid stacking inquiries during active disputes.',
  ];
  const later = [
    'Escalate stalled investigations with documentation.',
    'Enter build phase: utilization, depth, funding prep.',
    'Repeat analyze → act → re-pull until targets are met.',
  ];
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock('90-Day Roadmap', 'A clean execution path that turns this report into movement.', false),
  ];
  let x = 0.1;
  for (const [label, items] of [
    ['NOW · 0-7 DAYS', now],
    ['NEXT · 7-30 DAYS', next],
    ['LATER · 30-90 DAYS', later],
  ] as const) {
    const accent: SpreadColorKey = label.startsWith('NOW') ? 'emerald' : label.startsWith('NEXT') ? 'amber' : 'violet';
    zones.push(
      z('', x - 0.015, 0.39, 1, { cover: glassCover(x - 0.015, 0.39, 0.255, 0.42, accent) }),
      z('', x - 0.015, 0.39, 1, { cover: accentCover(x - 0.015, 0.39, 0.008, 0.42, accent) }),
      z(label, x + 0.005, 0.43, 8.5, { color: accent, bold: true, maxWidth: 0.2 }),
      z(items.join(' '), x + 0.005, 0.5, 8, { color: 'ink', maxWidth: 0.21, maxLines: 8, minSize: 6.5 }),
    );
    x += 0.3;
  }
  return [...zones, ...footerLabel(vm, ctx)];
}

function extensionPartnership(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const paras = [
    'Your Finely Cred portal is the operating system for this plan — upload reports, generate letters, store evidence, and track dispute rounds.',
    'Re-upload credit reports after bureau responses post. We re-parse, re-rank, and regenerate analysis so you always know if the file moved.',
    'Book a strategist session when you want hands-on sequencing for funding or restore.',
  ];
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock('How Finely Cred Supports You', 'The report is only one part of the workflow. The portal keeps the strategy active.', false),
  ];
  let y = 0.38;
  const accents: SpreadColorKey[] = ['emerald', 'amber', 'fuchsia'];
  for (const p of paras) {
    zones.push(...insightCard({ label: y < 0.48 ? 'Portal workflow' : y < 0.58 ? 'Regenerate analysis' : 'Strategist support', body: p, x: 0.1, y, w: 0.68, h: 0.1, accent: accents[Math.min(accents.length - 1, Math.round((y - 0.38) / 0.11))], lines: 3 }));
    y += 0.115;
  }
  return [...zones, ...footerLabel(vm, ctx)];
}

function extensionNegativeDigest(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock('Negative Summary Digest', 'Category totals - the uploaded bureau report remains the source of record for line detail.', false),
  ];
  let y = 0.39;
  for (const row of vm.negativeSummary) {
    zones.push(
      ...insightCard({ label: `${row.label}: ${row.count}`, body: `Impact: ${row.impact}. ${row.count ? 'Review accuracy, evidence, bureau reporting, and dispute sequence.' : 'No extracted issue in this category.'}`, x: 0.1, y, w: 0.66, h: 0.082, accent: impactAccent(row.impact), lines: 2 }),
    );
    y += 0.092;
  }
  return [...zones, ...footerLabel(vm, ctx)];
}

function extensionTips(vm: PremiumSpreadViewModel, tipIndex: number, ctx?: SpreadPageContext): SpreadTextZone[] {
  const tips = [
    'Utilization is often reported on your statement date — pay down before that date, not just the due date, for faster point gains.',
    'Your Finely Cred portal stores evidence, mail dates, and dispute rounds — documentation wins investigations.',
    'Personal and business credit lanes should be sequenced. Avoid competing inquiries in the same month.',
    'Re-upload reports 30–45 days after bureau responses post. This PDF is a snapshot; the portal stays live.',
    'One tradeline per dispute letter. Factual, evidence-backed disputes outperform volume every time.',
    'Protect open positive accounts while negatives are addressed — they are the foundation lenders trust.',
  ];
  const zones: SpreadTextZone[] = [
    ...partnerBannerLight(vm),
    ...titleBlock('Strategist Notes', 'Short guidance to keep the next action clear without crowding the report.', false),
    ...insightCard({ label: `Premium note ${tipIndex + 1}`, body: tips[tipIndex % tips.length], x: 0.1, y: 0.4, w: 0.68, h: 0.14, accent: (['emerald', 'amber', 'violet', 'fuchsia', 'sky'] as SpreadColorKey[])[tipIndex % 5], lines: 5 }),
    ...insightCard({ label: 'Client reminder', body: `${vm.partnerFirstName}, re-upload updated reports after bureau responses so Finely Cred can regenerate your analysis with fresh data.`, x: 0.1, y: 0.6, w: 0.68, h: 0.11, accent: 'emerald', lines: 3 }),
  ];
  return [...zones, ...footerLabel(vm, ctx)];
}

function extensionClosing(vm: PremiumSpreadViewModel, ctx?: SpreadPageContext): SpreadTextZone[] {
  const steps = [
    'Execute your priority action plan — disputes, utilization, and documentation.',
    'Re-upload credit reports after bureau responses post (typically 30–45 days).',
    'Use your Finely Cred portal for letters, evidence, and strategist support.',
    'Book a session when you want hands-on sequencing for funding or restore.',
  ];
  const zones: SpreadTextZone[] = [
    ...partnerBanner(vm),
    ...titleBlock('What Happens Next', `${vm.partnerName} - execute the plan, upload updates, and keep the portal current.`, true),
  ];
  let y = 0.39;
  steps.forEach((s, i) => {
    const accent: SpreadColorKey = i === 0 ? 'emerald' : i === 1 ? 'amber' : i === 2 ? 'violet' : 'fuchsia';
    zones.push(
      z('', 0.1, y, 1, { cover: forestCover(0.1, y, 0.68, 0.078) }),
      z('', 0.1, y, 1, { cover: accentCover(0.1, y, 0.009, 0.078, accent) }),
      z(String(i + 1).padStart(2, '0'), 0.13, y + 0.03, 11, { color: accent, bold: true, maxWidth: 0.04 }),
      z(s, 0.18, y + 0.03, 8.4, { color: 'white', maxWidth: 0.52, maxLines: 2, minSize: 6.7 }),
    );
    y += 0.092;
  });
  zones.push(
    z('Prepared by Shelly St Louis - Finely Cred', 0.12, 0.84, 9, { color: 'goldLight', bold: true, maxWidth: 0.42 }),
    z('Not legal advice. No outcome guarantees.', 0.12, 0.88, 7.5, { color: 'white', maxWidth: 0.38 }),
    ...footerLabel(vm, ctx),
  );
  return zones;
}

export const BASE_SPREAD_PAGES: SpreadPageSpec[] = [
  { file: PREMIUM_SPREAD_FILES[0], buildZones: spread01 },
  { file: PREMIUM_SPREAD_FILES[1], buildZones: spread02 },
  { file: PREMIUM_SPREAD_FILES[2], buildZones: spread03 },
  { file: PREMIUM_SPREAD_FILES[3], buildZones: spread04 },
  { file: PREMIUM_SPREAD_FILES[4], buildZones: spread05 },
  { file: PREMIUM_SPREAD_FILES[5], buildZones: spread06 },
  { file: PREMIUM_SPREAD_FILES[6], buildZones: spread07 },
  { file: PREMIUM_SPREAD_FILES[7], buildZones: spread08 },
  { file: PREMIUM_SPREAD_FILES[8], buildZones: spread09 },
  { file: PREMIUM_SPREAD_FILES[9], buildZones: spread10 },
];

export function buildExtensionSpreadPages(vm: PremiumSpreadViewModel): SpreadPageSpec[] {
  const pages: SpreadPageSpec[] = [];
  const posPages = Math.max(1, Math.ceil(vm.positiveSnapshots.length / 3));
  for (let i = 0; i < posPages; i++) {
    pages.push({
      file: PREMIUM_SPREAD_FILES[3],
      buildZones: (v, ctx) => extensionPositives(v, { ...ctx, positivePage: i }),
    });
  }
  const priPages = Math.max(1, Math.ceil(vm.priorityTargets.length / 4));
  for (let i = 0; i < priPages; i++) {
    pages.push({
      file: PREMIUM_SPREAD_FILES[4],
      buildZones: (v, ctx) => extensionPriorities(v, { ...ctx, priorityPage: i }),
    });
  }
  const inqPages = vm.inquiries.length ? Math.max(1, Math.ceil(vm.inquiries.length / 6)) : 1;
  for (let i = 0; i < inqPages; i++) {
    pages.push({
      file: PREMIUM_SPREAD_FILES[2],
      buildZones: (v, ctx) => extensionInquiries(v, { ...ctx, inquiryPage: i }),
    });
  }
  pages.push({ file: PREMIUM_SPREAD_FILES[1], buildZones: extensionBureauGrid });
  pages.push({ file: PREMIUM_SPREAD_FILES[2], buildZones: extensionNegativeDigest });
  pages.push({ file: PREMIUM_SPREAD_FILES[4], buildZones: extensionRoadmap });
  pages.push({ file: PREMIUM_SPREAD_FILES[1], buildZones: extensionPartnership });
  pages.push({ file: PREMIUM_SPREAD_FILES[9], buildZones: extensionClosing });
  return pages;
}

export const TARGET_MIN_SPREAD_PAGES = 24;

export function buildFullSpreadPageList(vm: PremiumSpreadViewModel): SpreadPageSpec[] {
  const pages = [...BASE_SPREAD_PAGES, ...buildExtensionSpreadPages(vm)];
  let tip = 0;
  while (pages.length < TARGET_MIN_SPREAD_PAGES) {
    pages.push({
      file: PREMIUM_SPREAD_FILES[5],
      buildZones: (v, ctx) => extensionTips(v, tip++, ctx),
    });
  }
  return pages;
}
