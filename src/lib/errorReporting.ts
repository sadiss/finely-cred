import { supabase, isSupabaseConfigured } from './supabaseClient';

type ReportArgs = {
  message: string;
  stack?: string;
  where?: string;
  meta?: Record<string, any>;
};

let lastSentAt = 0;
let burst = 0;
let installed = false;

function nowMs() {
  return Date.now();
}

function canSend() {
  const now = nowMs();
  if (now - lastSentAt > 60_000) {
    burst = 0;
    lastSentAt = now;
  }
  burst += 1;
  return burst <= 10; // local client throttle; server also rate-limits
}

export async function reportClientError(args: ReportArgs) {
  if (!isSupabaseConfigured) return;
  if (!canSend()) return;
  try {
    await supabase.functions.invoke('report-error', {
      body: {
        message: args.message,
        stack: args.stack,
        where: args.where,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        meta: args.meta ?? undefined,
      },
    });
  } catch {
    // swallow
  }
}

export function installGlobalErrorReporting() {
  if (installed) return () => {};
  installed = true;

  const onError = (ev: ErrorEvent) => {
    const message = String(ev.message || 'Unhandled error');
    const stack = (ev.error && (ev.error as any).stack) || undefined;
    reportClientError({ message, stack, where: 'window.error' });
  };

  const onRejection = (ev: PromiseRejectionEvent) => {
    const reason = ev.reason;
    const message = reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'Unhandled rejection';
    const stack = reason instanceof Error ? reason.stack : undefined;
    reportClientError({ message: String(message || 'Unhandled rejection'), stack, where: 'window.unhandledrejection' });
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
    installed = false;
  };
}

