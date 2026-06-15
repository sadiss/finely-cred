import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import { FinelyOsAutomationCatalog } from './FinelyOsAutomationCatalog';
import { FinelyOsPlatformFeatureStrip } from './FinelyOsPlatformFeatureStrip';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE, finelyOsGlassShell } from './finelyOsLightUi';
import { FinelyOsIconBadge } from './FinelyOsIconBadge';
import { resolveFinelyOsPageFooterVariant, type FinelyOsPageFooterVariant } from './finelyOsPageFooterConfig';

type Props = {
  variant?: FinelyOsPageFooterVariant;
  defaultOpen?: boolean;
};

export function FinelyOsPageFooter({ variant, defaultOpen = false }: Props) {
  const { pathname } = useLocation();
  const resolved = variant ?? resolveFinelyOsPageFooterVariant(pathname);

  if (resolved === 'hidden') return null;

  const summaryLabel = resolved === 'hub' ? 'Finely OS hub links' : 'Finely OS quick links';
  const summaryHint =
    resolved === 'hub'
      ? 'Collapsed platform navigation — expand when needed'
      : 'Platform + automation cross-navigation';

  return (
    <details className={`group ${finelyOsGlassShell('catalog', 'violet')}`} {...(defaultOpen ? { open: true } : {})}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-3">
          <FinelyOsIconBadge icon={LayoutGrid} accent="violet" size={14} className="p-2" />
          <div>
            <div className={`text-sm ${FINELY_OS_ENTITY_VALUE}`}>{summaryLabel}</div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{summaryHint}</div>
          </div>
        </div>
        <ChevronDown size={18} className="text-white/40 transition-transform group-open:rotate-180" />
      </summary>
      <div className={`mt-4 space-y-3 border-t border-white/[0.08] pt-4 ${FINELY_OS_ENTITY_BODY}`}>
        <FinelyOsPlatformFeatureStrip compact />
        {resolved === 'leaf' ? <FinelyOsAutomationCatalog compact /> : null}
      </div>
    </details>
  );
}
