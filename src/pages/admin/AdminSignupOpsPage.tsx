import React from 'react';
import { KeyRound, Mail, Shield, UserPlus } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsSectionTitle } from '../../features/os/FinelyOsIconBadge';
import { SIGNUP_ROLE_GUIDES } from '../../lib/signupOpsGuide';
import { isFeatureEnabled } from '../../data/settingsRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

export default function AdminSignupOpsPage() {
  const commsOn = isFeatureEnabled('commsDelivery');
  const inviteOn = isFeatureEnabled('inviteDelivery');

  return (
    <PageShell title="Signup & access ops" subtitle="How passwords, welcome emails, and role routing work">
      <div className="space-y-6 max-w-5xl">
        <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-4`}>
          <FinelyOsSectionTitle icon={UserPlus} label="Onboard someone in 3 steps" accent="emerald" />
          <ol className={`space-y-3 ${FINELY_OS_ENTITY_BODY} list-decimal pl-5`}>
            <li>
              <strong className={FINELY_OS_ENTITY_VALUE}>Admin → Partners → Create Partner</strong> — enter name, email, lane, and role route.
            </li>
            <li>
              Copy the <strong className={FINELY_OS_ENTITY_VALUE}>claim link</strong> (or send via Invite delivery). They open it, set their own password, and complete profile — you never set or email a password for them.
            </li>
            <li>
              After first login, open their card under <strong className={FINELY_OS_ENTITY_VALUE}>Partners</strong> to see onboarding progress, documents, and credit reports. Use <strong className={FINELY_OS_ENTITY_VALUE}>Access & auth → Send reset link</strong> if they forget their password.
            </li>
          </ol>
          <div className="flex flex-wrap gap-2 pt-1">
            <a href="/admin/partners" className={FINELY_OS_PRIMARY_BTN}>
              Open Partners list
            </a>
            <a href="/admin/partner-import" className={FINELY_OS_SECONDARY_BTN}>
              Bulk import
            </a>
          </div>
        </div>

        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
          <FinelyOsSectionTitle icon={Shield} label="Quick answers" accent="violet" />
          <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY} list-disc pl-5`}>
            <li>
              <strong className={FINELY_OS_ENTITY_VALUE}>Passwords are never auto-generated.</strong> Every self-serve signup chooses a password on the last onboarding step (Profile & account, min 8 characters).
            </li>
            <li>
              If Supabase email confirmation is enabled, users must confirm via Supabase’s email before first login. Welcome email from Finely sends after partner record creation (usually first successful session).
            </li>
            <li>
              <strong className={FINELY_OS_ENTITY_VALUE}>Admin password reset</strong> = send Supabase reset link from Partner detail → Access & auth, or user uses /forgot-password.
            </li>
            <li>
              Admin-created partners without a claim link stay unclaimed until the user signs up with the same email or opens a claim invite.
            </li>
          </ul>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className={`${finelyOsCatalogCard('emerald')} !p-4 flex items-center gap-3`}>
            <Mail size={18} className="text-emerald-300 shrink-0" />
            <div>
              <div className={FINELY_OS_ENTITY_VALUE}>Comms delivery</div>
              <div className={FINELY_OS_ENTITY_BODY}>{commsOn ? 'ON — welcome emails can send' : 'OFF — enable in Settings → Feature flags'}</div>
            </div>
          </div>
          <div className={`${finelyOsCatalogCard('sky')} !p-4 flex items-center gap-3`}>
            <UserPlus size={18} className="text-sky-300 shrink-0" />
            <div>
              <div className={FINELY_OS_ENTITY_VALUE}>Invite delivery</div>
              <div className={FINELY_OS_ENTITY_BODY}>{inviteOn ? 'ON — claim invites via email/SMS' : 'OFF — generate links manually'}</div>
            </div>
          </div>
        </div>

        {!commsOn ? (
          <div className={FINELY_OS_NOTICE_WARN}>
            Welcome emails will not send until Comms delivery is enabled and SendGrid secrets are configured on the edge functions.
          </div>
        ) : null}

        <div className="space-y-4">
          <FinelyOsSectionTitle icon={KeyRound} label="By role" accent="fuchsia" />
          {SIGNUP_ROLE_GUIDES.map((g) => (
            <div key={g.id} className={`${finelyOsCatalogCard('fuchsia')} !p-5 space-y-2`}>
              <div className={`text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{g.label}</div>
              <div className={`text-xs font-mono opacity-80 ${FINELY_OS_ENTITY_BODY}`}>Signup: {g.signupPath}</div>
              <div className={`text-xs font-mono opacity-80 ${FINELY_OS_ENTITY_BODY}`}>Landing: {g.postAuthHome}</div>
              <p className={FINELY_OS_ENTITY_BODY}>{g.passwordSetup}</p>
              <p className={FINELY_OS_ENTITY_BODY}>{g.welcomeEmail}</p>
              <p className={FINELY_OS_ENTITY_BODY}>{g.adminReset}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
