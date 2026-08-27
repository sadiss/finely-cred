import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthProvider';
import { getActiveTenantId } from '../../../tenancy/activeTenant';
import { getAccessiblePartnerIdsForAdmin } from '../../../tenancy/adminPartnerScope';
import { listPartnersByTenant } from '../../../data/partnersRepo';
import type { Partner } from '../../../domain/partners';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_TITLE,
  finelyOsCatalogCardCompact,
} from '../../os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../os/FinelyOsPageFooter';
import { ArrowLeft, Building2 } from 'lucide-react';
import WorkTasksProjectsHub, { type WorkHubTab } from './WorkTasksProjectsHub';

/** Admin Work OS — projects + tasks with draggable kanban and calendar. */
export function WorkProjectsHub({
  embedded = false,
  initialTab = 'projects',
  workspaceBasePath = '/admin/projects',
}: {
  embedded?: boolean;
  initialTab?: WorkHubTab;
  workspaceBasePath?: string;
} = {}) {
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
    <div className={FINELY_OS_COMPACT_PAGE}>
      {!embedded ? (
        <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Admin Dashboard
        </button>
      ) : null}

      {!embedded ? (
        <div className={`${finelyOsCatalogCardCompact('violet')} !py-3`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 text-violet-300 text-[10px] font-black uppercase tracking-widest">
                <Building2 size={14} /> Admin ops
              </div>
              <h1 className={`mt-1 ${FINELY_OS_ENTITY_TITLE}`}>Projects & tasks</h1>
              <p className="mt-1 text-sm text-white/55">Cross-partner boards with journey drag, kanban, list, and calendar views.</p>
            </div>
            <div className="text-right text-[10px] uppercase tracking-widest text-white/40">
              {partnerIds.size} partner{partnerIds.size === 1 ? '' : 's'} in scope
            </div>
          </div>
        </div>
      ) : null}

      <WorkTasksProjectsHub
        role="admin"
        partnerIds={partnerIds}
        partnerById={partnerById}
        initialTab={initialTab}
        workspaceBasePath={workspaceBasePath}
      />

      <FinelyOsPageFooter />
    </div>
  );
}

export default WorkProjectsHub;
