/**
 * Growth workstation surfaces — unique luxury room per pageId + real tools where the product route dropped them.
 */
import React, { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bot,
  Compass,
  FlaskConical,
  Globe2,
  Layers3,
  Megaphone,
  Radar,
  Route,
  Search,
  Sparkles,
  Target,
  Users,
  Workflow,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductNav, getWorkspaceProductNavItem } from '../workspaceProductNav';
import { useAdminProductPathResolver } from '../partner/usePartnerProductNavigation';
import { ADMIN_GROWTH_PAGE_DEFINITIONS, type AdminGrowthPageId } from './growth/adminGrowthPageDefinitions';
import { buildAdminGrowthPageSnapshot, type AdminGrowthPageSnapshot } from './growth/adminGrowthPageData';
import { AdminGrowthPageShell } from './growth/AdminGrowthPageShell';
import { GrowthResultsScoreboard } from '../../../../features/growthAgents/GrowthResultsScoreboard';
import { GrowthAgentWorkspaceView } from '../../../../features/growthAgents/GrowthAgentWorkspaceView';
import { GrowthAgentsRoster } from '../../../../features/growthAgents/GrowthAgentsRoster';
import { getGrowthAgent } from '../../../../features/growthAgents/growthAgentRegistry';
import { LeadScrapeSourcePicker } from '../../../../features/leadsOs/LeadScrapeSourcePicker';
import { LeadIntelHub } from '../../../../features/leadIntel/LeadIntelHub';
import { MarketingDeskEmbeddedPanel } from '../../../marketingDepartment/MarketingDeskEmbeddedPanel';
import { CmoUnifiedCommandCenter } from '../../../../components/cmo/CmoUnifiedCommandCenter';
import { FunnelExperimentsEmbeddedPanel } from './growth/FunnelExperimentsEmbeddedPanel';
import { GrowthCommandEmbeddedPanel } from './growth/GrowthCommandEmbeddedPanel';
import { LeadAcquisitionEmbeddedPanel } from './growth/LeadAcquisitionEmbeddedPanel';
import { SocialHubEmbeddedPanel, SocialHubToolRail, type SocialHubEmbedTab } from './growth/SocialHubEmbeddedPanel';
import { TestimonialsEmbeddedPanel } from './growth/TestimonialsEmbeddedPanel';
import { LeadsInboxEmbeddedPanel } from './growth/LeadsInboxEmbeddedPanel';
import { LeadMagnetsEmbeddedPanel } from './growth/LeadMagnetsEmbeddedPanel';
import { GrowthAutomationEmbeddedPanel } from './growth/GrowthAutomationEmbeddedPanel';
import { SignupOpsEmbeddedPanel } from './growth/SignupOpsEmbeddedPanel';
import { StaffGeoWarRoomPanel } from '../../../../features/staffCommandCenter/StaffGeoWarRoomPanel';
import type { GrowthContentBlock } from './growth/adminGrowthPageData';
import './growth/adminGrowthWorkstations.css';

const GROWTH_PAGE_IDS = new Set<string>(Object.keys(ADMIN_GROWTH_PAGE_DEFINITIONS));

const TOOL_FIRST_GROWTH_PAGE_IDS = new Set<AdminGrowthPageId>([
  'leads-os',
  'lead-intel',
  'marketing-desk',
  'growth-agents',
  'cmo',
  'growth-command',
  'funnel-experiments',
  'testimonials',
  'lead-acquisition',
  'geo-war-room',
  'social-hub',
  'crm-referrals',
  'crm-routing',
  'crm-sequences',
  'leads',
  'lead-magnets',
  'growth-automation',
  'signup-ops',
]);

function isGrowthPageId(pageId: string | undefined): pageId is AdminGrowthPageId {
  return Boolean(pageId && GROWTH_PAGE_IDS.has(pageId));
}

type GrowthRoomMeta = {
  deckLabel: string;
  deckTitle: string;
  deckDescription: string;
  tone: 'dark' | 'clear';
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  layout: string;
  icon: LucideIcon;
};

const GROWTH_ROOM_META: Record<AdminGrowthPageId, GrowthRoomMeta> = {
  'leads-os': {
    deckLabel: 'Source radar',
    deckTitle: 'Lead source adapters',
    deckDescription: 'Pick a scrape template, then run discovery from Marketing Desk or Lead intel.',
    tone: 'dark',
    accent: 'sky',
    layout: 'radar-console',
    icon: Radar,
  },
  'lead-intel': {
    deckLabel: 'Research vault',
    deckTitle: 'Partner prospect research',
    deckDescription: 'Enrich inbound partners before outreach — staging, intent tiers, and import paths.',
    tone: 'dark',
    accent: 'violet',
    layout: 'research-split',
    icon: Compass,
  },
  'marketing-desk': {
    deckLabel: 'Daily command',
    deckTitle: 'Marketing desk rooms',
    deckDescription: "Today's campaign work — Find, Board, Mail, and helper rooms in one desk.",
    tone: 'dark',
    accent: 'violet',
    layout: 'desk-command',
    icon: Megaphone,
  },
  'growth-agents': {
    deckLabel: 'Agent floor',
    deckTitle: 'Growth specialists on assignment',
    deckDescription: 'Caleb Brooks, Esther Hayes, and the rest — open any specialist brain or review results.',
    tone: 'dark',
    accent: 'violet',
    layout: 'agent-deck',
    icon: Bot,
  },
  'crm-referrals': {
    deckLabel: 'Referral ledger',
    deckTitle: 'Partner referral payouts',
    deckDescription: 'Who sends partners and what they are owed — ranked by urgency.',
    tone: 'clear',
    accent: 'emerald',
    layout: 'ledger-mosaic',
    icon: Users,
  },
  'crm-routing': {
    deckLabel: 'Routing mesh',
    deckTitle: 'Lead ownership rules',
    deckDescription: 'Every inbound partner route shows who owns the next handoff.',
    tone: 'dark',
    accent: 'violet',
    layout: 'routing-control',
    icon: Route,
  },
  'crm-sequences': {
    deckLabel: 'Sequence cascade',
    deckTitle: 'Automated follow-up lanes',
    deckDescription: 'Nurture sequences that run when nobody has time to chase.',
    tone: 'clear',
    accent: 'sky',
    layout: 'sequence-cascade',
    icon: Workflow,
  },
  leads: {
    deckLabel: 'Inbox triage',
    deckTitle: 'Unworked inbound partners',
    deckDescription: 'Newest raw leads first — one column for action, one for context.',
    tone: 'dark',
    accent: 'rose',
    layout: 'triage-columns',
    icon: Target,
  },
  'lead-acquisition': {
    deckLabel: 'Channel control',
    deckTitle: 'Acquisition economics',
    deckDescription: 'What each channel costs and what it returns — worst channel highlighted.',
    tone: 'clear',
    accent: 'violet',
    layout: 'channel-control',
    icon: Layers3,
  },
  'lead-magnets': {
    deckLabel: 'Magnet funnel',
    deckTitle: 'Partner capture funnels',
    deckDescription: 'Guides and funnels that convert visitors into partners.',
    tone: 'clear',
    accent: 'emerald',
    layout: 'funnel-stack',
    icon: Sparkles,
  },
  cmo: {
    deckLabel: 'Strategy board',
    deckTitle: 'Marketing Director overview',
    deckDescription: 'Esther Hayes — positioning, spend, and pipeline gaps at a strategy level.',
    tone: 'dark',
    accent: 'rose',
    layout: 'strategy-board',
    icon: Megaphone,
  },
  'growth-command': {
    deckLabel: 'Command center',
    deckTitle: 'Weekly growth targets',
    deckDescription: "This week's targets and the metric that is behind plan.",
    tone: 'dark',
    accent: 'emerald',
    layout: 'command-center',
    icon: Target,
  },
  'growth-automation': {
    deckLabel: 'Workflow lanes',
    deckTitle: 'Partner lifecycle automation',
    deckDescription: 'Triggered workflows across signup, nurture, and handoff.',
    tone: 'clear',
    accent: 'sky',
    layout: 'workflow-lanes',
    icon: Workflow,
  },
  'funnel-experiments': {
    deckLabel: 'Split lanes',
    deckTitle: 'Signup funnel experiments',
    deckDescription: 'Live tests against registration — winners and losers side by side.',
    tone: 'dark',
    accent: 'rose',
    layout: 'split-lanes',
    icon: FlaskConical,
  },
  'geo-war-room': {
    deckLabel: 'Market inspector',
    deckTitle: 'Geo performance map',
    deckDescription: 'Performance market by market — expand where partners convert.',
    tone: 'dark',
    accent: 'emerald',
    layout: 'market-inspector',
    icon: Globe2,
  },
  'social-hub': {
    deckLabel: 'Compose studio',
    deckTitle: 'Social scheduling floor',
    deckDescription: 'Scheduled, published, and winning posts across channels.',
    tone: 'clear',
    accent: 'violet',
    layout: 'compose-studio',
    icon: Megaphone,
  },
  'signup-ops': {
    deckLabel: 'Drop chart',
    deckTitle: 'Registration drop-offs',
    deckDescription: 'Where partners abandon signup — fix the worst step first.',
    tone: 'clear',
    accent: 'sky',
    layout: 'drop-chart',
    icon: Route,
  },
  testimonials: {
    deckLabel: 'Win gallery',
    deckTitle: 'Partner success stories',
    deckDescription: 'Partner wins from submitted to published — approve the oldest pending first.',
    tone: 'clear',
    accent: 'emerald',
    layout: 'win-gallery',
    icon: Sparkles,
  },
};

const DESK_ROOM_LINKS = [
  { id: 'find', label: 'Find', accent: 'emerald' as const },
  { id: 'board', label: 'Board', accent: 'violet' as const },
  { id: 'mail', label: 'Mail', accent: 'sky' as const },
  { id: 'ruth', label: 'Ruth', accent: 'rose' as const },
  { id: 'clean', label: 'Clean out', accent: 'emerald' as const },
];

const INTEL_NAV_LANES = [
  { id: 'search', label: 'Search', detail: 'Run a new prospect query' },
  { id: 'staging', label: 'Staging', detail: 'Review lanes before import' },
  { id: 'library', label: 'Library', detail: 'Saved templates and sources' },
  { id: 'import', label: 'Import', detail: 'Push qualified partners to CRM' },
];

function GrowthRoomSignalBand({
  snapshot,
  accent,
}: {
  snapshot: AdminGrowthPageSnapshot;
  accent: GrowthRoomMeta['accent'];
}) {
  return (
    <div className="fc-wlp-growth-room-signal-band" data-fcm-accent={accent}>
      <p className="fc-wlp-growth-rail-signal">{snapshot.rankedSignal.sentence}</p>
      {snapshot.rankedSignal.href && snapshot.rankedSignal.linkLabel ? (
        <Link to={snapshot.rankedSignal.href} className="fc-wlp-growth-signal-link">
          {snapshot.rankedSignal.linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

function GrowthRoomBlockTiles({
  blocks,
  className,
}: {
  blocks: GrowthContentBlock[];
  className?: string;
}) {
  return (
    <div className={className ?? 'fc-wlp-growth-room-tile-grid'}>
      {blocks.map((block) => (
        <section key={block.id} className="fc-wlp-growth-room-tile" data-fcm-accent={block.accent}>
          <p className="fc-wlp-growth-rail-label">{block.title}</p>
          {block.rows.length ? (
            <ul className="fc-wlp-growth-rail-list">
              {block.rows.slice(0, 6).map((row) => (
                <li key={row.id}>
                  {row.href ? (
                    <Link to={row.href}>
                      <strong>{row.primary}</strong>
                      {row.secondary ? <span>{row.secondary}</span> : null}
                      {row.meta ? <em>{row.meta}</em> : null}
                    </Link>
                  ) : (
                    <>
                      <strong>{row.primary}</strong>
                      {row.secondary ? <span>{row.secondary}</span> : null}
                      {row.meta ? <em>{row.meta}</em> : null}
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="fc-wlp-growth-empty">{block.emptyMessage ?? 'Nothing to show yet.'}</p>
          )}
        </section>
      ))}
    </div>
  );
}

function LeadsOsRadarConsole({
  snapshot,
  scrapeQueryHint,
  onScrapeSelect,
  onOpenMarketingFind,
  onOpenLeadIntel,
}: {
  snapshot: AdminGrowthPageSnapshot;
  scrapeQueryHint: string | null;
  onScrapeSelect: (query: string) => void;
  onOpenMarketingFind: () => void;
  onOpenLeadIntel: () => void;
}) {
  const meta = GROWTH_ROOM_META['leads-os'];

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--radar-console" data-growth-room="leads-os">
      <header className="fc-wlp-growth-radar-hero" data-fcm-accent="sky">
        <div className="fc-wlp-growth-radar-sweep" aria-hidden />
        <div className="fc-wlp-growth-radar-hero-copy">
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <div className="fc-wlp-growth-radar-hero-icon" aria-hidden>
          <Radar size={40} />
        </div>
      </header>

      <div className="fc-wlp-growth-radar-grid">
        <aside className="fc-wlp-growth-radar-rail fc-wlp-growth-radar-rail--status" data-fcm-accent="emerald">
          <p className="fc-wlp-growth-rail-label">Source signals</p>
          <p className="fc-wlp-growth-rail-signal">{snapshot.rankedSignal.sentence}</p>
          <ul className="fc-wlp-growth-rail-list">
            {snapshot.blocks.slice(0, 2).flatMap((block) =>
              block.rows.slice(0, 3).map((row) => (
                <li key={`${block.id}-${row.id}`}>
                  <strong>{row.primary}</strong>
                  {row.secondary ? <span>{row.secondary}</span> : null}
                  {row.meta ? <em>{row.meta}</em> : null}
                </li>
              )),
            )}
          </ul>
        </aside>

        <div className="fc-wlp-growth-radar-core" data-fcm-accent="sky">
          <LeadScrapeSourcePicker
            onSelect={(_source, query) => {
              onScrapeSelect(query);
            }}
          />
          {scrapeQueryHint ? (
            <p className="fc-wlp-growth-deck-hint mt-4 mb-0">
              Loaded template: <strong>{scrapeQueryHint}</strong>
            </p>
          ) : null}
        </div>

        <aside className="fc-wlp-growth-radar-rail fc-wlp-growth-radar-rail--actions" data-fcm-accent="violet">
          <p className="fc-wlp-growth-rail-label">Run discovery</p>
          <p className="fc-wlp-growth-rail-detail">
            Caleb Brooks (Lead Discovery) runs searches from Marketing Desk Find. Lead intel holds research staging.
          </p>
          <div className="fc-wlp-growth-deck-actions fc-wlp-growth-deck-actions--stack">
            <button type="button" className="fc-wlp-btn-primary" onClick={onOpenMarketingFind}>
              <Sparkles size={16} aria-hidden /> Open Marketing Desk Find
            </button>
            <button type="button" className="fc-wlp-btn-secondary" onClick={onOpenLeadIntel}>
              <Search size={16} aria-hidden /> Open Lead intel
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function LeadIntelResearchSplit() {
  const meta = GROWTH_ROOM_META['lead-intel'];

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--research-split" data-growth-room="lead-intel">
      <div className="fc-wlp-growth-research-grid">
        <aside className="fc-wlp-growth-research-nav" data-fcm-accent="violet">
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
          <nav className="fc-wlp-growth-research-lanes" aria-label="Research lanes">
            {INTEL_NAV_LANES.map((lane, index) => (
              <div
                key={lane.id}
                className="fc-wlp-growth-research-lane"
                data-fcm-accent={(['emerald', 'sky', 'rose', 'violet'] as const)[index % 4]}
              >
                <strong>{lane.label}</strong>
                <span>{lane.detail}</span>
              </div>
            ))}
          </nav>
        </aside>

        <div className="fc-wlp-growth-research-workbench" data-fcm-accent="sky">
          <LeadIntelHub embedded showCompliance={false} />
        </div>
      </div>
    </section>
  );
}

function MarketingDeskCommandRoom({
  onOpenRoom,
  activeHelper,
}: {
  onOpenRoom: (roomId: string) => void;
  activeHelper: string | null;
}) {
  const meta = GROWTH_ROOM_META['marketing-desk'];

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--desk-command" data-growth-room="marketing-desk">
      <header className="fc-wlp-growth-desk-command-strip" data-fcm-accent="rose">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">Esther Hayes · Marketing Director</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <div className="fc-wlp-growth-desk-command-kpi" data-fcm-accent="emerald">
          <BarChart3 size={22} aria-hidden />
          <div>
            <strong>Today's desk</strong>
            <span>Pick a room below — work stays on this screen.</span>
          </div>
        </div>
      </header>

      <div className="fc-wlp-growth-desk-room-dock" role="tablist" aria-label="Marketing desk rooms">
        {DESK_ROOM_LINKS.map((room) => (
          <button
            key={room.id}
            type="button"
            role="tab"
            aria-selected={activeHelper === room.id}
            className="fc-wlp-growth-desk-room-chip"
            data-fcm-accent={room.accent}
            data-active={activeHelper === room.id ? 'true' : undefined}
            onClick={() => onOpenRoom(room.id)}
          >
            {room.label}
          </button>
        ))}
      </div>

      <div className="fc-wlp-growth-desk-canvas" data-fcm-accent="violet">
        <MarketingDeskEmbeddedPanel />
      </div>
    </section>
  );
}

function GrowthAgentsDeckRoom({
  openAgentId,
  onSelectAgent,
  onOpenResults,
}: {
  openAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onOpenResults: () => void;
}) {
  const meta = GROWTH_ROOM_META['growth-agents'];
  const isResultsView = openAgentId === 'results';
  const openAgent = openAgentId && !isResultsView ? getGrowthAgent(openAgentId) : null;

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--agent-deck" data-growth-room="growth-agents">
      <header className="fc-wlp-growth-agent-deck-head" data-fcm-accent="sky">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <button
          type="button"
          className="fc-wlp-btn-secondary"
          onClick={onOpenResults}
          aria-pressed={isResultsView}
        >
          <BarChart3 size={16} aria-hidden /> {isResultsView ? 'Results open' : 'Open results'}
        </button>
      </header>

      {!isResultsView ? (
        <div className="fc-wlp-growth-agent-scoreboard-rail" data-fcm-accent="emerald">
          <GrowthResultsScoreboard variant="slim" />
        </div>
      ) : null}

      <div className="fc-wlp-growth-agent-deck-grid">
        <div className="fc-wlp-growth-agent-roster-pane" data-fcm-accent="violet">
          <GrowthAgentsRoster />
        </div>

        <div
          className="fc-wlp-growth-agent-inspector-pane"
          data-fcm-accent={isResultsView ? 'emerald' : 'rose'}
        >
          {isResultsView ? (
            <>
              <div className="fc-wlp-growth-agent-inspector-head">
                <p className="fc-wlp-growth-room-eyebrow">Results floor</p>
                <h3 className="fc-wlp-growth-agent-inspector-title">Growth results scoreboard</h3>
              </div>
              <div className="fc-wlp-growth-agent-inspector-body fc-wlp-growth-agent-inspector-body--results">
                <GrowthResultsScoreboard variant="full" />
              </div>
            </>
          ) : openAgent ? (
            <>
              <div className="fc-wlp-growth-agent-inspector-head">
                <p className="fc-wlp-growth-room-eyebrow">Specialist workspace</p>
                <h3 className="fc-wlp-growth-agent-inspector-title">
                  {openAgent.name} · {openAgent.roleTitle}
                </h3>
              </div>
              <div className="fc-wlp-growth-agent-inspector-body">
                <GrowthAgentWorkspaceView agentId={openAgentId!} />
              </div>
            </>
          ) : (
            <div className="fc-wlp-growth-agent-inspector-placeholder" data-fcm-accent="sky">
              <Bot size={32} aria-hidden />
              <strong>Select a growth specialist</strong>
              <p>
                Choose Caleb Brooks (Lead Discovery) or another specialist from the roster — or open
                results for the full scoreboard.
              </p>
              <div className="fc-wlp-growth-deck-actions">
                <button type="button" className="fc-wlp-btn-primary" onClick={() => onSelectAgent('lead-discovery')}>
                  Open Caleb Brooks
                </button>
                <button type="button" className="fc-wlp-btn-secondary" onClick={onOpenResults}>
                  Open results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CmoStrategyBoardRoom({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META.cmo;

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--strategy-board" data-growth-room="cmo">
      <header className="fc-wlp-growth-strategy-hero" data-fcm-accent="rose">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">Esther Hayes · Marketing Director</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <Megaphone size={36} aria-hidden className="fc-wlp-growth-strategy-hero-icon" />
      </header>

      <GrowthRoomSignalBand snapshot={snapshot} accent={meta.accent} />

      <div className="fc-wlp-growth-strategy-mosaic">
        <GrowthRoomBlockTiles blocks={snapshot.blocks.slice(0, 2)} className="fc-wlp-growth-strategy-side" />
        <div className="fc-wlp-growth-strategy-studio" data-fcm-accent="violet">
          <p className="fc-wlp-growth-rail-label">Strategy console</p>
          <CmoUnifiedCommandCenter embedded defaultTab="forecasts" />
        </div>
        <GrowthRoomBlockTiles blocks={snapshot.blocks.slice(2)} className="fc-wlp-growth-strategy-foot" />
      </div>
    </section>
  );
}

function GrowthCommandCenterRoom({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META['growth-command'];
  const targetsBlock = snapshot.blocks.find((b) => b.id === 'targets');
  const runwayNodes = targetsBlock?.rows ?? [];

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--command-center" data-growth-room="growth-command">
      <header className="fc-wlp-growth-command-hero" data-fcm-accent="emerald">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <Target size={36} aria-hidden className="fc-wlp-growth-command-hero-icon" />
      </header>

      <GrowthRoomSignalBand snapshot={snapshot} accent={meta.accent} />

      <div className="fc-wlp-growth-command-runway" aria-label="Weekly runway">
        {runwayNodes.map((node, index) => (
          <div
            key={node.id}
            className="fc-wlp-growth-command-runway-node"
            data-fcm-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[index % 4]}
          >
            <strong>{node.primary}</strong>
            <span>{node.secondary}</span>
            {node.meta ? <em>{node.meta}</em> : null}
          </div>
        ))}
      </div>

      <div className="fc-wlp-growth-command-deck" data-fcm-accent="sky">
        <GrowthCommandEmbeddedPanel />
      </div>

      <GrowthRoomBlockTiles blocks={snapshot.blocks.filter((b) => b.id !== 'targets')} className="fc-wlp-growth-command-alerts" />
    </section>
  );
}

function FunnelExperimentsSplitLanesRoom({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META['funnel-experiments'];

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--split-lanes" data-growth-room="funnel-experiments">
      <header className="fc-wlp-growth-funnel-hero" data-fcm-accent="rose">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <FlaskConical size={36} aria-hidden className="fc-wlp-growth-funnel-hero-icon" />
      </header>

      <GrowthRoomSignalBand snapshot={snapshot} accent={meta.accent} />

      <div className="fc-wlp-growth-funnel-lane-rail">
        {snapshot.blocks
          .find((b) => b.id === 'funnel')
          ?.rows.slice(0, 4)
          .map((row, index) => (
            <div
              key={row.id}
              className="fc-wlp-growth-funnel-lane-chip"
              data-fcm-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[index % 4]}
            >
              <strong>{row.primary}</strong>
              <span>{row.secondary}</span>
              {row.meta ? <em>{row.meta}</em> : null}
            </div>
          ))}
      </div>

      <div className="fc-wlp-growth-funnel-workbench" data-fcm-accent="violet">
        <FunnelExperimentsEmbeddedPanel />
      </div>
    </section>
  );
}

function TestimonialsWinGalleryRoom({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META.testimonials;
  const pendingBlock = snapshot.blocks.find((b) => b.id === 'pending');
  const spotlight = pendingBlock?.rows[0];

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--win-gallery" data-growth-room="testimonials">
      <header className="fc-wlp-growth-gallery-hero" data-fcm-accent="emerald">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <Sparkles size={36} aria-hidden className="fc-wlp-growth-gallery-hero-icon" />
      </header>

      <GrowthRoomSignalBand snapshot={snapshot} accent={meta.accent} />

      {spotlight ? (
        <div className="fc-wlp-growth-gallery-spotlight" data-fcm-accent="violet">
          <p className="fc-wlp-growth-rail-label">Approve next</p>
          <strong>{spotlight.primary}</strong>
          <span>{spotlight.secondary}</span>
          {spotlight.meta ? <em>{spotlight.meta} pending</em> : null}
          {spotlight.href ? (
            <Link to={spotlight.href} className="fc-wlp-growth-signal-link">Review in queue</Link>
          ) : null}
        </div>
      ) : null}

      <div className="fc-wlp-growth-gallery-canvas" data-fcm-accent="sky">
        <TestimonialsEmbeddedPanel />
      </div>
    </section>
  );
}

function LeadAcquisitionControlRoom({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META['lead-acquisition'];
  const spendBlock = snapshot.blocks.find((b) => b.id === 'spend');
  const cpaBlock = snapshot.blocks.find((b) => b.id === 'cpa');

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--channel-control" data-growth-room="lead-acquisition">
      <header className="fc-wlp-growth-control-hero" data-fcm-accent="violet">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <Layers3 size={36} aria-hidden className="fc-wlp-growth-control-hero-icon" />
      </header>

      <div className="fc-wlp-growth-control-grid">
        <aside className="fc-wlp-growth-control-alert-rail" data-fcm-accent="rose">
          <p className="fc-wlp-growth-rail-label">Alert rail</p>
          <p className="fc-wlp-growth-rail-signal">{snapshot.rankedSignal.sentence}</p>
          {snapshot.rankedSignal.href && snapshot.rankedSignal.linkLabel ? (
            <Link to={snapshot.rankedSignal.href} className="fc-wlp-growth-signal-link">
              {snapshot.rankedSignal.linkLabel}
            </Link>
          ) : null}
          <GrowthRoomBlockTiles blocks={snapshot.blocks.filter((b) => b.id === 'budget' || b.id === 'compare')} className="fc-wlp-growth-control-side-tiles" />
        </aside>

        <div className="fc-wlp-growth-control-status-grid" aria-label="Channel economics">
          {(spendBlock?.rows ?? []).map((row, index) => {
            const cpaRow = cpaBlock?.rows.find((r) => r.primary === row.primary);
            return (
              <div
                key={row.id}
                className="fc-wlp-growth-control-status-cell"
                data-fcm-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[index % 4]}
              >
                <strong>{row.primary}</strong>
                <span>{row.secondary}</span>
                {row.meta ? <em>{row.meta}</em> : null}
                {cpaRow?.meta ? <em className="fc-wlp-growth-control-cpa">{cpaRow.meta} CPA</em> : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="fc-wlp-growth-control-workbench" data-fcm-accent="sky">
        <LeadAcquisitionEmbeddedPanel />
      </div>
    </section>
  );
}

function GeoWarRoomMarketInspector({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META['geo-war-room'];
  const marketsBlock = snapshot.blocks.find((b) => b.id === 'markets');
  const expansionBlock = snapshot.blocks.find((b) => b.id === 'expansion');
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(marketsBlock?.rows[0]?.id ?? null);
  const selectedMarket = marketsBlock?.rows.find((row) => row.id === selectedMarketId) ?? marketsBlock?.rows[0];

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--market-inspector" data-growth-room="geo-war-room">
      <header className="fc-wlp-growth-geo-hero" data-fcm-accent="emerald">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <Globe2 size={36} aria-hidden className="fc-wlp-growth-geo-hero-icon" />
      </header>

      <GrowthRoomSignalBand snapshot={snapshot} accent={meta.accent} />

      <div className="fc-wlp-growth-geo-inspector-grid">
        <aside className="fc-wlp-growth-geo-market-queue" data-fcm-accent="sky">
          <p className="fc-wlp-growth-rail-label">Active markets</p>
          <ul className="fc-wlp-growth-geo-market-list">
            {(marketsBlock?.rows ?? []).map((row, index) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="fc-wlp-growth-geo-market-chip"
                  data-fcm-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[index % 4]}
                  data-active={selectedMarketId === row.id ? 'true' : undefined}
                  onClick={() => setSelectedMarketId(row.id)}
                >
                  <strong>{row.primary}</strong>
                  <span>{row.secondary}</span>
                  {row.meta ? <em>{row.meta} convert</em> : null}
                </button>
              </li>
            ))}
          </ul>
          {expansionBlock?.rows.length ? (
            <>
              <p className="fc-wlp-growth-rail-label mt-4">Expansion candidates</p>
              <ul className="fc-wlp-growth-rail-list">
                {expansionBlock.rows.slice(0, 4).map((row) => (
                  <li key={row.id}>
                    <strong>{row.primary}</strong>
                    {row.secondary ? <span>{row.secondary}</span> : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </aside>

        <div className="fc-wlp-growth-geo-inspector-pane" data-fcm-accent="violet">
          {selectedMarket ? (
            <div className="fc-wlp-growth-geo-spotlight" data-fcm-accent="rose">
              <p className="fc-wlp-growth-rail-label">Selected market</p>
              <strong>{selectedMarket.primary}</strong>
              <span>{selectedMarket.secondary}</span>
              {selectedMarket.meta ? <em>{selectedMarket.meta} conversion</em> : null}
            </div>
          ) : null}
          <StaffGeoWarRoomPanel />
        </div>
      </div>
    </section>
  );
}

function SocialHubComposeStudioRoom({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META['social-hub'];
  const [socialTab, setSocialTab] = useState<SocialHubEmbedTab>('composer');
  const pendingBlock = snapshot.blocks.find((b) => b.id === 'approval');
  const nextPending = pendingBlock?.rows[0];

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--compose-studio" data-growth-room="social-hub">
      <header className="fc-wlp-growth-compose-hero" data-fcm-accent="violet">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <Megaphone size={36} aria-hidden className="fc-wlp-growth-compose-hero-icon" />
      </header>

      <GrowthRoomSignalBand snapshot={snapshot} accent={meta.accent} />

      {nextPending ? (
        <div className="fc-wlp-growth-compose-approve-strip" data-fcm-accent="rose">
          <p className="fc-wlp-growth-rail-label">Approve next</p>
          <strong>{nextPending.primary}</strong>
          <span>{nextPending.secondary}</span>
          <button type="button" className="fc-wlp-btn-primary" onClick={() => setSocialTab('autopilot')}>
            Review queue
          </button>
        </div>
      ) : null}

      <div className="fc-wlp-growth-compose-studio-grid">
        <SocialHubToolRail activeTab={socialTab} onTabChange={setSocialTab} />
        <div className="fc-wlp-growth-compose-canvas" data-fcm-accent="sky">
          <SocialHubEmbeddedPanel activeTab={socialTab} onTabChange={setSocialTab} />
        </div>
      </div>
    </section>
  );
}

function CrmReferralsLedgerMosaicRoom({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META['crm-referrals'];

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--ledger-mosaic" data-growth-room="crm-referrals">
      <header className="fc-wlp-growth-ledger-hero" data-fcm-accent="emerald">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <Users size={36} aria-hidden className="fc-wlp-growth-ledger-hero-icon" />
      </header>

      <GrowthRoomSignalBand snapshot={snapshot} accent={meta.accent} />

      <div className="fc-wlp-growth-ledger-mosaic">
        {snapshot.blocks.map((block, index) => (
          <section
            key={block.id}
            className="fc-wlp-growth-ledger-tile"
            data-fcm-accent={block.accent}
            {...(index === 0 ? { 'data-ledger-span': 'wide' } : index === 1 ? { 'data-ledger-span': 'tall' } : {})}
          >
            <p className="fc-wlp-growth-rail-label">{block.title}</p>
            {block.rows.length ? (
              <ul className="fc-wlp-growth-rail-list">
                {block.rows.slice(0, 6).map((row) => (
                  <li key={row.id}>
                    {row.href ? (
                      <Link to={row.href}>
                        <strong>{row.primary}</strong>
                        {row.secondary ? <span>{row.secondary}</span> : null}
                        {row.meta ? <em>{row.meta}</em> : null}
                      </Link>
                    ) : (
                      <>
                        <strong>{row.primary}</strong>
                        {row.secondary ? <span>{row.secondary}</span> : null}
                        {row.meta ? <em>{row.meta}</em> : null}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="fc-wlp-growth-empty">{block.emptyMessage ?? 'Nothing to show yet.'}</p>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}

function CrmRoutingControlRoom({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META['crm-routing'];
  const rulesBlock = snapshot.blocks.find((b) => b.id === 'rules');
  const loadBlock = snapshot.blocks.find((b) => b.id === 'load');

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--routing-control" data-growth-room="crm-routing">
      <header className="fc-wlp-growth-routing-hero" data-fcm-accent="violet">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <Route size={36} aria-hidden className="fc-wlp-growth-routing-hero-icon" />
      </header>

      <GrowthRoomSignalBand snapshot={snapshot} accent={meta.accent} />

      <div className="fc-wlp-growth-routing-mesh" aria-label="Routing mesh">
        {(rulesBlock?.rows ?? []).slice(0, 6).map((rule, index) => (
          <div
            key={rule.id}
            className="fc-wlp-growth-routing-node"
            data-fcm-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[index % 4]}
          >
            <strong>{rule.primary}</strong>
            <span>{rule.secondary}</span>
            {rule.meta ? <em>{rule.meta}</em> : null}
          </div>
        ))}
      </div>

      <div className="fc-wlp-growth-routing-deck">
        <GrowthRoomBlockTiles blocks={snapshot.blocks.filter((b) => b.id !== 'rules')} className="fc-wlp-growth-routing-side" />
        {loadBlock?.rows.length ? (
          <aside className="fc-wlp-growth-routing-load-rail" data-fcm-accent="sky">
            <p className="fc-wlp-growth-rail-label">Owner load</p>
            <ul className="fc-wlp-growth-rail-list">
              {loadBlock.rows.slice(0, 6).map((row) => (
                <li key={row.id}>
                  <strong>{row.primary}</strong>
                  {row.secondary ? <span>{row.secondary}</span> : null}
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function CrmSequencesCascadeRoom({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META['crm-sequences'];
  const activeBlock = snapshot.blocks.find((b) => b.id === 'active');

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--sequence-cascade" data-growth-room="crm-sequences">
      <header className="fc-wlp-growth-cascade-hero" data-fcm-accent="sky">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <Workflow size={36} aria-hidden className="fc-wlp-growth-cascade-hero-icon" />
      </header>

      <GrowthRoomSignalBand snapshot={snapshot} accent={meta.accent} />

      <div className="fc-wlp-growth-sequence-cascade" aria-label="Sequence cascade">
        {(activeBlock?.rows ?? []).map((seq, index) => (
          <div
            key={seq.id}
            className="fc-wlp-growth-sequence-step"
            data-fcm-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[index % 4]}
          >
            <div className="fc-wlp-growth-sequence-step-marker" aria-hidden />
            <div className="fc-wlp-growth-sequence-step-body">
              <strong>{seq.primary}</strong>
              <span>{seq.secondary}</span>
              {seq.meta ? <em>{seq.meta}</em> : null}
            </div>
          </div>
        ))}
      </div>

      <GrowthRoomBlockTiles blocks={snapshot.blocks.filter((b) => b.id !== 'active')} className="fc-wlp-growth-sequence-foot" />
    </section>
  );
}

function LeadsTriageColumnsRoom({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META.leads;
  const sourcesBlock = snapshot.blocks.find((b) => b.id === 'sources');
  const qualBlock = snapshot.blocks.find((b) => b.id === 'qualification');
  const todayBlock = snapshot.blocks.find((b) => b.id === 'today');
  const todayRow = todayBlock?.rows[0];

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--triage-columns" data-growth-room="leads">
      <header className="fc-wlp-growth-triage-hero" data-fcm-accent="rose">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <Target size={36} aria-hidden className="fc-wlp-growth-triage-hero-icon" />
      </header>

      <GrowthRoomSignalBand snapshot={snapshot} accent={meta.accent} />

      <div className="fc-wlp-growth-triage-grid">
        <div className="fc-wlp-growth-triage-action" data-fcm-accent="rose">
          <LeadsInboxEmbeddedPanel />
        </div>

        <aside className="fc-wlp-growth-triage-context" data-fcm-accent="violet">
          {todayRow ? (
            <div className="fc-wlp-growth-triage-kpi" data-fcm-accent="emerald">
              <strong>{todayRow.primary}</strong>
              <span>{todayRow.secondary}</span>
            </div>
          ) : null}
          <GrowthRoomBlockTiles
            blocks={[sourcesBlock, qualBlock].filter((b): b is GrowthContentBlock => Boolean(b))}
            className="fc-wlp-growth-triage-context-tiles"
          />
        </aside>
      </div>
    </section>
  );
}

function LeadMagnetsFunnelStackRoom({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META['lead-magnets'];
  const listBlock = snapshot.blocks.find((b) => b.id === 'list');
  const topMagnet = listBlock?.rows[0];

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--funnel-stack" data-growth-room="lead-magnets">
      <header className="fc-wlp-growth-funnel-stack-hero" data-fcm-accent="emerald">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <Sparkles size={36} aria-hidden className="fc-wlp-growth-funnel-stack-hero-icon" />
      </header>

      <GrowthRoomSignalBand snapshot={snapshot} accent={meta.accent} />

      <div className="fc-wlp-growth-funnel-stack-rail" aria-label="Top magnets">
        {(listBlock?.rows ?? []).slice(0, 5).map((row, index) => (
          <div
            key={row.id}
            className="fc-wlp-growth-funnel-stack-step"
            data-fcm-accent={(['emerald', 'violet', 'sky', 'rose', 'emerald'] as const)[index % 4]}
          >
            <div className="fc-wlp-growth-funnel-stack-connector" aria-hidden />
            <strong>{row.primary}</strong>
            <span>{row.secondary}</span>
            {row.meta ? <em>{row.meta} convert</em> : null}
            {row.href ? (
              <Link to={row.href} className="fc-wlp-growth-signal-link">
                Open funnel
              </Link>
            ) : null}
          </div>
        ))}
      </div>

      {topMagnet ? (
        <div className="fc-wlp-growth-funnel-stack-spotlight" data-fcm-accent="violet">
          <p className="fc-wlp-growth-rail-label">Top converter</p>
          <strong>{topMagnet.primary}</strong>
          <span>{topMagnet.secondary}</span>
          {topMagnet.meta ? <em>{topMagnet.meta}</em> : null}
        </div>
      ) : null}

      <div className="fc-wlp-growth-funnel-stack-studio" data-fcm-accent="sky">
        <LeadMagnetsEmbeddedPanel />
      </div>

      <GrowthRoomBlockTiles
        blocks={snapshot.blocks.filter((b) => b.id !== 'list')}
        className="fc-wlp-growth-funnel-stack-foot"
      />
    </section>
  );
}

function GrowthAutomationWorkflowLanesRoom({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META['growth-automation'];
  const activeBlock = snapshot.blocks.find((b) => b.id === 'active');
  const errorsBlock = snapshot.blocks.find((b) => b.id === 'errors');

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--workflow-lanes" data-growth-room="growth-automation">
      <header className="fc-wlp-growth-workflow-hero" data-fcm-accent="sky">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <Workflow size={36} aria-hidden className="fc-wlp-growth-workflow-hero-icon" />
      </header>

      <GrowthRoomSignalBand snapshot={snapshot} accent={meta.accent} />

      <div className="fc-wlp-growth-workflow-lanes" aria-label="Active workflow lanes">
        {(activeBlock?.rows ?? []).slice(0, 6).map((lane, index) => (
          <div
            key={lane.id}
            className="fc-wlp-growth-workflow-lane"
            data-fcm-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[index % 4]}
          >
            <strong>{lane.primary}</strong>
            <span>{lane.secondary}</span>
          </div>
        ))}
      </div>

      {errorsBlock?.rows.length ? (
        <aside className="fc-wlp-growth-workflow-error-rail" data-fcm-accent="rose">
          <p className="fc-wlp-growth-rail-label">Errors needing fix</p>
          <ul className="fc-wlp-growth-rail-list">
            {errorsBlock.rows.slice(0, 4).map((row) => (
              <li key={row.id}>
                {row.href ? (
                  <Link to={row.href}>
                    <strong>{row.primary}</strong>
                    {row.secondary ? <span>{row.secondary}</span> : null}
                  </Link>
                ) : (
                  <>
                    <strong>{row.primary}</strong>
                    {row.secondary ? <span>{row.secondary}</span> : null}
                  </>
                )}
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      <div className="fc-wlp-growth-workflow-console" data-fcm-accent="violet">
        <GrowthAutomationEmbeddedPanel />
      </div>
    </section>
  );
}

function SignupOpsDropChartRoom({ snapshot }: { snapshot: AdminGrowthPageSnapshot }) {
  const meta = GROWTH_ROOM_META['signup-ops'];
  const dropBlock = snapshot.blocks.find((b) => b.id === 'dropoff');
  const maxDrop = Math.max(...(dropBlock?.rows.map((r) => parseFloat(r.secondary || '0')) ?? [0]), 1);

  return (
    <section className="fc-wlp-growth-room fc-wlp-growth-room--drop-chart" data-growth-room="signup-ops">
      <header className="fc-wlp-growth-drop-hero" data-fcm-accent="sky">
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <h2 className="fc-wlp-growth-room-title">{meta.deckTitle}</h2>
          <p className="fc-wlp-growth-room-description">{meta.deckDescription}</p>
        </div>
        <Route size={36} aria-hidden className="fc-wlp-growth-drop-hero-icon" />
      </header>

      <GrowthRoomSignalBand snapshot={snapshot} accent={meta.accent} />

      <div className="fc-wlp-growth-drop-chart" aria-label="Registration drop-off chart">
        {(dropBlock?.rows ?? []).map((step, index) => {
          const pct = parseFloat(step.secondary || '0') || 0;
          const height = Math.max(12, Math.round((pct / maxDrop) * 100));
          return (
            <div
              key={step.id}
              className="fc-wlp-growth-drop-bar"
              data-fcm-accent={(['rose', 'violet', 'sky', 'emerald'] as const)[index % 4]}
            >
              <div className="fc-wlp-growth-drop-bar-fill" style={{ height: `${height}%` }} aria-hidden />
              <strong>{step.primary}</strong>
              <span>{step.secondary}</span>
            </div>
          );
        })}
      </div>

      <div className="fc-wlp-growth-drop-workbench">
        <GrowthRoomBlockTiles
          blocks={snapshot.blocks.filter((b) => b.id === 'conversion' || b.id === 'recent')}
          className="fc-wlp-growth-drop-side"
        />
        <div className="fc-wlp-growth-drop-studio" data-fcm-accent="violet">
          <SignupOpsEmbeddedPanel />
        </div>
      </div>
    </section>
  );
}

function GrowthStandardRoom({ pageId }: { pageId: AdminGrowthPageId }) {
  const meta = GROWTH_ROOM_META[pageId];
  const DeckIcon = meta.icon;

  return (
    <section
      className={`fc-wlp-growth-room fc-wlp-growth-room--${meta.layout}`}
      data-growth-room={pageId}
    >
      <div className="fc-wlp-growth-room-accent-band" data-fcm-accent={meta.accent}>
        <DeckIcon size={28} aria-hidden />
        <div>
          <p className="fc-wlp-growth-room-eyebrow">{meta.deckLabel}</p>
          <strong>{meta.deckTitle}</strong>
          <p>{meta.deckDescription}</p>
        </div>
      </div>
    </section>
  );
}

export default function AdminGrowthWorkstationsSurface({ pageId, entityId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const resolvePath = useAdminProductPathResolver();
  const [version, setVersion] = useState(0);
  const [scrapeQueryHint, setScrapeQueryHint] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('finely:store', refresh as EventListener);
    return () => window.removeEventListener('finely:store', refresh as EventListener);
  }, []);

  const growthPageId = isGrowthPageId(pageId) ? pageId : 'leads';
  const openAgentId =
    growthPageId === 'growth-agents' ? entityId || searchParams.get('agentId') || null : null;
  const definition = ADMIN_GROWTH_PAGE_DEFINITIONS[growthPageId];
  const navItem = getWorkspaceProductNavItem('admin', growthPageId);
  const PageIcon = navItem?.icon ?? Target;
  const roomMeta = GROWTH_ROOM_META[growthPageId];
  const activeDeskHelper = searchParams.get('helper') || searchParams.get('room') || searchParams.get('tab');

  const snapshot = useMemo(() => {
    void version;
    return buildAdminGrowthPageSnapshot(growthPageId, resolvePath);
  }, [growthPageId, resolvePath, version]);

  const relatedLinks = useMemo(
    () =>
      getWorkspaceProductNav('admin')
        .filter((item) => item.service === 'growth' && item.id !== growthPageId)
        .slice(0, 6)
        .map((item) => ({
          label: item.label,
          path: resolvePath(item.legacyPath ?? item.path),
        })),
    [growthPageId, resolvePath],
  );

  const onPrimaryAction = () => {
    if (snapshot.primaryAction.onClick) {
      snapshot.primaryAction.onClick();
      return;
    }
    if (snapshot.primaryAction.href) {
      const href = resolvePath(snapshot.primaryAction.href);
      if (href !== pathname) navigate(href);
    }
  };

  const openMarketingFind = () => navigate(resolvePath('/admin/marketing-desk?helper=find'));
  const openLeadIntel = () => navigate(resolvePath('/admin/lead-intel'));
  const openDeskRoom = (roomId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'desk');
    next.set('helper', roomId);
    next.delete('room');
    setSearchParams(next, { replace: false });
  };
  const openGrowthAgent = (agentId: string) => {
    navigate(resolvePath(`/admin/growth-agents/${agentId}`));
  };
  const openGrowthResults = () => {
    navigate(resolvePath('/admin/growth-agents/results'));
  };

  const renderGrowthRoom = () => {
    switch (growthPageId) {
      case 'leads-os':
        return (
          <LeadsOsRadarConsole
            snapshot={snapshot}
            scrapeQueryHint={scrapeQueryHint}
            onScrapeSelect={setScrapeQueryHint}
            onOpenMarketingFind={openMarketingFind}
            onOpenLeadIntel={openLeadIntel}
          />
        );
      case 'lead-intel':
        return <LeadIntelResearchSplit />;
      case 'marketing-desk':
        return (
          <MarketingDeskCommandRoom onOpenRoom={openDeskRoom} activeHelper={activeDeskHelper} />
        );
      case 'growth-agents':
        return (
          <GrowthAgentsDeckRoom
            openAgentId={openAgentId}
            onSelectAgent={openGrowthAgent}
            onOpenResults={openGrowthResults}
          />
        );
      case 'cmo':
        return <CmoStrategyBoardRoom snapshot={snapshot} />;
      case 'growth-command':
        return <GrowthCommandCenterRoom snapshot={snapshot} />;
      case 'funnel-experiments':
        return <FunnelExperimentsSplitLanesRoom snapshot={snapshot} />;
      case 'testimonials':
        return <TestimonialsWinGalleryRoom snapshot={snapshot} />;
      case 'lead-acquisition':
        return <LeadAcquisitionControlRoom snapshot={snapshot} />;
      case 'geo-war-room':
        return <GeoWarRoomMarketInspector snapshot={snapshot} />;
      case 'social-hub':
        return <SocialHubComposeStudioRoom snapshot={snapshot} />;
      case 'crm-referrals':
        return <CrmReferralsLedgerMosaicRoom snapshot={snapshot} />;
      case 'crm-routing':
        return <CrmRoutingControlRoom snapshot={snapshot} />;
      case 'crm-sequences':
        return <CrmSequencesCascadeRoom snapshot={snapshot} />;
      case 'leads':
        return <LeadsTriageColumnsRoom snapshot={snapshot} />;
      case 'lead-magnets':
        return <LeadMagnetsFunnelStackRoom snapshot={snapshot} />;
      case 'growth-automation':
        return <GrowthAutomationWorkflowLanesRoom snapshot={snapshot} />;
      case 'signup-ops':
        return <SignupOpsDropChartRoom snapshot={snapshot} />;
      default:
        return <GrowthStandardRoom pageId={growthPageId} />;
    }
  };

  return (
    <div className="fc-wlp-growth-workstation-root" data-growth-layout={roomMeta.layout}>
      <AdminGrowthPageShell
        definition={definition}
        snapshot={snapshot}
        icon={PageIcon}
        relatedLinks={relatedLinks}
        onPrimaryAction={onPrimaryAction}
        chromeOnly={TOOL_FIRST_GROWTH_PAGE_IDS.has(growthPageId)}
      />

      {renderGrowthRoom()}
    </div>
  );
}
