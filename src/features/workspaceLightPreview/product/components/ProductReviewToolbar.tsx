import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  LayoutGrid,
  MoreHorizontal,
  Presentation,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  WORKSPACE_LIGHT_PREVIEW_HUB_PATH,
  WORKSPACE_LIGHT_PREVIEW_LANES,
  type WorkspaceLightPreviewSurface,
} from '../../workspaceLightPreviewCatalog';
import { useWorkspaceLightPreview } from '../../useWorkspaceLightPreview';
import {
  allRolePreviewEntries,
  parseRolePreviewRole,
  rolePreviewEntry,
  type RolePreviewRole,
} from '../../../../config/rolePreviewCatalog';

function previewRoleFromPath(pathname: string): RolePreviewRole | '' {
  const portalMatch = pathname.match(/\/preview\/workspace-light\/portal\/([^/?#]+)/);
  const adminMatch = pathname.match(/\/preview\/workspace-light\/admin\/([^/?#]+)/);
  if (adminMatch) {
    const pageId = adminMatch[1];
    const hit = allRolePreviewEntries().find((entry) => entry.role === 'admin' && entry.previewPageId === pageId);
    return hit?.role ?? 'admin';
  }
  if (portalMatch) {
    const pageId = portalMatch[1];
    const hit = allRolePreviewEntries().find((entry) => entry.role !== 'admin' && entry.previewPageId === pageId);
    return hit?.role ?? (pageId === 'dashboard' ? 'partner' : '');
  }
  return '';
}

function saveFeedback(surfaceId: string | null, vote: 'up' | 'down') {
  if (!surfaceId) return;
  try {
    const previous = JSON.parse(localStorage.getItem('fc_wl_preview_feedback') || '{}');
    previous[surfaceId] = { vote, at: new Date().toISOString(), generation: 'product' };
    localStorage.setItem('fc_wl_preview_feedback', JSON.stringify(previous, null, 2));
  } catch {
    // optional preview feedback
  }
}

export function ProductReviewToolbar(_props: {
  active?: WorkspaceLightPreviewSurface;
}) {
  const ctx = useWorkspaceLightPreview();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (ctx.presentationMode) {
    return (
      <button
        type="button"
        className="fc-wlp-presentation-exit"
        onClick={() => ctx.setPresentationMode?.(false)}
      >
        <X size={15} /> Exit presentation
      </button>
    );
  }

  const exportFeedback = async () => {
    try {
      const raw = localStorage.getItem('fc_wl_preview_feedback') || '{}';
      await navigator.clipboard.writeText(raw);
    } catch {
      // clipboard can be unavailable in preview browsers
    }
    setMenuOpen(false);
  };

  return (
    <div className="fc-wlp fc-wlp-review-bar">
      <div className="fc-wlp-review-inner">
        <div className="fc-wlp-review-brand">
          <span className="fc-wlp-review-mark"><Sparkles size={14} /></span>
          <span>
            <span className="fc-wlp-review-label">Finely workspace</span>
            <span className="fc-wlp-review-note"> · redesigned product</span>
          </span>
        </div>

        <div className="fc-wlp-review-segment" aria-label="Workspace">
          {WORKSPACE_LIGHT_PREVIEW_LANES.map((lane) => (
            <button
              key={lane.id}
              type="button"
              className="fc-wlp-review-option"
              aria-pressed={pathname.startsWith(lane.prefix)}
              onClick={() => navigate(lane.path)}
              title={lane.label}
            >
              {lane.label}
            </button>
          ))}
        </div>

        <label className="sr-only" htmlFor="fc-wlp-role-view">
          Role view
        </label>
        <select
          id="fc-wlp-role-view"
          className="fc-wlp-review-select"
          value={previewRoleFromPath(pathname)}
          onChange={(event) => {
            const raw = event.target.value;
            if (!raw) return;
            const next = parseRolePreviewRole(raw);
            const entry = rolePreviewEntry(next);
            if (entry.workspacePreviewPath) navigate(entry.workspacePreviewPath);
          }}
        >
          <option value="">Role view</option>
          {allRolePreviewEntries().map((entry) => (
            <option key={entry.role} value={entry.role}>
              {entry.shortLabel}
            </option>
          ))}
        </select>

        <div className="fc-wlp-review-spacer" />

        <span className="fc-wlp-review-product-state" aria-label="Unified product view">
          <Sparkles size={13} /> Product view
        </span>

        <div className="fc-wlp-review-overflow">
          <button
            type="button"
            className="fc-wlp-review-button"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <MoreHorizontal size={15} /> More
          </button>
          {menuOpen ? (
            <div className="fc-wlp-review-menu">
              <button
                type="button"
                onClick={() => {
                  ctx.setDensity?.(ctx.density === 'compact' ? 'comfortable' : 'compact');
                  setMenuOpen(false);
                }}
              >
                <RotateCcw size={15} /> {ctx.density === 'compact' ? 'Comfortable density' : 'Compact density'}
              </button>
              <button
                type="button"
                onClick={() => {
                  ctx.setShowSectionOutlines?.(!ctx.showSectionOutlines);
                  setMenuOpen(false);
                }}
              >
                {ctx.showSectionOutlines ? <EyeOff size={15} /> : <Eye size={15} />}
                {ctx.showSectionOutlines ? 'Hide section outlines' : 'Show section outlines'}
              </button>
              <button
                type="button"
                onClick={() => {
                  saveFeedback(ctx.surfaceId, 'up');
                  setMenuOpen(false);
                }}
              >
                <ThumbsUp size={15} /> Looks good
              </button>
              <button
                type="button"
                onClick={() => {
                  saveFeedback(ctx.surfaceId, 'down');
                  setMenuOpen(false);
                }}
              >
                <ThumbsDown size={15} /> Needs work
              </button>
              <button type="button" onClick={() => void exportFeedback()}>
                <LayoutGrid size={15} /> Copy feedback
              </button>
              <button
                type="button"
                onClick={() => {
                  ctx.setPresentationMode?.(true);
                  setMenuOpen(false);
                }}
              >
                <Presentation size={15} /> Presentation mode
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate(WORKSPACE_LIGHT_PREVIEW_HUB_PATH);
                  setMenuOpen(false);
                }}
              >
                <LayoutGrid size={15} /> Preview gallery
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
