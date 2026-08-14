import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, BookOpen, CheckCircle2, Circle, ExternalLink, HelpCircle, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ensureBusinessCreditLadderTasks, BUSINESS_LADDER_TASKS } from '../../business/businessCreditLadder';
import { listTasksByPartner } from '../../data/tasksRepo';
import {
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_HEADER,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlassShell,
  type FinelyOsPublicAccent,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';

const AZ_ACCENTS: FinelyOsPublicAccent[] = ['amber', 'emerald', 'sky', 'violet', 'fuchsia'];

const BUSINESS_CREDIT_AZ_STEPS: { letter: string; title: string; body: string; href?: string }[] = [
  {
    letter: 'A',
    title: 'Align entity basics',
    body: 'Register the entity, obtain your EIN, and confirm Secretary of State records match how you will apply.',
    href: '/business/profile',
  },
  {
    letter: 'B',
    title: 'Business address consistency',
    body: 'Use one verifiable business address everywhere — SOS, bank, D&B, and vendor applications must agree.',
    href: '/business/profile',
  },
  {
    letter: 'C',
    title: 'Commercial credit files',
    body: 'Establish D&B and pull baseline Experian Business / Equifax Business snapshots so you know what is reporting.',
    href: '/business/bureaus',
  },
  {
    letter: 'D',
    title: 'Document vault hygiene',
    body: 'Store formation docs, EIN letter, utility bills, and vendor invoices where your team can retrieve them fast.',
    href: '/business/documents',
  },
  {
    letter: 'E',
    title: 'Establish Tier 1 vendors',
    body: 'Open starter net-30 vendors that report. Place small orders and keep payment proof — this builds your first tradelines.',
    href: '/business/vendors',
  },
  {
    letter: 'F',
    title: 'Fundability signals',
    body: 'Complete foundation gates (domain email, banking, NAICS) before chasing revolving products.',
    href: '/business/profile',
  },
  {
    letter: 'G',
    title: 'Grow reporting depth',
    body: 'Sequence Tier 2–3 vendors only after Tier 1 history is clean — depth beats speed.',
    href: '/business/vendors',
  },
  {
    letter: 'H',
    title: 'Handle applications wisely',
    body: 'Run lender logic before inquiries. Apply for revolving, fleet, or LOC products only when your file supports it.',
    href: '/business/lender-logic',
  },
  {
    letter: 'I',
    title: 'Inquiry discipline',
    body: 'Batch applications around readiness windows. Premature pulls create noise funders read as desperation.',
  },
  {
    letter: 'J',
    title: 'Journey to capital',
    body: 'When trade depth and scores align, assemble your underwriting package and explore Nora Capital Group handoff.',
    href: '/business/billion-path',
  },
];

function BusinessCreditAzModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={`${FINELY_OS_FIXED_OVERLAY} flex items-center justify-center p-3 sm:p-4 md:p-6`} onClick={onClose}>
      <div
        className={`${FINELY_OS_MODAL_SHELL} relative z-[1] w-full max-w-2xl border-amber-400/25`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="bc-az-title"
      >
        <div className={`${finelyOsCatalogCardCompact('amber')} !p-0 flex flex-col max-h-[min(92vh,720px)]`} data-fc-accent="amber">
          <div className={FINELY_OS_MODAL_HEADER}>
            <div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Beginner path</div>
              <h2 id="bc-az-title" className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>
                Business credit from A to Z
              </h2>
              <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                Ten plain-English steps — entity hygiene first, vendors second, capital last. Results vary · not legal advice.
              </p>
            </div>
            <FinelyOsModalCloseButton onClick={onClose} />
          </div>
          <div className="overflow-y-auto px-4 py-3 space-y-2">
            {BUSINESS_CREDIT_AZ_STEPS.map((step, idx) => {
              const accent = AZ_ACCENTS[idx % AZ_ACCENTS.length];
              return (
                <div key={step.letter} className={`${finelyOsCatalogCardCompact(accent)} !p-3`} data-fc-accent={accent}>
                  <div className="flex items-start gap-3">
                    <span className={`${FINELY_OS_ENTITY_CHIP} shrink-0 font-mono`}>{step.letter}</span>
                    <div className="min-w-0 flex-1">
                      <div className={FINELY_OS_ENTITY_VALUE}>{step.title}</div>
                      <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{step.body}</p>
                      {step.href ? (
                        <button
                          type="button"
                          className={`${FINELY_OS_SECONDARY_BTN} mt-2`}
                          onClick={() => {
                            onClose();
                            navigate(step.href!);
                          }}
                        >
                          Open step <ExternalLink size={12} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
            <button
              type="button"
              className={FINELY_OS_PRIMARY_BTN}
              onClick={() => {
                onClose();
                navigate('/free-business-guide/read');
              }}
            >
              <BookOpen size={14} /> Read the free power guide
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function BusinessCreditLadderPanel({ partnerId }: { partnerId: string }) {
  const navigate = useNavigate();
  const [storeVersion, setStoreVersion] = useState(0);
  const [azOpen, setAzOpen] = useState(false);

  useEffect(() => {
    ensureBusinessCreditLadderTasks({ partnerId });
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, [partnerId]);

  const tasks = useMemo(() => listTasksByPartner(partnerId).filter((t) => (t.scope ?? 'personal') === 'business'), [partnerId, storeVersion]);
  const getStepTasks = (step: string) => tasks.filter((t) => (t.tags ?? []).includes(`business_ladder:${step}`));
  const stepStatus = (step: string) => {
    const ts = getStepTasks(step);
    if (!ts.length) return { done: false, any: false };
    const done = ts.every((t) => t.status === 'completed' || t.status === 'cancelled');
    return { done, any: true };
  };

  const progress = useMemo(() => {
    const steps = BUSINESS_LADDER_TASKS.map((s) => s.step);
    const done = steps.filter((s) => stepStatus(s).done).length;
    const total = steps.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const next = steps.find((s) => !stepStatus(s).done) ?? null;
    return { done, total, pct, next };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, storeVersion]);

  return (
    <>
      <div className={`${finelyOsGlassShell('panel', 'amber')} space-y-4`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-amber-300">
              <TrendingUp size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>4-step ladder</span>
            </div>
            <div className={`mt-2 text-xl font-light ${FINELY_OS_ENTITY_VALUE}`}>Business Credit Ladder</div>
            <div className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Fundability → Reports → Initial trade → Revolving/Fleet/Cash. This drives tasks and keeps sequencing clean.
            </div>
            <button
              type="button"
              onClick={() => setAzOpen(true)}
              className={`${FINELY_OS_SECONDARY_BTN} mt-3`}
            >
              <HelpCircle size={14} /> New to business credit?
            </button>
          </div>
          <div className="min-w-[220px]">
            <div className={`flex items-center justify-between ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <span>Progress</span>
              <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>
                {progress.done}/{progress.total} ({progress.pct}%)
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${progress.pct}%` }} />
            </div>
            {progress.next ? (
              <button
                type="button"
                onClick={() => {
                  const href = BUSINESS_LADDER_TASKS.find((s) => s.step === progress.next)?.href;
                  if (href) navigate(href);
                }}
                className={`mt-3 ${FINELY_OS_PRIMARY_BTN}`}
                title="Open the recommended next step"
              >
                Next step <ArrowRight size={14} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-3">
          {BUSINESS_LADDER_TASKS.map((s, idx) => {
            const st = stepStatus(s.step);
            const done = st.done;
            const accent = AZ_ACCENTS[idx % AZ_ACCENTS.length];
            return (
              <div key={s.step} className={`${finelyOsCatalogCardCompact(accent)} !p-3 space-y-2`} data-fc-accent={accent}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={FINELY_OS_ENTITY_VALUE}>{s.title}</div>
                    <div className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{s.notes}</div>
                  </div>
                  <div className="shrink-0">{done ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Circle size={18} className="text-white/25" />}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {s.href ? (
                    <button type="button" onClick={() => navigate(s.href!)} className={FINELY_OS_SECONDARY_BTN}>
                      Open <ExternalLink size={14} />
                    </button>
                  ) : null}
                  <span className={FINELY_OS_ENTITY_CHIP}>
                    <Target size={14} /> {getStepTasks(s.step).length} task{getStepTasks(s.step).length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className={`text-[11px] ${FINELY_OS_ENTITY_SUBLABEL}`}>
          Tip: this ladder seeds business-scoped tasks automatically. Track execution in{' '}
          <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>/portal/projects</span>.
        </div>
      </div>

      <BusinessCreditAzModal open={azOpen} onClose={() => setAzOpen(false)} />
    </>
  );
}
