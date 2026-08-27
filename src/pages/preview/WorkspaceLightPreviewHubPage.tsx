import React from 'react';
import { ArrowRight, LayoutGrid, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceLightPreviewShell } from '../../features/workspaceLightPreview';
import {
  ADMIN_PRODUCT_NAV,
  ADMIN_SERVICE_LINES,
  PARTNER_PRODUCT_NAV,
  PARTNER_SERVICE_LINES,
  type AdminServiceLine,
  type PartnerServiceLine,
  type WorkspaceProductNavItem,
} from '../../features/workspaceLightPreview/product/workspaceProductNav';

type Lane = {
  id: 'partner' | 'admin';
  label: string;
  tagline: string;
  entryPath: string;
  accent: 'emerald' | 'violet';
  icon: typeof Shield;
  lines: (PartnerServiceLine | AdminServiceLine)[];
  nav: WorkspaceProductNavItem[];
  previewPrefix: string;
};

const LANES: Lane[] = [
  {
    id: 'partner',
    label: 'Partner portal',
    tagline: 'What a partner sees: their next step, restore progress, letters, reports, and every service they own or could unlock.',
    entryPath: '/preview/workspace-light/portal/dashboard',
    accent: 'emerald',
    icon: Shield,
    lines: PARTNER_SERVICE_LINES,
    nav: PARTNER_PRODUCT_NAV,
    previewPrefix: '/preview/workspace-light/portal/',
  },
  {
    id: 'admin',
    label: 'Admin workspace',
    tagline: 'What the team sees: the partner book, delivery queues, growth, content, finance, and platform controls.',
    entryPath: '/preview/workspace-light/admin/dashboard',
    accent: 'violet',
    icon: LayoutGrid,
    lines: ADMIN_SERVICE_LINES,
    nav: ADMIN_PRODUCT_NAV,
    previewPrefix: '/preview/workspace-light/admin/',
  },
];

/**
 * Preview entry point — `/preview/workspace-light`.
 *
 * Deliberately just two doors. An earlier version listed every surface as its own "lane" with
 * ready / Phase 2 badges, which made pages that are in fact built (Letters, Reports, Debt) look
 * unfinished, and made the one partner workspace look like three competing partner apps. There
 * are two workspaces; everything else is a page inside one of them, so the full page index is
 * shown under each door instead.
 */
export default function WorkspaceLightPreviewHubPage() {
  const navigate = useNavigate();

  return (
    <WorkspaceLightPreviewShell surfaceId="hub" pageBed="hub" showSwitcher={false}>
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6">
        <div className="fc-wl-hub-hero">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <div className="fc-wl-hub-eyebrow">Finely workspace</div>
              <h1 className="fc-wl-hub-title">One product. Two workspaces. Every page.</h1>
              <p className="fc-wl-hub-sub">
                Choose the partner or admin workspace, then work inside one connected design. Pages no longer
                send you into a competing legacy experience.
              </p>
            </div>
          </div>
        </div>

        {LANES.map((lane) => {
          const LaneIcon = lane.icon;
          return (
            <section key={lane.id} aria-label={lane.label} className="space-y-3">
              <button
                type="button"
                onClick={() => navigate(lane.entryPath)}
                className="fc-wl-lane-card w-full text-left"
                data-fc-accent={lane.accent}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                      style={{
                        backgroundImage:
                          lane.accent === 'emerald'
                            ? 'linear-gradient(155deg, #12b98c 0%, #05604a 100%)'
                            : 'linear-gradient(155deg, #7c4ddb 0%, #4a219f 100%)',
                      }}
                    >
                      <LaneIcon size={20} />
                    </span>
                    <div>
                      <div className="text-lg font-semibold text-[#0a1628]">{lane.label}</div>
                      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">{lane.tagline}</p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-700">
                    Open workspace <ArrowRight size={11} />
                  </span>
                </div>
              </button>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {lane.lines.map((line) => {
                  const items = lane.nav.filter((item) => item.service === line.id);
                  if (!items.length) return null;
                  return (
                    <div key={line.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                      <div className="text-sm font-semibold text-[#0a1628]">{line.label}</div>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{line.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => navigate(`${lane.previewPrefix}${item.id}`)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
                            title={item.description}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600">
          <strong className="font-semibold text-[#0a1628]">Sign-off rubric:</strong> premium first impression ·
          distinct section worlds · saturated accents on white · no layer cake · readable hierarchy · compact luxury ·
          mobile 375px. Rate any page with the thumbs in the review bar.
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles size={14} className="text-violet-600" />
          Reports, communication, evidence, documents, and department rooms stay distinct inside the same product.
        </div>
      </div>
    </WorkspaceLightPreviewShell>
  );
}
