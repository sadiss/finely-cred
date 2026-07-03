import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FinelyUnifiedHubLayout } from '../unified/FinelyUnifiedHubLayout';
import { JamesHollowayAutomationHealthStrip } from './JamesHollowayAutomationHealthStrip';
import { listAutomationRules } from '../../data/automationStudioRepo';
import { AUTOMATION_BLUEPRINTS } from './automationBlueprints';
import { AUTOMATION_TRIGGER_CATALOG } from '../automation/automationTriggerCatalog';
import { HUMAN_AUTOMATION_RECIPE_COUNT } from '../automation/humanAutomationCatalog';

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
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/55">
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

  const kpis = [
    { label: 'Blueprints', value: String(AUTOMATION_BLUEPRINTS.length), hint: 'Curated scenario storyboards', accent: 'amber' as const },
    { label: 'Live triggers', value: String(AUTOMATION_TRIGGER_CATALOG.filter((t) => t.tier === 'live').length), hint: 'Event bridge wired today', accent: 'emerald' as const },
    { label: 'Recipes', value: String(HUMAN_AUTOMATION_RECIPE_COUNT + 40), hint: 'Human + ops install library', accent: 'violet' as const },
    { label: 'Your rules', value: String(rules.length), hint: `${rules.filter((r) => r.enabled).length} enabled`, accent: 'sky' as const },
  ];

  return (
    <FinelyUnifiedHubLayout
      eyebrow="Automation department"
      title="Automation Studio"
      subtitle="Scenarios for fast installs, full flow builder for branches, and a deep trigger/recipe catalog — nothing is hidden behind “locked”."
      accent="amber"
      kpis={kpis}
      tabs={[
        { id: 'scenarios', label: 'Scenarios' },
        { id: 'builder', label: 'Flow builder', badge: rules.length || undefined },
        { id: 'catalog', label: 'Trigger catalog', badge: AUTOMATION_TRIGGER_CATALOG.length },
      ]}
      activeTab={tab}
      onTabChange={(id) => setTab(id as Tab)}
      primaryAction={{ label: 'Open builder', onClick: () => setTab('builder') }}
      secondaryAction={{ label: 'Browse catalog', onClick: () => setTab('catalog') }}
      contentVariant="flush"
      tabDensity="comfortable"
    >
      <div className="mb-6">
        <JamesHollowayAutomationHealthStrip />
      </div>
      {rulesError ? (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Automation rules could not be read from local storage ({rulesError}). You can still browse blueprints — try clearing corrupted automation data in browser storage if this persists.
        </div>
      ) : null}
      <Suspense fallback={<TabFallback />}>
        {tab === 'scenarios' ? <AutomationCommandGrid /> : null}
        {tab === 'builder' ? <AutomationRuleWorkstation /> : null}
        {tab === 'catalog' ? <AutomationCatalogExplorer /> : null}
      </Suspense>
    </FinelyUnifiedHubLayout>
  );
}
