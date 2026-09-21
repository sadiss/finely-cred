import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { GuideCoverImage } from '../../components/public/GuideCoverImage';
import { submitLeadCapture } from '../../data/leadsRepo';

/** `/free-restore-wealth` — wealth + restore education funnel (not credit-repair hype). */
export default function FreeRestoreWealthPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!email.includes('@') || name.trim().length < 2) return;
    await submitLeadCapture({
      source: 'resources',
      offer: 'general_inquiry',
      interest: 'free_restore_wealth_funnel',
      fullName: name.trim(),
      email: email.trim(),
      phone: '',
      consentToContact: true,
    });
    setDone(true);
  };

  return (
    <PageShell
      badge="Restore & wealth"
      title="Free restore-to-wealth readiness kit"
      subtitle="Educational sequencing: stabilize personal file accuracy, then build lending readiness — no guaranteed scores or funding."
    >
      <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
        <div className="rounded-2xl border border-[#fbbf24]/30 bg-[#0b1110] p-6">
          <GuideCoverImage
            alt="Finely Cred wealth readiness"
            src="/brand/finely-cred-mark.png"
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
          />
          <div className="inline-flex items-center gap-2 text-[#fbbf24] text-xs font-black uppercase tracking-widest">
            <Sparkles size={14} /> Wealth tool framing
          </div>
          <p className="mt-3 text-white/75 text-sm leading-relaxed">
            This funnel mirrors our public restore guide with a wealth-builder lens: file accuracy, debt gates, documentation habits,
            and when business credit or funding packages make sense.
          </p>
          <ul className="mt-4 list-disc pl-5 text-white/70 text-sm space-y-2">
            <li>Personal restore checkpoints before aggressive apps</li>
            <li>Business credit journey preview (7-step rail)</li>
            <li>Honest disclaimers — no miracle deletions</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/free-guide" className="fc-button-soft text-xs">English debt guide</Link>
            <Link to="/start" className="fc-button-brand text-xs">Start Restore $147</Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-black/40 p-6 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-white/50">Get the PDF outline</p>
          {done ? (
            <p className="text-emerald-200 text-sm">Thanks — check your email for next steps.</p>
          ) : (
            <>
              <label className="block text-sm">
                <span className="text-white/60">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0b1110] px-4 py-3 text-white"
                />
              </label>
              <label className="block text-sm">
                <span className="text-white/60">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0b1110] px-4 py-3 text-white"
                />
              </label>
              <button type="button" onClick={() => void submit()} className="fc-button-brand w-full justify-center">
                Send kit <ArrowRight size={14} />
              </button>
            </>
          )}
          <p className="text-white/45 text-xs">
            Prefer live coaching?{' '}
            <Link to="/enlightenment-session" className="text-[#fbbf24] underline">Book a strategy session</Link>.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
