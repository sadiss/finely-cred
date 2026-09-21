import React, { useState } from 'react';
import { PageShell } from '../components/layout/PageShell';
import { submitLeadCapture } from '../data/leadsRepo';

/** Partner Journey Community — waitlist only (see PARTNER-SOCIAL-BLUEPRINT.md). */
export default function PartnerCommunityWaitlistPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const join = async () => {
    const e = email.trim();
    if (!e) return;
    await submitLeadCapture({
      source: 'contact',
      offer: 'general_inquiry',
      interest: 'partner_journey_community_waitlist',
      email: e,
      fullName: 'Partner community waitlist',
      phone: '',
      consentToContact: true,
      consentEmailMarketing: true,
    });
    setDone(true);
  };

  return (
    <PageShell
      badge="Coming soon"
      title="Partner Journey Community"
      subtitle="A separate space for partners on the restore journey — not built in this release."
    >
      <div className="max-w-lg mx-auto rounded-2xl border border-white/10 bg-black/30 p-8 space-y-4">
        <p className="text-white/70 text-sm leading-relaxed">
          Finely Cred specialists train in <strong className="text-white">Specialist Lounge</strong> (admin). Partner-facing community rooms, privacy controls, and handoff from your specialist are documented in our blueprint — shipping later without disrupting the partner portal.
        </p>
        {done ? (
          <p className="text-emerald-300 text-sm">You are on the waitlist. We will email when the partner community opens.</p>
        ) : (
          <>
            <input
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="Email for waitlist"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-white/80"
            />
            <button type="button" onClick={() => void join()} className="w-full py-3 rounded-xl bg-amber-500 text-black font-bold">
              Join waitlist
            </button>
          </>
        )}
      </div>
    </PageShell>
  );
}
