import React, { useMemo, useState } from 'react';
import { Code2, Bot, Download, Copy, Sparkles } from 'lucide-react';
import {
  exportDevProjectAsFile,
  listCoOwnerAgentSpecs,
  listCoOwnerDevProjects,
  getCoOwnerDevStudioStats,
} from '../../lib/coOwnerDevStudio';
import { runCoOwnerAutomation } from '../../lib/coOwnerOperatorEngine';
import { CO_OWNER_IDENTITY } from '../../domain/coOwnerPersona';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type Props = {
  onRunPrompt?: (prompt: string) => void;
  onActionExecuted?: (message: string) => void;
};

export function CoOwnerDevStudioPanel({ onRunPrompt, onActionExecuted }: Props) {
  const stats = getCoOwnerDevStudioStats();
  const projects = listCoOwnerDevProjects();
  const agents = listCoOwnerAgentSpecs();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const downloadProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const file = exportDevProjectAsFile(project);
    const blob = new Blob([file.content], { type: file.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);
    onActionExecuted?.(`Exported ${file.filename}`);
  };

  const runDev = (executeKey: string, label: string) => {
    const res = runCoOwnerAutomation(executeKey);
    onActionExecuted?.(res.message || label);
    if (res.prompt && onRunPrompt) onRunPrompt(res.prompt);
  };

  const studioPrompts = useMemo(
    () => [
      'Dev Studio: write a complete site feature component for validation clock badges on partner disputes — save via coowner-dev.',
      'Dev Studio: create an external TypeScript utility to export anonymized partner metrics — medium size, purposeful.',
      'Agent factory: design a Summons Response Specialist agent with roster hire — coowner-dev block.',
    ],
    [],
  );

  return (
    <div id="dev-studio" className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className={finelyOsStatusChip('ok')}>{stats.projects} code projects</span>
        <span className={finelyOsStatusChip('warn')}>{stats.agentSpecs} agent specs</span>
        <span className={finelyOsStatusChip('ok')}>{stats.sitePatches} site · {stats.external} external</span>
      </div>

      <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
          <Code2 size={16} /> Ruth Dev Studio — site code + external projects + agent factory
        </div>
        <p className={`${FINELY_OS_ENTITY_BODY} text-sm leading-relaxed`}>
          {CO_OWNER_IDENTITY.name} authors complete, purposeful code here — Finely Cred features, automation modules,
          and medium external scripts. Ask her to save via <code className="text-violet-300">coowner-dev</code> blocks;
          export or copy when ready.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => runDev('code_studio', 'Dev Studio')}>
            <Code2 size={14} /> Open Dev Studio session
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => runDev('create_agent', 'Agent factory')}>
            <Bot size={14} /> Create agent
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => runDev('site_map_scan', 'Site map')}>
            <Sparkles size={14} /> Site map scan
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-3`}>
          <div className={FINELY_OS_ENTITY_VALUE}>Code projects</div>
          {!projects.length ? (
            <p className={FINELY_OS_ENTITY_BODY}>
              No projects yet. Ask {CO_OWNER_IDENTITY.name} to write site or external code — she saves here automatically.
            </p>
          ) : (
            projects.slice(0, 8).map((p) => (
              <div key={p.id} className={`${finelyOsCatalogCard('sky')} !p-4 space-y-2`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{p.title}</div>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>
                      {p.kind} · {p.language} · {p.status}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyCode(p.id, p.code)} title="Copy code">
                      <Copy size={12} /> {copiedId === p.id ? 'Copied' : 'Copy'}
                    </button>
                    <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => downloadProject(p.id)} title="Download">
                      <Download size={12} />
                    </button>
                  </div>
                </div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-xs line-clamp-2`}>{p.purpose}</p>
                {p.targetPath ? <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs truncate`}>{p.targetPath}</div> : null}
              </div>
            ))
          )}
        </div>

        <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-3`}>
          <div className={FINELY_OS_ENTITY_VALUE}>Agent specs</div>
          {!agents.length ? (
            <p className={FINELY_OS_ENTITY_BODY}>No agent specs yet — use Agent factory or ask Ruth in chat.</p>
          ) : (
            agents.slice(0, 6).map((a) => (
              <div key={a.id} className={`${finelyOsCatalogCard('emerald')} !p-4`}>
                <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{a.displayTitle}</div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>{a.primaryRoleId} · {a.name}</div>
                <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-xs line-clamp-2`}>{a.purpose}</p>
              </div>
            ))
          )}
          <div className="space-y-2 pt-2">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Quick Dev Studio prompts</div>
            {studioPrompts.map((prompt) => (
              <button
                key={prompt.slice(0, 40)}
                type="button"
                className={`${FINELY_OS_SECONDARY_BTN} w-full text-left !text-xs`}
                onClick={() => onRunPrompt?.(prompt)}
              >
                {prompt.slice(0, 72)}…
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
