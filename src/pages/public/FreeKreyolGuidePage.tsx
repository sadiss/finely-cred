import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Download, MessageCircle, ShieldCheck } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { submitLeadCapture } from '../../data/leadsRepo';
import { HAITIAN_DESK_LIVE_PATH } from '../../lib/haitianCompanionDesk';

/**
 * Public Kreyòl unlock funnel — stays on this route (does NOT redirect to /haitian).
 */
export default function FreeKreyolGuidePage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [done, setDone] = useState(false);
  const [ref, setRef] = useState('');

  const submit = async () => {
    if (!email.includes('@') || fullName.trim().length < 2 || !consent) return;
    const res = await submitLeadCapture({
      source: 'resources',
      offer: 'general_inquiry',
      interest: 'kreyol_companion_kit_unlock',
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      consentToContact: true,
    });
    setRef(res.lead.id);
    setDone(true);
  };

  return (
    <PageShell
      badge="Kreyòl · Haitian community"
      title="Kat kit kredi — gratis"
      subtitle="Credit kits for Haitian Americans: kredi, lèt kolektè, èd fanmi, feyè legliz. Educational only — pa gen pwomès nòt."
    >
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#0b1110] to-[#060908] p-8">
          <img
            src="/brand/finely-cred-logo-dark.png"
            alt="Finely Cred"
            className="h-10 w-auto mb-3"
            width={160}
            height={40}
          />
          <p className="mt-3 text-white/75 text-sm leading-relaxed">
            Unlock the Kreyòl companion kit pack: what credit is, what the collector letter says, how family can help, and a
            simple church flyer. Letters to bureaus stay in English when needed — we explain in Kreyòl.
          </p>
        </div>

        {!done ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
            <div className="text-white font-semibold flex items-center gap-2">
              <BookOpen className="text-amber-400" size={18} /> Unlock your kit
            </div>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <label className="flex items-center gap-2 text-white/60 text-xs">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              I consent to be contacted about educational resources (not legal advice).
            </label>
            <button
              type="button"
              onClick={() => void submit()}
              className="w-full py-3 rounded-xl bg-[#fbbf24] text-[#060908] font-black uppercase tracking-widest text-xs"
            >
              <Download size={14} className="inline mr-2" /> Get kit access
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-100 text-sm space-y-3">
            <p>Reference: {ref}. Check your email for next steps.</p>
            <p className="text-white/60 text-xs">
              Kit PDFs ship via your specialist workflow — this unlock registers your interest in the Haitian desk lane.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            to={`${HAITIAN_DESK_LIVE_PATH}?lang=ht`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/30 text-emerald-200 text-sm"
          >
            <MessageCircle size={16} /> Pale Kreyòl — Haitian desk
          </Link>
          <Link to="/enlightenment-session" className="text-amber-300 text-sm underline">
            Book enlightenment session
          </Link>
        </div>

        <p className="text-white/45 text-xs flex items-start gap-2">
          <ShieldCheck size={14} className="shrink-0 mt-0.5" />
          Educational only. No guaranteed score increases, deletions, or loan approvals. Debt may remain after restore.
        </p>
      </div>
    </PageShell>
  );
}
