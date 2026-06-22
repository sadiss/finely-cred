import React from 'react';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_ENTITY_ACCENT_LINK,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const FREEZE_LINKS = [
  { label: 'Equifax freeze', href: 'https://www.equifax.com/personal/credit-report-services/credit-freeze/' },
  { label: 'Experian freeze', href: 'https://www.experian.com/freeze/center.html' },
  { label: 'TransUnion freeze', href: 'https://www.transunion.com/credit-freeze' },
] as const;

const PRIVACY_LINKS = [
  { label: 'LexisNexis opt-out', href: 'https://optout.lexisnexis.com/' },
  { label: 'FTC Identity Theft Report', href: 'https://www.identitytheft.gov/' },
  { label: 'Annual Credit Report (free)', href: 'https://www.annualcreditreport.com/' },
] as const;

/** Quick bureau freeze + privacy links for admin partner profile. */
export function PartnerBureauResourcesPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-4`}>
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} className="text-sky-300" />
        <div className={FINELY_OS_ENTITY_VALUE}>Bureau freezes & resources</div>
      </div>
      {!compact ? (
        <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
          Open official freeze and opt-out pages for this partner — not just inside letter studio.
        </p>
      ) : null}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Credit bureau freezes</div>
          <ul className="mt-2 space-y-1.5">
            {FREEZE_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 ${FINELY_OS_ENTITY_ACCENT_LINK} text-sm`}
                >
                  {l.label} <ExternalLink size={12} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Privacy & identity</div>
          <ul className="mt-2 space-y-1.5">
            {PRIVACY_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 ${FINELY_OS_ENTITY_ACCENT_LINK} text-sm`}
                >
                  {l.label} <ExternalLink size={12} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
