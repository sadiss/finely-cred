import React from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { PartnerDisputesWorkspace } from '../../../../pages/portal/PartnerDisputesPage';
import { PartnerDisputeDetailWorkspace } from '../../../../pages/portal/PartnerDisputeDetailPage';
import { disputeHubHref } from '../../../../lib/disputeProductPaths';
import './productDisputeWorkspace.css';

/**
 * Bureau dispute workstation — hub stays visible; `:id` / `?caseId=` opens an enhanced
 * inspector overlay (GLOBAL card→inspector rule). Legacy full-page detail is not default.
 */
export function ProductDisputeWorkspace({ entityId }: { entityId?: string }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [searchParams] = useSearchParams();
  const { id: routeCaseId } = useParams<{ id?: string }>();
  const caseId = searchParams.get('caseId')?.trim() || entityId || routeCaseId || undefined;

  const closeCaseSheet = () => {
    navigate(disputeHubHref(pathname, search));
  };

  return (
    <section className="fc-wlp-dispute-workspace" data-room={caseId ? 'case' : 'hub'}>
      <PartnerDisputesWorkspace embedded />

      {caseId ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Dispute case inspector"
          onClick={closeCaseSheet}
        >
          <div
            className="fc-wlp-local-modal fc-wlp-wide-drawer fc-wlp-dispute-record-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-violet-300 m-0">Enhanced dispute inspector</p>
                <h3 className="text-lg font-extrabold text-white m-0 mt-1">Bureau dispute case</h3>
              </div>
              <button
                type="button"
                className="fc-wlp-btn-secondary !py-1.5 !px-2.5 !text-xs"
                onClick={closeCaseSheet}
                aria-label="Close dispute case inspector"
              >
                <X size={14} /> Close
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto pr-1">
              <PartnerDisputeDetailWorkspace caseId={caseId} embedded />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
