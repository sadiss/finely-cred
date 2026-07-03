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
import { FINELY_OS_ENTITY_BODY, FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';

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

function PillModule({
  mod,
  partnerId,
  onChange,
}: {
  mod: PartnerSuccessModule;
  partnerId: string;
  onChange: () => void;
}) {
  const navigate = useNavigate();
  const record = getPartnerSuccessRecord(partnerId, mod.id);
  const done = Boolean(record?.completedAt);
  const Icon = TYPE_ICON[mod.type];
  const [expanded, setExpanded] = useState(false);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [rating, setRating] = useState(record?.reviewRating ?? 0);

  return (
    <div className={`rounded-xl border ${done ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-white/10 bg-black/30'} p-3 min-w-[200px] max-w-sm shrink-0`}>
      <div className="flex items-start gap-2">
        <Icon size={16} className={done ? 'text-emerald-300' : 'text-violet-300'} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-white leading-snug">{mod.title}</div>
          <p className={`text-[11px] mt-1 line-clamp-2 ${FINELY_OS_ENTITY_BODY}`}>{mod.description}</p>
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
            className="text-[9px] text-white/30 hover:text-white/50"
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
        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs text-white/75">{mod.quiz[0].question}</p>
          {mod.quiz[0].options.map((opt, i) => (
            <label key={opt} className="flex items-center gap-2 text-xs text-white/70">
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
        <div className="mt-3 border-t border-white/10 pt-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`p-1 rounded ${rating >= n ? 'text-amber-300' : 'text-white/25'}`}
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
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300/80">Partner success</p>
        <h3 className="text-sm font-black text-white">{compact ? 'Quick wins' : 'Quizzes & check-ins'}</h3>
      </div>
      <div className={`flex gap-3 overflow-x-auto pb-2 ${compact ? '' : 'flex-wrap'}`}>
        {(shown.length ? shown : modules.slice(0, 2)).map((mod) => (
          <PillModule key={mod.id} mod={mod} partnerId={partnerId} onChange={() => setVersion((v) => v + 1)} />
        ))}
      </div>
    </div>
  );
}
