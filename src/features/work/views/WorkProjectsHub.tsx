import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthProvider';
import { getActiveTenantId } from '../../../tenancy/activeTenant';
import { getAccessiblePartnerIdsForAdmin } from '../../../tenancy/adminPartnerScope';
import { listPartnersByTenant } from '../../../data/partnersRepo';
import type { Partner } from '../../../domain/partners';
import { FINELY_OS_BACK_LINK, FINELY_OS_PAGE } from '../../os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../os/FinelyOsPageFooter';
import { ArrowLeft } from 'lucide-react';
import WorkTasksProjectsHub from './WorkTasksProjectsHub';

/** Admin Work OS — projects + tasks with draggable kanban and calendar. */
export function WorkProjectsHub() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());
  const [partnerById, setPartnerById] = useState<Map<string, Partner>>(new Map());

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) {
      setPartnerIds(new Set());
      setPartnerById(new Map());
      return;
    }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then((ids) => {
      setPartnerIds(ids);
      listPartnersByTenant(tenantId).then((all) => {
        setPartnerById(new Map(all.filter((p) => ids.has(p.id)).map((p) => [p.id, p])));
      });
    });
  }, [auth.user, version]);

  return (
    <div className={FINELY_OS_PAGE}>
      <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
        <ArrowLeft size={16} /> Admin Dashboard
      </button>

      <WorkTasksProjectsHub
        role="admin"
        partnerIds={partnerIds}
        partnerById={partnerById}
        workspaceBasePath="/admin/projects"
      />

      <FinelyOsPageFooter />
    </div>
  );
}

export default WorkProjectsHub;
