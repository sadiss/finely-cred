/**
 * Admin go-live command center — runtime pillar checks (client-side).
 */

import { isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isLightThemePublicEnabled } from './finelyThemeAccess';
import { getPhoneProductionChecks, isPhoneProductionReady } from './phoneProductionOps';
import { listOpenValidationClocks } from './validationLetterEngine';
import { listDisputeOpsAttentionRows } from './disputeOpsSummary';
import { getLightThemeGoLiveReadiness } from './lightThemeGoLiveOps';
import { summarizeLaunchWavesForCoOwner } from './launchWaveRegistry';

export type GoLivePillar = {
  id: string;
  label: string;
  ok: boolean;
  tone: 'ok' | 'warn' | 'blocked';
  hint: string;
  actionLabel?: string;
  actionPath?: string;
};

function speechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition) && Boolean(window.speechSynthesis);
}

export function getGoLivePillars(): GoLivePillar[] {
  const phoneChecks = getPhoneProductionChecks();
  const phoneReady = isPhoneProductionReady();
  const validationClocks = listOpenValidationClocks().length;
  const disputeFollowUps = listDisputeOpsAttentionRows().length;
  const lightPublic = isLightThemePublicEnabled();
  const lightReadiness = getLightThemeGoLiveReadiness();

  return [
    {
      id: 'code_gates',
      label: 'Launch Sprint code (Parts A–E)',
      ok: true,
      tone: 'ok',
      hint: 'npm run launch:code — waves 54–69 sealed · npm run launch:production:ops · CODE TRACK COMPLETE',
      actionLabel: 'Launch OS',
      actionPath: '/admin/launch-os',
    },
    {
      id: 'supabase',
      label: 'Supabase keys configured',
      ok: isSupabaseConfigured,
      tone: isSupabaseConfigured ? 'ok' : 'blocked',
      hint: isSupabaseConfigured
        ? 'Portal auth, edge functions, and cloud sync available.'
        : 'Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env.local',
      actionLabel: 'Env bootstrap',
      actionPath: '/admin/launch-os#env-bootstrap',
    },
    {
      id: 'phone_twilio',
      label: 'Phone Hub + Twilio production',
      ok: phoneReady,
      tone: phoneReady ? 'ok' : isSupabaseConfigured ? 'warn' : 'blocked',
      hint: phoneReady
        ? 'Webhook URL ready — deploy functions + set TWILIO_AUTH_TOKEN secret.'
        : `${phoneChecks.filter((c) => !c.ok).length} phone checklist item(s) open.`,
      actionLabel: 'Phone Hub',
      actionPath: '/admin/phone-hub',
    },
    {
      id: 'validation_ops',
      label: 'Validation & dispute triage',
      ok: validationClocks === 0 && disputeFollowUps === 0,
      tone: validationClocks + disputeFollowUps > 0 ? 'warn' : 'ok',
      hint:
        validationClocks + disputeFollowUps > 0
          ? `${validationClocks} clock(s) · ${disputeFollowUps} dispute follow-up(s) — review before launch week.`
          : 'No urgent validation clocks or dispute follow-ups in local store.',
      actionLabel: 'Ops queue',
      actionPath: '/admin/workflow',
    },
    {
      id: 'light_theme',
      label: 'Light theme public rollout',
      ok: lightPublic,
      tone: lightPublic ? 'ok' : 'warn',
      hint: lightReadiness.hint,
      actionLabel: 'Appearance',
      actionPath: '/admin/settings?tab=appearance',
    },
    {
      id: 'voice_concierge',
      label: 'Voice concierge (browser STT/TTS)',
      ok: speechSupported(),
      tone: speechSupported() ? 'ok' : 'warn',
      hint: speechSupported()
        ? 'Mic + read aloud available in Ask Finely and tour player (Chrome/Edge recommended).'
        : 'Use Chrome or Edge for mic input and read-aloud.',
    },
    {
      id: 'comms_live',
      label: 'Comms delivery (live SMS/email)',
      ok: isFeatureEnabled('commsDelivery'),
      tone: isFeatureEnabled('commsDelivery') ? 'ok' : 'warn',
      hint: isFeatureEnabled('commsDelivery')
        ? 'Outbound comms enabled — verify Twilio/from numbers before blast.'
        : 'Dry-run mode — enable commsDelivery when ready for live send.',
      actionLabel: 'Settings',
      actionPath: '/admin/settings?tab=features',
    },
    {
      id: 'tour_voice',
      label: 'Voiced tour MP3s (optional)',
      ok: false,
      tone: 'warn',
      hint: 'npm run tour:voice:prerender -- --all after Cartesia secrets — player falls back to browser read-aloud.',
      actionLabel: 'Tour Studio',
      actionPath: '/admin/tour-studio',
    },
  ];
}

export function summarizeGoLiveForCoOwner(): string {
  const pillars = getGoLivePillars();
  const open = pillars.filter((p) => !p.ok && p.id !== 'tour_voice');
  const lines = pillars.map((p) => `- [${p.tone.toUpperCase()}] ${p.label}: ${p.hint}`);
  return [
    `Go-live pillars (${open.length} need attention excluding optional tours):`,
    ...lines,
    '',
    summarizeLaunchWavesForCoOwner(),
    'Commands: npm run launch:ops · npm run launch:waves:audit · npm run launch:go-live · npm run deploy:functions',
  ].join('\n');
}
