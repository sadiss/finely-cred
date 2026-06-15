import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { getActiveTenant } from '../../tenancy/activeTenant';

export function EmptyState(args: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  const tenant = useMemo(() => getActiveTenant(), []);
  const artUrl = (tenant.settings.emptyStateArtUrl || '').trim();
  const logoUrl = (tenant.settings.logoUrl || '').trim();
  const brand = (tenant.settings.brandName || tenant.name || 'Finely Cred').trim();

  return (
    <div className="fc-light-glass-panel fc-light-chrome-panel p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4 min-w-0">
          <div className="shrink-0 w-14 h-14 fc-light-glass-panel fc-light-chrome-panel flex items-center justify-center overflow-hidden">
            {artUrl ? (
              <img src={artUrl} alt={brand} className="w-full h-full object-cover" />
            ) : logoUrl ? (
              <img src={logoUrl} alt={brand} className="w-full h-full object-contain p-2" />
            ) : (
              <Sparkles size={22} className="text-[color:var(--brand-primary)]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-white font-semibold">{args.title}</div>
            {args.description ? <div className="mt-1 text-white/60 text-sm">{args.description}</div> : null}
          </div>
        </div>
        {args.actions ? <div className="flex flex-wrap gap-2">{args.actions}</div> : null}
      </div>
    </div>
  );
}

