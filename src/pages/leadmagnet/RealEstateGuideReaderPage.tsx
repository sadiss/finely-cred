import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessagesSquare,
  Sparkles,
} from 'lucide-react';
import { openPublicChat } from '../../lib/publicChatEvents';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import '../../components/leadmagnet/leadMagnetLuxuryStage.css';
import {
  RE_CAREERS_PATH,
  RE_GUIDE_CHAPTERS,
  RE_GUIDE_META,
  RE_GUIDE_PATH,
  RE_GUIDE_READ_PATH,
  realEstateGuideChapterIndex,
  type RealEstateGuideChapter,
} from './realEstateGuideContent';
import GuideReaderShell from './GuideReaderShell';
import './realEstateGuideLanding.css';
import './guideReaderShell.css';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function ChapterBody({ chapter }: { chapter: RealEstateGuideChapter }) {
  return (
    <div className="space-y-0">
      {chapter.sections.map((sec, i) => (
        <div key={`${chapter.id}-${i}`} className="border-t border-white/8 py-6 first:border-t-0 first:pt-0">
          {sec.heading ? (
            <h3 className="reg-serif text-2xl font-semibold text-white md:text-[1.65rem]">{sec.heading}</h3>
          ) : null}
          {sec.paragraphs?.map((p) => (
            <p key={p.slice(0, 48)} className="mt-3 text-[15px] leading-relaxed text-white/72 md:text-base">
              {p}
            </p>
          ))}
          {sec.bullets?.length ? (
            <ul className="mt-4 space-y-2.5">
              {sec.bullets.map((b) => (
                <li key={b} className="flex gap-3 text-[15px] leading-relaxed text-white/70">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300/80" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {sec.script ? (
            <div className="reg-script">
              <div className="reg-script-label">
                <MessagesSquare size={12} /> {sec.script.label}
              </div>
              {sec.script.lines.map((line) => (
                <div
                  key={line.text.slice(0, 48)}
                  className={cn('reg-script-line', line.speaker === 'you' && 'reg-script-line--you')}
                >
                  <span className="reg-script-who">{line.speaker === 'you' ? 'You' : 'Buyer / seller'}</span>
                  <span className="reg-script-text">{line.text}</span>
                </div>
              ))}
            </div>
          ) : null}
          {sec.checklist ? (
            <div className="reg-checklist">
              <div className="reg-checklist-label">{sec.checklist.label}</div>
              <div className="mt-2">
                {sec.checklist.items.map((item) => (
                  <div key={item.slice(0, 48)} className="reg-checklist-item">
                    <span className="reg-checkbox" aria-hidden />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {sec.resources?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {sec.resources.map((res) => {
                if (res.href.startsWith('/')) {
                  return (
                    <Link key={res.href + res.label} to={res.href} className="reg-resource">
                      <span className="reg-resource-label">
                        {res.label} <ArrowRight size={12} />
                      </span>
                      {res.note ? <span className="reg-resource-note">{res.note}</span> : null}
                    </Link>
                  );
                }
                return (
                  <a
                    key={res.href + res.label}
                    href={res.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reg-resource"
                  >
                    <span className="reg-resource-label">
                      {res.label} <ExternalLink size={12} />
                    </span>
                    {res.note ? <span className="reg-resource-note">{res.note}</span> : null}
                  </a>
                );
              })}
            </div>
          ) : null}
          {sec.callout ? <aside className="reg-callout mt-5 rounded-r-xl px-4 py-3 text-sm leading-relaxed">{sec.callout}</aside> : null}
        </div>
      ))}
    </div>
  );
}

export default function RealEstateGuideReaderPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tocOpen, setTocOpen] = useState(false);

  const initialIdx = useMemo(() => {
    const q = params.get('chapter') ?? '';
    return q ? realEstateGuideChapterIndex(q) : 0;
  }, [params]);

  const [chapterIdx, setChapterIdx] = useState(initialIdx);
  useEffect(() => {
    setChapterIdx(initialIdx);
  }, [initialIdx]);

  const chapter = RE_GUIDE_CHAPTERS[chapterIdx] ?? RE_GUIDE_CHAPTERS[0]!;

  const shellChapters = useMemo(
    () =>
      RE_GUIDE_CHAPTERS.map((c) => ({
        id: c.id,
        number: c.number,
        title: c.title,
        teaser: c.kicker || c.subtitle,
      })),
    [],
  );

  usePublicSeoMeta({
    title: `${chapter.title} — ${RE_GUIDE_META.shortTitle}`,
    description: chapter.subtitle,
    path: RE_GUIDE_READ_PATH,
  });

  const goChapter = (idx: number) => {
    const next = Math.max(0, Math.min(RE_GUIDE_CHAPTERS.length - 1, idx));
    setChapterIdx(next);
    setParams({ chapter: RE_GUIDE_CHAPTERS[next]!.id }, { replace: true });
    setTocOpen(false);
  };

  return (
    <GuideReaderShell
      className="reg-page reg-reader-shell selection:bg-[#c99b48]/30"
      chapters={shellChapters}
      chapterIndex={chapterIdx}
      onChapterChange={goChapter}
      tocOpen={tocOpen}
      onTocOpenChange={setTocOpen}
      tocLabel="Contents"
      tocTitle={RE_GUIDE_META.shortTitle}
      tocSubtitle="Real Estate Operator"
      tocFooter={<p className="reg-compliance mt-3">{RE_GUIDE_META.compliance}</p>}
      storageKey="finely.guideReader.realEstate"
      showFlipControls={false}
      atmosphere={
        <>
          <div className="reg-atmosphere pointer-events-none fixed inset-0 z-0" aria-hidden />
          <div className="lm-lux-grain lm-lux-grain--fixed pointer-events-none" aria-hidden />
        </>
      }
      headerClassName="reg-reader-nav"
      headerLeft={
        <button
          type="button"
          onClick={() => navigate(RE_GUIDE_PATH)}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55 hover:text-violet-200"
        >
          <ArrowLeft size={14} /> Guide home
        </button>
      }
      headerRight={
        <>
          <button
            type="button"
            onClick={() => openPublicChat({ goal: 'personal', personaId: 'funding_strategist' })}
            className="reg-ghost-btn inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.14em]"
          >
            <Sparkles size={13} /> Ask Finely
          </button>
          <Link to={RE_CAREERS_PATH} className="reg-primary-btn !py-2 !text-[10px]">
            Join path
          </Link>
        </>
      }
      renderChapter={(i) => {
        const ch = RE_GUIDE_CHAPTERS[i] ?? RE_GUIDE_CHAPTERS[0]!;
        return (
          <article className="reg-sheet overflow-hidden px-5 py-7 md:px-10 md:py-10 lg:px-12">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200/75">{ch.kicker}</span>
              <span className="text-[11px] text-white/40">
                {ch.number} / {String(RE_GUIDE_CHAPTERS.length).padStart(2, '0')}
              </span>
            </div>
            <h1 className="reg-serif mt-3 text-3xl font-semibold leading-tight text-white md:text-4xl">{ch.title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/60">{ch.subtitle}</p>
            <div className="mt-6 h-px bg-gradient-to-r from-violet-300/40 via-white/10 to-transparent" aria-hidden />
            <div className="mt-6">
              <ChapterBody chapter={ch} />
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => goChapter(i - 1)}
                className="reg-ghost-btn inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-[11px] font-black uppercase tracking-[0.14em] disabled:opacity-35"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                type="button"
                disabled={i >= RE_GUIDE_CHAPTERS.length - 1}
                onClick={() => goChapter(i + 1)}
                className="reg-primary-btn disabled:opacity-35"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
            <p className="reg-compliance mt-6">{RE_GUIDE_META.compliance}</p>
          </article>
        );
      }}
    />
  );
}
