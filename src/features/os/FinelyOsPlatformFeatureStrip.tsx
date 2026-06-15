import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CreditCard,
  FileText,
  Mail,
  PenLine,
  Target,
  Users,
} from 'lucide-react';
import { FINELY_OS_CATALOG_SHELL, FINELY_OS_ENTITY_ACCENT_LINK, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE, finelyOsKpiTile } from './finelyOsLightUi';
import { FinelyOsIconBadge, type FinelyOsIconAccent } from './FinelyOsIconBadge';

const LINKS: {
  to: string;
  label: string;
  hint: string;
  icon: typeof Users;
  accent: FinelyOsIconAccent;
}[] = [
  { to: '/admin/partners', label: 'Partners hub', hint: 'Reports · letters · journey', icon: Users, accent: 'violet' },
  { to: '/admin/templates', label: 'Letter templates', hint: 'Bases + outputs', icon: PenLine, accent: 'sky' },
  { to: '/admin/comms', label: 'Comms studio', hint: 'Portal · email · SMS', icon: Mail, accent: 'fuchsia' },
  { to: '/admin/crm/referrals', label: 'Referrals', hint: 'Attribution analytics', icon: Target, accent: 'emerald' },
  { to: '/admin/billing', label: 'Billing', hint: 'Checkout + packages', icon: CreditCard, accent: 'amber' },
  { to: '/admin/products', label: 'Products', hint: 'Service catalog', icon: FileText, accent: 'rose' },
];

export function FinelyOsPlatformFeatureStrip({ compact }: { compact?: boolean }) {
  return (
    <div className={FINELY_OS_CATALOG_SHELL}>
      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-3`}>
        Finely OS 400% — platform features
      </div>
      <div className={`grid gap-2 ${compact ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'}`}>
        {LINKS.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`block transition-all hover:shadow-md ${finelyOsKpiTile(i)} p-3`}
            >
              <FinelyOsIconBadge icon={Icon} accent={item.accent} size={12} className="p-1.5 rounded-lg mb-2" />
              <div className={`text-xs ${FINELY_OS_ENTITY_VALUE}`}>{item.label}</div>
              <div className={`text-[9px] mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{item.hint}</div>
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase mt-1.5 ${FINELY_OS_ENTITY_ACCENT_LINK} no-underline`}>
                Open <ArrowRight size={8} />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
