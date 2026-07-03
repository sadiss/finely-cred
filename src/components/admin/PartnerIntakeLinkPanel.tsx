import React, { useMemo, useState } from 'react';
import { ArrowRight, Copy, Link2, Mail, MessageSquare, RefreshCcw } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import { getOrCreatePartnerSetupInvite } from '../../lib/partnerInviteLinks';
import { sendInviteEmail, sendInviteSms } from '../../lib/inviteDeliveryClient';
import { canSimulateInviteDeliveryLocally, formatLocalInviteNotice } from '../../lib/inviteLocalDev';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { isFeatureEnabled } from '../../data/settingsRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type Props = {
  partner: Partner;
  compact?: boolean;
};

export function PartnerIntakeLinkPanel({ partner, compact }: Props) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<'email' | 'sms' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const deliveryEnabled = isFeatureEnabled('inviteDelivery');
  const localInviteSim = !isSupabaseConfigured && canSimulateInviteDeliveryLocally();
  const email = (partner.profile.email || '').trim();
  const phone = (partner.profile.phone || '').trim();

  const hint = useMemo(
    () =>
      'Send this link so they enter their own contact info, mailing address, and optional documents — no manual typing on your end.',
    [],
  );

  const generate = () => {
    setErr(null);
    setMsg(null);
    try {
      const inv = getOrCreatePartnerSetupInvite({
        partnerId: partner.id,
        toEmail: email || undefined,
        toPhone: phone || undefined,
      });
      setInviteUrl(inv.claimUrl);
      setMsg('Intake link ready — copy or send it to the partner.');
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Could not generate link.');
    }
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy intake link:', inviteUrl);
    }
  };

  return (
    <div className={`${finelyOsCatalogCard('emerald')} ${compact ? '!p-4' : '!p-5'} space-y-3`} data-fc-accent="emerald">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-emerald-300">
            <Link2 size={16} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Partner self-intake</span>
          </div>
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>{hint}</p>
        </div>
        <button type="button" onClick={generate} className={FINELY_OS_PRIMARY_BTN}>
          {inviteUrl ? 'Refresh link' : 'Generate link'} <RefreshCcw size={14} />
        </button>
      </div>

      {localInviteSim ? (
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY} rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2`}>
          Local dev mode: invites simulate without Supabase. Email opens a branded preview tab; SMS logs to the console.
        </div>
      ) : null}

      {err ? <div className="text-sm text-rose-300">{err}</div> : null}
      {msg && !inviteUrl ? <div className={`text-sm ${FINELY_OS_NOTICE_SUCCESS}`}>{msg}</div> : null}

      {inviteUrl ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={inviteUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 fc-input font-mono text-xs"
            />
            <button type="button" onClick={copyLink} className={FINELY_OS_SUCCESS_BTN}>
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!email || !deliveryEnabled || busy === 'email'}
              title={!email ? 'Add partner email first' : !deliveryEnabled ? 'Enable invite delivery in settings' : 'Send self-intake link email'}
              className={FINELY_OS_SECONDARY_BTN}
              onClick={async () => {
                if (!email || !inviteUrl) return;
                setBusy('email');
                setErr(null);
                try {
                  await sendInviteEmail({ toEmail: email, toName: partner.profile.fullName, claimUrl: inviteUrl, partner, mode: 'claim' });
                  setMsg(
                    localInviteSim
                      ? formatLocalInviteNotice({ ok: true, simulated: true, inviteUrl, previewOpened: true }, email)
                      : `Self-intake email sent to ${email}.`,
                  );
                } catch (e: unknown) {
                  setErr((e as Error)?.message || 'Email failed.');
                } finally {
                  setBusy(null);
                }
              }}
            >
              <Mail size={14} /> {busy === 'email' ? 'Sending…' : 'Email intake link'}
            </button>
            <button
              type="button"
              disabled={!phone || !deliveryEnabled || busy === 'sms'}
              title={!phone ? 'Add partner phone first' : !deliveryEnabled ? 'Enable invite delivery in settings' : 'Send SMS'}
              className={FINELY_OS_SECONDARY_BTN}
              onClick={async () => {
                if (!phone || !inviteUrl) return;
                setBusy('sms');
                setErr(null);
                try {
                  await sendInviteSms({ toPhone: phone, claimUrl: inviteUrl });
                  setMsg(
                    localInviteSim
                      ? `Local dev: SMS simulated to ${phone}. Message body logged in console — use the intake link above to test.`
                      : `SMS sent to ${phone}.`,
                  );
                } catch (e: unknown) {
                  setErr((e as Error)?.message || 'SMS failed.');
                } finally {
                  setBusy(null);
                }
              }}
            >
              <MessageSquare size={14} /> {busy === 'sms' ? 'Sending…' : 'Text link'}
            </button>
            <a href={inviteUrl} target="_blank" rel="noopener noreferrer" className={FINELY_OS_SECONDARY_BTN}>
              Preview <ArrowRight size={14} />
            </a>
          </div>
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Use <strong>Email intake link</strong> when you want them to submit contact info and documents through self-intake.
            Account login invites live under <strong>Access &amp; auth</strong> on Overview or Profile.
          </p>
        </div>
      ) : null}
    </div>
  );
}
