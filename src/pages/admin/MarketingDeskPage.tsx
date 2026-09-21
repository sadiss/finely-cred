import React, { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, Sparkles } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { DESK_HELPERS, helperFromParam } from '../../features/marketingDesk/marketingDeskModel';
import { MarketingDeskFindPanel } from '../../features/marketingDesk/MarketingDeskFindPanel';
import { MarketingDeskDraftPanel } from '../../features/marketingDesk/MarketingDeskDraftPanel';
import { MarketingDeskQualifyPanel } from '../../features/marketingDesk/MarketingDeskQualifyPanel';
import { FC_PAGE_SECTION } from '../../styles/layoutSurfaces';

export default function MarketingDeskPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = params.get('tab') ?? 'desk';
  const helper = helperFromParam(params.get('helper'));

  const body = useMemo(() => {
    if (helper === 'draft') return <MarketingDeskDraftPanel />;
    if (helper === 'qualify') return <MarketingDeskQualifyPanel />;
    return <MarketingDeskFindPanel />;
  }, [helper]);

  const setHelper = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', tab);
    next.set('helper', id);
    setParams(next, { replace: true });
  };

  return (
    <PageShell
      badge="Admin"
      title="Marketing Desk"
      subtitle="Partner growth — Grok-style asks, OSM-first Find, manual send only."
      back={{ to: '/admin/marketing', label: 'Marketing HQ' }}
    >
      <div className={FC_PAGE_SECTION}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl border border-[#fbbf24]/30 bg-[#fbbf24]/10 flex items-center justify-center text-[#fbbf24]">
              <Compass size={22} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#fbbf24]">Owner live · P0</div>
              <h1 className="text-2xl font-bold text-white">Marketing Desk</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              to="/admin/lead-intel"
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-white/70 hover:text-white"
            >
              <Sparkles size={14} /> Lead Intel (enrich)
            </Link>
            <button
              type="button"
              onClick={() => navigate('/admin/crm')}
              className="rounded-lg border border-[#fbbf24]/30 px-3 py-1.5 text-[#fbbf24] hover:bg-[#fbbf24]/10"
            >
              Warm CRM
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {DESK_HELPERS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setHelper(h.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                helper === h.id
                  ? 'border-[#fbbf24]/50 bg-[#fbbf24]/15 text-[#fbbf24]'
                  : 'border-white/15 text-white/70 hover:border-white/30'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>

        {body}
      </div>
    </PageShell>
  );
}
