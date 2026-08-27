import React from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { BusinessDisputesWorkspace } from '../../../../pages/business/BusinessDisputesPage';
import { BusinessDisputeDetailWorkspace } from '../../../../pages/business/BusinessDisputeDetailPage';
import { businessDisputeHubHref } from '../../../../lib/businessDisputeProductPaths';
import './productBusinessDisputeWorkspace.css';

/**
 * Business bureau dispute workstation — hub stays visible; `:id` / `?disputeId=` opens an enhanced
 * inspector overlay (GLOBAL card→inspector rule). Legacy full-page detail is not default.
 */
export function ProductBusinessDisputeWorkspace({ entityId }: { entityId?: string }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [searchParams] = useSearchParams();
  const { id: routeDisputeId } = useParams<{ id?: string }>();
  const disputeId =
    searchParams.get('disputeId')?.trim() || entityId || routeDisputeId || undefined;

  const closeDisputeSheet = () => {
    navigate(businessDisputeHubHref(pathname, search));
  };

  return (
    <section className="fc-wlp-business-dispute-workspace" data-room={disputeId ? 'dispute' : 'hub'}>
      <BusinessDisputesWorkspace embedded />

      {disputeId ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Business dispute inspector"
          onClick={closeDisputeSheet}
        >
          <div
            className="fc-wlp-local-modal fc-wlp-wide-drawer fc-wlp-business-dispute-record-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-rose-300 m-0">
                  Enhanced business dispute inspector
                </p>
                <h3 className="text-lg font-extrabold text-white m-0 mt-1">Business bureau dispute</h3>
              </div>
              <button
                type="button"
                className="fc-wlp-btn-secondary !py-1.5 !px-2.5 !text-xs"
                onClick={closeDisputeSheet}
                aria-label="Close business dispute inspector"
              >
                <X size={14} /> Close
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto pr-1">
              <BusinessDisputeDetailWorkspace disputeId={disputeId} embedded />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
