import React, { useMemo, useState } from 'react';
import { Link2, UserCheck } from 'lucide-react';
import { STAFF_SOCIAL_PRESENCE, type StaffSocialPresence } from '../staffCommandCenter/staffSocialPresence';
import { loadMetaIntegrationConfig, saveMetaIntegrationConfig } from '../../data/metaIntegrationRepo';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';

export function StaffSocialPageAssignWizard() {
  const [version, setVersion] = useState(0);
  const [staffId, setStaffId] = useState(STAFF_SOCIAL_PRESENCE[0]?.staffId ?? '');
  const [pageId, setPageId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const config = useMemo(() => {
    void version;
    return loadMetaIntegrationConfig();
  }, [version]);

  const staff = STAFF_SOCIAL_PRESENCE.find((s) => s.staffId === staffId) ?? null;
  const pages = config.connectedPages ?? [];

  const assign = () => {
    if (!staffId || !pageId.trim()) {
      setNotice('Pick staff and a connected page.');
      return;
    }
    const page = pages.find((p) => p.pageId === pageId);
    if (!page) {
      setNotice('Page not in connected list — connect Meta first.');
      return;
    }
    const key = `finely.staffSocial.pageMap.v1`;
    const raw = localStorage.getItem(key);
    const map: Record<string, { pageId: string; pageName: string; assignedAt: string }> = raw ? JSON.parse(raw) : {};
    map[staffId] = { pageId: page.pageId, pageName: page.pageName, assignedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(map));
    const next = {
      ...config,
      staffPageAssignments: { ...(config.staffPageAssignments ?? {}), [staffId]: page.pageId },
    };
    saveMetaIntegrationConfig(next);
    setNotice(`Assigned ${staff?.displayName ?? staffId} → ${page.pageName}`);
    setVersion((v) => v + 1);
  };

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <UserCheck size={18} className="text-violet-300" />
        <h3 className="font-bold text-white">Assign Meta page → staff agent</h3>
      </div>
      <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
        Wire a connected Facebook/Instagram page to a lead agent for recruiting SOP autopilot and disclosure-aware posting.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Staff agent</label>
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="fc-input mt-1 w-full">
            {STAFF_SOCIAL_PRESENCE.map((s: StaffSocialPresence) => (
              <option key={s.staffId} value={s.staffId}>
                {s.displayName} — {s.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Connected page</label>
          <select value={pageId} onChange={(e) => setPageId(e.target.value)} className="fc-input mt-1 w-full">
            <option value="">— Select page —</option>
            {pages.map((p) => (
              <option key={p.pageId} value={p.pageId}>
                {p.pageName} ({p.pageId})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={assign}>
          <Link2 size={14} /> Save assignment
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setVersion((v) => v + 1)}>
          Refresh pages
        </button>
      </div>
      {staff ? (
        <p className="text-xs text-white/50">
          Mission: {staff.mission} · Autopilot: {staff.autopilotEligible ? 'yes' : 'no'} · Disclosure:{' '}
          {staff.disclosureRequired ? 'required' : 'optional'}
        </p>
      ) : null}
      {notice ? <p className="text-sm text-emerald-200/90">{notice}</p> : null}
      {pages.length === 0 ? (
        <p className="text-xs text-amber-200/80">Connect Meta in Settings below before assigning pages.</p>
      ) : null}
    </div>
  );
}
