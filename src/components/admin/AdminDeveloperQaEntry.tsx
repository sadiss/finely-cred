import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { isAdminEmail } from '../../auth/admin';
import { useAuth } from '../../auth/AuthProvider';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';

/** Compact admin entry — visible on dashboard, not buried in nav noise. */
export function AdminDeveloperQaEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || '').trim();
  if (!email || !isAdminEmail(email)) return null;

  return (
    <div className={`${finelyOsCatalogCardCompact('sky')} !p-4 flex flex-wrap items-center justify-between gap-4`}>
      <div className="flex items-start gap-3 min-w-0">
        <div className="rounded-lg border border-sky-400/30 bg-sky-500/10 p-2 shrink-0">
          <FlaskConical size={22} className="text-sky-200" />
        </div>
        <div>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Developer QA</p>
          <p className={`${FINELY_OS_ENTITY_VALUE} text-base mt-0.5`}>Sadiss launch test bench</p>
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm mt-1 max-w-xl`}>
            Preview the developer command center, checklist, and sandbox tools — same view Sadiss uses after login.
          </p>
        </div>
      </div>
      <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/developer')}>
        Open developer hub <ArrowRight size={14} />
      </button>
    </div>
  );
}
