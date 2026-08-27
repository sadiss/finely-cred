import React from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import type { Partner } from '../../domain/partners';
import { careerRoleForPartner, landingPathForPartner, serviceLabelForPartner } from '../../lib/partnerInviteRouting';
import { enterPartnerView } from '../../lib/adminPartnerViewAs';
import { canViewPartnerAsAdmin } from '../../lib/adminRolePreviewAccess';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type Props = {
  partner: Partner;
  className?: string;
};

/** Per-partner scoped preview — reuses live portal routes with partner override session. */
export function AdminPartnerPreviewControls({ partner, className }: Props) {
  const auth = useAuth();
  const navigate = useNavigate();

  const email =
    auth.user?.email ||
    ((auth.user as { user_metadata?: { email?: string } } | null)?.user_metadata?.email ?? '');

  const allowed = canViewPartnerAsAdmin({ userId: auth.user?.id, email });
  if (!allowed) return null;

  const landing = landingPathForPartner(partner);
  const service = serviceLabelForPartner(partner);
  const careerRole = careerRoleForPartner(partner);
  const partnerName = partner.profile?.fullName?.trim() || partner.profile?.email?.trim() || partner.id;

  const seeAsPartner = (newTab: boolean) => {
    enterPartnerView(partner.id, {
      path: landing || '/portal/dashboard',
      newTab,
      navigate: newTab ? undefined : navigate,
    });
  };

  return (
    <div className={className ?? `${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-200">
            <Eye size={18} aria-hidden="true" />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Partner view preview</span>
          </div>
          <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
            Walk the live portal exactly as{' '}
            <span className={FINELY_OS_ENTITY_VALUE}>{partnerName}</span> sees it — their entitlements, lane, and data.
            An unmistakable banner stays visible until you exit.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 text-sm">
        <div className={`${finelyOsCatalogCard('sky')} !p-4`} data-fc-accent="sky">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Service lane</div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{service}</div>
        </div>
        <div className={`${finelyOsCatalogCard('violet')} !p-4`} data-fc-accent="violet">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Career role</div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{careerRole}</div>
        </div>
        <div className={`${finelyOsCatalogCard('rose')} !p-4`} data-fc-accent="rose">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Landing route</div>
          <div className={`mt-1 font-mono text-xs ${FINELY_OS_ENTITY_VALUE}`}>{landing}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => seeAsPartner(false)}>
          <Eye size={16} aria-hidden="true" />
          See what this partner sees
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => seeAsPartner(true)}>
          <ExternalLink size={14} aria-hidden="true" />
          Open in new tab
        </button>
      </div>
    </div>
  );
}
