import React, { useMemo, useState } from 'react';
import { CheckCircle2, Filter, GitBranch, Play, Zap } from 'lucide-react';
import { AUTOMATION_TRIGGER_CATALOG, type TriggerCatalogEntry } from '../automation/automationTriggerCatalog';
import { ALL_AUTOMATION_RECIPES } from '../automation/automationRecipeLibrary';
import { HUMAN_AUTOMATION_RECIPES } from '../automation/humanAutomationCatalog';
import { FLOW_NODE_PALETTE } from '../automation/automationFlowModel';
import { createAutomationRule } from '../../data/automationStudioRepo';
import { StudioSection } from './StudioKpiCards';

const CONDITION_TYPES = [
  { type: 'always', label: 'Always', detail: 'No gate — run when trigger fires.' },
  { type: 'partner_lane_in', label: 'Partner lane in', detail: 'Filter by funding, debt, AU, affiliate, etc.' },
  { type: 'partner_stage_in', label: 'Partner stage in', detail: 'Intake, evidence, letters, mailing, funding…' },
  { type: 'has_open_tasks', label: 'Has open tasks', detail: 'Minimum open Work OS tasks.' },
  { type: 'has_unclaimed_invite', label: 'Unclaimed invite', detail: 'Stale portal invite older than N hours.' },
  { type: 'has_active_bundle', label: 'Active bundle', detail: 'Partner has a specific package active.' },
] as const;

const ACTION_FAMILIES = [
  'run_workflow', 'send_comms_template', 'create_task', 'send_invite_reminder', 'bundle_nudge', 'sla_escalation',
  'crm_sequence_tick', 'send_email', 'send_sms', 'add_crm_tag', 'move_crm_stage', 'enroll_crm_sequence',
  'notify_admin', 'meta_reply', 'enroll_nurture_sequence', 'assign_agent_persona', 'draft_dispute_letter',
  'queue_letter_review', 'request_mail_confirmation', 'assign_staff_task', 'queue_compliance_escalation',
  'render_voice_asset', 'create_project', 'set_project_stage', 'set_task_stage', 'add_task_tags', 'create_notification',
] as const;

type CatalogTab = 'triggers' | 'conditions' | 'nodes' | 'recipes';

export function AutomationCatalogExplorer() {
  const [tab, setTab] = useState<CatalogTab>('triggers');
  const [triggerGroup, setTriggerGroup] = useState<TriggerCatalogEntry['group'] | 'all'>('all');
  const [recipeQuery, setRecipeQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const recipes = useMemo(() => {
    const merged = [...ALL_AUTOMATION_RECIPES, ...HUMAN_AUTOMATION_RECIPES];
    const seen = new Set<string>();
    return merged.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, []);

  const filteredRecipes = useMemo(() => {
    const q = recipeQuery.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => `${r.title} ${r.description} ${r.category}`.toLowerCase().includes(q));
  }, [recipeQuery, recipes]);

  const triggers = useMemo(() => {
    if (triggerGroup === 'all') return AUTOMATION_TRIGGER_CATALOG;
    return AUTOMATION_TRIGGER_CATALOG.filter((t) => t.group === triggerGroup);
  }, [triggerGroup]);

  function installRecipe(id: string) {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) return;
    createAutomationRule(recipe.makeRule());
    setNotice(`Installed recipe: ${recipe.title}`);
  }

  const tabBtn = (id: CatalogTab, label: string, count: number) => (
    <button type="button" key={id} className={tab === id ? 'fc-button-brand shrink-0' : 'fc-button-soft shrink-0'} onClick={() => setTab(id)}>
      {label} ({count})
    </button>
  );

  return (
    <div className="space-y-5">
      {notice ? (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100 text-sm inline-flex gap-3">
          <CheckCircle2 size={18} /> {notice}
        </div>
      ) : null}

      <StudioSection eyebrow="Automation library" title="Triggers, conditions, flow nodes, and installable recipes">
        <p className="text-sm text-white/60 max-w-3xl">
          The Scenarios tab shows curated blueprint storyboards. This catalog is the full engine — {AUTOMATION_TRIGGER_CATALOG.length} triggers, {CONDITION_TYPES.length} condition types, {ACTION_FAMILIES.length}+ action families, and {recipes.length} one-click recipes (including lane × stage human automations).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabBtn('triggers', 'Triggers', AUTOMATION_TRIGGER_CATALOG.length)}
          {tabBtn('conditions', 'Conditions', CONDITION_TYPES.length)}
          {tabBtn('nodes', 'Flow nodes', FLOW_NODE_PALETTE.length)}
          {tabBtn('recipes', 'Recipes', recipes.length)}
        </div>
      </StudioSection>

      {tab === 'triggers' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'core', 'crm', 'partner', 'channels', 'meta'] as const).map((g) => (
              <button key={g} type="button" className={triggerGroup === g ? 'fc-button-brand' : 'fc-button-soft'} onClick={() => setTriggerGroup(g)}>
                {g === 'all' ? 'All groups' : g}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {triggers.map((t) => (
              <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-violet-200 font-bold text-sm">
                    <Zap size={14} /> {t.label}
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${t.tier === 'live' ? 'border-emerald-500/30 text-emerald-200' : 'border-amber-500/30 text-amber-200'}`}>
                    {t.tier}
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/55 leading-relaxed">{t.description}</p>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-white/35">{t.group} • {t.sample.type}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'conditions' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONDITION_TYPES.map((c) => (
            <div key={c.type} className="rounded-2xl border border-sky-400/20 bg-sky-500/5 p-4">
              <div className="inline-flex items-center gap-2 text-sky-100 font-bold text-sm">
                <Filter size={14} /> {c.label}
              </div>
              <p className="mt-2 text-xs text-white/55">{c.detail}</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'nodes' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLOW_NODE_PALETTE.map((n) => (
            <div key={n.type} className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/5 p-4">
              <div className="inline-flex items-center gap-2 text-fuchsia-100 font-bold text-sm">
                <GitBranch size={14} /> {n.label}
              </div>
              <p className="mt-2 text-xs text-white/55">{n.hint}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:col-span-2">
            <div className="text-white font-bold text-sm">Action families ({ACTION_FAMILIES.length})</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ACTION_FAMILIES.map((a) => (
                <span key={a} className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-white/55">
                  {a.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'recipes' ? (
        <div className="space-y-4">
          <input
            value={recipeQuery}
            onChange={(e) => setRecipeQuery(e.target.value)}
            placeholder="Search recipes — lane, stage, Meta, dispute, human…"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/30"
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 max-h-[640px] overflow-auto pr-1">
            {filteredRecipes.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col">
                <div className="text-white font-bold text-sm">{r.title}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-white/35">{r.category}</div>
                <p className="mt-2 text-xs text-white/55 flex-1">{r.description}</p>
                <button type="button" className="fc-button-soft mt-3 w-full" onClick={() => installRecipe(r.id)}>
                  <Play size={14} /> Install as rule
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
