import { isFeatureEnabled } from '../../data/settingsRepo';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { loadJson, saveJson } from '../../data/localJsonStore';
import { listNurtureEnrollments } from '../../lib/nurtureEngine';

const PAUSE_KEY = 'finely.marketing_desk_mail_pause.v1';
/** Shared with marketingDeskStopOnReply — read-only here to avoid import cycles. */
const LAST_STOP_KEY = 'finely.marketing_desk_last_stop_on_reply.v1';

/** Preferred Desk sequence tiles (≤6) — plain English names. */
const DESK_SEQUENCE_TILES: Array<{ id: string; name: string }> = [
  { id: 'seq_cold_prospect', name: 'Cold' },
  { id: 'seq_inbound_nurture', name: 'Inbound welcome' },
  { id: 'seq_partner_onboard_keepwarm', name: 'Partner onboard' },
  { id: 'seq_partner_monthly_education', name: 'Partner education' },
  { id: 'seq_offer_pack', name: 'Offer' },
  { id: 'seq_booked_confirm', name: 'Booked' },
];

export type MarketingMailStatus = 'ready' | 'needs_setup' | 'paused';

export type MarketingMailChecklistItem = {
  id: string;
  label: string;
  ok: boolean | 'owner';
  detail: string;
};

export function isMarketingMailPaused(): boolean {
  return Boolean(loadJson<{ paused?: boolean }>(PAUSE_KEY, {}, 1).paused);
}

export function setMarketingMailPaused(paused: boolean) {
  saveJson(PAUSE_KEY, { paused }, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function getMarketingMailChecklist(): MarketingMailChecklistItem[] {
  const deliveryOn = isFeatureEnabled('commsDelivery');
  const supabaseOk = isSupabaseConfigured;
  return [
    {
      id: 'comms',
      label: 'Comms Delivery',
      ok: deliveryOn,
      detail: deliveryOn
        ? 'Feature flag on — native email can send.'
        : 'Turn on Comms Delivery in Admin Settings → Features.',
    },
    {
      id: 'supabase',
      label: 'Supabase',
      ok: supabaseOk,
      detail: supabaseOk
        ? 'Connected — enrollments can sync and send.'
        : 'Connect Supabase so mail can send. To-dos still work meanwhile.',
    },
    {
      id: 'cron',
      label: 'Scheduled sends',
      ok: 'owner',
      detail:
        'Owner ops: platform cron live (not dry-run) so nurture steps send. Same tick runs Find while I sleep once/day when On.',
    },
    {
      id: 'webhook',
      label: 'Stop-on-reply webhook',
      ok: 'owner',
      detail:
        'Owner ops: point SendGrid/Resend/SES at email-webhook. Events pause matching enrollments; replies create Hot reply to-dos. Not live until provider is wired.',
    },
  ];
}

function formatLastStopHint(): string | null {
  const last = loadJson<{
    at?: string;
    action?: 'reply' | 'bounce' | 'complaint';
    cancelled?: number;
  } | null>(LAST_STOP_KEY, null, 1);
  if (!last?.at) return null;
  const ageH = (Date.now() - Date.parse(last.at)) / 3600000;
  if (!Number.isFinite(ageH) || ageH > 72) return null;
  const when =
    ageH < 1
      ? 'just now'
      : ageH < 24
        ? `${Math.max(1, Math.round(ageH))}h ago`
        : `${Math.round(ageH / 24)}d ago`;
  const verb =
    last.action === 'bounce' ? 'bounce' : last.action === 'complaint' ? 'complaint' : 'reply';
  const cancelled = last.cancelled ?? 0;
  const seq =
    cancelled > 0
      ? ` · paused ${cancelled} sequence${cancelled === 1 ? '' : 's'}`
      : ' · no active sequence matched';
  return `Last auto-pause: ${verb}${seq} (${when}).`;
}

/** Honest status — Ready needs commsDelivery + Supabase; Paused is desk toggle; else Needs setup. */
export function getMarketingMailStatus(): {
  status: MarketingMailStatus;
  label: string;
  detail: string;
  activeEnrollments: number;
  sequenceTiles: Array<{ id: string; name: string; active: number }>;
  checklist: MarketingMailChecklistItem[];
  lastStopHint?: string;
} {
  const paused = isMarketingMailPaused();
  const checklist = getMarketingMailChecklist();
  const active = listNurtureEnrollments(200).filter((e) => e.status === 'active');
  const tiles = DESK_SEQUENCE_TILES.slice(0, 6).map((tile) => ({
    id: tile.id,
    name: tile.name,
    active: active.filter((e) => e.sequenceId === tile.id).length,
  }));
  const lastStopHint = formatLastStopHint() || undefined;

  if (paused) {
    return {
      status: 'paused',
      label: 'Paused',
      detail: [
        'Mail on autopilot is paused from Marketing Desk. Resume when ready. Due steps stay queued.',
        lastStopHint,
      ]
        .filter(Boolean)
        .join(' '),
      activeEnrollments: active.length,
      sequenceTiles: tiles,
      checklist,
      lastStopHint,
    };
  }

  const deliveryOn = isFeatureEnabled('commsDelivery');
  const supabaseOk = isSupabaseConfigured;
  if (!deliveryOn || !supabaseOk) {
    return {
      status: 'needs_setup',
      label: 'Needs setup',
      detail: !deliveryOn
        ? 'Turn on Comms Delivery in Admin Settings → Features. To-dos still work meanwhile.'
        : 'Connect Supabase so mail can send. To-dos still work meanwhile.',
      activeEnrollments: active.length,
      sequenceTiles: tiles,
      checklist,
      lastStopHint,
    };
  }

  return {
    status: 'ready',
    label: 'Ready',
    detail: [
      'Mail can send via Finely delivery + nurture enrollments. Owner keeps cron live (dryRun: false).',
      lastStopHint
        ? lastStopHint
        : 'Stop-on-reply pauses when provider webhook events arrive (owner wires email-webhook).',
    ]
      .filter(Boolean)
      .join(' '),
    activeEnrollments: active.length,
    sequenceTiles: tiles,
    checklist,
    lastStopHint,
  };
}
