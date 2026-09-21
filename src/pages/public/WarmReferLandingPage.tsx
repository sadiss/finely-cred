import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { submitLeadCapture } from '../../data/leadsRepo';

/** `/refer` — warm referral LP (partner intros, not cold lead spam). */
export default function WarmReferLandingPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referrer, setReferrer] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!email.includes('@') || name.trim().length < 2) return;
    await submitLeadCapture({
      source: 'affiliate',
      offer: 'general_inquiry',
      fullName: name.trim(),
      email: email.trim(),
      phone: '',
      consentToContact: true,
      interest: `warm_refer_lp${referrer ? `|by:${referrer}` : ''}${note ? `|${note.slice(0, 120)}` : ''}`,
    });
    setDone(true);
  };

  return (
    <PageShell
      badge="Warm referral"
      title="Refer someone you trust"
      subtitle="Introduce a friend, client, or community member. We respond with education-first next steps — no pressure scripts."
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6 flex gap-4">
          <Users className="text-emerald-300 shrink-0" size={28} />
          <p className="text-white/75 text-sm leading-relaxed">
            Warm referrals help us prioritize consent and context. Share who you are referring and why — staff use the same CRM lane as
            Marketing HQ warm prospects.
          </p>
        </div>

        {done ? (
          <div className="rounded-2xl border border-[#fbbf24]/30 bg-[#0b1110] p-6 text-white/80 text-sm">
            Thank you. Reference saved — our team will follow up with your referral using compliant language.
          </div>
        ) : (
          <div className="rounded-2xl border border-white/15 bg-black/40 p-6 space-y-4">
            <label className="block text-sm">
              <span className="text-white/60">Your name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-[#0b1110] px-4 py-3 text-white" />
            </label>
            <label className="block text-sm">
              <span className="text-white/60">Your email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-xl border border-white/15 bg-[#0b1110] px-4 py-3 text-white" />
            </label>
            <label className="block text-sm">
              <span className="text-white/60">Who referred you? (optional)</span>
              <input value={referrer} onChange={(e) => setReferrer(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-[#0b1110] px-4 py-3 text-white" />
            </label>
            <label className="block text-sm">
              <span className="text-white/60">Context (goal, timeline)</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-white/15 bg-[#0b1110] px-4 py-3 text-white" />
            </label>
            <button type="button" onClick={() => void submit()} className="fc-button-brand w-full justify-center">
              Submit warm intro <ArrowRight size={14} />
            </button>
          </div>
        )}

        <p className="text-white/50 text-xs text-center">
          Affiliate partners: <Link to="/affiliate" className="text-[#fbbf24] underline">Affiliate program</Link> ·{' '}
          <Link to="/partners" className="text-[#fbbf24] underline">Partner hub</Link>
        </p>
      </div>
    </PageShell>
  );
}
