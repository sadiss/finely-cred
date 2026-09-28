#!/usr/bin/env node
/**
 * Write dist/DEPLOY_HANDOFF.txt and dist/RELEASE.json for operators.
 * Usage: node scripts/generate-deploy-handoff.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readReleaseIdentity } from './releaseIdentity.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const outPath = path.join(dist, 'DEPLOY_HANDOFF.txt');
const releasePath = path.join(dist, 'RELEASE.json');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/ missing — run npm run build first');
  process.exit(1);
}

const identity = readReleaseIdentity(root);
if (identity.sha === 'UNKNOWN') {
  console.error('git SHA unavailable — refuse to write an untraceable deploy handoff');
  process.exit(1);
}

const built = fs.statSync(path.join(dist, 'index.html')).mtime.toISOString();
const liveSetup = fs.readFileSync(path.join(root, 'supabase/LIVE_SETUP_run_all.sql'), 'utf8');
const hasEvidenceProvenance = liveSetup.includes('20260821230000_evidence_provenance.sql');

const release = {
  sha: identity.sha,
  shortSha: identity.shortSha,
  branch: identity.branch,
  dirty: identity.dirty,
  generatedAt: identity.generatedAt,
  indexBuiltAt: built,
  migrationCount: identity.migrationCount,
  liveSetupIncludesEvidenceProvenance: hasEvidenceProvenance,
};

const body = `Finely Cred — deploy handoff
Generated: ${built}

RELEASE
- SHA: ${identity.sha}
- Short: ${identity.shortSha}
- Branch: ${identity.branch}
- Dirty worktree at build: ${identity.dirty ? 'yes' : 'no'}
- Migrations: ${identity.migrationCount}
- LIVE_SETUP includes 20260821230000_evidence_provenance.sql: ${hasEvidenceProvenance ? 'yes' : 'no'}

FRONTEND (this artifact)
- Upload entire dist/ folder to the production host (Bluehost document root / staging dir)
- Trace this artifact to GitHub with dist/RELEASE.json
- SPA fallback: _redirects + _routes.json included (Bluehost uses nginx/Apache rewrite, not Netlify)
- Security: _headers + security.txt + .well-known/security.txt included
- PWA: manifest.webmanifest + sw.js included

HOST ENV (Production) — template: deploy/env.production.template
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
VITE_SITE_URL=https://finelycred.com
VITE_SUPABASE_PRIVATE_BUCKET=pii

BACKEND (Supabase)
1. Prefer linked-project supabase db push for ordered migrations
2. Do not blindly re-run stale LIVE_SETUP_run_all.sql against a project that already has history
3. npm run live-setup:rebuild   (regenerate aggregate SQL after adding migrations)
4. npm run deploy:functions
5. Set edge secrets — run: npm run secrets:summary

LOCAL COMMANDS (from repo)
npm run release:parity -- --require-clean
npm run launch:handoff          operator checklist
npm run launch:go-live            after Supabase keys in .env.local
npm run post-deploy:verify -- https://your-domain.com

MANUAL QA
- Voice mic on /start-here (Chrome/Edge)
- docs/SENIOR-QA-WALKTHROUGH.md

Full guide: docs/PRODUCTION_DEPLOY.md
`;

fs.writeFileSync(outPath, body, 'utf8');
fs.writeFileSync(releasePath, `${JSON.stringify(release, null, 2)}\n`, 'utf8');
console.log(`Wrote dist/DEPLOY_HANDOFF.txt (SHA ${identity.shortSha})`);
console.log(`Wrote dist/RELEASE.json`);
