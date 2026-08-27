import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, DollarSign, TrendingUp, Trophy, Video } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { TestimonialDossier } from '../components/landing';
import { FlashyIcon } from '../components/ui';
import { getActiveTenantId } from '../tenancy/activeTenant';
import { listPublishedTestimonialsByTenant } from '../data/testimonialsRepo';
import type { TextTestimonial, VideoTestimonial } from '../domain/testimonials';
import { getBlobUrl } from '../storage/getBlobUrl';
import { getAllCaseStudies, type CaseStudy } from '../data/caseStudiesRepo';
import { categoryLabels } from '../config/pricingCatalog';
import { FinelyOsOverviewStatTile } from '../features/os/FinelyOsOverviewStatTile';
import { FinelyOsComplianceStrip } from '../features/os/FinelyOsComplianceStrip';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_PAGE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCard,
  finelyOsLeadMagnetPanel,
  finelyOsViewTab,
  type FinelyOsPublicAccent,
} from '../features/os/finelyOsLightUi';

function withStart(embedUrl: string, startAtSeconds?: number) {
  const base = (embedUrl || '').trim();
  const s = Math.max(0, Math.round(startAtSeconds || 0));
  if (!base || s <= 0) return base;
  if (base.includes('start=')) return base;
  return base.includes('?') ? `${base}&start=${s}` : `${base}?start=${s}`;
}

type CaseStudyCategoryFilter = CaseStudy['category'] | 'all';

const CASE_STUDY_CATEGORY_LABELS: Record<CaseStudy['category'], string> = {
  ...categoryLabels,
  heta_society: 'HETA Society',
};

const CASE_STUDY_FILTERS: Array<{ id: CaseStudyCategoryFilter; label: string; accent: FinelyOsPublicAccent }> = [
  { id: 'all', label: 'All', accent: 'violet' },
  { id: 'personal_credit', label: categoryLabels.personal_credit, accent: 'emerald' },
  { id: 'business_credit', label: categoryLabels.business_credit, accent: 'sky' },
  { id: 'debt_legal', label: categoryLabels.debt_legal, accent: 'rose' },
  { id: 'wealth_builder', label: categoryLabels.wealth_builder, accent: 'sky' },
  { id: 'privacy_id', label: categoryLabels.privacy_id, accent: 'fuchsia' },
  { id: 'tradeline_promo', label: categoryLabels.tradeline_promo, accent: 'violet' },
  { id: 'heta_society', label: 'HETA Society', accent: 'emerald' },
];

const CASE_STUDY_CARD_ACCENTS: FinelyOsPublicAccent[] = ['rose', 'emerald', 'violet', 'sky', 'fuchsia'];

function parseFundingSecuredAmount(value?: string): number {
  if (!value) return 0;
  const n = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function CaseStudyResultCard({
  caseStudy,
  accent,
  expanded,
  onToggle,
}: {
  caseStudy: CaseStudy;
  accent: FinelyOsPublicAccent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const stat = caseStudy.fundingSecured
    ? { label: 'Funding secured', value: caseStudy.fundingSecured }
    : caseStudy.startingScore != null && caseStudy.endingScore != null
    ? { label: 'Score lift', value: `${caseStudy.startingScore} → ${caseStudy.endingScore}` }
    : null;

  return (
    <div className={`space-y-4 ${finelyOsCatalogCard(accent)}`} data-fc-accent={accent}>
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
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wider text-violet-300 hover:text-violet-100 transition-colors"
      >
        {expanded ? 'Hide the details' : 'Challenge, strategy & outcomes'}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded ? (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Challenge</div>
            <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{caseStudy.challenge}</p>
          </div>
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Strategy applied</div>
            <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{caseStudy.strategyApplied}</p>
          </div>
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Outcomes</div>
            <ul className="mt-1 space-y-1">
              {caseStudy.outcomes.map((outcome) => (
                <li key={outcome} className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  • {outcome}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {caseStudy.statutoryBasis.map((basis) => (
              <span
                key={basis}
                className="text-[9px] px-2 py-0.5 rounded-full border border-white/15 bg-white/[0.06] text-white/55"
              >
                {basis.split('(')[0].trim()}
              </span>
            ))}
          </div>
          <p className="text-[10px] italic text-white/40">{caseStudy.disclaimer}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function TestimonialsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  usePublicSeoMeta({
    title: 'Partner success stories',
    description: 'Real stories from Finely Cred partners — credit restore, funding readiness, and results-driven workflows.',
    path: '/testimonials',
  });
  const tenantId = getActiveTenantId();
  const published = listPublishedTestimonialsByTenant(tenantId);
  const videos = published.filter((t) => t.kind === 'video') as VideoTestimonial[];
  const [blobVideoUrls, setBlobVideoUrls] = useState<Record<string, { url: string; revoke?: () => void }>>({});
  const playableVideos = useMemo(
    () => videos.filter((v) => Boolean(v.videoSrc || v.embedUrl || (v.blobRef && blobVideoUrls[v.id]?.url))),
    [videos, blobVideoUrls],
  );
  const texts = published.filter((t) => t.kind === 'text') as TextTestimonial[];
  const initialTab = searchParams.get('tab');
  const [tab, setTab] = useState<'videos' | 'stories' | 'case_studies'>(
    initialTab === 'case_studies' || initialTab === 'stories' ? initialTab : 'videos',
  );
  const blobRefs = useMemo(() => videos.filter((v) => Boolean(v.blobRef)).map((v) => ({ id: v.id, blobRef: v.blobRef!, mime: v.blobMimeType })), [videos]);

  const allCaseStudies = useMemo(() => getAllCaseStudies(), []);
  const initialCategory = searchParams.get('category') as CaseStudyCategoryFilter | null;
  const [caseStudyCategory, setCaseStudyCategory] = useState<CaseStudyCategoryFilter>(
    initialCategory && allCaseStudies.some((cs) => cs.category === initialCategory) ? initialCategory : 'all',
  );
  const [expandedCaseStudyId, setExpandedCaseStudyId] = useState<string | null>(null);
  const filteredCaseStudies = useMemo(
    () =>
      caseStudyCategory === 'all'
        ? allCaseStudies
        : allCaseStudies.filter((cs) => cs.category === caseStudyCategory),
    [allCaseStudies, caseStudyCategory],
  );
  const caseStudyStats = useMemo(() => {
    const scoreLifts = filteredCaseStudies
      .filter((cs) => cs.startingScore != null && cs.endingScore != null)
      .map((cs) => (cs.endingScore as number) - (cs.startingScore as number));
    const avgScoreLift = scoreLifts.length
      ? Math.round(scoreLifts.reduce((sum, n) => sum + n, 0) / scoreLifts.length)
      : null;
    const totalFunding = filteredCaseStudies.reduce((sum, cs) => sum + parseFundingSecuredAmount(cs.fundingSecured), 0);
    return { avgScoreLift, totalFunding };
  }, [filteredCaseStudies]);

  useEffect(() => {
    let cancelled = false;
    const ensure = async () => {
      for (const x of blobRefs.slice(0, 40)) {
        if (cancelled) return;
        if (blobVideoUrls[x.id]?.url) continue;
        const res = await getBlobUrl(x.blobRef, { mimeType: x.mime, preferSigned: true, signedTtlSeconds: 60 * 30 });
        if (!res?.url) continue;
        if (cancelled) {
          try { res.revoke?.(); } catch {}
          return;
        }
        setBlobVideoUrls((m) => ({ ...m, [x.id]: { url: res.url, revoke: res.revoke } }));
      }
    };
    void ensure();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blobRefs.map((x) => x.blobRef).join('|')]);

  useEffect(() => {
    return () => {
      try {
        Object.values(blobVideoUrls).forEach((x) => x.revoke?.());
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <PageShell
      badge="Public"
      title="Testimonials"
      subtitle="Real stories across Personal Restore, Business Foundation, and Debt & Summons."
    >
      <div className={FINELY_OS_PAGE}>
        <FinelyUnifiedHubLayout
          eyebrow="Social proof"
          title="Partner success stories"
          subtitle="Real stories across Personal Restore, Business Foundation, and Debt & Summons."
          accent="rose"
          kpis={[
            { label: 'Videos', value: String(playableVideos.length), accent: 'rose' },
            { label: 'Written', value: String(texts.length), accent: 'emerald' },
            { label: 'Published', value: String(published.length), accent: 'violet' },
          ]}
          tabs={[
            { id: 'videos', label: 'Video stories' },
            { id: 'stories', label: 'Written wins' },
            { id: 'case_studies', label: 'Case studies', badge: allCaseStudies.length },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as 'videos' | 'stories' | 'case_studies')}
          primaryAction={{ label: 'Free guide + session', onClick: () => navigate('/resources') }}
          secondaryAction={{ label: 'Contact team', onClick: () => navigate('/contact') }}
        >
        {tab === 'videos' && (
          <>
          <div className={`space-y-4 ${finelyOsCatalogCard('violet')}`} data-fc-accent="violet">
            <p className={`text-base max-w-3xl ${FINELY_OS_ENTITY_BODY}`}>
              Recorded testimonials from partners across Personal Restore, Business Foundation, and Debt & Summons.
            </p>
          </div>
          {playableVideos.length === 0 ? (
            <div className={FINELY_OS_LUXURY_EMPTY}>
              No published video stories with playable media yet. Switch to Written wins.
            </div>
          ) : (
            <FinelyOsPaginatedStack
              items={playableVideos}
              pageSize={6}
              itemSpacingClassName="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
              renderItem={(v, idx) => (
                <div
                  key={v.id}
                  className={`space-y-4 ${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])}`}
                  data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}
                >
                  <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{v.title}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>{v.service}</div>
                  <div className="overflow-hidden rounded-xl border border-white/20 !p-0">
                    {v.videoSrc ? (
                      <video className="w-full aspect-video bg-slate-900" controls playsInline preload="metadata" src={v.videoSrc} poster={v.posterSrc} />
                    ) : v.blobRef && blobVideoUrls[v.id]?.url ? (
                      <video className="w-full aspect-video bg-slate-900" controls playsInline preload="metadata" src={blobVideoUrls[v.id]!.url} poster={v.posterSrc} />
                    ) : v.embedUrl ? (
                      <iframe src={withStart(v.embedUrl, v.startAtSeconds)} title={v.title} className="w-full aspect-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    ) : null}
                  </div>
                  {v.caption ? <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{v.caption}</div> : null}
                </div>
              )}
            />
          )}
          </>
        )}

        {tab === 'stories' && (
          texts.length === 0 ? (
            <div className={FINELY_OS_LUXURY_EMPTY}>No published text testimonials yet.</div>
          ) : (
            <FinelyOsPaginatedStack
              items={texts}
              pageSize={9}
              itemSpacingClassName="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              renderItem={(t) => (
                <TestimonialDossier
                  key={t.id}
                  id={t.id}
                  service={t.service}
                  name={t.name}
                  review={t.review}
                  milestone={t.milestone ?? 'Partner win'}
                  amount={t.amount ?? ''}
                />
              )}
            />
          )
        )}

        {tab === 'case_studies' && (
          <>
            <div className={`space-y-4 ${finelyOsCatalogCard('emerald')}`} data-fc-accent="emerald">
              <p className={`text-base max-w-3xl ${FINELY_OS_ENTITY_BODY}`}>
                Every documented case study, with the challenge, strategy, and statutory basis behind each result. Filter by
                category to find a partner story closest to your own file.
              </p>
              <div className={`${FINELY_OS_VIEW_TABS} flex-wrap`}>
                {CASE_STUDY_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCaseStudyCategory(f.id)}
                    className={finelyOsViewTab(caseStudyCategory === f.id, f.accent)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <FinelyOsOverviewStatTile
                icon={Trophy}
                label="Case studies"
                value={String(filteredCaseStudies.length)}
                accent="emerald"
              />
              <FinelyOsOverviewStatTile
                icon={TrendingUp}
                label="Avg score lift"
                value={caseStudyStats.avgScoreLift != null ? `+${caseStudyStats.avgScoreLift}` : '—'}
                accent="violet"
              />
              <FinelyOsOverviewStatTile
                icon={DollarSign}
                label="Funding secured"
                value={caseStudyStats.totalFunding > 0 ? `$${caseStudyStats.totalFunding.toLocaleString('en-US')}` : '—'}
                accent="sky"
              />
            </div>
            <FinelyOsComplianceStrip>Results vary · not legal advice · funding subject to underwriting</FinelyOsComplianceStrip>

            {filteredCaseStudies.length === 0 ? (
              <div className={FINELY_OS_LUXURY_EMPTY}>No case studies in this category yet. Try "All".</div>
            ) : (
              <FinelyOsPaginatedStack
                key={caseStudyCategory}
                items={filteredCaseStudies}
                pageSize={12}
                itemSpacingClassName="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                renderItem={(cs, idx) => (
                  <CaseStudyResultCard
                    key={cs.id}
                    caseStudy={cs}
                    accent={CASE_STUDY_CARD_ACCENTS[idx % CASE_STUDY_CARD_ACCENTS.length]}
                    expanded={expandedCaseStudyId === cs.id}
                    onToggle={() => setExpandedCaseStudyId((current) => (current === cs.id ? null : cs.id))}
                  />
                )}
              />
            )}
          </>
        )}
        </FinelyUnifiedHubLayout>

        <div className={finelyOsLeadMagnetPanel('violet')} data-fc-accent="violet">
          <div className="inline-flex items-center gap-2 text-violet-300">
            <FlashyIcon icon={Trophy} color="violet" size="xs" className="!w-9 !h-9 !rounded-xl" />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Want to share yours?</span>
          </div>
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            If you want to record a video testimonial, message us and we’ll send a simple prompt + upload instructions.
          </p>
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className={`mt-4 ${FINELY_OS_SECONDARY_BTN}`}
            title="Contact our team"
          >
            Contact our team <ArrowRight size={14} />
          </button>
        </div>

        <MarketingStaffChatStrip
          roleId="finely_advisor"
          goal="personal"
          roleLabel="credit specialist"
          subline="Wondering if Finely Cred is right for your file? Chat before you commit."
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
