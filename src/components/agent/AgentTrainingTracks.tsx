import React from 'react';
import { BookOpen, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AgentSpecialtyId } from '../../domain/agentProgram';
import { AGENT_SPECIALTIES, getTrainingModulesForSpecialties } from '../../domain/agentProgram';

export function AgentTrainingTracks({ specialties }: { specialties: AgentSpecialtyId[] }) {
  const navigate = useNavigate();
  const modules = getTrainingModulesForSpecialties(specialties.length ? specialties : ['personal_restore']);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">Training academy</div>
        <p className="mt-1 text-white/55 text-sm">
          Structured paths for your specialties. Complete modules to graduate from Apprenticeship toward Certified Partner pricing.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(specialties.length ? specialties : (['personal_restore'] as AgentSpecialtyId[])).map((id) => {
          const spec = AGENT_SPECIALTIES.find((s) => s.id === id);
          return (
            <span key={id} className="px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-[10px] font-black uppercase tracking-widest text-amber-100">
              {spec?.label ?? id}
            </span>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {modules.map((mod) => (
          <div key={mod.id} className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <BookOpen size={16} />
                <span className="text-sm font-semibold text-white">{mod.title}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/40">
                <Clock size={12} /> ~{mod.estimatedHours}h
              </span>
            </div>
            <p className="text-white/55 text-sm">{mod.description}</p>
            <ul className="space-y-1.5">
              {mod.checklist.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-white/65">
                  <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => navigate('/portal/courses')}
                className="inline-flex items-center gap-2 px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.06]"
              >
                Open courses <ExternalLink size={12} />
              </button>
              {mod.hubPath ? (
                <button
                  type="button"
                  onClick={() => navigate(mod.hubPath!)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/25 bg-amber-500/10 text-[10px] font-black uppercase tracking-widest text-amber-100"
                >
                  Practice in app
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
