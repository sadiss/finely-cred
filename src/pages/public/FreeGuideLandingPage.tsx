import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, BookOpen } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { GuideCoverImage } from '../../components/public/GuideCoverImage';
import { submitLeadCapture } from '../../data/leadsRepo';

const PREVIEW_PAGES = [
  {
    id: '01',
    title: 'Page 01 — Why file accuracy matters',
    body: 'Credit restore starts with what is reportable and verifiable — not promises. We map errors, duplicates, and outdated fields before any bureau round.',
  },
  {
    id: '03',
    title: 'Page 03 — Debt gates before disputes',
    body: 'Collections and summons risk get triaged first. Skipping debt discipline creates rework and weakens dispute packages.',
  },
  {
    id: '06',
    title: 'Page 06 — Evidence vault habits',
    body: 'Label uploads, tie each dispute to one claim, and keep bureau responses in chronological order for escalation-ready files.',
  },
];

/**
 * English `/free-guide` lead magnet — separate from `/free-kreyol-guide`.
 */
export default function FreeGuideLandingPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!email.includes('@') || name.trim().length < 2) return;
    await submitLeadCapture({
      source: 'resources',
      offer: 'general_inquiry',
      interest: 'free_debt_guide_landing',
      fullName: name.trim(),
      email: email.trim(),
      phone: '',
      consentToContact: true,
    });
    setDone(true);
  };

  return (
    <PageShell
      badge="Free guide"
      title="Debt & restore readiness mini-guide"
      subtitle="Educational PDF pack — credit restore framing, not credit repair hype."
    >
      <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
        <div className="rounded-2xl border border-amber-500/30 bg-black/40 p-6">
          <GuideCoverImage
            alt="Finely Cred guide cover"
            src="/brand/finely-cred-mark.png"
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
          />
          <p className="text-center text-white/80 text-sm">Official Finely Cred medallion cover — digital guide pack</p>
          <div className="mt-6 flex items-center justify-center gap-3 text-white">
            <span className="text-white/45 line-through text-lg">$297</span>
            <span className="text-3xl font-bold text-[#fbbf24]">$0</span>
            <span className="text-white/60 text-xs uppercase tracking-widest">today</span>
          </div>
          <p className="text-center text-white/50 text-xs mt-2">Lead magnet — full program pricing is separate on /pricing</p>
        </div>

        <div className="space-y-4">
          {!done ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
              <div className="font-semibold text-white flex items-center gap-2">
                <BookOpen size={18} className="text-amber-400" /> Get the guide
              </div>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="button"
                onClick={() => void submit()}
                className="w-full py-3 rounded-xl bg-[#fbbf24] text-[#060908] font-black uppercase tracking-widest text-xs"
              >
                <Download size={14} className="inline mr-2" /> Send my guide
              </button>
            </div>
          ) : (
            <p className="text-emerald-200 text-sm rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              Thanks — check your email for download instructions.
            </p>
          )}

          <div className="space-y-3">
            {PREVIEW_PAGES.map((p) => (
              <details key={p.id} className="rounded-xl border border-white/10 bg-[#0b1110] p-4">
                <summary className="cursor-pointer text-white font-medium text-sm">{p.title}</summary>
                <p className="text-white/65 text-sm mt-3 leading-relaxed">{p.body}</p>
              </details>
            ))}
          </div>

          <p className="text-white/50 text-xs">
            Kreyòl kit? <Link to="/free-kreyol-guide" className="text-amber-300 underline">/free-kreyol-guide</Link> · Community desk:{' '}
            <Link to="/haitian" className="text-amber-300 underline">/haitian</Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
