import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileText,
  LayoutGrid,
  Link2,
  Settings,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FinelyOsOverviewStatTile } from '../../../os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type GuideTopic = {
  id: string;
  title: string;
  icon: LucideIcon;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  bullets: string[];
  cta?: { label: string; path: string };
};

const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: 'operating-model',
    title: 'Operating model',
    icon: BookOpen,
    accent: 'violet',
    bullets: [
      'Treat each partner as a case file with timelines, evidence, and an audit trail.',
      'Run weekly ops: review workflow queue → schedule sessions → convert leads to tasks → close loops.',
      'Standardize naming and uploads so any team member can pick up any file instantly.',
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    accent: 'emerald',
    bullets: [
      'Site: brand, support contact, and public social links.',
      'Stripe / In-House Financing: integration configuration, webhooks, and contract URL mappings per package.',
      'Features: turn modules on or off for staged rollout.',
      'Security: keep secrets server-side in production; avoid storing API keys in browser storage.',
    ],
    cta: { label: 'Open Admin Settings', path: '/admin/settings' },
  },
  {
    id: 'templates',
    title: 'Templates and downloadables',
    icon: FileText,
    accent: 'sky',
    bullets: [
      'The Template Library is generator-first: bases × variants × tones × versions (and optionally state specializations).',
      'Export to PDF/Word or save generated documents directly into the Evidence Vault.',
      'Continuously expand the base library across credit, identity theft, debt, court, banking, business funding, and ops.',
    ],
    cta: { label: 'Open Template Library', path: '/admin/templates' },
  },
  {
    id: 'lead-magnets',
    title: 'Lead magnets and Comms Studio',
    icon: BookOpen,
    accent: 'rose',
    bullets: [
      'Free guide funnel (/free-guide) and short links (/g/code) — leads land in Admin → Leads with referral attribution.',
      'Comms Studio sends templates into Communication Hub threads — not a duplicate inbox.',
      'Print-ready QR PDF in affiliate/specialist toolkit for brochures and business cards.',
      'Book a session page (/enlightenment-session) includes time slot picker and agenda.',
    ],
    cta: { label: 'CRM inbound', path: '/admin/crm?pipeline=inbound' },
  },
  {
    id: 'calendar',
    title: 'Calendar and video',
    icon: Calendar,
    accent: 'violet',
    bullets: [
      'Partners self-book at /portal/calendar — time slots, agenda, voice notes, instant video room.',
      'Triage public requests from strategy call and consultation pages.',
      'Meeting reminders deep-link to /portal/meeting/:id for one-click join.',
    ],
    cta: { label: 'Open Calendar and Scheduling', path: '/admin/calendar' },
  },
  {
    id: 'billing',
    title: 'Billing and agreements',
    icon: CreditCard,
    accent: 'emerald',
    bullets: [
      'Stripe and in-house financing are normalized into one internal agreement flow.',
      'Use pending review for contracts that require ops confirmation before activation.',
      'Grant entitlements when agreements activate so portal modules unlock cleanly.',
    ],
    cta: { label: 'Open Billing and Agreements', path: '/admin/billing' },
  },
  {
    id: 'security',
    title: 'Security discipline',
    icon: Shield,
    accent: 'sky',
    bullets: [
      'Production requires a secure backend configured (guardrail is enabled).',
      'Never store SSNs/IDs in plain text; use access control, audit logs, and least-privilege roles.',
      'Use consent-first intake and keep your legal pages accurate and visible.',
    ],
  },
];

const MOSAIC_ACCENTS: Array<'emerald' | 'violet' | 'sky' | 'rose'> = ['emerald', 'violet', 'sky', 'rose'];

export default function AdminGuideProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const [activeIndex, setActiveIndex] = useState(0);

  const activeTopic = GUIDE_TOPICS[activeIndex]!;
  const nextTopic = GUIDE_TOPICS[activeIndex + 1] ?? null;
  const linkedTopics = GUIDE_TOPICS.filter((t) => t.cta);

  const metrics = useMemo(
    () => [
      { label: 'Topics', value: String(GUIDE_TOPICS.length), hint: 'Ops areas covered', accent: 'emerald' as const },
      { label: 'Current', value: String(activeIndex + 1), hint: activeTopic.title, accent: 'violet' as const },
      { label: 'With links', value: String(linkedTopics.length), hint: 'Jump to live tools', accent: 'sky' as const },
      { label: 'Visited', value: String(activeIndex), hint: 'Topics opened', accent: 'rose' as const },
    ],
    [activeIndex, activeTopic.title, linkedTopics.length],
  );

  const goNext = () => {
    if (nextTopic) setActiveIndex((i) => i + 1);
  };

  const ActiveIcon = activeTopic.icon;

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Studio"
      title="Admin guide"
      description="Run Finely Cred operations — settings, workflow, templates, billing, and security."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      metrics={metrics}
      metricTitle="Ops topic mosaic"
      metricDescription="Pick a topic tile — read the playbook and jump to live tools."
      primaryAction={
        nextTopic ? (
          <ProductPagePrimaryAction label={`Next: ${nextTopic.title}`} onClick={goNext} />
        ) : (
          <ProductPagePrimaryAction label="Back to command center" onClick={() => navigate('/admin')} />
        )
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/owners-guide')}>
          Partner owner&apos;s guide
        </button>
      }
    >
      <div className={FINELY_OS_PAGE} data-surface-layout="catalog-mosaic">
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-9 space-y-6">
            {/* Catalog mosaic — topic tiles */}
            <section className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-6`} data-fc-accent="violet">
              <div>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <LayoutGrid size={18} />
                  <span>Ops topics</span>
                </div>
                <h2 className="mt-2 text-3xl font-extrabold">Enterprise playbook mosaic</h2>
                <p className={`mt-2 max-w-3xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  Each tile is a standing operating procedure. Open one to read steps and jump to the live workstation.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {GUIDE_TOPICS.map((topic, index) => {
                  const TopicIcon = topic.icon;
                  const active = index === activeIndex;
                  const tileAccent = MOSAIC_ACCENTS[index % MOSAIC_ACCENTS.length];
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`${finelyOsCatalogCard(tileAccent)} p-6 lg:p-7 text-left min-h-[220px] flex flex-col gap-4 transition hover:shadow-lg ${
                        active ? 'ring-2 ring-white/30' : ''
                      }`}
                      data-fc-accent={tileAccent}
                      aria-current={active ? 'true' : undefined}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-black/20">
                          <TopicIcon size={22} />
                        </span>
                        <span className={`text-sm font-extrabold uppercase tracking-wide ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          {index + 1} / {GUIDE_TOPICS.length}
                        </span>
                      </div>
                      <div>
                        <div className="text-xl font-extrabold">{topic.title}</div>
                        <p className={`mt-2 text-base font-semibold line-clamp-2 ${FINELY_OS_ENTITY_BODY}`}>
                          {topic.bullets[0]}
                        </p>
                      </div>
                      {topic.cta ? (
                        <span className="mt-auto inline-flex w-fit rounded-full bg-sky-500/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sky-200">
                          Has live tool
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Detail reader — selected topic */}
            <article
              className={`${finelyOsCatalogCard(activeTopic.accent)} p-6 lg:p-8 space-y-6 min-h-[28rem]`}
              data-fc-accent={activeTopic.accent}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    <ActiveIcon size={18} />
                    <span>
                      Topic {activeIndex + 1} of {GUIDE_TOPICS.length}
                    </span>
                  </div>
                  <h2 className="mt-3 text-3xl lg:text-4xl font-extrabold">{activeTopic.title}</h2>
                </div>
                <FinelyOsOverviewStatTile
                  icon={ActiveIcon}
                  label="Playbook steps"
                  value={activeTopic.bullets.length}
                  hint={activeTopic.cta ? 'Includes live tool link' : 'Reference only'}
                  accent={activeTopic.accent === 'rose' ? 'fuchsia' : activeTopic.accent}
                  iconAccent={activeTopic.accent === 'rose' ? 'fuchsia' : activeTopic.accent}
                />
              </div>

              <div
                className="rounded-2xl border border-white/10 bg-black/20 p-6 lg:p-8 min-h-[320px] space-y-4"
                aria-label="Guide reader"
              >
                <ul className={`space-y-4 ${FINELY_OS_ENTITY_BODY}`}>
                  {activeTopic.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-base font-semibold leading-relaxed">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                {activeIndex > 0 ? (
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setActiveIndex((i) => i - 1)}>
                    Previous topic
                  </button>
                ) : (
                  <span />
                )}
                {activeTopic.cta ? (
                  <button
                    type="button"
                    className={FINELY_OS_PRIMARY_BTN}
                    onClick={() => navigate(activeTopic.cta!.path)}
                  >
                    {activeTopic.cta.label} <ArrowRight size={14} />
                  </button>
                ) : nextTopic ? (
                  <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={goNext}>
                    Next: {nextTopic.title} <ArrowRight size={14} />
                  </button>
                ) : (
                  <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/admin')}>
                    Finish guide <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </article>
          </div>

          {/* Quick links rail */}
          <aside className="lg:col-span-3 space-y-4">
            <div className={`${finelyOsCatalogCard('sky')} p-5 lg:p-6 space-y-4`} data-fc-accent="sky">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Link2 size={14} />
                <span>Quick links</span>
              </div>
              <div className="flex flex-col gap-2">
                {linkedTopics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => {
                      setActiveIndex(GUIDE_TOPICS.findIndex((t) => t.id === topic.id));
                      if (topic.cta) navigate(topic.cta.path);
                    }}
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    {topic.cta!.label} <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6 space-y-3`} data-fc-accent="rose">
              <div className={FINELY_OS_ENTITY_VALUE}>Progress</div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold">{activeIndex + 1}</span>
                <span className={`pb-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  of {GUIDE_TOPICS.length} topics
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all"
                  style={{ width: `${((activeIndex + 1) / GUIDE_TOPICS.length) * 100}%` }}
                />
              </div>
              {nextTopic ? (
                <button type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`} onClick={goNext}>
                  Next: {nextTopic.title}
                </button>
              ) : null}
            </div>

            <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6`} data-fc-accent="emerald">
              <p className={`text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                Partner-facing owner&apos;s guide lives at /owners-guide for external distribution.
              </p>
              <button
                type="button"
                className={`${FINELY_OS_SECONDARY_BTN} mt-4 w-full justify-center`}
                onClick={() => navigate('/owners-guide')}
              >
                Partner owner&apos;s guide <ArrowRight size={14} />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </ProductHubScaffold>
  );
}
