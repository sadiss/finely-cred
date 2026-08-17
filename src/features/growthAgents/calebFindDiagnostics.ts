/**
 * Caleb find diagnostics — surfaces why auto-find returned 0 results.
 * Search path: runMarketingDailyPack → lead-intel edge → Serper (SERPER_API_KEY on server).
 */
import { getMarketingFindLastRun, getMarketingFindReadiness } from '../marketingDesk/marketingDeskHunt';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { isCalebAutoFindEnabled } from './calebAutoFind';

export type CalebFindDiagnosticTone = 'ok' | 'warning' | 'error' | 'info';

export type CalebFindDiagnostic = {
  tone: CalebFindDiagnosticTone;
  headline: string;
  detail: string;
  fixSteps: string[];
};

function classifyError(err: string): CalebFindDiagnostic | null {
  const lower = err.toLowerCase();
  if (lower.includes('serper') || lower.includes('search api key')) {
    return {
      tone: 'error',
      headline: 'Serper search key missing on server',
      detail: err,
      fixSteps: [
        'Open Supabase → Project Settings → Edge Functions → Secrets.',
        'Add SERPER_API_KEY with your key from serper.dev.',
        'Redeploy the lead-intel function (npm run deploy:functions).',
        'Click Test search again below.',
      ],
    };
  }
  if (lower.includes('forbidden') || lower.includes('edge_admin_emails')) {
    return {
      tone: 'error',
      headline: 'Your login email is not allowlisted for lead-intel',
      detail: err,
      fixSteps: [
        'Open Supabase → Edge Functions → Secrets.',
        'Set EDGE_ADMIN_EMAILS to include your admin login email (comma-separated).',
        'Sign out and back in, then Test search again.',
      ],
    };
  }
  if (lower.includes('rate limit')) {
    return {
      tone: 'warning',
      headline: 'Search rate limit hit',
      detail: err,
      fixSteps: ['Wait a few minutes and run Test search again.', 'Daily pack fires many lane calls — stagger manual retries.'],
    };
  }
  return {
    tone: 'warning',
    headline: 'Search returned an error',
    detail: err,
    fixSteps: ['Open Supabase function logs for lead-intel.', 'Click Test search again after fixing the server config.'],
  };
}

/** Build a user-visible diagnostic from local readiness + last run state. */
export function buildCalebFindDiagnostics(): CalebFindDiagnostic | null {
  if (!isCalebAutoFindEnabled()) {
    return {
      tone: 'info',
      headline: 'Auto-find is off',
      detail: 'Turn on auto-find to run daily metro search packs.',
      fixSteps: ['Click Turn auto-find on above.'],
    };
  }

  const readiness = getMarketingFindReadiness();
  if (!readiness.ready) {
    const steps = ['Enable Marketing Desk + Lead Intel in Admin → Settings → Features.'];
    if (!isSupabaseConfigured) {
      steps.unshift('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.');
    }
    return {
      tone: 'warning',
      headline: 'Find setup incomplete',
      detail: readiness.steps.filter((s) => !s.done).map((s) => s.label).join(' · ') || 'Flags or Supabase not ready.',
      fixSteps: steps,
    };
  }

  const last = getMarketingFindLastRun();
  if (last?.errors?.[0]) {
    return classifyError(last.errors[0]);
  }

  if (last?.at && last.found === 0 && last.mode === 'daily_pack' && !last.errors?.length) {
    const skipped = last.skipped ?? 0;
    if (skipped > 0) {
      return {
        tone: 'warning',
        headline: `Search ran but ${skipped} hit(s) were filtered out`,
        detail: `Found ${last.found} raw · ${last.review ?? 0} to review · ${skipped} skipped. Open Find room for skip reasons.`,
        fixSteps: [
          'Open Marketing Desk → Find → check skip reasons.',
          'Lower junk filters only if you accept more directory noise.',
          'Click Find once now to retry manually.',
        ],
      };
    }
    return {
      tone: 'warning',
      headline: 'Search connected but returned 0 people today',
      detail: `Last run ${new Date(last.at).toLocaleString()} — Serper returned no matches for today’s metro/lane combo.`,
      fixSteps: [
        'Set a specific city in Your city for finds.',
        'Click Test search again to verify the edge connection.',
        'Click Find once now to run a fresh one-tap search.',
      ],
    };
  }

  return null;
}
