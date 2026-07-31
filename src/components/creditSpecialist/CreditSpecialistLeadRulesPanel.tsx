import React from 'react';
import { CalendarDays, Check, Gift, Users } from 'lucide-react';
import { CS_OFFER, CS_OFFER_ENTRY_RULES } from '../../config/creditSpecialistOffer';
import { CS_PUBLIC } from './creditSpecialistPublicUi';
import { finelyOsCatalogCard } from '../../features/os/finelyOsLightUi';

type Props = {
  compact?: boolean;
  className?: string;
};

export function CreditSpecialistLeadRulesPanel({ compact = false, className = '' }: Props) {
  return (
    <section className={`space-y-5 ${className}`}>
      <div className={`${finelyOsCatalogCard('amber')} !p-6 sm:!p-10 border-2 border-amber-200 space-y-6`}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className={CS_PUBLIC.sectionKicker}>Entry requirement</p>
            <h2 className={`mt-2 ${CS_PUBLIC.sectionTitle}`}>{CS_OFFER_ENTRY_RULES.headline}</h2>
            <p className={`mt-3 ${CS_PUBLIC.sectionLead}`}>{CS_OFFER_ENTRY_RULES.subline}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-2xl border-2 border-amber-300 bg-white px-5 py-4 text-center">
              <Users className="mx-auto text-amber-700" size={22} />
              <div className={`${CS_PUBLIC.statHuge} text-amber-800 mt-1`}>{CS_OFFER.minLeadsRequired}</div>
              <div className={CS_PUBLIC.statLabel}>leads minimum</div>
            </div>
            <div className="rounded-2xl border-2 border-violet-300 bg-white px-5 py-4 text-center">
              <CalendarDays className="mx-auto text-violet-700" size={22} />
              <div className={`${CS_PUBLIC.statHuge} text-violet-800 mt-1`}>{CS_OFFER.freeLeadsWindowDays}</div>
              <div className={CS_PUBLIC.statLabel}>days free leads</div>
            </div>
          </div>
        </div>

        {!compact ? (
          <div className="grid md:grid-cols-2 gap-4">
            {CS_OFFER_ENTRY_RULES.bullets.map((b) => (
              <div key={b.title} className="rounded-2xl border-2 border-slate-200 bg-white p-5 space-y-2">
                <h3 className={`${CS_PUBLIC.cardTitle} flex items-center gap-2`}>
                  <Gift size={18} className="text-amber-600 shrink-0" />
                  {b.title}
                </h3>
                <p className={CS_PUBLIC.bodySm}>{b.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            {CS_OFFER_ENTRY_RULES.bullets.map((b) => (
              <li key={b.title} className={`flex gap-2 ${CS_PUBLIC.body}`}>
                <Check size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-900">{b.title}:</strong> {b.body}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
