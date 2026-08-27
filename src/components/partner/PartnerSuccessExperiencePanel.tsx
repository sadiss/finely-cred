import React, { useMemo, useState } from 'react';
import { ArrowRight, GraduationCap, MessageSquareHeart, Star, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  modulesForLane,
  type PartnerSuccessLane,
  type PartnerSuccessModule,
  type PartnerSuccessModuleType,
} from '../../domain/partnerSuccessExperience';
import {
  dismissPartnerSuccessModule,
  getPartnerSuccessRecord,
  listPartnerSuccessRecords,
  upsertPartnerSuccessRecord,
} from '../../data/partnerSuccessExperienceRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const TYPE_ICON: Record<PartnerSuccessModuleType, React.ComponentType<{ size?: number; className?: string }>> = {
  quiz: GraduationCap,
  review: Star,
  checklist: Trophy,
  survey: MessageSquareHeart,
  milestone: Trophy,
  training: GraduationCap,
  certificate: Trophy,
};

type Props = {
  partnerId: string;
  lane: PartnerSuccessLane;
  compact?: boolean;
};

const PILL_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

/** Solid accent chip — the reference cards read as designed because the icon is a filled chip, not tinted glyph. */
const PILL_CHIP: Record<(typeof PILL_ACCENTS)[number], string> = {
  emerald: 'bg-emerald-600 ring-emerald-300/40',
  violet: 'bg-violet-600 ring-violet-300/40',
  sky: 'bg-sky-600 ring-sky-300/40',
  rose: 'bg-rose-600 ring-rose-300/40',
};

function PillModule({
  mod,
  partnerId,
  accent,
  onChange,
}: {
  mod: PartnerSuccessModule;
  partnerId: string;
  accent: (typeof PILL_ACCENTS)[number];
  onChange: () => void;
}) {
  const navigate = useNavigate();
  const record = getPartnerSuccessRecord(partnerId, mod.id);
  const done = Boolean(record?.completedAt);
  const Icon = TYPE_ICON[mod.type];
  const [expanded, setExpanded] = useState(false);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [rating, setRating] = useState(record?.reviewRating ?? 0);
  const family = done ? 'emerald' : accent;

  return (
    <div
      className={`${finelyOsCatalogCard(family)} !p-6 min-w-[240px] max-w-sm shrink-0`}
      data-accent={family}
    >
      <div className="flex items-start gap-3">
        <span
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white ring-1 ${PILL_CHIP[family]}`}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-base font-extrabold text-slate-900 leading-snug">{mod.title}</div>
          <p className={`text-sm mt-1 line-clamp-2 ${FINELY_OS_ENTITY_BODY}`}>{mod.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {(mod.type === 'quiz' || mod.type === 'review') && !done ? (
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Close' : mod.type === 'quiz' ? 'Quick quiz' : 'Rate'}
          </button>
        ) : null}
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(mod.hubPath)}>
          Open <ArrowRight size={10} />
        </button>
        {mod.type === 'training' && mod.trainingLessonId ? (
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => navigate(`/portal/training?lesson=${mod.trainingLessonId}`)}
          >
            Academy <GraduationCap size={10} />
          </button>
        ) : null}
        {!done ? (
          <button
            type="button"
            className="text-sm font-bold text-slate-500 hover:text-slate-800"
            onClick={() => {
              dismissPartnerSuccessModule(partnerId, mod.id);
              onChange();
            }}
          >
            Dismiss
          </button>
        ) : null}
      </div>
      {expanded && mod.type === 'quiz' && mod.quiz?.[0] ? (
        <div className="mt-3 space-y-2 border-t border-black/10 pt-3">
          <p className="text-xs text-slate-700">{mod.quiz[0].question}</p>
          {mod.quiz[0].options.map((opt, i) => (
            <label key={opt} className="flex items-center gap-2 text-xs text-slate-600">
              <input type="radio" checked={quizPick === i} onChange={() => setQuizPick(i)} />
              {opt}
            </label>
          ))}
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            disabled={quizPick === null}
            onClick={() => {
              const score = quizPick === mod.quiz![0]!.correctIndex ? 100 : 0;
              upsertPartnerSuccessRecord(partnerId, { moduleId: mod.id, quizScore: score });
              onChange();
              setExpanded(false);
            }}
          >
            Submit
          </button>
        </div>
      ) : null}
      {expanded && mod.type === 'review' ? (
        <div className="mt-3 border-t border-black/10 pt-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`p-1 rounded ${rating >= n ? 'text-amber-600' : 'text-slate-300'}`}
            >
              <Star size={12} fill={rating >= n ? 'currentColor' : 'none'} />
            </button>
          ))}
          <button
            type="button"
            className={`${FINELY_OS_SECONDARY_BTN} ml-2`}
            disabled={rating < 1}
            onClick={() => {
              upsertPartnerSuccessRecord(partnerId, { moduleId: mod.id, reviewRating: rating });
              onChange();
              setExpanded(false);
            }}
          >
            Send
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function PartnerSuccessExperiencePanel({ partnerId, lane, compact }: Props) {
  const [version, setVersion] = useState(0);
  const modules = useMemo(() => modulesForLane(lane), [lane]);
  const records = useMemo(() => listPartnerSuccessRecords(partnerId), [partnerId, version]);
  const pending = modules.filter((m) => !records.find((r) => r.moduleId === m.id && (r.completedAt || r.dismissedAt)));
  const shown = compact ? pending.slice(0, 4) : pending.slice(0, 6);

  if (shown.length === 0 && compact) return null;

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-violet-700">Partner success</p>
        <h3 className="text-xl font-black text-slate-900">{compact ? 'Quick wins' : 'Quizzes & check-ins'}</h3>
      </div>
      <div className={`flex gap-3 overflow-x-auto pb-2 ${compact ? '' : 'flex-wrap'}`}>
        {(shown.length ? shown : modules.slice(0, 2)).map((mod, i) => (
          <PillModule
            key={mod.id}
            mod={mod}
            partnerId={partnerId}
            accent={PILL_ACCENTS[i % PILL_ACCENTS.length]!}
            onChange={() => setVersion((v) => v + 1)}
          />
        ))}
      </div>
    </div>
  );
}
