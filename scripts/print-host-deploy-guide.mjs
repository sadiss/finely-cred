#!/usr/bin/env node
/**
 * Print host-specific deploy steps and env vars.
 * Usage: npm run deploy:host-guide [-- vercel|netlify|cloudflare|any]
 */
const host = (process.argv[2] || 'any').toLowerCase();

const envBlock = `# Required on static host
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key

# Recommended
VITE_SITE_URL=https://finelycred.com
VITE_SUPABASE_PRIVATE_BUCKET=pii

# Optional
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
# VITE_SMARTCREDIT_PID=your_live_pid
# VITE_SENTRY_DSN=...`;

const common = `
── Pre-deploy (local) ──
npm run launch:bundle
npm run predeploy:code

── Backend (Supabase) ──
1. Run supabase/LIVE_SETUP_run_all.sql on production project
2. npm run deploy:functions
3. Set edge secrets (TWILIO_AUTH_TOKEN, STRIPE_*, SENDGRID_*, etc.)

── Post-deploy ──
npm run post-deploy:verify -- https://your-domain.com
Manual: voice mic on /start-here · docs/SENIOR-QA-WALKTHROUGH.md
`;

console.log(`Finely Cred — deploy guide (${host})\n`);

if (host === 'vercel' || host === 'any') {
  console.log('── Vercel ──');
  console.log('1. Import repo or connect GitHub');
  console.log('2. Root directory: Tishobe/finely-cred-main');
  console.log('3. Build: npm run build · Output: dist');
console.log('4. Environment variables (Production):');
console.log('   See deploy/env.production.template in repo');
console.log(envBlock);
  console.log('5. vercel.json ships SPA rewrites + security headers');
  console.log('6. Deploy → npm run post-deploy:verify -- https://your-app.vercel.app\n');
}

if (host === 'netlify' || host === 'any') {
  console.log('── Netlify ──');
  console.log('1. New site from Git · Base: Tishobe/finely-cred-main');
  console.log('2. netlify.toml sets build + publish dist/');
  console.log('3. Site settings → Environment variables:');
  console.log(envBlock);
  console.log('4. Deploy → verify live URL\n');
}

if (host === 'cloudflare' || host === 'any') {
  console.log('── Cloudflare Pages ──');
  console.log('1. Connect repo · Build command: npm run build');
  console.log('2. Build output directory: dist');
  console.log('3. SPA: public/_redirects + public/_routes.json (in dist/)');
  console.log('4. Settings → Environment variables (Production):');
  console.log(envBlock);
  console.log('5. Deploy → verify live URL\n');
}

if (host === 'any') {
  console.log('── Any static host ──');
  console.log('npm run build → upload dist/ folder');
  console.log('Ensure SPA fallback: all routes → index.html (200)');
  console.log('Local preview: npm run start → http://127.0.0.1:8080\n');
}

console.log(common);
console.log('Full doc: docs/PRODUCTION_DEPLOY.md');
