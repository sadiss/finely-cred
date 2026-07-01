import React from 'react';
import { Check, Layers, Sparkles } from 'lucide-react';
import { CREDIT_SPECIALIST_OFFERINGS } from '../../config/creditSpecialistProgram';
import { CS_PUBLIC } from './creditSpecialistPublicUi';
import { finelyOsCatalogCard } from '../../features/os/finelyOsLightUi';

type Props = {
  compact?: boolean;
  className?: string;
};

export function CreditSpecialistOfferingsPanel({ compact = false, className = '' }: Props) {
  const featured = CREDIT_SPECIALIST_OFFERINGS.find((item) => item.title.toLowerCase().includes('platform'));
  const stackItems = CREDIT_SPECIALIST_OFFERINGS.filter(
    (item) => item !== featured && item.title !== 'Dedicated partnership line',
  );
  const partnership = CREDIT_SPECIALIST_OFFERINGS.find((item) => item.title === 'Dedicated partnership line');

  return (
    <div className={`space-y-8 sm:space-y-10 ${className}`}>
      <header>
        <p className={CS_PUBLIC.sectionKicker}>What you get</p>
        <h2 className={`mt-2 ${CS_PUBLIC.sectionTitle}`}>Tools — not your pay %</h2>
        <p className={`mt-3 ${CS_PUBLIC.sectionLead}`}>
          Everyone gets the Finely platform. Your percentage is on the <strong>Tiers &amp; pay</strong> tab.
        </p>
      </header>

      {featured ? (
        <div className="overflow-hidden rounded-2xl border-2 border-emerald-300 shadow-lg grid lg:grid-cols-12">
          <div className="lg:col-span-5 p-8 bg-gradient-to-br from-slate-900 to-emerald-950 text-white">
            <div className="text-sm font-bold uppercase tracking-widest text-amber-300 flex items-center gap-2">
              <Layers size={18} /> All specialists
            </div>
            <h3 className="mt-4 text-2xl sm:text-3xl font-bold">{featured.title}</h3>
            <p className="mt-4 text-lg text-white/80">{featured.description}</p>
            <p className="mt-4 text-emerald-300 text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} /> Software you work in — not a pay tier
            </p>
          </div>
          <div className="lg:col-span-7 p-6 sm:p-8 bg-white">
            <ul className="grid sm:grid-cols-2 gap-3">
              {featured.included.map((line) => (
                <li key={line} className="flex gap-3 rounded-xl border-2 border-emerald-100 bg-emerald-50 p-4 text-base">
                  <Check size={20} className="text-emerald-600 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className={`grid gap-5 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-2'}`}>
        {stackItems.map((item) => (
          <div key={item.title} className={`${finelyOsCatalogCard('violet')} !p-6 sm:!p-8 border-2 space-y-3`}>
            <h3 className={CS_PUBLIC.cardTitle}>{item.title}</h3>
            <p className={CS_PUBLIC.body}>{item.description}</p>
            {!compact ? (
              <ul className="space-y-2">
                {item.included.map((line) => (
                  <li key={line} className={`flex gap-2 ${CS_PUBLIC.bodySm}`}>
                    <Check size={16} className="text-emerald-600 shrink-0 mt-1" />
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>

      {partnership && !compact ? (
        <div className={`${finelyOsCatalogCard('sky')} !p-6 sm:!p-8 border-2`}>
          <h3 className={CS_PUBLIC.cardTitle}>{partnership.title}</h3>
          <p className={`mt-2 ${CS_PUBLIC.body}`}>{partnership.description}</p>
        </div>
      ) : null}
    </div>
  );
}
