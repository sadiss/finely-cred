import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Headphones, Library, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { listFreeGuidesEffective } from '../../data/freeGuidesRepo';
import { CommsWorkspaceActions } from '../../components/comms/CommsWorkspaceActions';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildEducationNoticedItems } from '../../lib/finelyProactiveSignals';
import { GuideAudioPlayer } from '../../components/resources/GuideAudioPlayer';
import { getGuideNarration } from '../../resources/guideNarration';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PRIMARY_BTN,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { LAUNCH_ROLE_COURSES } from '../../config/launchRoleCourses';

export default function PartnerEducationPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  type EduTab = 'curriculum' | 'guides' | 'explore';
  const [tab, setTab] = useState<EduTab>('curriculum');
  const [storeVersion, setStoreVersion] = useState(0);
  const [audioGuideId, setAudioGuideId] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const guides = useMemo(() => listFreeGuidesEffective(), [storeVersion]);
  const libraryGuides = useMemo(() => guides.filter((g) => g.id !== 'credit-dispute-letter-guide'), [guides]);
  const audioGuide = useMemo(() => guides.find((g) => g.id === audioGuideId) ?? null, [guides, audioGuideId]);
  const audioNarration = useMemo(
    () => (audioGuide ? getGuideNarration(audioGuide.id, audioGuide.title, audioGuide.sections) : null),
    [audioGuide],
  );

  return (
    <PageShell
      badge="Partner Portal"
      title="Education Library"
      subtitle="Learn credit basics, dispute steps, and what to do next — in plain language."
    >
      {!partner ? (
        <div className={FINELY_OS_LUXURY_EMPTY}>
          No partner profile found for this account. If you’re an admin, use Partner Management to pick a partner.
        </div>
      ) : (
        <div className={FINELY_OS_PAGE}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/portal/dashboard')}
              className={FINELY_OS_BACK_LINK}
              title="Back to Partner Dashboard"
            >
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Finely Cred Dashboard">
              <ArrowLeft size={16} /> Finely Cred
            </button>
          </div>

          <CommsWorkspaceActions />

          <FinelyNoticedStrip
            items={buildEducationNoticedItems({
              journeyStage: partner.journeyStage,
              guidesCount: libraryGuides.length,
            })}
          />
          <FinelyNowDoThisStrip currentIndex={tab === 'guides' ? 1 : tab === 'explore' ? 2 : 0} />

          <FinelyUnifiedHubLayout
            eyebrow="Education library"
            title="Learn credit step by step"
            subtitle="Dispute rounds, score models, and funding basics — in plain language."
            accent="violet"
            kpis={[
              { label: 'Field guides', value: String(guides.length), hint: 'Published', accent: 'emerald' },
              { label: 'Curriculum', value: '3 tracks', hint: 'Core topics', accent: 'violet' },
              { label: 'Score models', value: '4', hint: 'Explained', accent: 'amber' },
              { label: 'Stage', value: partner.journeyStage ?? 'intake', hint: 'Your journey', accent: 'sky' },
            ]}
            tabs={[
              { id: 'curriculum', label: 'Curriculum' },
              { id: 'guides', label: 'Field guides', badge: libraryGuides.length || undefined },
              { id: 'explore', label: 'Explore' },
            ]}
            activeTab={tab}
            onTabChange={(id) => setTab(id as EduTab)}
            primaryAction={{ label: 'Training Academy', onClick: () => navigate('/portal/training/academy') }}
            secondaryAction={{ label: 'Courses LMS', onClick: () => navigate('/portal/courses') }}
          >
          {tab === 'curriculum' && (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <div className="inline-flex items-center gap-2 text-violet-300">
                <GraduationCap size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Core curriculum</span>
              </div>
              <div className="space-y-3">
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>Dispute rounds: Round 1 → Round 2 → Round 3</div>
                  <div className={FINELY_OS_ENTITY_BODY}>
                    What changes each round, how follow-up windows work, and why documentation discipline matters.
                  </div>
                </div>
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>Utilization mechanics</div>
                  <div className={FINELY_OS_ENTITY_BODY}>Statement date vs due date and why reporting timing changes outcomes.</div>
                </div>
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>Funding readiness sequencing</div>
                  <div className={FINELY_OS_ENTITY_BODY}>
                    How we stage personal → business → advanced layers to avoid avoidable denials.
                  </div>
                </div>
              </div>
            </div>

            <div className={`lg:col-span-5 min-w-0 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <div className="inline-flex items-center gap-2 text-violet-300">
                <Scale size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Score models</span>
              </div>
              <div className="space-y-3">
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>FICO 8</div>
                  <div className={FINELY_OS_ENTITY_BODY}>
                    Common “general lending” score used across many products (varies by lender).
                  </div>
                </div>
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>Mortgage classic scores</div>
                  <div className={FINELY_OS_ENTITY_BODY}>
                    Many mortgage underwrites still use older FICO versions by bureau: Equifax FICO 5, Experian FICO 2, TransUnion FICO 4.
                  </div>
                </div>
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>VantageScore (3.0 / 4.0)</div>
                  <div className={FINELY_OS_ENTITY_BODY}>Common in monitoring apps; underwriting may differ by lender/product.</div>
                </div>
                <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  Educational content only. Lenders can use different models by product, channel, and partner bank.
                </div>
              </div>
            </div>

            <div className={`lg:col-span-12 ${finelyOsCatalogCard('emerald')} !p-5 space-y-4`} data-fc-accent="emerald">
              <div className={FINELY_OS_ENTITY_VALUE}>Launch training tracks</div>
              <p className={FINELY_OS_ENTITY_BODY}>Follow the same step-by-step playbooks used across Finely Cred.</p>
              <div className="grid md:grid-cols-2 gap-3">
                {LAUNCH_ROLE_COURSES.filter((c) => c.role.toLowerCase().includes('partner') || c.role.toLowerCase().includes('client') || c.role.toLowerCase().includes('compliance')).map((course) => (
                  <div key={course.id} className={`${finelyOsCatalogCard(course.accent)} !p-4 space-y-2`} data-fc-accent={course.accent}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>{course.role}</div>
                    <div className={FINELY_OS_ENTITY_VALUE}>{course.title}</div>
                    <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>{course.desc}</p>
                    <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(course.hubPath)}>
                      Open track <ArrowRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {tab === 'guides' && (
          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4 fc-band-violet rounded-3xl p-6`}>
            <div className="inline-flex items-center gap-2 text-emerald-300">
              <BookOpen size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Insider field guides ({guides.length})</span>
            </div>
            <p className={FINELY_OS_ENTITY_BODY}>
              Client-first playbooks — tradelines, business credit, funding sequences, AI workflows, and topics most consumers never hear explained honestly.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <FinelyOsPaginatedStack
                items={libraryGuides}
                pageSize={8}
                itemSpacingClassName="grid md:grid-cols-2 gap-3"
                emptyMessage="No field guides published yet."
                renderItem={(g) => (
                <div key={g.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>{g.title}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-sm line-clamp-2`}>{g.desc}</div>
                  <button
                    type="button"
                    onClick={() => setAudioGuideId(audioGuideId === g.id ? null : g.id)}
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300/90 hover:text-emerald-200"
                  >
                    <Headphones size={12} /> {audioGuideId === g.id ? 'Hide narration' : 'Listen'}
                  </button>
                  {audioGuideId === g.id && audioGuide?.id === g.id && audioNarration ? (
                    <GuideAudioPlayer narration={audioNarration} autoPlayPreview />
                  ) : null}
                </div>
                )}
              />
            </div>
            <button type="button" onClick={() => navigate('/resources')} className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
              View full library <ArrowRight size={12} />
            </button>
          </div>
          )}

          {tab === 'explore' && (
          <div className="grid md:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => navigate('/portal/courses')}
              className={`text-left ${finelyOsInlineListItem()} p-6 transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed`}
              disabled={!isFeatureEnabled('courses')}
              title={!isFeatureEnabled('courses') ? 'Courses are disabled in settings' : undefined}
            >
              <div className="flex items-center gap-3 text-violet-300">
                <GraduationCap size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Courses</span>
              </div>
              <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
                Self-paced lessons tied to disputes, evidence discipline, and funding readiness.
              </p>
              <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                Open courses <ArrowRight size={12} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/resources')}
              className={`text-left ${finelyOsInlineListItem()} p-6 transition-all hover:shadow-md`}
            >
              <div className="flex items-center gap-3 text-violet-300">
                <Library size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Resource library</span>
              </div>
              <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Guides, templates, and reference materials.</p>
              <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                Open library <ArrowRight size={12} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/bookstore')}
              className={`text-left ${finelyOsInlineListItem()} p-6 transition-all hover:shadow-md`}
            >
              <div className="flex items-center gap-3 text-violet-300">
                <BookOpen size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Bookstore</span>
              </div>
              <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>E-books and premium resources.</p>
              <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                Browse titles <ArrowRight size={12} />
              </div>
            </button>
          </div>
          )}
          </FinelyUnifiedHubLayout>

          <FinelyOsPageFooter />
        </div>
      )}
    </PageShell>
  );
}
