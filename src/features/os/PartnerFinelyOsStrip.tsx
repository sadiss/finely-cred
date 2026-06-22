import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  FileText,
  FolderKanban,
  ListChecks,
  PenLine,
  Sparkles,
  Target,
} from 'lucide-react';
import { findCrmRecordsForPartner } from '../crm/partner/findCrmRecordsForPartner';
import { listProjectsByPartner } from '../../data/projectsRepo';
import { crmRecordDisplayName } from '../../domain/crmRecords';
import {FINELY_OS_CATALOG_SHELL,
  FINELY_OS_ENTITY_ACCENT_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_PANEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsKpiTile,
  finelyOsCatalogCard,} from './finelyOsLightUi';

type PartnerTabKey = 'overview' | 'profile' | 'reports' | 'analysis' | 'evidence' | 'letters' | 'tasks' | 'notes' | 'debt';

const FEATURE_TABS: { tab: PartnerTabKey; label: string; hint: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { tab: 'reports', label: 'Reports', hint: 'Credit pulls', icon: FileText },
  { tab: 'analysis', label: 'Analysis', hint: 'Report builder', icon: BarChart3 },
  { tab: 'letters', label: 'Letters', hint: 'Letter studio & vault', icon: PenLine },
  { tab: 'tasks', label: 'Tasks', hint: 'Work queue', icon: ListChecks },
];

export function PartnerFinelyOsStrip({
  partnerId,
  email,
  onOpenTab,
}: {
  partnerId: string;
  email?: string;
  onOpenTab?: (tab: PartnerTabKey) => void;
}) {
  const navigate = useNavigate();
  const crmRecords = useMemo(() => findCrmRecordsForPartner({ partnerId, email }), [partnerId, email]);
  const projects = useMemo(
    () => listProjectsByPartner(partnerId).filter((p) => p.status === 'active' || p.status === 'paused'),
    [partnerId],
  );

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-300/80`}>Finely OS 400%</p>
          <p className={`text-sm mt-1 ${FINELY_OS_ENTITY_BODY}`}>CRM + Work + platform features — unified hub for this partner.</p>
        </div>
        <Link to="/admin/workflow" className={FINELY_OS_SECONDARY_BTN}>
          Ops inbox
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {crmRecords.slice(0, 3).map((r, i) => (
          <button
            key={r.id}
            type="button"
            onClick={() => navigate(`/admin/crm/records/${encodeURIComponent(r.id)}`)}
            className={`text-left p-3 transition-all ${finelyOsKpiTile(i)}`}
          >
            <div className="flex items-center gap-2 text-violet-300">
              <Target size={14} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>CRM record</span>
            </div>
            <div className={`mt-1 text-sm truncate ${FINELY_OS_ENTITY_VALUE}`}>{crmRecordDisplayName(r)}</div>
            <div className={`text-[10px] mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{r.stage} · score {r.score ?? '—'}</div>
          </button>
        ))}

        {projects.slice(0, 3).map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => navigate(`/admin/projects/${p.id}`)}
            className={`text-left p-3 transition-all ${finelyOsKpiTile(i + 1)}`}
          >
            <div className="flex items-center gap-2 text-emerald-300">
              <FolderKanban size={14} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Work project</span>
            </div>
            <div className={`mt-1 text-sm truncate ${FINELY_OS_ENTITY_VALUE}`}>{p.title}</div>
            <div className={`text-[10px] mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{p.stage} · {p.status}</div>
          </button>
        ))}

        <Link to="/admin/projects/templates" className={`block p-3 transition-all ${finelyOsKpiTile(2)}`}>
          <div className="flex items-center gap-2 text-violet-300">
            <Sparkles size={14} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>New from template</span>
          </div>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>Spawn catalog-backed delivery project</p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase mt-2 ${FINELY_OS_ENTITY_ACCENT_LINK} no-underline`}>
            Templates <ArrowRight size={10} />
          </span>
        </Link>
      </div>

      <div className={FINELY_OS_CATALOG_SHELL}>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>Platform features (this partner)</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {FEATURE_TABS.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => onOpenTab?.(item.tab)}
                className={`text-left p-2.5 transition-all ${finelyOsKpiTile(i)}`}
              >
                <Icon size={14} className="text-violet-400 mb-1" />
                <div className={`text-xs ${FINELY_OS_ENTITY_VALUE}`}>{item.label}</div>
                <div className={`text-[9px] mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{item.hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      {!crmRecords.length && !projects.length ? (
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          No CRM record or Work project linked yet — convert from{' '}
          <Link to="/admin/crm" className={FINELY_OS_ENTITY_ACCENT_LINK}>
            CRM workspace
          </Link>{' '}
          or create from templates.
        </p>
      ) : null}
    </div>
  );
}
