import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, ShieldAlert, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { createProgramApplication } from '../data/programApplicationsRepo';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote } from '../data/leadOpsRepo';

export default function AgentsPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [linkedin, setLinkedin] = useState('');
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
        kind: 'agent',
        fullName,
        email,
        phone,
        companyName,
        roleTitle,
        website,
        socials: { instagram, tiktok, youtube, linkedin },
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
        source: 'agent',
        offer: 'agent_application',
        interest: niche.trim() || 'agent_program',
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        consentToContact: true,
      });
      addLeadNote(lead.lead.id, `Agent application submitted: ${app.id}\nCompany: ${companyName || '—'}\nWebsite: ${website || '—'}`);

      setStatus('sent');
      setStatusMsg('Application received. Our team will reach out with next steps.');
      setNotes('');
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(err?.message || 'Could not submit application.');
    }
  };

  return (
    <PageShell badge="Public" title="Agent Program" subtitle="Apply to work with Finely Cred as an Agent.">
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <a href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Home
          </a>
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

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <Users size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Application</span>
            </div>

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
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Role title</label>
                  <input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} className="fc-input" placeholder="Agent, Broker, Coach…" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Company</label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="fc-input" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Website</label>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} className="fc-input" placeholder="https://…" />
                </div>
              </div>

              <details className="rounded-2xl border border-white/10 bg-white/[0.02] p-5" open>
                <summary className="cursor-pointer select-none text-white font-semibold">Socials + reach</summary>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="fc-input" placeholder="Instagram" />
                  <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} className="fc-input" placeholder="TikTok" />
                  <input value={youtube} onChange={(e) => setYoutube(e.target.value)} className="fc-input" placeholder="YouTube" />
                  <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="fc-input" placeholder="LinkedIn" />
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
                <summary className="cursor-pointer select-none text-white font-semibold">Referral + payout</summary>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="fc-input" placeholder="Referral code (optional)" />
                  <select value={payoutPreference} onChange={(e) => setPayoutPreference(e.target.value as any)} className="fc-input">
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="zelle">Zelle</option>
                    <option value="cash_app">Cash App</option>
                    <option value="other">Other</option>
                  </select>
                  <input value={payoutHandle} onChange={(e) => setPayoutHandle(e.target.value)} className="fc-input md:col-span-2" placeholder="Payout handle (email/$cashtag/etc.)" />
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

          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Building2 size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">What happens next</span>
              </div>
              <ul className="text-white/60 text-sm space-y-2 list-disc pl-5">
                <li>We review your application and confirm the best lane and offer structure.</li>
                <li>We provision your access, assets, and operating guidelines.</li>
                <li>You start referring and tracking inside the CRM.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

