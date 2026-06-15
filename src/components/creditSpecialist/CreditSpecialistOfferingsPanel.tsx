import React from 'react';
import { Check } from 'lucide-react';
import { CREDIT_SPECIALIST_OFFERINGS } from '../../config/creditSpecialistProgram';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const OFFERING_ACCENTS = ['violet', 'emerald', 'amber', 'sky', 'fuchsia'] as const;

type Props = {
  compact?: boolean;
  className?: string;
};

export function CreditSpecialistOfferingsPanel({ compact = false, className = '' }: Props) {
  const offerings = React.useMemo(() => {
    const dedicated = CREDIT_SPECIALIST_OFFERINGS.find((item) => item.title === 'Dedicated partnership line');
    const rest = CREDIT_SPECIALIST_OFFERINGS.filter((item) => item.title !== 'Dedicated partnership line');
    if (!dedicated) return rest;
    const contractIdx = rest.findIndex((item) => item.title.toLowerCase().includes('contracts'));
    const next = rest.slice();
    next.splice(contractIdx >= 0 ? contractIdx + 1 : 2, 0, dedicated);
    return next;
  }, []);

  return (
    <div className={`space-y-5 ${className}`}>
      <div>
        <p className={FINELY_OS_ENTITY_SUBLABEL}>What you get</p>
        <h2 className={`mt-2 text-2xl md:text-3xl font-light ${FINELY_OS_ENTITY_VALUE}`}>Full operating stack + revenue share</h2>
        <p className={`mt-2 max-w-3xl ${FINELY_OS_ENTITY_BODY}`}>
          Everything included in the Credit Specialist Program — platform, training, white-label, partnership line, and lead magnets.
        </p>
      </div>
      <div className={`grid gap-4 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        {offerings.map((item, idx) => {
          const accent = OFFERING_ACCENTS[idx % OFFERING_ACCENTS.length]!;
          const featured = item.title.toLowerCase().includes('full operating');
          return (
            <div
              key={item.title}
              className={`${finelyOsCatalogCard(accent)} !p-5 space-y-3 ${featured ? 'ring-1 ring-emerald-400/35 md:col-span-2 lg:col-span-2' : ''}`}
            >
              <div>
                <p className={FINELY_OS_ENTITY_LABEL}>{featured ? 'Featured' : 'Included'}</p>
                <div className={`mt-1 font-semibold ${featured ? 'text-xl' : 'text-lg'} ${FINELY_OS_ENTITY_VALUE}`}>{item.title}</div>
                <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>{item.description}</p>
              </div>
              {!compact ? (
                <ul className="space-y-2">
                  {item.included.map((line) => (
                    <li key={line} className={`flex items-start gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                      <Check size={14} className="mt-0.5 text-emerald-400 shrink-0" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{item.included.slice(0, 2).join(' • ')}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
