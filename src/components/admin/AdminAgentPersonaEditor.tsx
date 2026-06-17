import React, { useMemo, useState } from 'react';
import { Bot, Save, Sparkles, Wand2 } from 'lucide-react';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import { AGENT_PERSONAS } from '../../domain/agentPersonas';
import {
  getPersonaOverride,
  upsertPersonaOverride,
  type AgentPersonaOverride,
} from '../../data/agentPersonaOverridesRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

function splitCsv(s: string): string[] {
  return s.split(/[,;|]+/).map((x) => x.trim()).filter(Boolean);
}

function joinCsv(arr?: string[]): string {
  return (arr ?? []).join(', ');
}

export function AdminAgentPersonaEditor() {
  const [personaId, setPersonaId] = useState<AgentPersonaId>('support_specialist');
  const [notice, setNotice] = useState<string | null>(null);
  const base = useMemo(() => AGENT_PERSONAS.find((p) => p.id === personaId)!, [personaId]);
  const existing = useMemo(() => getPersonaOverride(personaId), [personaId, notice]);

  const [draft, setDraft] = useState<Partial<AgentPersonaOverride>>({});

  React.useEffect(() => {
    setDraft({
      displayName: existing?.displayName ?? base.name,
      displayTitle: existing?.displayTitle ?? base.displayTitle,
      personalityTraits: existing?.personalityTraits ?? base.toneTags,
      capabilities: existing?.capabilities ?? [],
      superPowers: existing?.superPowers ?? [],
      languages: existing?.languages ?? ['en', 'ht'],
      maxReplyWords: existing?.maxReplyWords ?? 90,
      typingDelayMs: existing?.typingDelayMs ?? 1200,
      promptAddendum: existing?.promptAddendum ?? '',
    });
  }, [personaId, existing, base]);

  const save = () => {
    upsertPersonaOverride({
      personaId,
      displayName: draft.displayName,
      displayTitle: draft.displayTitle,
      personalityTraits: draft.personalityTraits,
      capabilities: draft.capabilities,
      superPowers: draft.superPowers,
      languages: draft.languages,
      maxReplyWords: draft.maxReplyWords,
      typingDelayMs: draft.typingDelayMs,
      promptAddendum: draft.promptAddendum,
    });
    setNotice('Agent traits saved — public & portal chat will use these immediately.');
    window.setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
      <div className="flex items-center gap-2">
        <Wand2 size={18} className="text-violet-300" />
        <div className={FINELY_OS_ENTITY_VALUE}>Edit agent traits & super powers</div>
      </div>
      <p className={FINELY_OS_ENTITY_BODY}>
        Tune personality, capabilities, languages (Kreyòl Ayisyen supported), reply length, and custom instructions — no deploy required.
      </p>

      {notice ? <div className="text-emerald-300 text-sm">{notice}</div> : null}

      <div>
        <label className={FINELY_OS_ENTITY_SUBLABEL}>Agent role</label>
        <select
          value={personaId}
          onChange={(e) => setPersonaId(e.target.value as AgentPersonaId)}
          className={FINELY_OS_ENTITY_SELECT}
        >
          {AGENT_PERSONAS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayTitle} ({p.id})
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Display name</label>
          <input
            value={draft.displayName ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
            className={FINELY_OS_ENTITY_INPUT}
          />
        </div>
        <div>
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Title</label>
          <input
            value={draft.displayTitle ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, displayTitle: e.target.value }))}
            className={FINELY_OS_ENTITY_INPUT}
          />
        </div>
      </div>

      <div>
        <label className={FINELY_OS_ENTITY_SUBLABEL}>Personality traits (comma-separated)</label>
        <input
          value={joinCsv(draft.personalityTraits)}
          onChange={(e) => setDraft((d) => ({ ...d, personalityTraits: splitCsv(e.target.value) }))}
          placeholder="warm, patient, Haitian-community aware"
          className={FINELY_OS_ENTITY_INPUT}
        />
      </div>

      <div>
        <label className={FINELY_OS_ENTITY_SUBLABEL}>Capabilities (comma-separated)</label>
        <input
          value={joinCsv(draft.capabilities)}
          onChange={(e) => setDraft((d) => ({ ...d, capabilities: splitCsv(e.target.value) }))}
          placeholder="disputes, portal navigation, appointment booking"
          className={FINELY_OS_ENTITY_INPUT}
        />
      </div>

      <div>
        <label className={FINELY_OS_ENTITY_SUBLABEL}>Super powers (comma-separated)</label>
        <input
          value={joinCsv(draft.superPowers)}
          onChange={(e) => setDraft((d) => ({ ...d, superPowers: splitCsv(e.target.value) }))}
          placeholder="Kreyòl fluency, debt validation expert, funding readiness"
          className={FINELY_OS_ENTITY_INPUT}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Languages</label>
          <select
            multiple
            value={draft.languages ?? ['en', 'ht']}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((o) => o.value as 'en' | 'ht' | 'fr');
              setDraft((d) => ({ ...d, languages: selected.length ? selected : ['en'] }));
            }}
            className={`${FINELY_OS_ENTITY_SELECT} min-h-[88px]`}
          >
            <option value="en">English</option>
            <option value="ht">Kreyòl Ayisyen</option>
            <option value="fr">Français</option>
          </select>
        </div>
        <div>
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Max reply words</label>
          <input
            type="number"
            min={40}
            max={200}
            value={draft.maxReplyWords ?? 90}
            onChange={(e) => setDraft((d) => ({ ...d, maxReplyWords: Number(e.target.value) }))}
            className={FINELY_OS_ENTITY_INPUT}
          />
        </div>
        <div>
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Typing delay (ms)</label>
          <input
            type="number"
            min={400}
            max={4000}
            value={draft.typingDelayMs ?? 1200}
            onChange={(e) => setDraft((d) => ({ ...d, typingDelayMs: Number(e.target.value) }))}
            className={FINELY_OS_ENTITY_INPUT}
          />
        </div>
      </div>

      <div>
        <label className={FINELY_OS_ENTITY_SUBLABEL}>Custom instructions (appended to system prompt)</label>
        <textarea
          rows={4}
          value={draft.promptAddendum ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, promptAddendum: e.target.value }))}
          placeholder="Extra behavior rules for this agent…"
          className={FINELY_OS_ENTITY_INPUT}
        />
      </div>

      <details className="text-xs">
        <summary className={`cursor-pointer ${FINELY_OS_ENTITY_VALUE}`}>Base system prompt (read-only)</summary>
        <pre className={`mt-2 whitespace-pre-wrap ${FINELY_OS_ENTITY_BODY} bg-black/20 p-3 rounded-lg max-h-40 overflow-y-auto`}>
          {base.systemPrompt}
        </pre>
      </details>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={save} className={FINELY_OS_PRIMARY_BTN}>
          <Save size={14} /> Save agent traits
        </button>
        <button
          type="button"
          onClick={() => {
            upsertPersonaOverride({ personaId, personalityTraits: [], capabilities: [], superPowers: [], promptAddendum: '' });
            setNotice('Reset to code defaults for this role.');
          }}
          className={FINELY_OS_SECONDARY_BTN}
        >
          Reset overrides
        </button>
      </div>
    </div>
  );
}
