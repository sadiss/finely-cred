import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { BookOpen, GitBranch, Grid3X3, Layers, Sparkles, Zap } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { JamesHollowayAutomationHealthStrip } from '../../../studioCommandOs/JamesHollowayAutomationHealthStrip';
import { listAutomationRules } from '../../../../data/automationStudioRepo';
import { AUTOMATION_BLUEPRINTS } from '../../../studioCommandOs/automationBlueprints';
import { AUTOMATION_TRIGGER_CATALOG } from '../../../automation/automationTriggerCatalog';
import { HUMAN_AUTOMATION_RECIPE_COUNT } from '../../../automation/humanAutomationCatalog';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import type { ProductMetric } from '../components/ProductUi';
import './adminAutomationStudioProductSurface.css';

const AutomationCommandGrid = React.lazy(() =>
  import('../../../studioCommandOs/AutomationCommandGrid').then((m) => ({ default: m.AutomationCommandGrid })),
);
const AutomationRuleWorkstation = React.lazy(() =>
  import('../../../studioCommandOs/AutomationRuleWorkstation').then((m) => ({ default: m.AutomationRuleWorkstation })),
);
const AutomationCatalogExplorer = React.lazy(() =>
  import('../../../studioCommandOs/AutomationCatalogExplorer').then((m) => ({ default: m.AutomationCatalogExplorer })),
);

function TabFallback() {
  return (
    <div className={`${finelyOsCatalogCard('violet')} p-10 text-center`} data-fc-accent="violet">
      <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Loading automation workroom…</p>
    </div>
  );
}

const DECK_STOPS = ['scenarios', 'builder', 'catalog'] as const;
type DeckStop = (typeof DECK_STOPS)[number];

function parseStop(raw: string | null): DeckStop {
  if (raw && DECK_STOPS.includes(raw as DeckStop)) return raw as DeckStop;
  return 'scenarios';
}

const STOP_META: Array<{
  id: DeckStop;
  label: string;
  title: string;
  icon: typeof Grid3X3;
  accent: 'emerald' | 'violet' | 'sky';
  countKey: 'blueprints' | 'rules' | 'triggers';
}> = [
  {
    id: 'scenarios',
    label: 'Scenarios',
    title: 'Curated blueprint storyboards',
    icon: Grid3X3,
    accent: 'emerald',
    countKey: 'blueprints',
  },
  {
    id: 'builder',
    label: 'Flow builder',
    title: 'Rules, branches, and enablement',
    icon: GitBranch,
    accent: 'violet',
    countKey: 'rules',
  },
  {
    id: 'catalog',
    label: 'Trigger catalog',
    title: 'Live triggers and install recipes',
    icon: Zap,
    accent: 'sky',
    countKey: 'triggers',
  },
];

export default function AdminAutomationStudioProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'emerald';
  const [searchParams, setSearchParams] = useSearchParams();
  const [version, setVersion] = useState(0);
  const stop = parseStop(searchParams.get('room'));

  const { rules, rulesError } = useMemo(() => {
    try {
      return { rules: listAutomationRules(), rulesError: null as string | null };
    } catch (err) {
      return {
        rules: [] as ReturnType<typeof listAutomationRules>,
        rulesError: err instanceof Error ? err.message : 'Could not load automation rules.',
      };
    }
  }, [version]);

  const enabledRules = rules.filter((r) => r.enabled).length;
  const liveTriggers = AUTOMATION_TRIGGER_CATALOG.filter((t) => t.tier === 'live').length;

  const counts = {
    blueprints: AUTOMATION_BLUEPRINTS.length,
    rules: rules.length,
    triggers: AUTOMATION_TRIGGER_CATALOG.length,
  };

  const setStop = (id: DeckStop) => {
    const next = new URLSearchParams(searchParams);
    next.set('room', id);
    setSearchParams(next, { replace: true });
    setVersion((v) => v + 1);
  };

  useEffect(() => {
    if (!searchParams.get('room')) {
      const next = new URLSearchParams(searchParams);
      next.set('room', 'scenarios');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const metrics: ProductMetric[] = [
    {
      label: 'Blueprints',
      value: String(AUTOMATION_BLUEPRINTS.length),
      hint: 'Curated scenario storyboards',
      accent: 'emerald',
      icon: Layers,
      onClick: () => setStop('scenarios'),
    },
    {
      label: 'Live triggers',
      value: String(liveTriggers),
      hint: 'Event bridge wired today',
      accent: 'violet',
      icon: Zap,
      onClick: () => setStop('catalog'),
    },
    {
      label: 'Recipes',
      value: String(HUMAN_AUTOMATION_RECIPE_COUNT + 40),
      hint: 'Human + ops install library',
      accent: 'sky',
      icon: BookOpen,
      onClick: () => setStop('catalog'),
    },
    {
      label: 'Your rules',
      value: String(rules.length),
      hint: `${enabledRules} enabled`,
      accent: 'rose',
      icon: Sparkles,
      onClick: () => setStop('builder'),
    },
  ];

  const activeStop = STOP_META.find((s) => s.id === stop) ?? STOP_META[0]!;
  const ActiveIcon = activeStop.icon;

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Platform"
      title="Automation Studio"
      description="Command deck — mosaic trigger tiles open the builder, catalog, and scenario workrooms."
      status={`${enabledRules} enabled · ${rules.length} rules`}
      freshness="ready now"
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon ?? GitBranch}
      primaryAction={<ProductPagePrimaryAction label="Open builder" onClick={() => setStop('builder')} />}
      metrics={metrics}
      metricTitle="Trigger command deck"
      metricDescription="Three deck tiles — not a cloned calendar runway."
    >
      <section className="fc-admin-auto-command" data-surface-layout="command-deck">
        <JamesHollowayAutomationHealthStrip />

        {rulesError ? (
          <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6`} data-fc-accent="rose">
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              Automation rules could not be read from local storage ({rulesError}). You can still browse blueprints.
            </p>
          </div>
        ) : null}

        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Trigger command deck</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <span className="text-5xl font-extrabold leading-none">{enabledRules}</span>
                <span className="pb-1 text-xl font-extrabold">rules live</span>
              </div>
              <p className={`mt-3 max-w-2xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {enabledRules > 0
                  ? `${liveTriggers} triggers wired · ${rules.length - enabledRules} paused`
                  : 'Start with a scenario blueprint — pick a deck tile below.'}
              </p>
            </div>
            {rules.length > 0 && enabledRules < rules.length ? (
              <span className={finelyOsStatusChip('warn')}>{rules.length - enabledRules} paused</span>
            ) : null}
          </div>

          <div className="fc-admin-auto-signal-row mt-6">
            {[
              { label: 'Blueprints', value: counts.blueprints, family: 'emerald' as const },
              { label: 'Rules', value: counts.rules, family: 'violet' as const },
              { label: 'Triggers', value: counts.triggers, family: 'sky' as const },
              { label: 'Live', value: liveTriggers, family: 'rose' as const },
            ].map((sig) => (
              <div key={sig.label} className={`${finelyOsCatalogCard(sig.family)} p-4 text-center`} data-fc-accent={sig.family}>
                <div className={`text-[10px] font-black uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>{sig.label}</div>
                <div className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{sig.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="fc-admin-auto-deck-grid" role="tablist" aria-label="Automation deck">
          {STOP_META.map((seg) => {
            const Icon = seg.icon;
            const count = counts[seg.countKey];
            const active = stop === seg.id;
            return (
              <button
                key={seg.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-active={active ? 'true' : undefined}
                data-fc-accent={seg.accent}
                className={`${finelyOsCatalogCard(seg.accent)} fc-admin-auto-deck-tile`}
                onClick={() => setStop(seg.id)}
              >
                <div className="fc-admin-auto-deck-tile-head">
                  <span className="inline-flex items-center gap-2 text-lg font-extrabold">
                    <Icon size={18} />
                    {seg.label}
                  </span>
                  {count > 0 ? <span className={finelyOsStatusChip('ok')}>{count}</span> : null}
                </div>
                <span className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{seg.title}</span>
                <span className="fc-admin-auto-deck-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="fc-admin-auto-workroom">
          <div className="fc-admin-auto-workroom-head">
            <ActiveIcon size={26} />
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Workroom</p>
              <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{activeStop.label}</h2>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{activeStop.title}</p>
            </div>
          </div>

          <Suspense fallback={<TabFallback />}>
            {stop === 'scenarios' ? <AutomationCommandGrid /> : null}
            {stop === 'builder' ? <AutomationRuleWorkstation /> : null}
            {stop === 'catalog' ? <AutomationCatalogExplorer /> : null}
          </Suspense>
        </div>
      </section>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
