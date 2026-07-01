import React from 'react';
import { ArrowRight, Building2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AgencySplitBreakdown } from '../pricing/AgencySplitBreakdown';
import { AGENCY, AGENCY_ROLE_MODEL, getPublicAgencyTiers } from '../../config/agencyPartnersProgram';
import { CS_PUBLIC } from '../creditSpecialist/creditSpecialistPublicUi';
import { FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN, finelyOsCatalogCard } from '../../features/os/finelyOsLightUi';

export function AgencyPartnersCareerGuide() {
  const navigate = useNavigate();
  const tiers = getPublicAgencyTiers();

  return (
    <div className="space-y-12 sm:space-y-16">
      <header className="space-y-4">
        <p className={CS_PUBLIC.pageKicker}>Tiers &amp; pay</p>
        <h1 className={CS_PUBLIC.pageTitle}>Agency capacity &amp; revenue share</h1>
        <p className={CS_PUBLIC.pageLead}>
          Agency tiers set <strong className="text-slate-900">how many files and seats</strong> your company runs, plus
          white-label depth. Splits show while training vs when certified on your tenant.
        </p>
      </header>

      <section className={`${finelyOsCatalogCard('amber')} !p-6 sm:!p-10 border-2 border-amber-200 space-y-6`}>
        <div>
          <p className={CS_PUBLIC.sectionKicker}>Read this first</p>
          <h2 className={`mt-2 ${CS_PUBLIC.sectionTitle}`}>{AGENCY_ROLE_MODEL.headline}</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {AGENCY_ROLE_MODEL.rows.map((row, i) => (
            <div key={row.term} className="rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg font-black text-amber-800">
                  {i + 1}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{row.term}</h3>
              </div>
              <p className={CS_PUBLIC.body}>{row.meaning}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-violet-100 border-2 border-violet-200 px-5 py-4">
          <p className="text-base sm:text-lg font-semibold text-violet-950">{AGENCY_ROLE_MODEL.percentOf}</p>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className={CS_PUBLIC.sectionKicker}>Agency capacity tiers</p>
          <h2 className={`mt-2 ${CS_PUBLIC.sectionTitle}`}>Agency-only — files, seats &amp; white-label</h2>
          <p className={`mt-3 ${CS_PUBLIC.sectionLead}`}>
            Each tier adds client file limits, team seats, and branding depth — from Finely-branded training to enterprise
            white-label.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {tiers.map((tier) => (
            <div key={tier.id} className="rounded-2xl border-2 border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{tier.name}</h3>
                {tier.badge ? (
                  <span className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
                    {tier.badge}
                  </span>
                ) : null}
              </div>
              <p className={CS_PUBLIC.body}>{tier.description}</p>
              <ul className="space-y-2">
                {tier.features.slice(0, 4).map((f) => (
                  <li key={f} className={`flex gap-2 ${CS_PUBLIC.bodySm}`}>
                    <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <AgencySplitBreakdown tier={tier} variant="full" theme="light" />
              <button
                type="button"
                onClick={() => navigate(`${AGENCY.signupPath}?tier=${tier.id}`)}
                className={FINELY_OS_SECONDARY_BTN}
              >
                Start with {tier.name} <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => navigate('/pricing?tab=agency')} className={FINELY_OS_SECONDARY_BTN}>
          Full pricing comparison <ArrowRight size={16} />
        </button>
      </section>

      <section className="rounded-2xl border-2 border-slate-300 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-amber-300">Solo track</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Building2 size={28} /> Credit specialists
            </h2>
            <p className="mt-3 text-lg text-white/80">
              Not building a company yet? The specialist program is apprenticeship → certified partner on per-file revenue
              share — no tenant required.
            </p>
          </div>
          <button type="button" onClick={() => navigate('/credit-specialists')} className={FINELY_OS_PRIMARY_BTN}>
            Credit specialists <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
