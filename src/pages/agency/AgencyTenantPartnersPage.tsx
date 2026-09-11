import React, { useEffect, useState } from 'react';
import { PartnerWorkstationFrame } from '../../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';
import { useMappedPartnerNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';
import { useAuth } from '../../auth/AuthProvider';
import { AGENCY } from '../../config/agencyPartnersProgram';
import { resolveAgencyHubAccess } from '../../lib/roleHubAccess';
import { listPartnersByTenant } from '../../data/partnersRepo';
import type { Partner } from '../../domain/partners';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';
import './agencyTenantPartners.css';

const QUEUE_ACCENTS = ['emerald', 'violet', 'fuchsia'] as const;

export default function AgencyTenantPartnersPage() {
  const auth = useAuth();
  const navigate = useMappedPartnerNavigate();
  const gate = resolveAgencyHubAccess(auth.user);
  const [rows, setRows] = useState<Partner[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const tenantId = gate.membership?.tenantId;
    if (!tenantId) return;
    void listPartnersByTenant(tenantId).then((list) => {
      setRows(list);
      setSelectedId((prev) => prev ?? list[0]?.id ?? null);
    });
  }, [gate.membership?.tenantId]);

  const selected = rows.find((p) => p.id === selectedId) ?? rows[0] ?? null;

  if (!auth.user || !gate.allowed) {
    return (
      <PartnerWorkstationFrame kind="agency-hub-workstation" badge={AGENCY.programName} title="Your partners" subtitle="Sign in to your agency tenant.">
        <div className={`${FINELY_OS_PAGE} flex flex-wrap gap-3`}>
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(AGENCY.hubPath)}>
            Agency hub
          </button>
        </div>
      </PartnerWorkstationFrame>
    );
  }

  return (
    <PartnerWorkstationFrame
      kind="agency-hub-workstation"
      badge={AGENCY.programName}
      title="Your partners"
      subtitle="Partners on this agency tenant — not the Finely admin roster."
      back={{ to: AGENCY.hubPath, label: 'Agency hub' }}
    >
      <div className={`${FINELY_OS_PAGE} w-full max-w-none space-y-6`}>
        <p className={FINELY_OS_ENTITY_BODY}>
          {rows.length ? `${rows.length} partner${rows.length === 1 ? '' : 's'} on this tenant.` : 'No partner files on this tenant yet.'}
        </p>
        <div className="fc-agency-tenant-deck">
          <div className="fc-agency-tenant-queue">
            <FinelyOsPaginatedStack
              items={rows}
              pageSize={8}
              emptyMessage="Invite or add a partner file from the hub when you are ready."
              renderItem={(p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className={finelyOsListItem(p.id === selected?.id, QUEUE_ACCENTS[i % 3])}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div className="text-lg font-extrabold">{p.profile.fullName || 'Unnamed partner'}</div>
                  <div className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                    {p.status} · {p.lane || p.primaryRoute || 'lane unset'}
                  </div>
                </button>
              )}
            />
          </div>
          <div className={`fc-agency-tenant-inspector ${finelyOsCatalogCard(selected ? 'sky' : 'violet')}`}>
            {selected ? (
              <>
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Selected file</p>
                <h2 className="mt-2 text-3xl font-extrabold">{selected.profile.fullName || 'Unnamed partner'}</h2>
                <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
                  {selected.status} · {selected.lane || selected.primaryRoute || 'lane unset'}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/portal/letters')}>
                    Open letters
                  </button>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(AGENCY.messagesDeepLink)}>
                    Agency line
                  </button>
                </div>
              </>
            ) : (
              <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>Pick a partner on the left to open the next step.</p>
            )}
          </div>
        </div>
        <FinelyOsPageFooter />
      </div>
    </PartnerWorkstationFrame>
  );
}
