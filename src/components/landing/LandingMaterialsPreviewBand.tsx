/** Homepage — compact e-guide + one-sheet preview band after free guide teaser. */
import React from 'react';
import { ArrowRight, FileText, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Reveal } from '../ui';
import { FreeGuideFunnelStyles } from '../leadmagnet/FreeGuideFunnelStyles';
import { LeadMagnetEbook } from '../leadmagnet/LeadMagnetHeroMockup';
import { BUSINESS_CREDIT_PROCESS_BRIEF } from '../../resources/buildBusinessCreditProcessBriefPdf';
import {
  finelyOsCatalogCard,
  finelyOsLandingPlatinumSection,
  type FinelyOsPublicAccent,
} from '../../features/os/finelyOsLightUi';

type OneSheetPreview = {
  id: string;
  title: string;
  desc: string;
  path: string;
  badge: string;
  accent: FinelyOsPublicAccent;
  lines: string[];
};

const ONE_SHEETS: OneSheetPreview[] = [
  {
    id: 'process_brief',
    title: BUSINESS_CREDIT_PROCESS_BRIEF.title,
    desc: BUSINESS_CREDIT_PROCESS_BRIEF.summary,
    path: '/resources/business-credit-one-sheets',
    badge: BUSINESS_CREDIT_PROCESS_BRIEF.sheetLabel,
    accent: 'emerald',
    lines: ['Six-layer build sequence', 'Specialist work model', 'Business Credit OS cockpit'],
  },
  {
    id: 'fundability_roadmap',
    title: 'Business Credit Fundability Roadmap',
    desc:
      'Six pillars, stage gates, and scorecard mapping — the readiness map partners share before picking a tier or quoting capital.',
    path: '/resources/business-credit-one-sheets',
    badge: '1-page',
    accent: 'sky',
    lines: ['Fundability pillars', 'Week-by-week gates', 'Blockers vs green lights'],
  },
];

function OneSheetMockup({ accent, lines }: { accent: FinelyOsPublicAccent; lines: string[] }) {
  const accentBorder =
    accent === 'emerald'
      ? 'border-emerald-400/35'
      : accent === 'sky'
        ? 'border-sky-400/35'
        : 'border-violet-400/35';
  const accentGlow =
    accent === 'emerald'
      ? 'from-emerald-500/20 via-transparent to-emerald-900/10'
      : accent === 'sky'
        ? 'from-sky-500/20 via-transparent to-sky-900/10'
        : 'from-violet-500/20 via-transparent to-violet-900/10';

  return (
    <div
      className={`relative mx-auto aspect-[8.5/11] w-full max-w-[9.5rem] overflow-hidden rounded-lg border ${accentBorder} bg-gradient-to-br from-[#0a1628]/95 to-[#020618]/98 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.65)]`}
      aria-hidden
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accentGlow} pointer-events-none`} />
      <div className="relative flex h-full flex-col p-2.5">
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5">
          <FileText className="h-3 w-3 shrink-0 text-sky-300/90" />
          <span className="text-[6px] font-black uppercase tracking-[0.18em] text-white/45">Finely Cred PDF</span>
        </div>
        <div className="mt-2 space-y-1">
          {lines.map((line) => (
            <div key={line} className="rounded border border-white/8 bg-black/30 px-1.5 py-1">
              <span className="text-[7px] font-semibold leading-tight text-white/75">{line}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-2">
          <div className="h-1 w-8 rounded-full bg-sky-400/50" />
        </div>
      </div>
    </div>
  );
}

export function LandingMaterialsPreviewBand() {
  const navigate = useNavigate();

  return (
    <section
      className={`py-10 sm:py-14 ${finelyOsLandingPlatinumSection()}`}
      data-fc-contrast-band="1"
      aria-label="Partner guides and one-sheets preview"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="mb-8 text-center sm:text-left">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-sky-300/90">
              <Layers className="mr-1.5 inline h-3.5 w-3.5" />
              Partner materials
            </p>
            <h2 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
              Free e-guide + <span className="text-sky-300">one-sheet previews</span>
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/55 sm:text-base">
              Skim the dispute letter guide and business credit PDFs before you book — every download is partner-ready
              talking points, not generic fluff.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          <Reveal delay={80}>
            <button
              type="button"
              onClick={() => navigate('/free-guide')}
              className={`${finelyOsCatalogCard('emerald')} group !p-4 text-left transition-all hover:brightness-110`}
              data-fc-accent="emerald"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300/90">E-guide</span>
              <h3 className="mt-1.5 text-base font-semibold leading-snug sm:text-lg">
                Credit Dispute Letter Guide
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed opacity-70 sm:text-sm">
                FCRA rights, bureau mailing kit, and a 15-day DIY portal trial — instant PDF to your inbox.
              </p>
              <div className="fg-funnel my-4 flex justify-center">
                <FreeGuideFunnelStyles />
                <LeadMagnetEbook compact />
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-200 group-hover:gap-2 transition-all">
                Open free guide <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          </Reveal>

          {ONE_SHEETS.map((sheet, i) => (
            <Reveal key={sheet.id} delay={120 + i * 60}>
              <button
                type="button"
                onClick={() => navigate(sheet.path)}
                className={`${finelyOsCatalogCard(sheet.accent)} group flex h-full flex-col !p-4 text-left transition-all hover:brightness-110`}
                data-fc-accent={sheet.accent}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">One-sheet</span>
                  <span className="rounded-full border border-white/15 bg-black/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide">
                    {sheet.badge}
                  </span>
                </div>
                <h3 className="mt-1.5 text-base font-semibold leading-snug sm:text-lg">{sheet.title}</h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed opacity-70 sm:text-sm">{sheet.desc}</p>
                <div className="my-4 flex justify-center">
                  <OneSheetMockup accent={sheet.accent} lines={sheet.lines} />
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide opacity-90 group-hover:gap-2 transition-all">
                  View one-sheets <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </Reveal>
          ))}
        </div>

        <Reveal delay={280}>
          <p className="mt-5 text-center text-[11px] text-white/40 sm:text-left">
            Results vary · not legal advice · funding subject to underwriting
          </p>
        </Reveal>
      </div>
    </section>
  );
}
