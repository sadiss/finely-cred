import React, { useMemo } from 'react';
import { FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CrmRecord } from '../../../domain/crmRecords';
import { getRecommendedPackageForRecord } from '../../../data/crmRecordsRepo';
import { describeServiceBundle } from '../../work/playbooks/servicePlaybookBundles';
import {
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsInlineListItem,
} from '../../os/finelyOsLightUi';

export function CrmServiceBundlePanel({ record }: { record: CrmRecord }) {
  const navigate = useNavigate();
  const packages = useMemo(() => getRecommendedPackageForRecord(record).filter(Boolean), [record]);
  const primary = packages[0];
  const bundle = useMemo(() => (primary ? describeServiceBundle(primary.id) : null), [primary]);

  if (!primary || !bundle) return null;

  return (
    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Service bundle preview</div>
          <div className={FINELY_OS_ENTITY_VALUE}>{primary.name}</div>
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY} mt-1`}>
            Convert spawns {bundle.taskCount} playbook tasks · {bundle.bundle.delivery} · {bundle.bundle.scope}
          </p>
        </div>
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() => navigate('/admin/project-templates')}
        >
          <FolderKanban size={14} /> Template gallery
        </button>
      </div>
      <ul className="grid sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
        {bundle.playbooks.slice(0, 6).map((pb) => (
          <li key={pb.id} className={`${finelyOsInlineListItem()} px-3 py-2 text-sm`}>
            <div className={FINELY_OS_ENTITY_VALUE}>{pb.title}</div>
            <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{pb.kind.replace(/_/g, ' ')}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
