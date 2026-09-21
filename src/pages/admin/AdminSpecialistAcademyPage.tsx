import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  GraduationCap,
  Languages,
  LayoutGrid,
  Map,
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import {
  ACADEMY_GROUPS,
  ACADEMY_ITEMS,
  TRACK_LABELS,
  findAcademyItem,
  type AcademyItem,
} from '../../specialistAcademy/academyCatalog';
import { AcademyMarkdown } from '../../specialistAcademy/AcademyMarkdown';
import { getAcademyMarkdown, preloadAcademyMarkdown } from '../../specialistAcademy/academyContent';
import {
  academyProgressPercent,
  getAcademyProgress,
  markAcademyItemComplete,
} from '../../specialistAcademy/academyProgress';

type Lang = 'en' | 'ht';

export default function AdminSpecialistAcademyPage() {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = (searchParams.get('lang') === 'ht' ? 'ht' : 'en') as Lang;
  const [markdown, setMarkdown] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(() => getAcademyProgress());

  const active = findAcademyItem(itemId ?? null);

  useEffect(() => {
    preloadAcademyMarkdown().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!active) {
      setMarkdown('');
      return;
    }
    const path = lang === 'ht' && active.pathHt ? active.pathHt : active.pathEn;
    setLoadError(null);
    getAcademyMarkdown(path).then((md) => {
      if (!md) setLoadError(`Content not found: ${path}`);
      else setMarkdown(md);
    });
  }, [active, lang]);

  const progressPct = useMemo(() => academyProgressPercent(ACADEMY_ITEMS.length, progress), [progress]);

  const setLang = (next: Lang) => {
    const p = new URLSearchParams(searchParams);
    p.set('lang', next);
    setSearchParams(p, { replace: true });
  };

  const openItem = (item: AcademyItem) => {
    navigate(`/admin/specialist-academy/${item.id}?lang=${lang}`);
  };

  const markDone = () => {
    if (!active) return;
    markAcademyItemComplete(active.id);
    setProgress(getAcademyProgress());
  };

  const hub = !itemId;

  return (
    <PageShell
      badge="Specialist Academy"
      title={hub ? 'Specialist Academy' : active?.title ?? 'Lesson'}
      subtitle={
        hub
          ? 'Restore-for-wealth training — methodology, SOPs, and BUILD literacy for Finely specialists.'
          : active?.subtitle ?? TRACK_LABELS[active?.track ?? 'F']
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={() => (hub ? navigate('/admin') : navigate('/admin/specialist-academy'))}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} /> {hub ? 'Admin dashboard' : 'Academy home'}
        </button>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-[10px] font-black uppercase tracking-widest text-white/60">
            <GraduationCap size={14} className="text-amber-300" />
            Progress {progressPct}%
          </div>
          <div className="inline-flex rounded-xl border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest ${lang === 'en' ? 'bg-amber-500 text-black' : 'bg-black/30 text-white/70'}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('ht')}
              disabled={!active?.pathHt && !hub}
              className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 ${lang === 'ht' ? 'bg-amber-500 text-black' : 'bg-black/30 text-white/70 disabled:opacity-40'}`}
              title="Kreyòl where twin exists"
            >
              <Languages size={12} /> HT
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
        <aside className="lg:sticky lg:top-24 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto fc-scroll-area pr-1">
          <button
            type="button"
            onClick={() => navigate(`/admin/specialist-academy?lang=${lang}`)}
            className={`w-full text-left rounded-2xl border p-4 transition-all ${hub ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-black/30 hover:bg-white/[0.03]'}`}
          >
            <LayoutGrid size={16} className="text-amber-300 mb-2" />
            <div className="text-white font-semibold text-sm">Browse tracks</div>
            <div className="text-white/55 text-xs mt-1">A–G modules & SOPs</div>
          </button>
          {ACADEMY_GROUPS.map((g) => (
            <div key={g.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="text-[10px] uppercase tracking-widest text-white/45 font-black px-1 mb-2">
                {lang === 'ht' && g.labelHt ? g.labelHt : g.label}
              </div>
              <div className="space-y-1">
                {g.items.map((item) => {
                  const done = progress.has(item.id);
                  const isActive = item.id === itemId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openItem(item)}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all flex items-start gap-2 ${
                        isActive
                          ? 'border-amber-500/35 bg-amber-500/10 text-amber-100'
                          : 'border-transparent text-white/70 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 size={14} className="shrink-0 text-emerald-400 mt-0.5" />
                      ) : (
                        <Circle size={14} className="shrink-0 text-white/30 mt-0.5" />
                      )}
                      <span className="leading-snug">{lang === 'ht' && item.titleHt ? item.titleHt : item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        <main className="min-w-0">
          {!ready ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-10 text-center text-white/60">Loading academy…</div>
          ) : hub ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <Kpi label="Lessons & SOPs" value={String(ACADEMY_ITEMS.length)} hint="In this pack" tone="amber" />
                <Kpi label="Your progress" value={`${progressPct}%`} hint="Local checklist" tone="violet" />
                <Kpi label="Track F core" value="7" hint="Deep lessons" tone="emerald" />
                <Kpi label="Workflow" value="1" hint="Visual map" tone="amber" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {ACADEMY_GROUPS.map((g) => (
                  <div key={g.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="text-white font-semibold">{g.label}</div>
                    <div className="mt-3 space-y-2">
                      {g.items.slice(0, 4).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openItem(item)}
                          className="w-full text-left text-sm text-white/70 hover:text-amber-200 flex justify-between gap-2"
                        >
                          <span>{item.title}</span>
                          {item.minutes ? <span className="text-white/40 text-xs">{item.minutes}m</span> : null}
                        </button>
                      ))}
                      {g.items.length > 4 ? (
                        <div className="text-white/40 text-xs">+{g.items.length - 4} more in sidebar</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => openItem(ACADEMY_ITEMS.find((x) => x.id === 'workflow')!)}
                className="w-full rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-left hover:bg-amber-500/15 transition-all"
              >
                <div className="flex items-center gap-2 text-amber-100 font-semibold">
                  <Map size={18} /> Start with the workflow map
                </div>
                <p className="mt-2 text-white/65 text-sm">Debt → validation → summons → restore → complaints → readiness → Nora.</p>
              </button>
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">{loadError}</div>
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-[#070b09]/80 backdrop-blur-xl p-6 md:p-10 shadow-2xl shadow-black/30">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-6 border-b border-white/10">
                <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-widest font-black">
                  <BookOpen size={14} /> {active?.minutes ? `~${active.minutes} min read` : 'Lesson'}
                </div>
                <button
                  type="button"
                  onClick={markDone}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
                >
                  <CheckCircle2 size={14} /> Mark complete
                </button>
              </div>
              <AcademyMarkdown markdown={markdown} />
            </div>
          )}
        </main>
      </div>
    </PageShell>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: 'amber' | 'violet' | 'emerald';
}) {
  const border =
    tone === 'amber' ? 'border-amber-500/25 bg-amber-500/10' : tone === 'violet' ? 'border-violet-500/25 bg-violet-500/10' : 'border-emerald-500/25 bg-emerald-500/10';
  return (
    <div className={`rounded-2xl border p-4 ${border}`}>
      <div className="text-[10px] uppercase tracking-widest text-white/50 font-black">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
      {hint ? <div className="mt-1 text-white/50 text-xs">{hint}</div> : null}
    </div>
  );
}
