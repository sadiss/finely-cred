/** Landing — in-house financing / payment-plan pre-approval (public, no vendor name). */
import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, CreditCard, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FINANCING_PREAPPROVAL_PUBLIC } from '../../config/denefitsProgram';
import { startFinancingPreapprovalInterest } from '../../lib/financingPreapprovalInterest';
import { Button, Reveal, FlashyIcon } from '../ui';
import { FinelyOsComplianceStrip } from '../../features/os/FinelyOsComplianceStrip';
import {
  finelyOsCatalogCard,
  finelyOsLandingContrastSection,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
} from '../../features/os/finelyOsLightUi';

const copy = FINANCING_PREAPPROVAL_PUBLIC;

export function LandingFinancingPreapprovalSection() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const onPrimary = async () => {
    setNotice(null);
    const name = fullName.trim();
    const mail = email.trim();
    if (!name || !mail) {
      setNotice('Add your name and email so we can follow up on financing readiness.');
      return;
    }
    if (!consent) {
      setNotice('Please confirm we may contact you about financing options.');
      return;
    }
    setBusy(true);
    try {
      await startFinancingPreapprovalInterest({
        source: 'lead_magnet',
        funnelPath: '/',
        fullName: name,
        email: mail,
        phone: phone.trim(),
        consentToContact: true,
        captureLead: true,
        openApplication: true,
      });
      setNotice('Opening pre-approval — we saved your interest for follow-up.');
    } catch {
      setNotice('Could not save your interest. Opening pre-approval anyway.');
      await startFinancingPreapprovalInterest({
        funnelPath: '/',
        captureLead: false,
        openApplication: true,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id="financing-preapproval"
      className={`py-16 sm:py-20 ${finelyOsLandingContrastSection('fc-band-emerald')}`}
      data-fc-contrast-band="1"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <Reveal>
          <div className={`${finelyOsCatalogCard('emerald')} !p-6 sm:!p-8 lg:!p-10`} data-fc-accent="emerald">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-10 items-start">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300">
                  <Sparkles size={14} />
                  {copy.eyebrow}
                </div>
                <h2 className={`mt-3 text-3xl lg:text-4xl font-light ${FINELY_OS_ENTITY_VALUE}`}>
                  Payment plans that report{' '}
                  <span className="text-emerald-300 font-medium">while you build</span>
                </h2>
                <p className={`mt-3 text-sm sm:text-base leading-relaxed max-w-xl ${FINELY_OS_ENTITY_BODY}`}>
                  {copy.description}
                </p>
                <ul className="mt-5 space-y-2">
                  {copy.bullets.map((b) => (
                    <li key={b} className={`flex items-start gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 grid sm:grid-cols-2 gap-3">
                  <div className={`${finelyOsCatalogCard('sky')} !p-4`} data-fc-accent="sky">
                    <FlashyIcon icon={CreditCard} color="sky" size="sm" className="mb-2" />
                    <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Equifax-reporting contracts</div>
                    <p className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>Positive installment history as payments post.</p>
                  </div>
                  <div className={`${finelyOsCatalogCard('amber')} !p-4`} data-fc-accent="amber">
                    <FlashyIcon icon={ShieldCheck} color="amber" size="sm" className="mb-2" />
                    <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Financing readiness</div>
                    <p className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>Pre-approval first — then enroll with clarity.</p>
                  </div>
                </div>
                <FinelyOsComplianceStrip className="mt-5">{copy.compliance}</FinelyOsComplianceStrip>
              </div>

              <div className={`${finelyOsCatalogCard('violet')} !p-5 sm:!p-6 space-y-3`} data-fc-accent="violet">
                <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Start pre-approval</div>
                <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  Leave your details so Finely Cred can follow up — then continue to the financing pre-approval application.
                </p>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-white/45">Full name</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"
                    placeholder="Partner name"
                    autoComplete="name"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-white/45">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-white/45">Phone (optional)</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"
                    placeholder="(555) 000-0000"
                    autoComplete="tel"
                  />
                </label>
                <label className="flex items-start gap-2 text-xs text-white/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded border-white/20"
                  />
                  <span>I agree Finely Cred may contact me about financing readiness and related services.</span>
                </label>
                {notice ? <p className="text-xs text-emerald-200/90">{notice}</p> : null}
                <div className="flex flex-col gap-2 pt-1">
                  <Button variant="gold" size="lg" disabled={busy} onClick={() => void onPrimary()} className="w-full justify-center">
                    {busy ? 'Opening…' : copy.primaryCta} <ArrowRight size={16} />
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="platinum" size="sm" onClick={() => navigate('/enlightenment-session')}>
                      {copy.secondaryCta}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                      {copy.tertiaryCta}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
