import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Gavel, Scale, ShieldAlert } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';
import { useMappedAdminNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';
import { DisputeCaseWorkflowPanel } from '../../components/disputes/DisputeCaseWorkflowPanel';
import { useAuth } from '../../auth/AuthProvider';
import { getCase } from '../../data/casesRepo';
import { listPartnersByTenant } from '../../data/partnersRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { ActionLink, Button } from '../../components/ui';
import { bureauShortCode } from '../../utils/bureaus';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
} from '../../features/os/finelyOsLightUi';

type AdminCaseDetailPageProps = AdminEmbeddablePageProps & { caseId?: string };

export default function AdminCaseDetailPage({ embedded = false, caseId: caseIdProp }: AdminCaseDetailPageProps = {}) {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const id = caseIdProp || routeId || searchParams.get('caseId') || undefined;
  const navigate = useMappedAdminNavigate();
  const auth = useAuth();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const disputeCase = useMemo(() => (id ? getCase(id) : null), [id, version]);
  const [partnerName, setPartnerName] = useState('Partner');

  useEffect(() => {
    const u = auth.user;
    if (!u || !disputeCase) return;
    const tenantId = getActiveTenantId();
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then(async (allowed) => {
      const all = await listPartnersByTenant(tenantId);
      const p = all.find((x) => x.id === disputeCase.partnerId && allowed.has(x.id));
      if (p) setPartnerName(p.profile.fullName || p.profile.email || 'Partner');
    });
  }, [auth.user, disputeCase]);

  if (!disputeCase) {
    return (
      <AdminWorkstationFrame embedded={embedded} kind="case-detail-workstation" badge="Admin" title="Case not found" subtitle="This dispute case does not exist.">
        <ActionLink to="/admin/cases" icon={<ArrowLeft size={16} />}>
          Back to cases
        </ActionLink>
      </AdminWorkstationFrame>
    );
  }

  return (
    <AdminWorkstationFrame embedded={embedded} kind="case-detail-workstation"
      badge="Admin"
      title={`${bureauShortCode(disputeCase.bureau)} • ${disputeCase.title}`}
      subtitle={`Collaborative workflow for ${partnerName} — rounds, complaints, and team messaging.`}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <ActionLink to="/admin/cases" icon={<ArrowLeft size={16} />}>
              Cases
            </ActionLink>
            <ActionLink to="/admin/dispute-collaboration" icon={<Scale size={16} />}>
              Complaints inbox
            </ActionLink>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/partners/${disputeCase.partnerId}`)}>
              View partner <ArrowRight size={14} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/support')}>
              Partner conversations
            </Button>
          </div>
        </div>

        <div className={`${finelyOsCatalogCard('violet')} inline-flex items-center gap-2`} data-fc-accent="violet">
          <Gavel size={16} className="text-violet-600" />
          <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>{disputeCase.status}</span>
          <span className="text-slate-300">•</span>
          <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono ${FINELY_OS_ENTITY_VALUE}`}>{disputeCase.id}</span>
        </div>

        <DisputeCaseWorkflowPanel caseId={disputeCase.id} partnerId={disputeCase.partnerId} mode="admin" />
        {!embedded ? <FinelyOsPageFooter /> : null}
</div>
    </AdminWorkstationFrame>
  );
}
