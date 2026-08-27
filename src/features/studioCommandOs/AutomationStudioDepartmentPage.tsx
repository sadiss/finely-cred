import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { BookOpen, GitBranch, Grid3X3, Layers, Sparkles, Zap } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { JamesHollowayAutomationHealthStrip } from './JamesHollowayAutomationHealthStrip';
import { listAutomationRules } from '../../data/automationStudioRepo';
import { AUTOMATION_BLUEPRINTS } from './automationBlueprints';
import { AUTOMATION_TRIGGER_CATALOG } from '../automation/automationTriggerCatalog';
import { HUMAN_AUTOMATION_RECIPE_COUNT } from '../automation/humanAutomationCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../workspaceLightPreview/product/components/ProductHubScaffold';
import { AdminStageNav, type AdminStageNavItem } from '../workspaceLightPreview/product/components/ProductAdminStage';
import type { ProductMetric } from '../workspaceLightPreview/product/components/ProductUi';

const AutomationCommandGrid = React.lazy(() =>
  import('./AutomationCommandGrid').then((m) => ({ default: m.AutomationCommandGrid })),
);
const AutomationRuleWorkstation = React.lazy(() =>
  import('./AutomationRuleWorkstation').then((m) => ({ default: m.AutomationRuleWorkstation })),
);
const AutomationCatalogExplorer = React.lazy(() =>
  import('./AutomationCatalogExplorer').then((m) => ({ default: m.AutomationCatalogExplorer })),
);

function TabFallback() {
  return (
    <div className="rounded-3xl border border-violet-500/25 bg-violet-500/10 p-10 text-center text-white/70 font-semibold">
      Loading automation workroom…
    </div>
  );
}

const TABS = ['scenarios', 'builder', 'catalog'] as const;
type Tab = (typeof TABS)[number];

function parseTab(raw: string | null): Tab {
  if (raw && TABS.includes(raw as Tab)) return raw as Tab;
  return 'scenarios';
}

const AUTOMATION_ROOMS = (
  blueprintCount: number,
  ruleCount: number,
  triggerCount: number,
): AdminStageNavItem[] => [
  {
    id: 'scenarios',
    label: 'Scenarios',
    description: 'Curated blueprint storyboards',
    icon: Grid3X3,
    accent: 'emerald',
    badge: blueprintCount || undefined,
  },
  {
    id: 'builder',
    label: 'Flow builder',
    description: 'Rules, branches, and enablement',
    icon: GitBranch,
    accent: 'violet',
    badge: ruleCount || undefined,
  },
  {
    id: 'catalog',
    label: 'Trigger catalog',
    description: 'Live triggers and install recipes',
    icon: Zap,
    accent: 'sky',
    badge: triggerCount || undefined,
  },
];

export function AutomationStudioDepartmentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [version, setVersion] = useState(0);
  const tab = parseTab(searchParams.get('room'));
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

  const setTab = (id: Tab) => {
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
      onClick: () => setTab('scenarios'),
    },
    {
      label: 'Live triggers',
      value: String(AUTOMATION_TRIGGER_CATALOG.filter((t) => t.tier === 'live').length),
      hint: 'Event bridge wired today',
      accent: 'violet',
      icon: Zap,
      onClick: () => setTab('catalog'),
    },
    {
      label: 'Recipes',
      value: String(HUMAN_AUTOMATION_RECIPE_COUNT + 40),
      hint: 'Human + ops install library',
      accent: 'sky',
      icon: BookOpen,
      onClick: () => setTab('catalog'),
    },
    {
      label: 'Your rules',
      value: String(rules.length),
      hint: `${rules.filter((r) => r.enabled).length} enabled`,
      accent: 'rose',
      icon: Sparkles,
      onClick: () => setTab('builder'),
    },
  ];

  const rooms = AUTOMATION_ROOMS(
    AUTOMATION_BLUEPRINTS.length,
    rules.length,
    AUTOMATION_TRIGGER_CATALOG.length,
  );

  return (
    <ProductHubScaffold
      role="admin"
      pageId="automations"
      eyebrow="Platform automation"
      title="Automation Studio"
      description="Scenario blueprints, visual flow builder, and the full trigger catalog."
      status={`${rules.filter((r) => r.enabled).length} enabled · ${rules.length} rules`}
      freshness="ready now"
      accent="emerald"
      surfaceMode="studio"
      icon={GitBranch}
      primaryAction={<ProductPagePrimaryAction label="Open builder" onClick={() => setTab('builder')} />}
      metrics={metrics}
      metricTitle="Studio signals"
      metricDescription="Open a signal to jump into the matching room."
    >
      <JamesHollowayAutomationHealthStrip />

      {rulesError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-100">
          Automation rules could not be read from local storage ({rulesError}). You can still browse blueprints.
        </div>
      ) : null}

      <AdminStageNav
        label="Automation rooms"
        items={rooms}
        activeId={tab}
        onChange={(id) => setTab(id as Tab)}
      />

      <Suspense fallback={<TabFallback />}>
        {tab === 'scenarios' ? <AutomationCommandGrid /> : null}
        {tab === 'builder' ? <AutomationRuleWorkstation /> : null}
        {tab === 'catalog' ? <AutomationCatalogExplorer /> : null}
      </Suspense>
    </ProductHubScaffold>
  );
}
