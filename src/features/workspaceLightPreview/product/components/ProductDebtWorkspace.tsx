import React from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { PartnerDebtDetailWorkspace } from '../../../../pages/portal/PartnerDebtDetailPage';
import { debtHubHref } from '../../../../lib/debtProductPaths';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { PartnerDebtCommandDeck } from '../partner/PartnerDebtCommandDeck';
import './productDebtWorkspace.css';

/**
 * Debt & court product shell — split workbench hub; `:id` / `?caseId=` opens enhanced
 * inspector overlay (GLOBAL card→inspector rule). Legacy full-page detail is not default.
 */
export function ProductDebtWorkspace(props: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [searchParams] = useSearchParams();
  const { id: routeCaseId } = useParams<{ id?: string }>();
  const caseId = searchParams.get('caseId')?.trim() || props.entityId || routeCaseId || undefined;

  const closeCaseSheet = () => {
    navigate(debtHubHref(pathname, search));
  };

  return (
    <section className="fc-wlp-debt-workspace" data-room={caseId ? 'case' : 'hub'} data-surface-layout="split-workbench">
      <PartnerDebtCommandDeck {...props} />

      {caseId ? (
        <div
          className="fc-wlp-local-modal-overlay fc-wlp-debt-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Debt case inspector"
          onClick={closeCaseSheet}
        >
          <div
            className="fc-wlp-local-modal fc-wlp-wide-drawer fc-wlp-debt-record-sheet fc-wlp-debt-inspector"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fc-wlp-debt-inspector-head">
              <div>
                <p className="fc-wlp-debt-inspector-kicker">Debt case inspector</p>
                <h3 className="fc-wlp-debt-inspector-title">Debt &amp; court case</h3>
              </div>
              <button
                type="button"
                className="fc-wlp-btn-secondary fc-wlp-debt-inspector-close"
                onClick={closeCaseSheet}
                aria-label="Close debt case inspector"
              >
                <X size={14} /> Close
              </button>
            </div>
            <div className="fc-wlp-debt-inspector-body">
              <PartnerDebtDetailWorkspace caseId={caseId} embedded />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
