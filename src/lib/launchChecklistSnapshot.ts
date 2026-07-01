/** Runtime launch-readiness snapshot for admin monitoring (Phase 45). */
import { isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { listAutomationRules } from '../data/automationStudioRepo';
import { PUBLIC_SEO_CATALOG, PUBLIC_SEO_PATHS } from '../data/publicSeoCatalog';
import { getDeployEnvironmentLabel } from './deployEnvironment';
import { getLastPlatformCronResult } from './platformCronStore';
import { buildOpsHealthSnapshot } from './opsHealthDashboard';
import { loadStaffRoster, listRoleCoverageGaps, listStaffOnDutyNow } from '../data/staffRoster';
import type { AgentPersonaId } from '../domain/agentPersonas';
import { PLATFORM_SOP_LIBRARY } from '../domain/platformSops';
import { TOUR_MANIFEST } from '../config/tourManifest';
import { CREDIT_MONITORING_PARTNERS, isSmartCreditPidLive } from '../config/creditMonitoringPartners';
import { finelyKnowledgeIndexStats } from './finelyKnowledgeIndex';
import { LAUNCH_ROLE_COURSES } from '../config/launchRoleCourses';

const LAUNCH_COVERAGE_ROLES: AgentPersonaId[] = [
  'finely_advisor',
  'dispute_coach',
  'processing_agent',
  'letter_ops_agent',
  'support_specialist',
  'debt_strategist',
  'appointment_setter',
  'compliance_agent',
];

export type LaunchCheckStatus = 'ok' | 'warn' | 'blocked';

export type LaunchCheckItem = {
  id: string;
  label: string;
  status: LaunchCheckStatus;
  detail: string;
};

export function buildLaunchChecklistSnapshot(): LaunchCheckItem[] {
  const rules = listAutomationRules();
  const billingRule = rules.some((r) => r.enabled && r.meta?.recipeId === 'recipe_billing_dunning');
  const winBackRule = rules.some((r) => r.enabled && r.meta?.recipeId === 'recipe_trial_win_back');
  const funnelRule = rules.some((r) => r.enabled && r.meta?.recipeId === 'recipe_funnel_nurture');
  const funnelSessionRule = rules.some((r) => r.enabled && r.meta?.recipeId === 'recipe_funnel_session_closer');
  const metaRule = rules.some((r) => r.enabled && r.meta?.recipeId === 'recipe_meta_lead_notify');
  const cron = getLastPlatformCronResult();
  const ops = buildOpsHealthSnapshot();
  const staffCount = loadStaffRoster().filter((s) => s.active).length;
  const onDutyNow = listStaffOnDutyNow().length;
  const staffGaps = listRoleCoverageGaps(LAUNCH_COVERAGE_ROLES);
  const autopilotOn = isFeatureEnabled('automationAutopilot');
  const knowledgeStats = finelyKnowledgeIndexStats();

  return [
    {
      id: 'environment',
      label: 'Deploy environment',
      status: 'ok',
      detail: getDeployEnvironmentLabel(),
    },
    {
      id: 'supabase',
      label: 'Supabase client',
      status: isSupabaseConfigured ? 'ok' : 'warn',
      detail: isSupabaseConfigured ? 'URL + anon key present' : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
    },
    {
      id: 'comms',
      label: 'Comms delivery',
      status: isFeatureEnabled('commsDelivery') ? 'ok' : 'warn',
      detail: isFeatureEnabled('commsDelivery') ? 'Live nurture + dunning email' : 'Dry run — enable commsDelivery flag',
    },
    {
      id: 'stripe',
      label: 'Stripe checkout',
      status: isFeatureEnabled('stripeEnabled') ? 'ok' : 'warn',
      detail: isFeatureEnabled('stripeEnabled')
        ? 'Paid enlightenment sessions + portal billing'
        : 'Enable stripeEnabled for public-session-checkout',
    },
    {
      id: 'automation_rules',
      label: 'Core automation recipes',
      status: billingRule && winBackRule && funnelRule && funnelSessionRule && metaRule ? 'ok' : 'warn',
      detail: `${billingRule ? 'Dunning' : 'Missing dunning'} · ${winBackRule ? 'Win-back' : 'Missing win-back'} · ${funnelRule ? 'Funnel' : 'Missing funnel'} · ${funnelSessionRule ? 'Session' : 'Missing session'} · ${metaRule ? 'Meta' : 'Missing meta'}`,
    },
    {
      id: 'seo',
      label: 'Public SEO catalog',
      status: PUBLIC_SEO_CATALOG.filter((r) => r.hasSchema).length >= 20 ? 'ok' : 'warn',
      detail: `${PUBLIC_SEO_CATALOG.length} marketing routes with JSON-LD`,
    },
    {
      id: 'cron',
      label: 'Platform cron',
      status: cron ? 'ok' : 'warn',
      detail: cron ? `Last tick ${new Date(cron.at).toLocaleString()}` : 'Open Admin → Automations to run autopilot',
    },
    {
      id: 'sitemap',
      label: 'Sitemap catalog',
      status: PUBLIC_SEO_PATHS.length >= 20 ? 'ok' : 'warn',
      detail: `${PUBLIC_SEO_PATHS.length} URLs — run npm run sitemap:generate before deploy`,
    },
    {
      id: 'server_cron',
      label: 'Server platform-cron',
      status: isSupabaseConfigured ? 'warn' : 'ok',
      detail: isSupabaseConfigured
        ? 'Deploy platform-cron + automation-runner cron_sweep — see docs/PLATFORM_CRON.md'
        : 'Local dev — browser autopilot only',
    },
    {
      id: 'voice',
      label: 'Voice prerender',
      status: 'warn',
      detail: 'Run npm run voice:prerender after Cartesia secrets — guides + ebooks + course intro lessons in catalog',
    },
    {
      id: 'funnel_conversion',
      label: 'Funnel conversion',
      status: 'ok',
      detail: 'Exit intent + inline booking + score roadmap PDF + inquiry calculator',
    },
    {
      id: 'marketing_compliance',
      label: 'Marketing compliance',
      status: 'ok',
      detail: '/unsubscribe · comms opt-out footer · PublicLegalFooter on public pages',
    },
    {
      id: 'predeploy',
      label: 'Pre-deploy gate',
      status: 'ok',
      detail: 'npm run predeploy:check before production deploy',
    },
    {
      id: 'live_setup_sync',
      label: 'LIVE_SETUP sync',
      status: 'ok',
      detail: 'LIVE_SETUP_run_all.sql rebuilt from all 18 migrations incl. server_automation_queue + work_tasks',
    },
    {
      id: 'local_dev_bootstrap',
      label: 'Local dev bootstrap',
      status: 'ok',
      detail: 'docs/LOCAL_DEV.md + npm run env:check + npm run dev → :5175',
    },
    {
      id: 'ci_predeploy_gate',
      label: 'CI pre-deploy gate',
      status: 'ok',
      detail: 'npm run ci:check in GitHub Actions — smoke + migrations + RLS without local secrets',
    },
    {
      id: 'sitewide_hub_complete',
      label: 'Sitewide hub complete',
      status: 'ok',
      detail: 'All 31 substantive portal routes on FinelyUnifiedHubLayout — npm run hub:audit',
    },
    {
      id: 'finely_os_400_complete',
      label: 'Finely OS 400% complete',
      status: 'ok',
      detail: 'Plan closure doc + deploy-manual workflow — docs/FINELY-OS-400-COMPLETE.md',
    },
    {
      id: 'sitewide_hub_wave12',
      label: 'Sitewide hub wave 12',
      status: 'ok',
      detail: 'Public bookstore + AU buyer lanes on FinelyUnifiedHubLayout — npm run public:hub:audit',
    },
    {
      id: 'production_deploy_runner',
      label: 'Production deploy runner',
      status: 'ok',
      detail: 'npm run deploy:plan (dry-run) after ci:check — npm run deploy:plan -- --execute for live',
    },
    {
      id: 'sitewide_hub_wave13',
      label: 'Sitewide hub wave 13',
      status: 'ok',
      detail: 'Business lane sub-pages + enlightenment session on FinelyUnifiedHubLayout — npm run business:hub:audit',
    },
    {
      id: 'catalog_ux_no_long_lists',
      label: 'Catalog UX — no long lists',
      status: 'ok',
      detail: 'Pricing/package surfaces use PricingPackageCatalog (grouped + paginated) — npm run catalog:audit',
    },
    {
      id: 'sitewide_hub_wave14',
      label: 'Sitewide hub wave 14',
      status: 'ok',
      detail: 'Public community lanes + role hubs + AU intake on FinelyUnifiedHubLayout — public:hub:audit + role:hub:audit',
    },
    {
      id: 'sitewide_hub_wave15',
      label: 'Sitewide hub wave 15',
      status: 'ok',
      detail: 'FAQ/checkout/legal/agency + business detail hubs + portal catalog lanes — public:hub:audit + business:hub:audit + catalog:audit',
    },
    {
      id: 'sitewide_theme_nav_wave16',
      label: 'Sitewide theme + wayfinder wave 16',
      status: 'ok',
      detail: 'Light/Dark/Auto theme toggle + simplified public nav + 4-lane wayfinder — theme:audit',
    },
    {
      id: 'sitewide_theme_portal_wave17',
      label: 'Sitewide theme + portal nav wave 17',
      status: 'ok',
      detail: 'Portal simple nav (4 lanes + paginated destinations) + app-surface light theme pass — theme:audit',
    },
    {
      id: 'sitewide_theme_admin_wave18',
      label: 'Sitewide theme + admin nav wave 18',
      status: 'ok',
      detail: 'Admin simple nav + onboarding light theme + admin hub wave (dashboard, partners, workflow) — theme:audit + admin:hub:audit',
    },
    {
      id: 'sitewide_partner_detail_wave19',
      label: 'Sitewide partner detail + CRM/leads hub wave 19',
      status: 'ok',
      detail: 'Partner detail tab lanes + paginated entity stacks + Leads OS + CRM workspace on FinelyUnifiedHubLayout — theme:audit + admin:hub:audit',
    },
    {
      id: 'sitewide_admin_ops_wave20',
      label: 'Sitewide admin ops hub wave 20',
      status: 'ok',
      detail: 'Playbooks + Comms Studio + Automation Studio + Portfolio dashboard on FinelyUnifiedHubLayout — admin:hub:audit',
    },
    {
      id: 'sitewide_light_vivid_wave21',
      label: 'Sitewide light vivid + catalog wave 21',
      status: 'ok',
      detail: 'Light theme accent pop (labels/chips/panels) + paginated entity lists (Lender Logic, Work list, Barter) — theme:audit + catalog:audit',
    },
    {
      id: 'sitewide_portal_catalog_wave22',
      label: 'Sitewide portal catalog wave 22',
      status: 'ok',
      detail: 'Portal dashboard + partner select + kanban columns + lead intel library + admin events feed — paginated stacks, no show-all scroll traps — catalog:audit',
    },
    {
      id: 'sitewide_light_glass_wave23',
      label: 'Sitewide light frosted glass wave 23',
      status: 'ok',
      detail: 'Drastic light-theme frosted glass system — aurora shell, glass tokens, site-wide surface remaps, tinted chips — theme:audit',
    },
    {
      id: 'sitewide_light_premium_wave24',
      label: 'Sitewide light premium UX wave 24',
      status: 'ok',
      detail: 'Premium light UX — typography ladder, catalog/marketing glass cards, selected states, modal scrim, hover lift, side rails — theme:audit',
    },
    {
      id: 'sitewide_light_solid_wave25',
      label: 'Sitewide light solid accent wave 25',
      status: 'ok',
      detail: 'Solid accent icons/boxes (no glow) + lane nav shows all destinations + desktop More menu — theme:audit',
    },
    {
      id: 'sitewide_obsidian_metal_wave26',
      label: 'Sitewide obsidian metallic wave 26',
      status: 'ok',
      detail: 'Theme-split secondary CTAs — obsidian black on light, silver platinum restored on dark — theme:audit',
    },
    {
      id: 'sitewide_light_appeal_wave27',
      label: 'Sitewide light appeal wave 27',
      status: 'ok',
      detail: 'Light UX — black contrast bands, pop cards, hero panels, accent lift — theme:audit',
    },
    {
      id: 'sitewide_clean_shell_wave28',
      label: 'Sitewide clean neutral shell wave 28',
      status: 'ok',
      detail: 'Remove multi-color page aurora — neutral shell gradient, clean glass panels — theme:audit',
    },
    {
      id: 'sitewide_light_pop_wave29',
      label: 'Sitewide light pop 100% wave 29',
      status: 'ok',
      detail: 'Drastic light UX — opaque glass, bold hero, hub KPIs, vivid accent cards, tab bar pop — theme:audit',
    },
    {
      id: 'sitewide_light_luxury_wave30',
      label: 'Sitewide light luxury wave 30',
      status: 'ok',
      detail: 'Wealthy ivory mesh + transparent glass — elegant multi-color depth, PageShell aurora, accent washes — theme:audit',
    },
    {
      id: 'sitewide_light_pop_surfaces_wave31',
      label: 'Sitewide light pop surfaces wave 31',
      status: 'ok',
      detail: 'Accent glow boxes, floating mesh sections, contrast band rise — fc-pop-surface sitewide — theme:audit',
    },
    {
      id: 'sitewide_light_readable_wave32',
      label: 'Sitewide light readable copy wave 32',
      status: 'ok',
      detail: 'Dark/accent text on colorful boxes and light sections — fc-light-readable — theme:audit',
    },
    {
      id: 'sitewide_light_rollout_wave33',
      label: 'Sitewide light public rollout wave 33',
      status: 'ok',
      detail: 'Landing + App.tsx mesh/contrast sections, tradeline catalog cards, affiliate band — theme:audit',
    },
    {
      id: 'sitewide_light_marketing_wave34',
      label: 'Sitewide light marketing closures wave 34',
      status: 'ok',
      detail: 'Wealth hero ivory wash, footer/final CTA platinum bands, lead magnet + testimonial catalog cards — theme:audit',
    },
    {
      id: 'sitewide_light_routes_wave35',
      label: 'Sitewide light public routes wave 35',
      status: 'ok',
      detail: 'Fundability, bookstore, checkout, free-guide funnel — catalog cards + ivory mesh fg-funnel — theme:audit',
    },
    {
      id: 'sitewide_light_hubs_wave36',
      label: 'Sitewide light public hubs wave 36',
      status: 'ok',
      detail: 'Agents, resources, AU marketplace guide, portal dashboard quick-actions — catalog cards + hub accent readable — theme:audit',
    },
    {
      id: 'sitewide_light_marketing_wave37',
      label: 'Sitewide light marketing pages wave 37',
      status: 'ok',
      detail: 'Pricing, affiliate, enlightenment session, personal credit, events, testimonials, portal partner select — catalog cards — theme:audit',
    },
    {
      id: 'sitewide_light_harmony_wave38',
      label: 'Sitewide light surface harmony wave 38',
      status: 'ok',
      detail: 'Grounded accent depth — no literal float; role hubs + AU orders on catalog cards; fc-surface-harmony — theme:audit',
    },
    {
      id: 'sitewide_light_business_wave39',
      label: 'Sitewide light business + portal wave 39',
      status: 'ok',
      detail: 'Business funding/bureaus/profile/billion-path + portal library/tradelines + personal credit polish — catalog cards — theme:audit',
    },
    {
      id: 'sitewide_light_completion_wave40',
      label: 'Sitewide light business completion wave 40',
      status: 'ok',
      detail: 'Business dashboard/vendors/disputes/documents + notifications paginated + admin products/bookstore — catalog cards — theme:audit',
    },
    {
      id: 'sitewide_light_admin_wave41',
      label: 'Sitewide light admin catalog wave 41',
      status: 'ok',
      detail: 'Admin funnel/monitoring/tenants/analytics/vendors/testimonials/integration/cms/access/settings — catalog cards + paginated stacks — theme:audit',
    },
    {
      id: 'sitewide_light_admin_workspaces_wave42',
      label: 'Sitewide light admin workspaces wave 42',
      status: 'ok',
      detail: 'Admin resources/billing/team/support/voice/calendar/automations/vault/import/nora/crm/access panels — catalog cards — theme:audit',
    },
    {
      id: 'sitewide_light_admin_studios_wave43',
      label: 'Sitewide light admin studios wave 43',
      status: 'ok',
      detail: 'Comms/media/templates/settings + ops cases AU finance parsing social — catalog cards — theme:audit',
    },
    {
      id: 'sitewide_light_portal_hubs_wave44',
      label: 'Sitewide light portal hubs wave 44',
      status: 'ok',
      detail: 'Partner dashboard/reports/billing/education/escalations/barter/checklist — catalog cards — theme:audit',
    },
    {
      id: 'sitewide_light_portal_lanes_wave45',
      label: 'Sitewide light portal lanes wave 45',
      status: 'ok',
      detail: 'Debt/disputes/documents/letters/build/calendar/checkout + partner detail — catalog cards — theme:audit',
    },
    {
      id: 'sitewide_light_public_account_wave46',
      label: 'Sitewide light public + account wave 46',
      status: 'ok',
      detail: 'Pricing/agents/resources/affiliate/checkout/account/seller/AU/business remainder — catalog cards — theme:audit',
    },
    {
      id: 'sitewide_light_components_wave47',
      label: 'Sitewide light components wave 47',
      status: 'ok',
      detail: 'Token layer + FinelyOsGlassPanel + FinelyUnifiedHubLayout + 49 component/feature panels — catalog cards — theme:audit',
    },
    {
      id: 'sitewide_light_black_silver_wave48',
      label: 'Sitewide light black/silver cards wave 48',
      status: 'ok',
      detail: 'Black primary + silver nested catalog cards on mesh/hubs/app surface — silver CTAs on black — theme:audit',
    },
    {
      id: 'sitewide_light_chrome_wave49',
      label: 'Sitewide light chrome wave 49',
      status: 'ok',
      detail: 'Ivory/silver toolbars, tabs, pagination, board shells + chrome-on-black nested — theme:audit',
    },
    {
      id: 'sitewide_light_studios_wave50',
      label: 'Sitewide light studios wave 50',
      status: 'ok',
      detail: 'Light glass panels on comms hub, letter studio, credit intel + scoped studio shells — theme:audit',
    },
    {
      id: 'sitewide_light_harmony_wave51',
      label: 'Sitewide CK harmony wave 51',
      status: 'ok',
      detail: 'No Y-lift hovers on onboarding/studios, light tooltip shells, credit intel chrome buttons — theme:audit',
    },
    {
      id: 'sitewide_light_residue_wave52',
      label: 'Sitewide light residue wave 52',
      status: 'ok',
      detail: 'Landing CK harmony, bg-white/07 glass panels, fc-panel → catalog cards — theme:audit',
    },
    {
      id: 'social_os_sop_wave53',
      label: 'Social OS SOP wave 53',
      status: 'ok',
      detail: '12+ SOP templates, weekly workflow strip, paginated SOP library, staff portrait validation — ci:check',
    },
    {
      id: 'coowner_ops_wave54',
      label: 'Co-owner ops wave 54',
      status: 'ok',
      detail: 'Executable Ruth automations, phone thread queue, validation clocks engine, staff training bridge — coowner:audit',
    },
    {
      id: 'phone_hub_wave55',
      label: 'Phone hub wave 55',
      status: 'ok',
      detail: 'Twilio inbound webhook, edge sync, voicemail → Ruth summaries, simulate inbound — phone:audit',
    },
    {
      id: 'validation_dispute_wave56',
      label: 'Validation & dispute ops wave 56',
      status: 'ok',
      detail: 'Admin validation clocks triage, dispute follow-up queue, partner one-click validation drafts, tour step MP3 — validation:audit',
    },
    {
      id: 'production_ops_wave57',
      label: 'Production ops wave 57',
      status: 'ok',
      detail: 'Twilio webhook in deploy subset, Phone Hub production checklist, launch:ops Twilio readiness — production:audit',
    },
    {
      id: 'go_live_command_wave58',
      label: 'Go-live command center wave 58',
      status: 'ok',
      detail: 'Admin go-live pillars, hub coach mic + read aloud, tour read-aloud fallback — go-live:audit',
    },
    {
      id: 'light_theme_go_live_wave59',
      label: 'Light theme go-live wave 59',
      status: 'ok',
      detail: 'Priority route spot-check panel, admin preview gating, dashboard go-live nudges — theme:go-live:audit',
    },
    {
      id: 'launch_waves_rollup_wave60',
      label: 'Launch waves rollup wave 60',
      status: 'ok',
      detail: 'Wave registry 54–60, npm run launch:waves:audit, admin go-live SOP — launch:waves:rollup:audit',
    },
    {
      id: 'launch_plan_closure_wave61',
      label: 'Launch plan code closure wave 61',
      status: 'ok',
      detail: 'Code track complete banner, production ops checklist, predeploy orchestrator — launch:plan:closure:audit',
    },
    {
      id: 'production_launch_ops_wave62',
      label: 'Production launch ops wave 62',
      status: 'ok',
      detail: 'Runtime production checklist, copy commands, Ruth summary — production:launch:audit',
    },
    {
      id: 'env_bootstrap_wave63',
      label: 'Supabase env bootstrap wave 63',
      status: 'ok',
      detail: 'In-app env bootstrap panel, dev project guide, go-live pillar link — env:bootstrap:audit',
    },
    {
      id: 'senior_qa_signoff_wave64',
      label: 'Senior QA human sign-off wave 64',
      status: 'ok',
      detail: 'Persistent QA checklist, production ops integration, Ruth summary — senior:qa:signoff:audit',
    },
    {
      id: 'deploy_go_live_wave65',
      label: 'Deploy & host go-live wave 65',
      status: 'ok',
      detail: 'SQL → functions → build → host env → feature flags — deploy:go-live:audit',
    },
    {
      id: 'launch_final_readiness_wave66',
      label: 'Launch final readiness rollup wave 66',
      status: 'ok',
      detail: 'Unified production readiness zones, Ruth summary — launch:final:readiness:audit',
    },
    {
      id: 'launch_plan_handoff_wave67',
      label: 'Launch plan handoff complete wave 67',
      status: 'ok',
      detail: 'Full closure audit stack 54–66, handoff panel — launch:handoff:audit',
    },
    {
      id: 'production_sequencer_wave68',
      label: 'Production go-live sequencer wave 68',
      status: 'ok',
      detail: 'Phased production playbook credentials→sign-off — production:sequencer:audit',
    },
    {
      id: 'production_ops_runner_wave69',
      label: 'Production ops runner wave 69 (plan sealed)',
      status: 'ok',
      detail: 'launch:production:ops terminal runner, plan seal banner — production:ops:runner:audit',
    },
    {
      id: 'launch_os_nav_wave70',
      label: 'Launch OS navigation hub wave 70',
      status: 'ok',
      detail: 'Section jump nav for all production panels — launch:os:nav:audit',
    },
    {
      id: 'ops',
      label: 'Ops health',
      status: ops.status === 'healthy' ? 'ok' : ops.status === 'degraded' ? 'warn' : 'blocked',
      detail: `${ops.status} · ${ops.adminUnread} admin unread · ${ops.billingPastDue} past due`,
    },
    {
      id: 'staff_roster',
      label: 'Staff OS roster',
      status: staffCount >= 30 ? 'ok' : 'warn',
      detail: `${staffCount} active · ${onDutyNow} on duty now · ${staffGaps.length} coverage gap(s)`,
    },
    {
      id: 'hands_free_ops',
      label: 'Hands-free autopilot',
      status: autopilotOn ? 'ok' : 'warn',
      detail: autopilotOn
        ? 'Live draft + task actions — review queues at /admin/ops-autopilot'
        : 'Enable automationAutopilot in Admin → Settings before live letter draft',
    },
    {
      id: 'staff_migration',
      label: 'Staff Supabase sync',
      status: isSupabaseConfigured ? 'warn' : 'ok',
      detail: isSupabaseConfigured
        ? 'Apply migration 20260616000000_staff_members.sql + deploy automation-runner'
        : 'Local JSON roster only — Supabase optional for multi-admin sync',
    },
    {
      id: 'marketing_staff_chat',
      label: 'Marketing staff chat',
      status: 'ok',
      detail: 'MarketingStaffChatStrip on all major public routes including checkout, legal, AU marketplace, testimonials, events, enlightenment, and 404 recovery',
    },
    {
      id: 'light_os_chrome',
      label: 'Light OS chrome tokens',
      status: 'ok',
      detail: 'Site-wide border-white/[0.08] + ring-white/[0.08]; finelyOsLightUi canonical entity tokens',
    },
    {
      id: 'work_os_depth',
      label: 'Work OS depth',
      status: 'ok',
      detail: 'Admin + portal Ctrl+K command palettes, Work AI copilot, weekly digest on Ops Inbox + portfolio',
    },
    {
      id: 'crm_os_depth',
      label: 'CRM OS depth',
      status: 'ok',
      detail: 'Sequence builder, call-time optimizer, churn scoring copilot, smart lists + routing',
    },
    {
      id: 'ops_briefing_depth',
      label: 'Ops briefing depth',
      status: 'ok',
      detail: 'Daily briefing ranks Work + CRM + automation queue + social + support + Meta inbox',
    },
    {
      id: 'social_publish_depth',
      label: 'Social publish workflow',
      status: 'ok',
      detail: 'Publish due now + compliance review queue; meta-publish-post edge when Meta connected',
    },
    {
      id: 'meta_ig_publish',
      label: 'Meta IG publish',
      status: 'ok',
      detail: 'meta-publish-post Graph API — Facebook feed + Instagram media container with default image URL',
    },
    {
      id: 'social_supabase_persistence',
      label: 'Social Supabase persistence',
      status: isSupabaseConfigured ? 'warn' : 'ok',
      detail: isSupabaseConfigured
        ? 'Apply migration 20260617000000_social_scheduled_posts.sql for server cron publish'
        : 'Local JSON queue — Supabase optional for multi-admin + 24/7 cron',
    },
    {
      id: 'server_nurture_email',
      label: 'Server nurture email',
      status: isSupabaseConfigured ? 'warn' : 'ok',
      detail: isSupabaseConfigured
        ? 'Set SMTP_FROM_EMAIL + mail API secrets — server cron sends due nurture steps'
        : 'Local browser nurture only until Supabase + outbound email configured',
    },
    {
      id: 'server_automation_rules_db',
      label: 'Server automation rules (DB)',
      status: isSupabaseConfigured ? 'warn' : 'ok',
      detail: isSupabaseConfigured
        ? 'Apply migration 20260620000000 — automation-runner executes notify_admin rules from automation_rules table'
        : 'Local JSON rules — DB server execution optional until Supabase',
    },
    {
      id: 'server_nurture_persistence',
      label: 'Server nurture persistence',
      status: isSupabaseConfigured ? 'warn' : 'ok',
      detail: isSupabaseConfigured
        ? 'Apply migration 20260619000000_nurture_automation_persistence.sql — server cron advances due enrollments'
        : 'Local JSON enrollments — Supabase optional for 24/7 nurture ticks',
    },
    {
      id: 'server_automation_cron',
      label: 'Server automation cron',
      status: isSupabaseConfigured ? 'warn' : 'ok',
      detail: isSupabaseConfigured
        ? 'Apply migration 20260618000000_platform_cron_heartbeats.sql + schedule pg_cron tick'
        : 'Local JSON automations — server sweep optional until Supabase',
    },
    {
      id: 'unified_ux_hub',
      label: 'Unified UX hub',
      status: 'ok',
      detail: 'FinelyUnifiedHubLayout + fundability hub + landing journey strip — progressive disclosure sitewide',
    },
    {
      id: 'human_automation_catalog',
      label: 'Human automation catalog',
      status: 'ok',
      detail: '40+ human-like automation recipes with persona cadence — install from Admin → Automations template library',
    },
    {
      id: 'reasons_command_hub',
      label: 'Reasons command hub',
      status: 'ok',
      detail: 'ReasonsCommandHub — library + AI rank + fundability lens in Template Library',
    },
    {
      id: 'server_automation_queue',
      label: 'Server automation queue',
      status: isSupabaseConfigured ? 'warn' : 'ok',
      detail: isSupabaseConfigured
        ? 'DB rules queue create_task (server work_tasks) + run_workflow (client drain fallback)'
        : 'Local automations only until Supabase queue migration',
    },
    {
      id: 'server_task_execution',
      label: 'Server task execution',
      status: isSupabaseConfigured ? 'warn' : 'ok',
      detail: isSupabaseConfigured
        ? 'Apply migration 20260622000000 — automation-runner executes create_task into work_tasks; client merges on boot'
        : 'Server task table + edge processor ready for deploy',
    },
    {
      id: 'ops_cron_health',
      label: 'Ops cron health panel',
      status: 'ok',
      detail: 'Ops Inbox shows platform-cron heartbeat, pg_cron schedule, and queue pending count',
    },
    {
      id: 'sitewide_hub_wave2',
      label: 'Sitewide hub wave 2',
      status: 'ok',
      detail: 'Pricing + Resources unified hubs + landing fundability trust band',
    },
    {
      id: 'reasons_os_letter_studio',
      label: 'Reasons OS Letter Studio',
      status: 'ok',
      detail: 'Letter Studio opens ReasonsCommandHub modal (AI rank + fundability lens)',
    },
    {
      id: 'sitewide_hub_wave3',
      label: 'Sitewide hub wave 3',
      status: 'ok',
      detail: 'Partner dashboard + PricingServicePage unified hubs + landing hero OS refresh',
    },
    {
      id: 'landing_hero_os_refresh',
      label: 'Landing hero OS refresh',
      status: 'ok',
      detail: 'LandingHeroOsRefreshSection — fundability KPI band after hero',
    },
    {
      id: 'human_automation_seed_expanded',
      label: 'Human automation auto-seed expanded',
      status: 'ok',
      detail: '28 core human + CRM + lane intake recipes auto-install on boot',
    },
    {
      id: 'sitewide_hub_wave4',
      label: 'Sitewide hub wave 4',
      status: 'ok',
      detail: 'Partner disputes + checklist + reports + projects unified hub tabs',
    },
    {
      id: 'portal_disputes_hub',
      label: 'Portal disputes hub',
      status: 'ok',
      detail: 'PartnerDisputesPage — overview / needs / tracked / cases tabs',
    },
    {
      id: 'portal_checklist_hub',
      label: 'Portal checklist hub',
      status: 'ok',
      detail: 'PartnerChecklistPage — checklist / score / improvements tabs',
    },
    {
      id: 'portal_reports_hub',
      label: 'Portal reports hub',
      status: 'ok',
      detail: 'PartnerReportsPage — credit intel + evidence vault unified hub',
    },
    {
      id: 'human_automation_seed_full',
      label: 'Human automation full catalog seed',
      status: 'ok',
      detail: 'All HUMAN_AUTOMATION_RECIPES auto-install on boot (40+ persona cadence recipes)',
    },
    {
      id: 'hero_fundability_cta',
      label: 'Hero fundability CTA',
      status: 'ok',
      detail: 'Landing hero primary CTA → /fundability-readiness',
    },
    {
      id: 'sitewide_hub_wave5',
      label: 'Sitewide hub wave 5',
      status: 'ok',
      detail: 'Documents vault + credit building + debt center + letters vault unified hubs',
    },
    {
      id: 'portal_documents_hub',
      label: 'Portal documents hub',
      status: 'ok',
      detail: 'PartnerDocumentsPage — upload / vault / doc intel tabs',
    },
    {
      id: 'portal_build_hub',
      label: 'Portal build hub',
      status: 'ok',
      detail: 'PartnerBuildPage — bundles / timeline / history tabs',
    },
    {
      id: 'portal_debt_hub',
      label: 'Portal debt hub',
      status: 'ok',
      detail: 'PartnerDebtPage — overview / cases / letter guides tabs',
    },
    {
      id: 'portal_letters_vault_hub',
      label: 'Portal letters vault hub',
      status: 'ok',
      detail: 'PartnerLettersVaultPage — letters + analysis reports tabs',
    },
    {
      id: 'sitewide_hub_wave6',
      label: 'Sitewide hub wave 6',
      status: 'ok',
      detail: 'Template library + calendar + identity theft + messages + admin ops unified hubs',
    },
    {
      id: 'portal_template_library_hub',
      label: 'Portal template library hub',
      status: 'ok',
      detail: 'PartnerTemplateLibraryPage — overview / vault / reasons / bases tabs',
    },
    {
      id: 'portal_calendar_hub',
      label: 'Portal calendar hub',
      status: 'ok',
      detail: 'PartnerCalendarPage — book / calendar / sessions / settings tabs',
    },
    {
      id: 'portal_identity_theft_hub',
      label: 'Portal identity theft hub',
      status: 'ok',
      detail: 'PartnerIdentityTheftPage — overview / freeze / recovery tabs',
    },
    {
      id: 'portal_messages_hub',
      label: 'Portal messages hub',
      status: 'ok',
      detail: 'PartnerMessagesPage — ai / team / meetings / guide tabs via ?hub=',
    },
    {
      id: 'admin_ops_hub',
      label: 'Admin ops hub',
      status: 'ok',
      detail: 'AdminWorkflowQueuePage — triage / tasks / crm / activity unified hub',
    },
    {
      id: 'sitewide_hub_wave7',
      label: 'Sitewide hub wave 7',
      status: 'ok',
      detail: 'Library + education + escalations + my-tasks + courses unified hubs',
    },
    {
      id: 'portal_library_hub',
      label: 'Portal library hub',
      status: 'ok',
      detail: 'PartnerLibraryPage — overview / owned / store tabs',
    },
    {
      id: 'portal_education_hub',
      label: 'Portal education hub',
      status: 'ok',
      detail: 'PartnerEducationPage — curriculum / guides / explore tabs',
    },
    {
      id: 'portal_escalations_hub',
      label: 'Portal escalations hub',
      status: 'ok',
      detail: 'PartnerEscalationsPage — submit / track / regulatory tabs',
    },
    {
      id: 'portal_mytasks_hub',
      label: 'Portal my-tasks hub',
      status: 'ok',
      detail: 'PartnerMyTasksPage — queue / overdue / projects tabs',
    },
    {
      id: 'portal_courses_hub',
      label: 'Portal courses hub',
      status: 'ok',
      detail: 'PartnerCoursesPage — catalog / progress / tips tabs',
    },
    {
      id: 'sitewide_hub_wave8',
      label: 'Sitewide hub wave 8',
      status: 'ok',
      detail: 'Billing + tradeline + wealth paths + analysis vault + barter unified hubs',
    },
    {
      id: 'portal_billing_hub',
      label: 'Portal billing hub',
      status: 'ok',
      detail: 'PartnerBillingPage — profile / billing / access / plans tabs',
    },
    {
      id: 'portal_tradeline_hub',
      label: 'Portal tradeline hub',
      status: 'ok',
      detail: 'PartnerTradelineMarketplacePage — overview / packages / after purchase tabs',
    },
    {
      id: 'portal_wealth_paths_hub',
      label: 'Portal wealth paths hub',
      status: 'ok',
      detail: 'PartnerWealthPathsPage — overview / lanes / funding ladder tabs',
    },
    {
      id: 'portal_analysis_vault_hub',
      label: 'Portal analysis vault hub',
      status: 'ok',
      detail: 'PartnerAnalysisVaultPage — overview / saved reports tabs',
    },
    {
      id: 'portal_barter_hub',
      label: 'Portal barter hub',
      status: 'ok',
      detail: 'PartnerBarterPage — market / mine / offers / agreements tabs',
    },
    {
      id: 'sitewide_hub_wave9',
      label: 'Sitewide hub wave 9',
      status: 'ok',
      detail: 'Checkout + purchase flows + project workspace + course player + dispute detail unified hubs',
    },
    {
      id: 'portal_checkout_hub',
      label: 'Portal checkout hub',
      status: 'ok',
      detail: 'PartnerCheckoutPage — catalog / package / payment tabs',
    },
    {
      id: 'portal_book_purchase_hub',
      label: 'Portal book purchase hub',
      status: 'ok',
      detail: 'PartnerBookPurchasePage — overview / unlock tabs',
    },
    {
      id: 'portal_bundle_purchase_hub',
      label: 'Portal bundle purchase hub',
      status: 'ok',
      detail: 'PartnerBundlePurchasePage — overview / unlock tabs',
    },
    {
      id: 'portal_project_workspace_hub',
      label: 'Portal project workspace hub',
      status: 'ok',
      detail: 'PartnerProjectWorkspacePage — overview / board / list / calendar tabs',
    },
    {
      id: 'portal_course_player_hub',
      label: 'Portal course player hub',
      status: 'ok',
      detail: 'PartnerCoursePage — syllabus / lesson tabs',
    },
    {
      id: 'portal_dispute_detail_hub',
      label: 'Portal dispute detail hub',
      status: 'ok',
      detail: 'PartnerDisputeDetailPage — overview / workflow / items tabs',
    },
    {
      id: 'sitewide_hub_wave10',
      label: 'Sitewide hub wave 10',
      status: 'ok',
      detail: 'Debt detail unified hub — portal detail pages complete',
    },
    {
      id: 'portal_debt_detail_hub',
      label: 'Portal debt detail hub',
      status: 'ok',
      detail: 'PartnerDebtDetailPage — overview / strategy / letters / legal tabs',
    },
    {
      id: 'sitewide_hub_wave11',
      label: 'Sitewide hub wave 11',
      status: 'ok',
      detail: 'Letter Studio unified hub — portal letters page complete',
    },
    {
      id: 'portal_letters_studio_hub',
      label: 'Portal Letter Studio hub',
      status: 'ok',
      detail: 'PartnerLettersPage — dispute / validation / court / templates tabs via FinelyUnifiedHubLayout',
    },
    {
      id: 'role_os',
      label: 'Role OS 2.0',
      status: 'ok',
      detail:
        'All 6 lanes — client, business, agent, affiliate, au_seller, au_buyer — workflow panels + live progress on hubs; admin preview uses demo progress',
    },
    {
      id: 'launch_os_sops',
      label: 'Launch OS SOP library',
      status: PLATFORM_SOP_LIBRARY.length >= 24 ? 'ok' : 'warn',
      detail: `${PLATFORM_SOP_LIBRARY.length} platform SOPs — all tour-linked · npm run launch:sops:audit`,
    },
    {
      id: 'launch_os_tours',
      label: 'Tour manifest + player',
      status: TOUR_MANIFEST.length >= 12 ? 'ok' : 'warn',
      detail: `${TOUR_MANIFEST.length} tours — FinelyTourPlayer + MP4 factory + Watch how strip`,
    },
    {
      id: 'launch_os_monitoring',
      label: 'Credit monitoring partners',
      status: CREDIT_MONITORING_PARTNERS.length >= 4 ? 'ok' : 'warn',
      detail: `${CREDIT_MONITORING_PARTNERS.length} partners on Resources + onboarding${isSmartCreditPidLive() ? ' · live SmartCredit PID set' : ' · set VITE_SMARTCREDIT_PID when affiliate URL is live'}`,
    },
    {
      id: 'launch_os_supabase_env',
      label: 'Supabase env (portal + sync)',
      status: isSupabaseConfigured ? 'ok' : 'blocked',
      detail: isSupabaseConfigured
        ? 'VITE_SUPABASE_URL + anon key present — portal auth and cloud sync enabled'
        : 'Marketing-only — edit .env.local (VITE_SUPABASE_URL + anon key) → npm run env:check → npm run launch:go-live',
    },
    {
      id: 'launch_os_start_here',
      label: 'Start Here page',
      status: 'ok',
      detail: '/start-here — fix credit, refer people, or staff login (senior-simple lanes)',
    },
    {
      id: 'launch_os_finely_brain',
      label: 'FinelyBrain local RAG',
      status: 'ok',
      detail: 'Ask Finely + context help wired to SOPs and tour manifest',
    },
    {
      id: 'launch_os_help_center',
      label: 'Launch Help Center',
      status: 'ok',
      detail: '/help-center + /admin/launch-os — searchable SOP browser + role training',
    },
    {
      id: 'launch_os_role_courses',
      label: 'Role training tracks',
      status: LAUNCH_ROLE_COURSES.length >= 6 ? 'ok' : 'warn',
      detail: `${LAUNCH_ROLE_COURSES.length} role courses — partner, affiliate, agent, admin, business, compliance`,
    },
    {
      id: 'launch_os_workspace_scroll',
      label: 'Mastery workspace scroll',
      status: 'ok',
      detail: 'Dashboard sidebar jumps to sections — all modules visible on scroll',
    },
    {
      id: 'launch_os_portal_scroll',
      label: 'Partner portal scroll',
      status: 'ok',
      detail: 'Portal dashboard scroll sections + Now-do-this strip — npm run launch:scroll:audit',
    },
    {
      id: 'launch_os_admin_scroll',
      label: 'Admin dashboard scroll',
      status: 'ok',
      detail: 'Admin overview/ops/modules on scroll + proactive strips — npm run launch:scroll:audit',
    },
    {
      id: 'launch_os_tour_factory',
      label: 'Tour factory pipeline',
      status: 'ok',
      detail: `${TOUR_MANIFEST.length} tours — npm run tour:capture:audit · tour:voice:prerender for voiced MP3s`,
    },
    {
      id: 'launch_os_proactive_strips',
      label: 'Proactive Now-do-this strips',
      status: 'ok',
      detail: '27 key routes wired — npm run launch:strips:audit',
    },
    {
      id: 'launch_os_noticed_strips',
      label: 'Finely-noticed proactive nudges',
      status: 'ok',
      detail: '26 routes + onboarding monitoring — npm run launch:noticed:audit',
    },
    {
      id: 'finely_intelligence_wave57',
      label: 'Finely Intelligence OS',
      status: knowledgeStats.total >= 25 ? 'ok' : 'warn',
      detail: `Unified RAG ${knowledgeStats.total} chunks (${knowledgeStats.bySource.sop} SOP · ${knowledgeStats.bySource.tour} tour · ${knowledgeStats.bySource.module} module · ${knowledgeStats.bySource.article} guide) · persona routing · Now-do-this + Finely-noticed proactive strips`,
    },
    {
      id: 'launch_os_senior_ux',
      label: 'Senior-simple UX (Part D)',
      status: 'ok',
      detail: 'PageShell fc-senior-simple on all routes + onboarding + workspace — npm run launch:senior:audit',
    },
    {
      id: 'launch_os_module_playbooks',
      label: 'Module playbooks (Part A3)',
      status: 'ok',
      detail: 'Admin + portal + public route guides in Help Center — npm run launch:admin-tabs:audit',
    },
    {
      id: 'launch_os_letter_agent_chain',
      label: 'Letter agent chain (Part E4)',
      status: 'ok',
      detail: 'Coach → letter ops → compliance gate before mail in MailLetterModal',
    },
    {
      id: 'launch_os_affiliate_pitch',
      label: 'Affiliate pitch helper (Part E7)',
      status: 'ok',
      detail: 'AI pitch panel on Affiliate Hub overview',
    },
    {
      id: 'launch_os_voice_concierge',
      label: 'Voice-first Ask Finely (Part E5)',
      status: 'ok',
      detail: 'Mic input + read aloud + staff chat — FinelyLaunchHelpStrip',
    },
    {
      id: 'launch_os_tour_resources',
      label: 'Tour videos on Resources',
      status: 'ok',
      detail: '17 factory tours on /resources#videos — npm run launch:tour-resources:audit',
    },
    {
      id: 'launch_os_plain_language',
      label: 'Plain-language onboarding (Part D2)',
      status: 'ok',
      detail: 'Live onboarding + portal hubs — npm run launch:plain:audit',
    },
    {
      id: 'launch_os_sprint_code_complete',
      label: 'Launch Sprint Parts A–E (code)',
      status: 'ok',
      detail: 'All automated gates pass — npm run launch:senior:qa (23 paths) · rollup: npm run launch:complete',
    },
    {
      id: 'launch_os_go_live',
      label: 'Production go-live (ops)',
      status: isSupabaseConfigured ? 'warn' : 'blocked',
      detail: isSupabaseConfigured
        ? 'npm run launch:go-live · SQL + deploy:functions + build — docs/PRODUCTION_DEPLOY.md'
        : 'Blocked on Supabase keys — npm run launch:complete passes today (23-path QA)',
    },
    {
      id: 'launch_os_ai_audit',
      label: 'AI action audit log (Part E8)',
      status: 'ok',
      detail: 'Hands-free ops audit trail + daily briefing rollup',
    },
  ];
}
