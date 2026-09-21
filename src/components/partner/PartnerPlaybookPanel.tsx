import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { getPlaybookTemplate, PARTNER_PLAYBOOK_TEMPLATES, type PlaybookTemplateId } from '../../domain/partnerPlaybook';
import {
  getPartnerPlaybook,
  setPartnerPlaybookTemplate,
  togglePartnerPlaybookStage,
} from '../../data/partnerPlaybookRepo';
import { FC_CARD_GRID, FC_PAGE_SECTION, FC_SURFACE_CARD } from '../../styles/layoutSurfaces';

export function PartnerPlaybookPanel({ partnerId, partnerName }: { partnerId: string; partnerName: string }) {
  const [version, setVersion] = useState(0);
  const state = useMemo(() => getPartnerPlaybook(partnerId), [partnerId, version]);
  const templateId = state?.templateId ?? 'anna_apparel_design_tech';
  const template = getPlaybookTemplate(templateId);

  return (
    <div className={FC_PAGE_SECTION}>
      <div className="rounded-2xl border border-[#fbbf24]/30 bg-[#0b1110] p-6 space-y-4">
        <div className="flex items-center gap-2 text-[#fbbf24] text-xs font-black uppercase tracking-widest">
          <BookOpen size={16} /> Partner journey template
        </div>
        <p className="text-white/75 text-sm">
          Coaching stages for <strong className="text-white">{partnerName}</strong> — reusable for other verticals. See{' '}
          <span className="font-mono text-white/80">docs/partners/ANNA-CHARLOTIN-PLAYBOOK.md</span>.
        </p>
        <label className="block text-sm text-white/70">
          Template
          <select
            value={templateId}
            onChange={(e) => {
              setPartnerPlaybookTemplate(partnerId, e.target.value as PlaybookTemplateId);
              setVersion((v) => v + 1);
            }}
            className="mt-2 w-full max-w-md rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white"
          >
            {PARTNER_PLAYBOOK_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <p className="text-white/60 text-xs">{template.vertical}</p>
      </div>

      <div className={FC_CARD_GRID + ' lg:grid-cols-1'}>
        {template.stages.map((stage) => {
          const done = Boolean(state?.stageDone?.[stage.id]);
          return (
            <div key={stage.id} className={FC_SURFACE_CARD + ' space-y-4'}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{stage.title}</h3>
                  <p className="text-white/75 text-sm mt-1">{stage.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    togglePartnerPlaybookStage(partnerId, stage.id, !done);
                    setVersion((v) => v + 1);
                  }}
                  className="shrink-0 text-[#fbbf24]"
                  aria-label={done ? 'Mark incomplete' : 'Mark done'}
                >
                  {done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>
              </div>
              <ul className="list-disc pl-5 text-white/75 text-sm space-y-1">
                {stage.checklist.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              {stage.verticalNotes ? (
                <div className="text-xs text-white/60 border-t border-white/10 pt-3">
                  {Object.entries(stage.verticalNotes).map(([k, v]) => (
                    <div key={k}><span className="text-[#fbbf24]">{k}:</span> {v}</div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className={FC_SURFACE_CARD}>
        <div className="text-[10px] uppercase tracking-widest text-white/55 font-bold">Reading list (honest books)</div>
        <ul className="mt-3 list-disc pl-5 text-white/75 text-sm space-y-1">
          {template.readingList.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <Link to="/business/dashboard" className="inline-block mt-4 text-[#fbbf24] text-sm font-semibold underline">
          Open business portal journey
        </Link>
      </div>
    </div>
  );
}
