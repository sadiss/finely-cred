import React from 'react';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { BUREAU_FREEZE_LINKS, bureauLinksByGroup } from '../../lib/bureauFreezeCatalog';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_ENTITY_ACCENT_LINK,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const GROUP_LABELS: Record<string, string> = {
  credit_bureau: 'Credit bureau freezes',
  specialty: 'Specialty & supplemental bureaus',
  banking: 'Banking / checking reports',
  privacy: 'Privacy & prescreen opt-out',
  identity: 'Identity theft recovery',
};

/** Quick bureau freeze + privacy links for admin partner profile. */
export function PartnerBureauResourcesPanel({ compact = false }: { compact?: boolean }) {
  const groups = ['credit_bureau', 'specialty', 'banking', 'privacy', 'identity'] as const;

  return (
    <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-5 w-full`}>
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} className="text-sky-300" />
        <div className={FINELY_OS_ENTITY_VALUE}>Bureau freezes & resources</div>
      </div>
      {!compact ? (
        <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
          Official freeze, opt-out, and specialty consumer-report pages — Equifax, Experian, TransUnion, Innovis, SageStream, ChexSystems, and more.
        </p>
      ) : null}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map((group) => {
          const links = bureauLinksByGroup(group);
          if (!links.length) return null;
          return (
            <div key={group}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>{GROUP_LABELS[group]}</div>
              <ul className="mt-2 space-y-2">
                {links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-start gap-1.5 ${FINELY_OS_ENTITY_ACCENT_LINK} text-sm`}
                    >
                      <span>{l.label}</span>
                      <ExternalLink size={12} className="shrink-0 mt-0.5" />
                    </a>
                    {l.note ? <p className={`mt-0.5 pl-0 ${FINELY_OS_ENTITY_BODY} text-xs opacity-80`}>{l.note}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { BUREAU_FREEZE_LINKS };
