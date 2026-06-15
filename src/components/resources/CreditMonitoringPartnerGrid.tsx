import React from 'react';
import { ExternalLink, CheckCircle2, Server } from 'lucide-react';
import {
  CREDIT_MONITORING_PARTNERS,
  type CreditMonitoringPartner,
} from '../../config/creditMonitoringPartners';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const ACCENT_CYCLE = ['fuchsia', 'violet', 'sky', 'emerald', 'amber'] as const;

type CardProps = {
  partner: CreditMonitoringPartner;
  index?: number;
  variant?: 'resources' | 'onboarding';
  synced?: boolean;
  syncing?: boolean;
  onOpen?: () => void;
};

export function CreditMonitoringPartnerCard({
  partner,
  index = 0,
  variant = 'resources',
  synced,
  syncing,
  onOpen,
}: CardProps) {
  const accent = ACCENT_CYCLE[index % ACCENT_CYCLE.length];

  if (variant === 'onboarding') {
    return (
      <a
        href={partner.href}
        target="_blank"
        rel="noreferrer"
        onClick={onOpen}
        className={`group relative block p-8 fc-light-glass-panel fc-light-chrome-panel ring-1 ring-inset ring-white/5 transition-all duration-500 cursor-pointer hover:brightness-[1.03] hover:shadow-lg text-left ${
          synced ? 'border-green-500/50 bg-green-500/10' : 'hover:border-violet-500/30'
        }`}
      >
        <div className="flex justify-between items-start mb-4">
          <Server size={32} className={synced ? 'text-green-500' : 'text-white/45 group-hover:text-fuchsia-400 transition-colors'} />
          {synced ? <CheckCircle2 size={20} className="text-green-500 shrink-0" /> : <ExternalLink size={16} className="text-white/35 group-hover:text-white/70 shrink-0" aria-hidden />}
        </div>
        <h4 className="text-xl font-light text-white mb-1">{partner.provider}</h4>
        <p className="text-sm text-white/70 font-medium mb-2">{partner.title}</p>
        <p className="text-sm text-white/55 font-light leading-relaxed mb-3">{partner.desc}</p>
        <p className="text-[10px] text-white/45 font-bold uppercase tracking-widest">
          {partner.meta}
          {partner.htmlFriendly ? ' · HTML-friendly' : ''}
        </p>
        <p className="mt-2 text-[10px] text-fuchsia-300/90 font-semibold uppercase tracking-wider">
          {synced ? 'Opened' : 'Open partner site'}
        </p>
        {syncing && !synced ? (
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-sm rounded-2xl">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}
      </a>
    );
  }

  return (
    <a
      href={partner.href}
      target="_blank"
      rel="noreferrer"
      className={`group ${finelyOsCatalogCard(accent)} hover:border-fuchsia-500/30 transition-all block !p-5`}
      data-fc-accent={accent}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{partner.title}</div>
        <ExternalLink size={14} className="opacity-45 group-hover:opacity-80 shrink-0 mt-1" />
      </div>
      <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} text-[10px]`}>{partner.provider}</div>
      <div className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>{partner.desc}</div>
      <div className={`mt-3 ${FINELY_OS_ENTITY_SUBLABEL} text-[10px]`}>
        {partner.meta}
        {partner.htmlFriendly ? ' · Best for HTML upload' : ''}
      </div>
    </a>
  );
}

type GridProps = {
  variant?: 'resources' | 'onboarding';
  synced?: boolean;
  syncing?: boolean;
  onPartnerOpened?: () => void;
  className?: string;
};

export function CreditMonitoringPartnerGrid({
  variant = 'onboarding',
  synced,
  syncing,
  onPartnerOpened,
  className = '',
}: GridProps) {
  if (variant === 'resources') {
    return (
      <FinelyOsPaginatedStack
        items={CREDIT_MONITORING_PARTNERS}
        pageSize={6}
        itemSpacingClassName={`grid md:grid-cols-2 gap-4 ${className}`}
        renderItem={(partner, idx) => (
          <CreditMonitoringPartnerCard key={partner.href} partner={partner} index={idx} variant="resources" />
        )}
      />
    );
  }

  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl ${className}`}>
      {CREDIT_MONITORING_PARTNERS.map((partner, idx) => (
        <CreditMonitoringPartnerCard
          key={partner.provider}
          partner={partner}
          index={idx}
          variant="onboarding"
          synced={synced}
          syncing={syncing}
          onOpen={onPartnerOpened}
        />
      ))}
    </div>
  );
}

export { CREDIT_MONITORING_PARTNERS };
