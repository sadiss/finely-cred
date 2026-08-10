import React, { useEffect, useState } from 'react';
import { loadJson, saveJson } from '../../data/localJsonStore';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, finelyOsCatalogCardCompact } from '../os/finelyOsLightUi';

const KEY = 'finely.growth_daily_playbook.v1';

type PlaybookState = {
  date: string;
  steps: Record<string, boolean>;
};

const STEPS = [
  { id: 'results', label: 'Open Results — check booked calls and signups' },
  { id: 'find', label: 'Find new people or clear Review people' },
  { id: 'contact', label: "Send Today's 10 or paste a guide link" },
  { id: 'board', label: 'Move people on the Board (New → Talking → Booked)' },
  { id: 'label', label: 'Mark good fit / wrong fit when reviewing (helps learning)' },
] as const;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): PlaybookState {
  const raw = loadJson<PlaybookState>(KEY, { date: '', steps: {} }, 1);
  if (raw.date !== todayKey()) return { date: todayKey(), steps: {} };
  return raw;
}

export function GrowthDailyPlaybook() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    const onStore = () => setState(loadState());
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const toggle = (id: string) => {
    const next = { ...state, steps: { ...state.steps, [id]: !state.steps[id] } };
    saveJson(KEY, next, 1);
    setState(next);
  };

  const done = STEPS.filter((s) => state.steps[s.id]).length;

  return (
    <div className={finelyOsCatalogCardCompact('violet')}>
      <div className="flex items-center justify-between gap-2">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Daily checklist (about 15 min)</div>
        <span className="text-xs text-white/60">
          {done}/{STEPS.length}
        </span>
      </div>
      <ul className={`mt-3 space-y-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
        {STEPS.map((s) => (
          <li key={s.id}>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(state.steps[s.id])}
                onChange={() => toggle(s.id)}
                className="mt-1 accent-violet-500"
              />
              <span className={state.steps[s.id] ? 'text-white/50 line-through' : 'text-white/90'}>{s.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
