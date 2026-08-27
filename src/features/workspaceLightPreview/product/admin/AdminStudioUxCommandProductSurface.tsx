import React, { useState } from 'react';
import { Bot, Clapperboard, LayoutDashboard, Mail, Route, Trash2, Workflow } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GeminiStyleVideoCommand } from '../../../studioCommandOs/GeminiStyleVideoCommand';
import { AutomationCommandGrid } from '../../../studioCommandOs/AutomationCommandGrid';
import { CommsCommandLibrary } from '../../../studioCommandOs/CommsCommandLibrary';
import { LeadTrashPanel } from '../../../studioCommandOs/LeadTrashPanel';
import { SiteWideUxAuditPanel } from '../../../studioCommandOs/SiteWideUxAuditPanel';
import { StudioSection } from '../../../studioCommandOs/StudioKpiCards';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type ToolId = 'overview' | 'media' | 'automation' | 'comms' | 'lead_trash' | 'sitewide';

const TOOLS: Array<{
  id: ToolId;
  label: string;
  icon: React.ReactNode;
  desc: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  heroLabel: string;
}> = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <LayoutDashboard size={18} />,
    desc: 'Layout rules and command flow',
    accent: 'violet',
    heroLabel: 'Review merged upgrades',
  },
  {
    id: 'media',
    label: 'Media Studio',
    icon: <Clapperboard size={18} />,
    desc: 'Prompt-to-video command',
    accent: 'emerald',
    heroLabel: 'Open Media Studio',
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: <Workflow size={18} />,
    desc: 'Blueprint workflows',
    accent: 'sky',
    heroLabel: 'Open Automation Studio',
  },
  {
    id: 'comms',
    label: 'Comms Hub',
    icon: <Mail size={18} />,
    desc: 'Template deck layout',
    accent: 'rose',
    heroLabel: 'Open Comms templates',
  },
  {
    id: 'lead_trash',
    label: 'Lead Trash',
    icon: <Trash2 size={18} />,
    desc: 'Delete and restore leads',
    accent: 'violet',
    heroLabel: 'Manage lead trash',
  },
  {
    id: 'sitewide',
    label: 'Sitewide UX',
    icon: <Route size={18} />,
    desc: 'Long-list cleanup',
    accent: 'emerald',
    heroLabel: 'Audit sitewide UX',
  },
];

const OVERVIEW_UPGRADES = [
  'Media Studio becomes prompt-to-video first',
  'Communication Hub becomes card deck and preview',
  'Automation Studio becomes blueprint grid',
  'Leads get visible trash and restore controls',
  'Long lists become KPI cards and decks',
  'Grid movement is locked unless editing',
  'Primary action appears at the top',
  'Everything is Cursor-ready in copy_to_repo',
];

export default function AdminStudioUxCommandProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const [tool, setTool] = useState<ToolId>('media');

  const activeTool = TOOLS.find((t) => t.id === tool) ?? TOOLS[1]!;

  const runHeroAction = () => {
    if (tool === 'media') navigate('/admin/media-studio');
    else if (tool === 'automation') navigate('/admin/automations');
    else if (tool === 'comms') navigate('/admin/communications');
    else if (tool === 'sitewide') navigate('/admin/sitewide-ux');
    else if (tool === 'lead_trash') navigate('/admin/crm');
    else setTool('media');
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Studio"
      title="Studio UX Command"
      description="One hero action up top, then pick a tool from the strip — media, automation, comms, leads, or sitewide."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      metrics={[
        { label: 'Tools', value: String(TOOLS.length), hint: 'Command strip', accent: 'emerald' },
        { label: 'Active', value: activeTool.label, hint: 'Selected tool', accent: 'violet' },
        { label: 'Media', value: 'Video', hint: 'Prompt-first', accent: 'sky' },
        { label: 'Automation', value: 'Blueprints', hint: 'Scenario grid', accent: 'rose' },
      ]}
      metricTitle="Command deck"
      metricDescription="Hero action launches the active tool; strip switches without leaving the deck."
      primaryAction={<ProductPagePrimaryAction label={activeTool.heroLabel} onClick={runHeroAction} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => setTool('overview')}>
          Overview
        </button>
      }
    >
      {/* Command deck — hero band + horizontal tool strip */}
      <section className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-violet-300">
              <Bot size={16} /> Studio UX Command
            </div>
            <h2 className="mt-3 text-3xl font-extrabold lg:text-4xl">
              {activeTool.label}: {activeTool.desc}
            </h2>
            <p className={`mt-4 text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
              Unified command layer for Media, Comms, Automation, lead cleanup, and sitewide layout refactors.
            </p>
          </div>
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={runHeroAction}>
            {activeTool.heroLabel}
          </button>
        </div>
      </section>

      <div
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
        role="tablist"
        aria-label="Studio tools"
      >
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tool === t.id}
            onClick={() => setTool(t.id)}
            className={`shrink-0 rounded-2xl border px-4 py-3 text-left transition-all min-w-[140px] ${
              tool === t.id
                ? 'border-violet-400/50 bg-violet-500/15 shadow-lg shadow-violet-500/10'
                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
            }`}
            data-fc-accent={t.accent}
          >
            <div className="flex items-center gap-2 text-sm font-extrabold">{t.icon}{t.label}</div>
            <div className="mt-1 text-xs font-semibold opacity-60">{t.desc}</div>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tool === 'overview' ? (
          <StudioSection eyebrow="Merged upgrade" title="What changes immediately">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              {OVERVIEW_UPGRADES.map((item, idx) => {
                const family = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
                return (
                  <div key={item} className={`${finelyOsCatalogCard(family)} p-5`} data-fc-accent={family}>
                    <p className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>{item}</p>
                  </div>
                );
              })}
            </div>
          </StudioSection>
        ) : null}
        {tool === 'media' ? <GeminiStyleVideoCommand /> : null}
        {tool === 'automation' ? <AutomationCommandGrid /> : null}
        {tool === 'comms' ? <CommsCommandLibrary /> : null}
        {tool === 'lead_trash' ? <LeadTrashPanel /> : null}
        {tool === 'sitewide' ? <SiteWideUxAuditPanel /> : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/media-studio')}>
          Media studio
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/automations')}>
          Automations
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/sitewide-ux')}>
          Sitewide UX
        </button>
      </div>
    </ProductHubScaffold>
  );
}
