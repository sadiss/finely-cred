#!/usr/bin/env node
/**
 * Write dist/DEPLOY_HANDOFF.txt for operators (included in deploy artifact).
 * Usage: node scripts/generate-deploy-handoff.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const outPath = path.join(dist, 'DEPLOY_HANDOFF.txt');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/ missing — run npm run build first');
  process.exit(1);
}

const built = fs.statSync(path.join(dist, 'index.html')).mtime.toISOString();
const body = `Finely Cred — deploy handoff
Generated: ${built}

FRONTEND (this artifact)
- Upload entire dist/ folder to Vercel, Netlify, or Cloudflare Pages
- SPA fallback: _redirects + _routes.json included
- Security: _headers + security.txt + .well-known/security.txt included
- PWA: manifest.webmanifest + sw.js included

HOST ENV (Production) — template: deploy/env.production.template
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
VITE_SITE_URL=https://finelycred.com
VITE_SUPABASE_PRIVATE_BUCKET=pii

BACKEND (Supabase)
1. Run supabase/LIVE_SETUP_run_all.sql on target project
2. npm run deploy:functions
3. Set edge secrets — run: npm run secrets:summary

LOCAL COMMANDS (from repo)
npm run launch:handoff          operator checklist
npm run launch:go-live            after Supabase keys in .env.local
npm run post-deploy:verify -- https://your-domain.com

MANUAL QA
- Voice mic on /start-here (Chrome/Edge)
- docs/SENIOR-QA-WALKTHROUGH.md

Full guide: docs/PRODUCTION_DEPLOY.md
`;

fs.writeFileSync(outPath, body, 'utf8');
console.log(`Wrote dist/DEPLOY_HANDOFF.txt`);
