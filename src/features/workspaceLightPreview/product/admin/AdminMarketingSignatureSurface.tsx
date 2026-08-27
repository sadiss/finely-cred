import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Clapperboard,
  FlaskConical,
  Gauge,
  Megaphone,
  Network,
  Radio,
  Sparkles,
  Users,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';
import { listFunnelExperiments } from '../../../../data/funnelExperimentsRepo';
import { listCommsSequences } from '../../../../data/commsSequencesRepo';
import { listScheduledPosts } from '../../../../data/socialHubRepo';
import { listMediaProjects } from '../../../../data/mediaStudioRepo';
import { MarketingAutopilotStrip } from '../../../marketingDepartment/MarketingAutopilotStrip';
import { MarketingChannelsHub } from '../../../marketingDepartment/MarketingChannelsHub';
import { MarketingDeskEmbeddedPanel } from '../../../marketingDepartment/MarketingDeskEmbeddedPanel';
import { MarketingTeamHierarchy } from '../../../marketingDepartment/MarketingTeamHierarchy';
import { MarketingWeekFocusHero } from '../../../marketingDepartment/MarketingWeekFocusHero';
import { MediaStudioPremiumPage } from '../../../studioCommandOs/MediaStudioPremiumPage';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  type FinelyOsPublicAccent,
} from '../../../os/finelyOsLightUi';
import '../../../marketingDepartment/marketingHub.css';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import type { WorkspaceProductAccent } from '../workspaceProductTokens';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import {
  AdminContextCommand,
  AdminStageHero,
  AdminStageSection,
  AdminStageShell,
  type AdminStageSignal,
} from '../components/ProductAdminStage';
import { ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminMarketingSignature.css';

type MarketingRoom = 'control' | 'desk' | 'channels' | 'team' | 'content' | 'studio' | 'automation';

function publicCatalogAccent(accent: WorkspaceProductAccent): FinelyOsPublicAccent {
  return accent === 'graphite' ? 'violet' : accent;
}

type MarketingDeckRoom = {
  id: MarketingRoom;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
};

const MARKETING_ROOMS: MarketingDeckRoom[] = [
  {
    id: 'control',
    label: 'Weekly focus',
    description: 'This week’s priority, launch timing, and the decision holding growth back.',
    icon: Radio,
    accent: 'violet',
  },
  {
    id: 'desk',
    label: 'Daily desk',
    description: 'Today’s assignments and work already in motion.',
    icon: Gauge,
    accent: 'emerald',
  },
  {
    id: 'channels',
    label: 'Channels',
    description: 'Publishing readiness across owned and zero-cost channels.',
    icon: Network,
    accent: 'sky',
  },
  {
    id: 'team',
    label: 'Growth team',
    description: 'People, AI staff, ownership, and handoffs.',
    icon: Users,
    accent: 'rose',
  },
  {
    id: 'content',
    label: 'Release runway',
    description: 'Posts and media moving toward their publish window.',
    icon: Clapperboard,
    accent: 'sky',
  },
  {
    id: 'studio',
    label: 'Media studio',
    description: 'Research, scripts, video, voice, design, review, and export.',
    icon: Video,
    accent: 'violet',
  },
  {
    id: 'automation',
    label: 'Autopilot',
    description: 'Experiments, nurture, and overnight growth systems.',
    icon: Sparkles,
    accent: 'emerald',
  },
];

type MarketingEntry = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  kind: 'experiment' | 'post' | 'sequence' | 'media';
  needsAction: boolean;
};

function formatFreshness(iso?: string): string {
  if (!iso) return 'ready now';
  const elapsed = Date.now() - Date.parse(iso);
  if (!Number.isFinite(elapsed) || elapsed < 60_000) return 'just now';
  const hours = Math.floor(elapsed / 3_600_000);
  if (hours < 1) return `${Math.max(1, Math.floor(elapsed / 60_000))} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminMarketingSignatureSurface({
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const [room, setRoom] = useState<MarketingRoom>('control');
  const [version, setVersion] = useState(0);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('admin', 'marketing'), []);

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('finely:store', refresh as EventListener);
    return () => window.removeEventListener('finely:store', refresh as EventListener);
  }, []);

  const snapshot = useMemo(() => {
    void version;
    const experiments = listFunnelExperiments();
    const posts = listScheduledPosts();
    const sequences = listCommsSequences();
    const media = listMediaProjects();

    const entries: MarketingEntry[] = [
      ...experiments.map((experiment) => {
        const stats = Object.values(experiment.stats ?? {}).reduce(
          (totals, item) => ({
            impressions: totals.impressions + (item?.impressions ?? 0),
            conversions: totals.conversions + (item?.conversions ?? 0),
          }),
          { impressions: 0, conversions: 0 },
        );
        return {
          id: `experiment-${experiment.id}`,
          title: experiment.name,
          detail: experiment.enabled
            ? `${stats.impressions} impressions · ${stats.conversions} conversions`
            : 'Paused — no variant is currently serving traffic.',
          meta: experiment.enabled ? 'Live experiment' : 'Paused',
          kind: 'experiment' as const,
          needsAction: experiment.enabled && stats.impressions === 0,
        };
      }),
      ...posts.map((post) => ({
        id: `post-${post.id}`,
        title: post.caption.slice(0, 70) || 'Scheduled post',
        detail:
          post.status === 'queued'
            ? `Publishes ${new Date(post.scheduledAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}`
            : `Status: ${post.status.replace(/_/g, ' ')}`,
        meta: (post.platforms ?? []).join(' · ') || 'Social',
        kind: 'post' as const,
        needsAction: post.status === 'needs_review' || post.status === 'failed',
      })),
      ...sequences.map((sequence) => ({
        id: `sequence-${sequence.id}`,
        title: sequence.name,
        detail: `${sequence.steps.length} step ${sequence.defaultChannel} nurture`,
        meta: sequence.enabled ? 'Nurture live' : 'Nurture paused',
        kind: 'sequence' as const,
        needsAction: !sequence.enabled,
      })),
      ...media.map((project) => ({
        id: `media-${project.id}`,
        title: project.title,
        detail: 'Media project moving through production.',
        meta: 'Content studio',
        kind: 'media' as const,
        needsAction: false,
      })),
    ];

    const demoMetrics = demoSpec?.metrics ?? [];
    const demoNumber = (label: string, fallback: number) => {
      const value = demoMetrics.find((metric) => metric.label.toLowerCase().includes(label))?.value;
      return typeof value === 'number' ? value : fallback;
    };

    const active = dataMode === 'demo'
      ? demoNumber('campaign', 6)
      : experiments.filter((item) => item.enabled).length + sequences.filter((item) => item.enabled).length;
    const review = dataMode === 'demo'
      ? demoNumber('approval', 2)
      : posts.filter((item) => item.status === 'needs_review' || item.status === 'failed').length;
    const scheduled = dataMode === 'demo'
      ? demoNumber('session', 7)
      : posts.filter((item) => item.status === 'queued').length;
    const production = dataMode === 'demo'
      ? 4
      : media.filter((item) => Date.now() - Date.parse(item.updatedAt) < 14 * 86_400_000).length;

    return {
      active,
      review,
      scheduled,
      production,
      entries:
        entries.length > 0
          ? entries
          : (demoSpec?.items ?? []).map((item, index) => ({
              id: item.id,
              title: item.title,
              detail: item.description,
              meta: item.meta,
              kind: (['experiment', 'post', 'sequence', 'media'] as const)[index % 4],
              needsAction: item.status === 'needs_action' || item.status === 'blocked',
            })),
      freshness: formatFreshness(
        posts[0]?.updatedAt ??
          posts[0]?.createdAt ??
          experiments[0]?.updatedAt ??
          sequences[0]?.updatedAt ??
          media[0]?.updatedAt,
      ),
    };
  }, [dataMode, demoSpec, version]);

  const signals: AdminStageSignal[] = [
    {
      id: 'active',
      label: 'Campaigns moving',
      value: snapshot.active,
      detail: 'Experiments and nurture currently live',
      icon: Sparkles,
      accent: 'emerald',
      featured: true,
      onClick: () => setRoom('automation'),
    },
    {
      id: 'review',
      label: 'Decision queue',
      value: snapshot.review,
      detail: snapshot.review ? 'Copy, compliance, or failed delivery' : 'Nothing is waiting on approval',
      icon: FlaskConical,
      accent: 'rose',
      onClick: () => setRoom('content'),
    },
    {
      id: 'scheduled',
      label: 'Release runway',
      value: snapshot.scheduled,
      detail: 'Posts already queued to publish',
      icon: CalendarClock,
      accent: 'sky',
      onClick: () => setRoom('content'),
    },
    {
      id: 'production',
      label: 'Studio motion',
      value: snapshot.production,
      detail: 'Media projects touched in the last 14 days',
      icon: Clapperboard,
      accent: 'violet',
      onClick: () => setRoom('studio'),
    },
  ];

  const activeRoom = MARKETING_ROOMS.find((item) => item.id === room) ?? MARKETING_ROOMS[0]!;
  const ActiveIcon = activeRoom.icon;

  const status = snapshot.review
    ? `${snapshot.review} decision${snapshot.review === 1 ? '' : 's'} holding the release line`
    : `${snapshot.active} growth system${snapshot.active === 1 ? '' : 's'} moving`;

  const feature = (
    <div className="fc-wlp-mkt-broadcast" aria-label="Marketing broadcast summary">
      <div className="fc-wlp-mkt-broadcast-tower" aria-hidden>
        <span className="fc-wlp-mkt-broadcast-beam fc-wlp-mkt-broadcast-beam--emerald" />
        <span className="fc-wlp-mkt-broadcast-beam fc-wlp-mkt-broadcast-beam--violet" />
        <span className="fc-wlp-mkt-broadcast-beam fc-wlp-mkt-broadcast-beam--sky" />
        <span className="fc-wlp-mkt-broadcast-core">
          <Radio size={22} />
        </span>
      </div>
      <div className="fc-wlp-mkt-broadcast-stats">
        <div className="fc-wlp-mkt-broadcast-stat" data-accent="emerald">
          <strong>{snapshot.active}</strong>
          <span>live systems</span>
        </div>
        <div className="fc-wlp-mkt-broadcast-stat" data-accent="rose">
          <strong>{snapshot.review}</strong>
          <span>in review</span>
        </div>
        <div className="fc-wlp-mkt-broadcast-stat" data-accent="sky">
          <strong>{snapshot.scheduled}</strong>
          <span>queued</span>
        </div>
      </div>
    </div>
  );

  const renderRoom = () => {
    if (room === 'desk') {
      return (
        <div className="fc-wlp-mkt-room fc-wlp-mkt-room--desk" data-mkt-room="desk">
          <AdminStageSection
            eyebrow="Daily desk"
            title="Today’s marketing assignments"
            description="Assignments, helper rooms, and decisions in one working canvas."
            tone="dark"
          >
            <MarketingDeskEmbeddedPanel />
          </AdminStageSection>
        </div>
      );
    }

    if (room === 'channels') {
      return (
        <div className="fc-wlp-mkt-room fc-wlp-mkt-room--channels" data-mkt-room="channels">
          <AdminStageSection
            eyebrow="Channels"
            title="Every channel shows its readiness"
            description="Publishing setup, community listening, and delivery controls."
            tone="dark"
          >
            <MarketingChannelsHub />
          </AdminStageSection>
        </div>
      );
    }

    if (room === 'team') {
      return (
        <div className="fc-wlp-mkt-room fc-wlp-mkt-room--team" data-mkt-room="team">
          <AdminStageSection
            eyebrow="Growth team"
            title="The growth floor has visible ownership"
            description="Strategy, research, content, nurture, and capture — who owns the next handoff."
            tone="dark"
          >
            <MarketingTeamHierarchy />
          </AdminStageSection>
        </div>
      );
    }

    if (room === 'automation') {
      return (
        <div className="fc-wlp-mkt-room fc-wlp-mkt-room--automation" data-mkt-room="automation">
          <div className="fc-wlp-mkt-control-grid">
            <AdminStageSection
              eyebrow="Autopilot"
              title="Overnight growth systems"
              description="See whether growth continues while the team sleeps — intervene only on exceptions."
              tone="dark"
            >
              <MarketingAutopilotStrip />
            </AdminStageSection>
            <MarketingActivityRunway entries={snapshot.entries.filter((entry) => entry.kind === 'experiment' || entry.kind === 'sequence')} />
          </div>
        </div>
      );
    }

    if (room === 'content') {
      return (
        <div className="fc-wlp-mkt-room fc-wlp-mkt-room--content" data-mkt-room="content">
          <AdminStageSection
            eyebrow="Release runway"
            title="Content moves on a visible runway"
            description="Blocked approvals separated from scheduled and in-production work."
            tone="dark"
            action={
              <button type="button" className="fc-wlp-btn-primary" onClick={() => setRoom('desk')}>
                Open daily desk
              </button>
            }
          >
            <MarketingActivityRunway entries={snapshot.entries.filter((entry) => entry.kind === 'post' || entry.kind === 'media')} />
          </AdminStageSection>
        </div>
      );
    }

    if (room === 'studio') {
      return (
        <div className="fc-wlp-mkt-room fc-wlp-mkt-room--studio" data-mkt-room="studio">
          <AdminStageSection
            eyebrow="Media studio"
            title="Full media studio inside Marketing"
            description="Research, scripts, scenes, voice, image and video generation, review, and publishing."
            tone="clear"
          >
            <MediaStudioPremiumPage embedded />
          </AdminStageSection>
        </div>
      );
    }

    return (
      <div className="fc-wlp-mkt-room fc-wlp-mkt-room--control" data-mkt-room="control">
        <div className="fc-wlp-mkt-command-grid">
          <MarketingWeekFocusHero />
          <MarketingAutopilotStrip />
          <div className="fc-wlp-mkt-command-runway">
            <MarketingActivityRunway entries={snapshot.entries} compact />
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminStageShell family="department-suite" signature="marketing-broadcast-suite" accent="violet">
      <AdminStageHero
        tone="studio"
        accent="violet"
        eyebrow="Marketing"
        title={
          <>
            Turn attention into <span className="fc-wlp-mkt-title-accent">measurable partner movement.</span>
          </>
        }
        description="Weekly focus, daily desk, channels, growth team, release runway, media studio, and autopilot — one deck for partner movement."
        status={status}
        freshness={snapshot.freshness}
        icon={Megaphone}
        feature={feature}
        primaryAction={
          <ProductPagePrimaryAction label="Create campaign" onClick={() => setActiveModal('create_campaign')} />
        }
      >
        <div className="fc-wlp-mkt-waveform" aria-hidden>
          {Array.from({ length: 28 }).map((_, index) => (
            <span key={index} style={{ '--fc-mkt-bar': (index % 9) + 3 } as React.CSSProperties} />
          ))}
        </div>
      </AdminStageHero>

      <section className="fc-wlp-mkt-command-deck" aria-label="Marketing command deck">
        <div className="fc-wlp-mkt-deck-signals">
          {signals.map((signal) => {
            const Icon = signal.icon;
            return (
              <button
                key={signal.id}
                type="button"
                className={`fc-wlp-mkt-deck-signal ${finelyOsCatalogCard(publicCatalogAccent(signal.accent))} p-5 lg:p-6`}
                data-fc-accent={signal.accent}
                data-featured={signal.featured ? 'true' : undefined}
                onClick={signal.onClick}
              >
                <div className="flex items-start justify-between gap-2">
                  <Icon size={20} className="shrink-0 opacity-90" />
                  <span className={`${FINELY_OS_ENTITY_VALUE} text-3xl`}>{signal.value}</span>
                </div>
                <div className={`mt-2 text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{signal.label}</div>
                <p className={`mt-1 text-sm font-bold leading-snug ${FINELY_OS_ENTITY_BODY}`}>{signal.detail}</p>
              </button>
            );
          })}
        </div>

        <div className="fc-wlp-mkt-deck-strip" role="tablist" aria-label="Marketing tools">
          {MARKETING_ROOMS.map((item) => {
            const Icon = item.icon;
            const active = room === item.id;
            const badge =
              item.id === 'content'
                ? snapshot.review || undefined
                : item.id === 'automation'
                  ? snapshot.active
                  : undefined;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`fc-wlp-mkt-deck-tool ${finelyOsCatalogCard(item.accent)} p-4 lg:p-5`}
                data-fc-accent={item.accent}
                data-active={active ? 'true' : undefined}
                onClick={() => setRoom(item.id)}
              >
                <div className="flex items-center gap-2 text-base font-extrabold">
                  <Icon size={18} />
                  {item.label}
                  {badge !== undefined ? (
                    <span className="fc-wlp-mkt-deck-badge">{badge}</span>
                  ) : null}
                </div>
                <p className={`mt-1 text-sm font-bold leading-snug ${FINELY_OS_ENTITY_BODY}`}>{item.description}</p>
              </button>
            );
          })}
        </div>

        <div className={`fc-wlp-mkt-deck-active ${finelyOsCatalogCard(activeRoom.accent)} p-5 lg:p-6`} data-fc-accent={activeRoom.accent}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="fc-wlp-mkt-deck-active-icon">
              <ActiveIcon size={22} />
            </span>
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Active room</p>
              <h2 className="text-2xl font-extrabold lg:text-3xl">{activeRoom.label}</h2>
            </div>
            <p className={`w-full text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{activeRoom.description}</p>
          </div>
        </div>
      </section>

      {renderRoom()}

      <AdminContextCommand
        label="Next step"
        title={snapshot.review ? 'Clear the decision queue first.' : 'The release line is clear.'}
        description={
          snapshot.review
            ? 'Approvals and failed sends rank above new production because they hold scheduled work.'
            : 'Use open capacity to strengthen the winning experiment or prepare the next content batch.'
        }
        steps={
          snapshot.review
            ? ['Open the oldest blocked release.', 'Approve, edit, or retry it.', 'Recheck the next scheduled batch.']
            : ['Inspect the winning experiment.', 'Confirm channel readiness.', 'Prepare the next release batch.']
        }
        prompt="What marketing decision should I make next, and why?"
        contextLabel="Marketing"
      />

      {activeModal ? (
        <div className="fc-wlp-local-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="fc-wlp-local-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-extrabold text-white">Create campaign</h3>
              <button type="button" className="text-gray-400 hover:text-white" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="text-base font-semibold text-white/85 space-y-2">
              <p>Set campaign objective, target channel, and nurture sequence variants.</p>
              <div className="p-4 bg-black/40 rounded border border-white/10 font-mono text-sm text-violet-300">
                Local preview mode — campaign configuration saved to local session.
              </div>
            </div>
            <button
              type="button"
              className="fc-wlp-btn-primary !w-full !py-3 !text-base"
              onClick={() => setActiveModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </AdminStageShell>
  );
}

function MarketingActivityRunway({
  entries,
  compact = false,
}: {
  entries: MarketingEntry[];
  compact?: boolean;
}) {
  const visible = entries.slice(0, compact ? 5 : 9);
  const ordered = [...visible].sort((a, b) => Number(b.needsAction) - Number(a.needsAction));

  if (!ordered.length) {
    return (
      <div className="fc-wlp-mkt-runway-empty">
        <Sparkles size={22} />
        <strong>The runway is open</strong>
        <span>Create an experiment, post, sequence, or media project to put work in motion.</span>
      </div>
    );
  }

  return (
    <div className="fc-wlp-mkt-runway" data-compact={compact ? 'true' : undefined}>
      <div className="fc-wlp-mkt-runway-line" aria-hidden />
      {ordered.map((entry, index) => (
        <article
          key={entry.id}
          className="fc-wlp-mkt-runway-card"
          data-kind={entry.kind}
          data-blocked={entry.needsAction ? 'true' : undefined}
          style={{ '--fc-mkt-runway-index': index } as React.CSSProperties}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div>
            <em>{entry.meta}</em>
            <h3>{entry.title}</h3>
            <p>{entry.detail}</p>
          </div>
          <strong>{entry.needsAction ? 'Decision needed' : 'Moving'}</strong>
        </article>
      ))}
    </div>
  );
}
