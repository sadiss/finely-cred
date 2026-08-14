import React, { useMemo } from 'react';
import { ArrowRight, DollarSign, ImageIcon, Layers, TrendingUp, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyOsComplianceStrip } from '../features/os/FinelyOsComplianceStrip';
import { FinelyOsOverviewStatTile } from '../features/os/FinelyOsOverviewStatTile';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import {
  getAllCaseStudies,
  getFeaturedCaseStudies,
  getCaseStudyProofStats,
  type CaseStudy,
} from '../data/caseStudiesRepo';
import { categoryLabels } from '../config/pricingCatalog';
import {
  FINELY_OS_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsLeadMagnetPanel,
  type FinelyOsPublicAccent,
} from '../features/os/finelyOsLightUi';

/**
 * /results — a curated highlight subset of the full case-study library
 * (see /testimonials's "Case studies" tab for every documented entry,
 * filterable by category). This page exists as a dedicated, nav-reachable
 * entrance for "show me real numbers" visitors, not a duplicate of the
 * full library maintained in a second place — all data still comes from
 * `caseStudiesRepo.ts`.
 *
 * `/results/before-after` (Phase C2) is this page's visual sibling, not a
 * competing "proof" page — it renders the same score-delta case studies as
 * shareable before/after graphics for an "at a glance" visitor. The link card
 * below is the explicit, one-directional-looking-but-actually-two-way bridge
 * between them (the gallery links back here for funding-secured/full-detail
 * case studies it doesn't cover).
 */

const CASE_STUDY_CATEGORY_LABELS: Record<CaseStudy['category'], string> = {
  ...categoryLabels,
  heta_society: 'HETA Society',
};

const HIGHLIGHT_ACCENTS: FinelyOsPublicAccent[] = ['emerald', 'sky', 'fuchsia', 'amber', 'violet', 'rose'];

function ResultHighlightCard({ caseStudy, accent }: { caseStudy: CaseStudy; accent: FinelyOsPublicAccent }) {
  const stat = caseStudy.fundingSecured
    ? { label: 'Funding secured', value: caseStudy.fundingSecured }
    : caseStudy.startingScore != null && caseStudy.endingScore != null
    ? { label: 'Score lift', value: `${caseStudy.startingScore} → ${caseStudy.endingScore}` }
    : null;

  return (
    <div className={`space-y-3 ${finelyOsCatalogCard(accent)} !p-5`} data-fc-accent={accent}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-white/20 bg-white/10 text-white/70 whitespace-nowrap">
          {CASE_STUDY_CATEGORY_LABELS[caseStudy.category] ?? 'Case study'}
        </span>
        {stat ? (
          <span className="text-xs font-bold text-emerald-300 text-right shrink-0">
            {stat.label}
            <br />
            {stat.value}
          </span>
        ) : null}
      </div>
      <div>
        <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{caseStudy.partnerAlias}</div>
        <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{caseStudy.summary}</p>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Real results — documented case studies',
    description:
      'Documented partner outcomes across personal credit, business credit, debt & legal, and wealth building — real numbers, not projections.',
    path: '/results',
  });

  const allCaseStudies = useMemo(() => getAllCaseStudies(), []);
  const featured = useMemo(() => getFeaturedCaseStudies(6), []);
  const stats = useMemo(() => getCaseStudyProofStats(allCaseStudies), [allCaseStudies]);

  const categoryBreakdown = useMemo(() => {
    const counts = new Map<CaseStudy['category'], number>();
    for (const cs of allCaseStudies) {
      counts.set(cs.category, (counts.get(cs.category) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [allCaseStudies]);

  return (
    <PageShell
      badge="Public"
      title="Results"
      subtitle="Documented partner outcomes, by practice area — real numbers, not projections."
    >
      <div className={FINELY_OS_PAGE}>
        <div className={`space-y-3 ${finelyOsCatalogCard('emerald')} !p-6`} data-fc-accent="emerald">
          <p className={`text-sm max-w-3xl ${FINELY_OS_ENTITY_BODY}`}>
            A curated highlight set — one flagship outcome per practice area — pulled from our full, documented case
            study library. Every entry uses an alias (first name, last initial, city/state), never a full name, and
            every statutory citation is a real federal or state law reference.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FinelyOsOverviewStatTile
            icon={Trophy}
            label="Documented case studies"
            value={String(stats.totalCount)}
            accent="emerald"
          />
          <FinelyOsOverviewStatTile
            icon={TrendingUp}
            label="Avg score lift"
            value={stats.avgScoreLift != null ? `+${stats.avgScoreLift}` : '—'}
            accent="violet"
          />
          <FinelyOsOverviewStatTile
            icon={DollarSign}
            label="Funding secured (documented)"
            value={stats.totalFundingSecured > 0 ? `$${stats.totalFundingSecured.toLocaleString('en-US')}` : '—'}
            accent="amber"
          />
          <FinelyOsOverviewStatTile
            icon={Layers}
            label="Practice areas"
            value={String(stats.categoryCount)}
            accent="sky"
          />
        </div>
        <FinelyOsComplianceStrip>Results vary · not legal advice · funding subject to underwriting</FinelyOsComplianceStrip>

        <div className={`${finelyOsCatalogCard('fuchsia')} !p-5`} data-fc-accent="fuchsia">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} inline-flex items-center gap-1.5`}>
                <ImageIcon size={12} /> Prefer to see it visually?
              </div>
              <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                The same score-lift numbers above, rendered as shareable before/after proof graphics — the before/after
                gallery.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/results/before-after')}
              className={`${FINELY_OS_SECONDARY_BTN} shrink-0 inline-flex items-center gap-2`}
            >
              See the visual gallery <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map((cs, idx) => (
            <ResultHighlightCard key={cs.id} caseStudy={cs} accent={HIGHLIGHT_ACCENTS[idx % HIGHLIGHT_ACCENTS.length]!} />
          ))}
        </div>

        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`} data-fc-accent="violet">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Browse by practice area</div>
          <div className="flex flex-wrap gap-2">
            {categoryBreakdown.map(([category, count]) => (
              <button
                key={category}
                type="button"
                onClick={() => navigate(`/testimonials?tab=case_studies&category=${category}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.05] text-xs font-semibold hover:bg-white/10 transition-colors"
              >
                {CASE_STUDY_CATEGORY_LABELS[category] ?? category} <span className="opacity-60">({count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className={`${finelyOsLeadMagnetPanel('amber')} !p-6`} data-fc-accent="amber">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Want the full library?</div>
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            This page shows a curated highlight subset. Browse every documented case study — filterable by category —
            on the full case studies tab.
          </p>
          <button
            type="button"
            onClick={() => navigate('/testimonials?tab=case_studies')}
            className={`mt-4 ${FINELY_OS_SECONDARY_BTN}`}
          >
            Browse the full case study library <ArrowRight size={14} />
          </button>
        </div>

        <MarketingStaffChatStrip
          roleId="finely_advisor"
          goal="personal"
          roleLabel="credit specialist"
          subline="Want to know what's realistic for your file? Chat before you commit."
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
