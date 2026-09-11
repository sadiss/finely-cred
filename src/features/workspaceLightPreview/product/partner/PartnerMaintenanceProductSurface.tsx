import React, { useMemo } from 'react';
import { Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listReportsByPartner } from '../../../../data/reportsRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerMaintenanceProductSurface.css';

function daysSince(iso?: string): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export default function PartnerMaintenanceProductSurface({
  role,
  pageId,
  partnerId,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const resolvePath = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const archetype = getWorkspaceProductArchetype('partner', pageId);

  const latest = useMemo(() => {
    if (!partnerId) return undefined;
    return listReportsByPartner(partnerId)[0];
  }, [partnerId]);

  const age = daysSince(latest?.receivedAt);
  const stale = age == null || age >= 30;

  const steps = [
    {
      title: 'Upload a current report',
      body:
        age == null
          ? 'No report on file. There is no live bureau feed — upload HTML or PDF to refresh the workspace.'
          : age >= 30
            ? `Last upload was ${age} days ago. Re-upload so disputes use what the bureaus show now.`
            : `Last upload was ${age} days ago. You are inside a healthy 30-day window.`,
      accent: 'emerald' as const,
      to: '/portal/reports',
    },
    {
      title: 'Check utilization before statement close',
      body: 'Balances print on the issuer statement date, not the due date. That is the number most models see.',
      accent: 'violet' as const,
      to: '/portal/build',
    },
    {
      title: 'Queue only factual letters',
      body: 'Cite the bureau screenshot. Skip generic delete language.',
      accent: 'sky' as const,
      to: '/portal/letters',
    },
    {
      title: 'Book a session if the file is stuck',
      body: 'A specialist can walk the next 90 days. Results vary. Not legal advice.',
      accent: 'rose' as const,
      to: '/enlightenment-session',
    },
  ];

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Restore · maintenance"
      title="Credit maintenance"
      description="Upload-based check-ins. We do not pull live bureau scores."
      accent={navItem?.accent ?? 'violet'}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon ?? Repeat}
      primaryAction={
        <ProductPagePrimaryAction
          label={stale ? 'Upload a report' : 'Open reports'}
          onClick={() => navigate(resolvePath('/portal/reports'))}
        />
      }
    >
      <div className="fc-partner-maintain">
        <div className="fc-partner-maintain-clock">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-violet-300">Days since last upload</p>
          <div className="fc-partner-maintain-days">{age == null ? '—' : age}</div>
          <p className={`mt-4 text-base ${FINELY_OS_ENTITY_BODY}`}>
            {stale
              ? 'Re-upload to keep letters and disputes tied to a current file.'
              : 'File is fresh enough for this week’s work.'}
          </p>
          <button
            type="button"
            className={`${FINELY_OS_PRIMARY_BTN} mt-6`}
            onClick={() => navigate(resolvePath('/portal/reports'))}
          >
            {stale ? 'Upload now' : 'Review file'}
          </button>
        </div>
        <div className="fc-partner-maintain-steps">
          {steps.map((step) => (
            <button
              key={step.title}
              type="button"
              className={`fc-partner-maintain-step ${finelyOsCatalogCard(step.accent)} text-left`}
              data-fc-accent={step.accent}
              onClick={() => navigate(step.to.startsWith('/portal') ? resolvePath(step.to) : step.to)}
            >
              <h2 className="text-xl font-extrabold text-white">{step.title}</h2>
              <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>{step.body}</p>
            </button>
          ))}
        </div>
      </div>
    </ProductHubScaffold>
  );
}
