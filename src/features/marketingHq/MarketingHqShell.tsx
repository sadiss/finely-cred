import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, DoorOpen, Layers } from 'lucide-react';
import { MARKETING_DEPARTMENTS, getDepartment, type MarketingDepartmentId } from './marketingHqModel';

const INK = 'bg-[#060908]';
const PANEL = 'bg-[#0b1110]';

function parsePath(pathname: string) {
  const base = '/admin/marketing';
  if (!pathname.startsWith(base)) return { deptId: null as string | null, channelId: null as string | null };
  const rest = pathname.slice(base.length).replace(/^\//, '');
  const [deptId, channelId] = rest.split('/');
  return { deptId: deptId || null, channelId: channelId || null };
}

export function MarketingHqShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { deptId, channelId } = parsePath(location.pathname);
  const activeDept = deptId ? getDepartment(deptId) : null;

  return (
    <div className={`min-h-screen ${INK} text-slate-200 font-sans`}>
      <header className={`border-b border-[#fbbf24]/20 ${PANEL}`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/brand/finely-cred-icon.svg" alt="Finely Cred" className="h-10 w-10" width={40} height={40} />
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#fbbf24]/80">Marketing Command</div>
              <h1 className="text-xl font-semibold text-white tracking-tight">Office Floor HQ</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white"
            >
              Admin home
            </button>
            <Link to="/admin/comms" className="px-3 py-1.5 rounded-lg border border-[#fbbf24]/30 text-[#fbbf24] hover:bg-[#fbbf24]/10">
              Comms Studio
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-5rem)]">
        <aside className={`lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 ${PANEL} p-4`}>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
            <Building2 size={14} className="text-[#fbbf24]" /> Department floors
          </div>
          <nav className="space-y-1">
            <Link
              to="/admin/marketing"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                !deptId ? 'bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30' : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <Layers size={16} /> Command floor
            </Link>
            {MARKETING_DEPARTMENTS.map((d) => (
              <div key={d.id}>
                <Link
                  to={`/admin/marketing/${d.id}`}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                    deptId === d.id && !channelId
                      ? 'bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30'
                      : deptId === d.id
                        ? 'text-[#fbbf24]/90 bg-white/[0.03]'
                        : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <span className="truncate">{d.floorLabel}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-70 truncate">{d.name}</span>
                </Link>
                {deptId === d.id && (
                  <div className="ml-3 mt-1 mb-2 pl-3 border-l border-[#fbbf24]/20 space-y-0.5">
                    {d.channels.map((ch) => (
                      <Link
                        key={ch.id}
                        to={`/admin/marketing/${d.id}/${ch.id}`}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                          channelId === ch.id
                            ? 'bg-[#fbbf24]/10 text-[#fbbf24]'
                            : 'text-white/55 hover:text-white/80'
                        }`}
                      >
                        <DoorOpen size={12} />
                        {ch.short}
                        {ch.comingSoon ? ' · soon' : ''}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {activeDept && (
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-white/45">
              <Link to="/admin/marketing" className="hover:text-[#fbbf24]">Command floor</Link>
              <ChevronRight size={12} />
              <Link to={`/admin/marketing/${activeDept.id}`} className="hover:text-[#fbbf24]">{activeDept.name}</Link>
              {channelId && (
                <>
                  <ChevronRight size={12} />
                  <span className="text-[#fbbf24]">{activeDept.channels.find((c) => c.id === channelId)?.label}</span>
                </>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
