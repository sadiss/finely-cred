import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, DollarSign, ShieldAlert, Users, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { Button } from '../components/ui';
import { createProgramApplication } from '../data/programApplicationsRepo';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote } from '../data/leadOpsRepo';

export default function AffiliatePage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [audienceSize, setAudienceSize] = useState('');
  const [monthlyLeadsEstimate, setMonthlyLeadsEstimate] = useState('');
  const [niche, setNiche] = useState('');
  const [regionsServed, setRegionsServed] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [payoutPreference, setPayoutPreference] = useState<'stripe' | 'paypal' | 'zelle' | 'cash_app' | 'other'>('stripe');
  const [payoutHandle, setPayoutHandle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const canSubmit = fullName.trim().length > 1 && email.trim().includes('@') && status !== 'sending';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('sending');
    setStatusMsg(null);
    try {
      const app = createProgramApplication({
        kind: 'affiliate',
        fullName,
        email,
        phone,
        companyName,
        website,
        socials: { instagram, tiktok, youtube },
        audienceSize: audienceSize.trim() ? Number(audienceSize) : undefined,
        monthlyLeadsEstimate: monthlyLeadsEstimate.trim() ? Number(monthlyLeadsEstimate) : undefined,
        niche,
        regionsServed,
        referralCode,
        payoutPreference,
        payoutHandle,
        notes,
      });
      window.dispatchEvent(new Event('finely:store'));

      const lead = await submitLeadCapture({
        source: 'affiliate',
        offer: 'affiliate_application',
        interest: niche.trim() || 'affiliate_program',
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        consentToContact: true,
      });
      addLeadNote(lead.lead.id, `Affiliate application submitted: ${app.id}\nCompany: ${companyName || '—'}\nWebsite: ${website || '—'}`);

      setStatus('sent');
      setStatusMsg('Application received. Our team will reach out with next steps.');
      setNotes('');
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(err?.message || 'Could not submit application.');
    }
  };

  return (
    <PageShell
      badge="Public"
      title="Affiliate Program"
      subtitle="Partner with Finely Cred and earn while you help others build credit and funding readiness."
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <a href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Home
          </a>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl p-6 md:p-8 space-y-6">
          <blockquote className="text-xl text-white/70 italic leading-relaxed">
            &ldquo;The day I realized that residual income is far more profitable than chasing the next check,
            was the day my mentality shifted towards wealth.&rdquo;
          </blockquote>
          <p className="text-amber-500 font-semibold">— Sanz St Louis</p>
          <p className="text-white/40 text-sm uppercase tracking-wider">Income Built Different</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Share2 size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Share & earn</span>
            </div>
            <p className="text-white/70 text-sm">
              Refer clients to Finely Cred with your unique link. When they sign up and engage with our services,
              you earn.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <DollarSign size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Commission structure</span>
            </div>
            <p className="text-white/70 text-sm">
              Competitive payouts on qualified referrals. Details and tiers are provided when you join the program.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Users size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Who can join</span>
            </div>
            <p className="text-white/70 text-sm">
              Coaches, brokers, and anyone with an audience that benefits from credit education and funding readiness.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-white/80 font-semibold">Affiliate application</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>

          {statusMsg ? (
            <div
              className={`rounded-2xl border p-4 text-sm ${
                status === 'sent'
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                  : status === 'error'
                    ? 'border-amber-500/25 bg-amber-500/10 text-amber-100'
                    : 'border-white/10 bg-black/30 text-white/70'
              }`}
            >
              <div className="inline-flex items-center gap-2 font-semibold">
                {status === 'sent' ? <BadgeCheck size={16} /> : <ShieldAlert size={16} />}
                <span>{statusMsg}</span>
              </div>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={submit}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="fc-input" required />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="fc-input" required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="fc-input" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Company (optional)</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="fc-input" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Website (optional)</label>
                <input value={website} onChange={(e) => setWebsite(e.target.value)} className="fc-input" placeholder="https://…" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Referral code (optional)</label>
                <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="fc-input" />
              </div>
            </div>

            <details className="rounded-2xl border border-white/10 bg-white/[0.02] p-5" open>
              <summary className="cursor-pointer select-none text-white font-semibold">Socials + reach</summary>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="fc-input" placeholder="Instagram" />
                <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} className="fc-input" placeholder="TikTok" />
                <input value={youtube} onChange={(e) => setYoutube(e.target.value)} className="fc-input" placeholder="YouTube" />
                <input value={audienceSize} onChange={(e) => setAudienceSize(e.target.value.replace(/[^\d]/g, ''))} className="fc-input" placeholder="Audience size (approx)" />
                <input value={monthlyLeadsEstimate} onChange={(e) => setMonthlyLeadsEstimate(e.target.value.replace(/[^\d]/g, ''))} className="fc-input" placeholder="Monthly leads estimate" />
              </div>
            </details>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Niche</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)} className="fc-input" placeholder="Credit, funding, real estate…" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Regions served</label>
                <input value={regionsServed} onChange={(e) => setRegionsServed(e.target.value)} className="fc-input" placeholder="States / cities / remote" />
              </div>
            </div>

            <details className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <summary className="cursor-pointer select-none text-white font-semibold">Payout preference</summary>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <select value={payoutPreference} onChange={(e) => setPayoutPreference(e.target.value as any)} className="fc-input">
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="zelle">Zelle</option>
                  <option value="cash_app">Cash App</option>
                  <option value="other">Other</option>
                </select>
                <input value={payoutHandle} onChange={(e) => setPayoutHandle(e.target.value)} className="fc-input" placeholder="Payout handle (email/$cashtag/etc.)" />
              </div>
            </details>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white/80 text-sm resize-y" />
            </div>

            <button type="submit" disabled={!canSubmit} className="fc-button-brand w-full disabled:opacity-60 disabled:cursor-not-allowed">
              {status === 'sending' ? 'Submitting…' : 'Submit application'} <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
