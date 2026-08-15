import React from 'react';
import { FlaskConical } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { isDeveloperQaOnly } from '../../auth/staffIdentity';
import { FINELY_OS_NOTICE_WARN } from '../../features/os/finelyOsLightUi';

/** Persistent banner for developer QA accounts — sandbox comms + test-mode mail only. */
export function DeveloperSandboxBanner() {
  const { user } = useAuth();
  const email = (user?.email || '').trim();
  if (!email || !isDeveloperQaOnly(email)) return null;

  return (
    <div className={`${FINELY_OS_NOTICE_WARN} mb-4`} role="status">
      <div className="flex items-start gap-3">
        <FlaskConical size={18} className="text-sky-300 shrink-0 mt-0.5" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-white/90">Developer QA sandbox</p>
          <p className="text-white/65">
            Email and SMS redirect to sandbox inboxes configured on edge (`EDGE_SANDBOX_EMAIL`, `EDGE_SANDBOX_SMS`).
            Physical mail requires `MAIL_TEST_MODE` — live LetterStream sends are blocked for developer accounts.
          </p>
        </div>
      </div>
    </div>
  );
}
