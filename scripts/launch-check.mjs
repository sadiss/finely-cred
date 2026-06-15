#!/usr/bin/env node
/**
 * Tier 294 — Launch readiness smoke (no browser).
 * Usage: npm run launch:check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const requiredPaths = [
  '.env.example',
  'README.md',
  'DEVELOPER_HANDOFF.md',
  'supabase/LIVE_SETUP_run_all.sql',
  'supabase/config.toml',
  'docs/NORA_CAPITAL_API.md',
  'docs/SOCIAL_HUB_META.md',
  'docs/PLATFORM_CRON.md',
  'docs/PRODUCTION_DEPLOY.md',
  'docs/LOCAL_DEV.md',
  'docs/FINELY-OS-400-COMPLETE.md',
  'docs/TOUR-FACTORY.md',
  'docs/TOUR-RECORDING-PLAYBOOK.md',
  'docs/LAUNCH-OS-SOP-MASTER.md',
  'docs/LAUNCH-READY-SPRINT.md',
  'docs/SENIOR-QA-WALKTHROUGH.md',
  'docs/FINELY-INTELLIGENCE-OS.md',
  'docs/AUTOMATION_STUDIO.md',
  'docs/STAFF_OS.md',
  'docs/ROLE_OS.md',
  'docs/PUBLIC_BOOKING.md',
  'data/legacy-migration/legacy-partners-export-v1.json',
  'data/voice-prerender-catalog.json',
  'scripts/production-secrets-check.mjs',
  'scripts/productionLaunchOrchestrator.mjs',
  'scripts/rls-smoke-check.mjs',
  'scripts/run-migrations.mjs',
  'scripts/generate-public-sitemap.mjs',
  'scripts/verify-production-dist.mjs',
  'scripts/launch-ready-summary.mjs',
  'scripts/validate-local-env.mjs',
  'scripts/ci-predeploy-check.mjs',
  'scripts/audit-portal-unified-hub.mjs',
  'scripts/audit-public-marketing-hub.mjs',
  'scripts/audit-business-hub.mjs',
  'scripts/production-deploy-runner.mjs',
  '.github/workflows/ci.yml',
  '.github/workflows/deploy-manual.yml',
  'public/robots.txt',
  'public/sitemap.xml',
  'public/_redirects',
  'public/_headers',
  'public/security.txt',
  'public/.well-known/security.txt',
  'public/_routes.json',
  'scripts/post-deploy-verify.mjs',
  'scripts/generate-deploy-handoff.mjs',
  'scripts/launch-handoff-pack.mjs',
  'scripts/launch-gate.mjs',
  'deploy/env.production.template',
  'scripts/validate-public-seo.mjs',
  'scripts/secrets-summary.mjs',
  'scripts/audit-signup-welcome-emails.mjs',
  'vercel.json',
  'netlify.toml',
  'scripts/deploy-supabase-functions.mjs',
  'scripts/audit-legacy-sql.mjs',
];

const requiredFunctions = [
  'claim-profile',
  'admin-list-partners',
  'meta-oauth',
  'meta-webhook',
  'voice-studio',
  'automation-runner',
  'platform-cron',
  'public-session-checkout',
  'finely-partner-api',
  'nora-capital',
  'nora-capital-webhook',
  'stripe-webhook',
  'stripe-checkout',
];

let failed = 0;

console.log('Finely Cred launch check\n');

for (const rel of requiredPaths) {
  const abs = path.join(root, rel);
  const ok = fs.existsSync(abs);
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const fnDir = path.join(root, 'supabase/functions');
for (const name of requiredFunctions) {
  const ok = fs.existsSync(path.join(fnDir, name, 'index.ts'));
  console.log(`${ok ? '✓' : '✗'} supabase/functions/${name}`);
  if (!ok) failed += 1;
}

try {
  const liveSql = fs.readFileSync(path.join(root, 'supabase/LIVE_SETUP_run_all.sql'), 'utf8');
  const hasRoleOs = liveSql.includes('20260611000001_role_os_migration_nora');
  const hasLeadCaptures = liveSql.includes('20260612000001_lead_captures_referral_columns');
  const hasLeadCapturesTable = liveSql.includes('20260614000001_lead_captures_table');
  const hasRoleOsRls = liveSql.includes('20260614000002_role_os_rls');
  const hasVoiceStudio = liveSql.includes('20260612000000_voice_studio') || liveSql.includes('voice_assets');
  const hasStaffMembers = liveSql.includes('20260616000000_staff_members') || liveSql.includes('staff_members');
  const hasSocialPosts = liveSql.includes('20260617000000_social_scheduled_posts') || liveSql.includes('social_scheduled_posts');
  const hasPlatformCron = liveSql.includes('20260618000000_platform_cron_heartbeats') || liveSql.includes('platform_cron_heartbeats');
  const hasNurturePersist = liveSql.includes('20260619000000_nurture_automation_persistence') || liveSql.includes('nurture_enrollments');
  const hasAutomationRules = liveSql.includes('20260620000000_automation_rule_runs_cron_schedule') || liveSql.includes('automation_rules');
  const hasServerQueue = liveSql.includes('20260621000000_server_automation_queue') || liveSql.includes('server_automation_queue');
  const hasWorkTasks = liveSql.includes('20260622000000_work_tasks') || liveSql.includes('work_tasks');
  console.log(`${hasRoleOs ? '✓' : '✗'} LIVE_SETUP includes role OS migration`);
  console.log(`${hasLeadCaptures ? '✓' : '✗'} LIVE_SETUP includes lead_captures referral columns`);
  console.log(`${hasLeadCapturesTable ? '✓' : '✗'} LIVE_SETUP includes lead_captures table`);
  console.log(`${hasRoleOsRls ? '✓' : '✗'} LIVE_SETUP includes role OS RLS policies`);
  console.log(`${hasVoiceStudio ? '✓' : '✗'} LIVE_SETUP includes voice studio tables`);
  console.log(`${hasStaffMembers ? '✓' : '✗'} LIVE_SETUP includes staff_members (Staff OS)`);
  console.log(`${hasSocialPosts ? '✓' : '✗'} LIVE_SETUP includes social_scheduled_posts`);
  console.log(`${hasPlatformCron ? '✓' : '✗'} LIVE_SETUP includes platform_cron_heartbeats`);
  console.log(`${hasNurturePersist ? '✓' : '✗'} LIVE_SETUP includes nurture/automation persistence`);
  console.log(`${hasAutomationRules ? '✓' : '✗'} LIVE_SETUP includes automation_rules + pg_cron schedule`);
  console.log(`${hasServerQueue ? '✓' : '✗'} LIVE_SETUP includes server_automation_queue`);
  console.log(`${hasWorkTasks ? '✓' : '✗'} LIVE_SETUP includes work_tasks`);
  if (
    !hasRoleOs ||
    !hasLeadCaptures ||
    !hasLeadCapturesTable ||
    !hasRoleOsRls ||
    !hasVoiceStudio ||
    !hasStaffMembers ||
    !hasSocialPosts ||
    !hasPlatformCron ||
    !hasNurturePersist ||
    !hasAutomationRules ||
    !hasServerQueue ||
    !hasWorkTasks
  )
    failed += 1;
} catch {
  console.log('✗ LIVE_SETUP_run_all.sql read failed');
  failed += 1;
}

try {
  const bundled = JSON.parse(fs.readFileSync(path.join(root, 'data/legacy-migration/legacy-partners-export-v1.json'), 'utf8'));
  const count = bundled.partners?.length ?? 0;
  console.log(`${count > 0 ? '✓' : '✗'} bundled legacy export partners: ${count}`);
  if (count <= 0) failed += 1;
} catch {
  console.log('✗ bundled legacy export parse failed');
  failed += 1;
}

console.log('\nVoice catalog coverage…');
const voiceCheck = spawnSync('npm', ['run', 'voice:catalog:check'], { cwd: root, shell: true, stdio: 'inherit' });
if (voiceCheck.status !== 0) failed += 1;

console.log('\nLaunch OS scroll sections…');
const scrollAudit = spawnSync('npm', ['run', 'launch:scroll:audit'], { cwd: root, shell: true, stdio: 'inherit' });
if (scrollAudit.status !== 0) failed += 1;

console.log('\nTour capture assets…');
const tourAudit = spawnSync('npm', ['run', 'tour:capture:audit'], { cwd: root, shell: true, stdio: 'inherit' });
if (tourAudit.status !== 0) failed += 1;

console.log('\nLaunch proactive strips…');
const stripsAudit = spawnSync('npm', ['run', 'launch:strips:audit'], { cwd: root, shell: true, stdio: 'inherit' });
if (stripsAudit.status !== 0) failed += 1;

console.log('\nLaunch Finely-noticed strips…');
const noticedAudit = spawnSync('npm', ['run', 'launch:noticed:audit'], { cwd: root, shell: true, stdio: 'inherit' });
if (noticedAudit.status !== 0) failed += 1;

console.log('\nLaunch SOP ↔ tour links…');
const sopsAudit = spawnSync('npm', ['run', 'launch:sops:audit'], { cwd: root, shell: true, stdio: 'inherit' });
if (sopsAudit.status !== 0) failed += 1;

console.log('\nSenior-simple UX…');
const seniorAudit = spawnSync('npm', ['run', 'launch:senior:audit'], { cwd: root, shell: true, stdio: 'inherit' });
if (seniorAudit.status !== 0) failed += 1;

console.log('\nAdmin hub tabs…');
const adminTabsAudit = spawnSync('npm', ['run', 'launch:admin-tabs:audit'], { cwd: root, shell: true, stdio: 'inherit' });
if (adminTabsAudit.status !== 0) failed += 1;

console.log('\nIntelligence OS…');
const intelAudit = spawnSync('npm', ['run', 'intel:audit'], { cwd: root, shell: true, stdio: 'inherit' });
if (intelAudit.status !== 0) failed += 1;

console.log('\nTour resources…');
const tourResAudit = spawnSync('npm', ['run', 'launch:tour-resources:audit'], { cwd: root, shell: true, stdio: 'inherit' });
if (tourResAudit.status !== 0) failed += 1;

console.log('\nPlain-language onboarding…');
const plainAudit = spawnSync('npm', ['run', 'launch:plain:audit'], { cwd: root, shell: true, stdio: 'inherit' });
if (plainAudit.status !== 0) failed += 1;

console.log('\nTour voice MP3 coverage (informational)…');
spawnSync('npm', ['run', 'tour:voice:audit'], { cwd: root, shell: true, stdio: 'inherit' });

console.log('\nPublic SEO assets…');
const seoAudit = spawnSync('npm', ['run', 'seo:check'], { cwd: root, shell: true, stdio: 'inherit' });
if (seoAudit.status !== 0) failed += 1;

console.log('\nSignup welcome emails…');
const signupEmailAudit = spawnSync('npm', ['run', 'signup:email:audit'], { cwd: root, shell: true, stdio: 'inherit' });
if (signupEmailAudit.status !== 0) failed += 1;

console.log(failed ? `\n${failed} check(s) failed.` : '\nAll launch checks passed.');
process.exit(failed ? 1 : 0);
