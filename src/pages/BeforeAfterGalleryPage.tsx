import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Download, ImageIcon, Layers } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyOsComplianceStrip } from '../features/os/FinelyOsComplianceStrip';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { getAllCaseStudies, getCaseStudyProofStats, type CaseStudy } from '../data/caseStudiesRepo';
import { categoryLabels } from '../config/pricingCatalog';
import {
  BeforeAfterScoreGraphicCanvas,
  BEFORE_AFTER_GRAPHIC_DISCLAIMER,
  downloadBeforeAfterGraphicPng,
  type BeforeAfterGraphicThemeId,
} from '../components/proof/BeforeAfterScoreGraphicCanvas';
import { ensureC2BeforeAfterGalleryComplianceRecordSeeded } from '../data/complianceReviewRepo';
import {
  FINELY_OS_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsLeadMagnetPanel,
} from '../features/os/finelyOsLightUi';

/**
 * `/results/before-after` — Phase C2, the public before/after proof gallery.
 *
 * This is a distinct, more visual "at a glance" companion to `/results` (Phase B1) — not a
 * competing "where do I see proof" page. `/results` is the text/number-led library (score lift,
 * funding secured, category browse). This page is the visual-proof-graphic-led sibling: the same
 * exact canvas renderer used by the admin-only Content Studio tool
 * (`BeforeAfterScoreGraphicPanel.tsx`), fed only with real `caseStudiesRepo.ts` score pairs — never
 * fabricated numbers. Every case study that documents both a `startingScore` and `endingScore` is
 * shown; case studies that instead document `fundingSecured` (business credit, debt & legal) stay
 * on `/results`, since a before/after score-delta graphic does not apply to them.
 *
 * Navigation is two-way and explicit: `/results` links here via a "see the visual proof" panel,
 * and this page links back to `/results` for the full numbers/funding library.
 */

const GALLERY_THEME_ROTATION: BeforeAfterGraphicThemeId[] = ['emerald', 'violet', 'amber'];

const CONTENT_REF = '/results/before-after';

function GalleryTile({ caseStudy, themeId }: { caseStudy: CaseStudy; themeId: BeforeAfterGraphicThemeId }) {
  const navigate = useNavigate();
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const delta = (caseStudy.endingScore as number) - (caseStudy.startingScore as number);

  return (
    <div className={`${finelyOsCatalogCard('emerald')} !p-4 space-y-3`} data-fc-accent="emerald">
      <BeforeAfterScoreGraphicCanvas
        ref={setCanvasEl}
        startingScore={caseStudy.startingScore as number}
        endingScore={caseStudy.endingScore as number}
        partnerAlias={caseStudy.partnerAlias}
        themeId={themeId}
        className="w-full aspect-square rounded-xl border border-white/10 bg-black/40"
      />
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-white/20 bg-white/10 text-white/70 whitespace-nowrap">
            {categoryLabels[caseStudy.category as keyof typeof categoryLabels] ?? 'HETA Society'}
          </span>
          <span className="text-xs font-bold text-emerald-300">+{delta} pts</span>
        </div>
        <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{caseStudy.summary}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => canvasEl && downloadBeforeAfterGraphicPng(canvasEl, caseStudy.startingScore as number, caseStudy.endingScore as number)}
          className={`${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-2.5 text-[11px]`}
        >
          <Download size={12} /> Download
        </button>
        <button
          type="button"
          onClick={() => navigate(`/testimonials?tab=case_studies&category=${caseStudy.category}`)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/60 hover:text-white/90"
        >
          Read the full case study <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
}

export default function BeforeAfterGalleryPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Before & after — visual proof gallery',
    description:
      'Real credit-score before/after graphics generated directly from our documented case studies — visual, at-a-glance proof, sourced from the same numbers on our results page.',
    path: CONTENT_REF,
  });

  useEffect(() => {
    ensureC2BeforeAfterGalleryComplianceRecordSeeded();
  }, []);

  const scoreDeltaStudies = useMemo(
    () => getAllCaseStudies().filter((cs) => typeof cs.startingScore === 'number' && typeof cs.endingScore === 'number'),
    [],
  );
  const stats = useMemo(() => getCaseStudyProofStats(scoreDeltaStudies), [scoreDeltaStudies]);

  return (
    <PageShell
      badge="Public · visual proof"
      title="Before & after gallery"
      subtitle="The same score-delta numbers on /results, rendered as shareable before/after graphics — at a glance."
    >
      <div className={FINELY_OS_PAGE}>
        <div className={`space-y-3 ${finelyOsCatalogCard('violet')} !p-6`} data-fc-accent="violet">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
              <ImageIcon size={13} /> Visual proof gallery
            </span>
          </div>
          <p className={`text-sm max-w-3xl ${FINELY_OS_ENTITY_BODY}`}>
            Every graphic below is generated straight from our documented case study library — no separate "marketing"
            numbers. If you'd rather read the full story (challenge, strategy, statutory basis) or see funding-secured
            outcomes for business credit and debt & legal, that's the fuller <button type="button" className="underline hover:text-white" onClick={() => navigate('/results')}>results library</button>.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={`${finelyOsCatalogCard('emerald')} !p-4`} data-fc-accent="emerald">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Graphics shown</div>
            <div className={`mt-1 text-2xl font-bold ${FINELY_OS_ENTITY_TITLE}`}>{scoreDeltaStudies.length}</div>
          </div>
          <div className={`${finelyOsCatalogCard('sky')} !p-4`} data-fc-accent="sky">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Avg score lift shown</div>
            <div className={`mt-1 text-2xl font-bold ${FINELY_OS_ENTITY_TITLE}`}>
              {stats.avgScoreLift != null ? `+${stats.avgScoreLift}` : '—'}
            </div>
          </div>
          <div className={`${finelyOsCatalogCard('amber')} !p-4 sm:col-span-2 lg:col-span-2`} data-fc-accent="amber">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Source</div>
            <div className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Rendered live from <code className="text-white/80">caseStudiesRepo.ts</code> — the same repository behind{' '}
              <button type="button" className="underline hover:text-white" onClick={() => navigate('/results')}>
                /results
              </button>{' '}
              and the full case study library.
            </div>
          </div>
        </div>

        <FinelyOsComplianceStrip>{BEFORE_AFTER_GRAPHIC_DISCLAIMER}</FinelyOsComplianceStrip>

        {scoreDeltaStudies.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scoreDeltaStudies.map((cs, idx) => (
              <GalleryTile key={cs.id} caseStudy={cs} themeId={GALLERY_THEME_ROTATION[idx % GALLERY_THEME_ROTATION.length]!} />
            ))}
          </div>
        ) : (
          <div className={`${finelyOsCatalogCard('rose')} !p-6`}>
            <p className={FINELY_OS_ENTITY_BODY}>No score-delta case studies are documented yet.</p>
          </div>
        )}

        <div className={`${finelyOsLeadMagnetPanel('sky')} !p-6`} data-fc-accent="sky">
          <div className="flex items-start gap-2">
            <Layers size={16} className="mt-0.5 shrink-0 text-sky-300" />
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Want funding numbers too?</div>
          </div>
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Business credit and debt & legal case studies document funding secured, not a credit-score delta — see them,
            plus every score-delta story above in full detail, on the results library.
          </p>
          <button type="button" onClick={() => navigate('/results')} className={`mt-4 ${FINELY_OS_SECONDARY_BTN}`}>
            See the full results library <ArrowRight size={14} />
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
