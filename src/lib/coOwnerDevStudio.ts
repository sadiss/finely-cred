/**
 * Ruth Dev Studio — code projects, agent specs, and external scaffolds.
 * Browser-safe workspace (localStorage); Ruth authors via ```coowner-dev``` action blocks.
 */

import { newId } from '../utils/ids';
import type { AgentPersonaId } from '../domain/agentPersonas';

export type DevProjectKind = 'site_patch' | 'site_feature' | 'agent_spec' | 'automation_rule' | 'external_app' | 'external_script';

export type CoOwnerDevProject = {
  id: string;
  title: string;
  kind: DevProjectKind;
  language: 'typescript' | 'tsx' | 'javascript' | 'python' | 'sql' | 'markdown';
  purpose: string;
  targetPath?: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  createdBy: 'ruth';
  status: 'draft' | 'ready' | 'exported';
  tags: string[];
};

export type CoOwnerAgentSpec = {
  id: string;
  name: string;
  displayTitle: string;
  primaryRoleId: AgentPersonaId;
  systemPrompt: string;
  toneTags: string[];
  allowedChannels: Array<'chat' | 'email' | 'sms' | 'portal' | 'social'>;
  purpose: string;
  createdAt: string;
  rosterLinked: boolean;
};

const PROJECTS_KEY = 'finely.coowner.devProjects.v1';
const AGENTS_KEY = 'finely.coowner.agentSpecs.v1';

function loadProjects(): CoOwnerDevProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: CoOwnerDevProject[]) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects.slice(-40)));
  } catch {
    /* ignore */
  }
}

function loadAgentSpecs(): CoOwnerAgentSpec[] {
  try {
    const raw = localStorage.getItem(AGENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAgentSpecs(specs: CoOwnerAgentSpec[]) {
  try {
    localStorage.setItem(AGENTS_KEY, JSON.stringify(specs.slice(-30)));
  } catch {
    /* ignore */
  }
}

export function listCoOwnerDevProjects(): CoOwnerDevProject[] {
  return loadProjects().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listCoOwnerAgentSpecs(): CoOwnerAgentSpec[] {
  return loadAgentSpecs().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getCoOwnerDevStudioStats() {
  const projects = listCoOwnerDevProjects();
  const agents = listCoOwnerAgentSpecs();
  return {
    projects: projects.length,
    agentSpecs: agents.length,
    exportsReady: projects.filter((p) => p.status === 'ready' || p.status === 'exported').length,
    sitePatches: projects.filter((p) => p.kind === 'site_patch' || p.kind === 'site_feature').length,
    external: projects.filter((p) => p.kind === 'external_app' || p.kind === 'external_script').length,
  };
}

export function upsertCoOwnerDevProject(input: Omit<CoOwnerDevProject, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): CoOwnerDevProject {
  const now = new Date().toISOString();
  const projects = loadProjects();
  const existing = input.id ? projects.find((p) => p.id === input.id) : undefined;
  const project: CoOwnerDevProject = {
    id: existing?.id ?? input.id ?? newId('devproj'),
    title: input.title.trim(),
    kind: input.kind,
    language: input.language,
    purpose: input.purpose.trim(),
    targetPath: input.targetPath?.trim(),
    code: input.code,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    createdBy: 'ruth',
    status: input.status ?? 'draft',
    tags: input.tags ?? [],
  };
  const next = existing ? projects.map((p) => (p.id === project.id ? project : p)) : [project, ...projects];
  saveProjects(next);
  return project;
}

export function upsertCoOwnerAgentSpec(input: Omit<CoOwnerAgentSpec, 'id' | 'createdAt' | 'rosterLinked'> & { id?: string; rosterLinked?: boolean }): CoOwnerAgentSpec {
  const specs = loadAgentSpecs();
  const existing = input.id ? specs.find((s) => s.id === input.id) : undefined;
  const spec: CoOwnerAgentSpec = {
    id: existing?.id ?? input.id ?? newId('agentspec'),
    name: input.name.trim(),
    displayTitle: input.displayTitle.trim(),
    primaryRoleId: input.primaryRoleId,
    systemPrompt: input.systemPrompt.trim(),
    toneTags: input.toneTags ?? [],
    allowedChannels: input.allowedChannels ?? ['chat', 'portal'],
    purpose: input.purpose.trim(),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    rosterLinked: input.rosterLinked ?? false,
  };
  const next = existing ? specs.map((s) => (s.id === spec.id ? spec : s)) : [spec, ...specs];
  saveAgentSpecs(next);
  return spec;
}

export function exportDevProjectAsFile(project: CoOwnerDevProject): { filename: string; mime: string; content: string } {
  const ext =
    project.language === 'tsx' ? 'tsx' :
    project.language === 'typescript' ? 'ts' :
    project.language === 'javascript' ? 'js' :
    project.language === 'python' ? 'py' :
    project.language === 'sql' ? 'sql' : 'md';
  const base = project.targetPath?.split('/').pop()?.replace(/\.\w+$/, '') ?? project.title.toLowerCase().replace(/\s+/g, '-');
  return {
    filename: `${base}.${ext}`,
    mime: 'text/plain',
    content: project.code,
  };
}

export const CO_OWNER_DEV_STUDIO_SCAFFOLDS = {
  site_feature: `// Finely Cred feature module — Ruth Dev Studio
import React from 'react';

export function NewFeaturePanel() {
  return (
    <div className="rounded-2xl border border-violet-200/40 p-5">
      <h2 className="text-lg font-semibold">Feature title</h2>
      <p className="text-sm opacity-80">Purpose-driven UI wired to existing repos.</p>
    </div>
  );
}
`,
  external_script: `#!/usr/bin/env node
/** External utility — purpose-built outside Finely Cred */
async function main() {
  console.log('Ruth-authored external script');
}
main().catch(console.error);
`,
  agent_spec: `You are a specialist agent at Finely Cred. Purpose: [fill]. Tone: plain, validation-first, educational only.`,
} as const;

export function summarizeDevStudioForCoOwner(): string {
  const stats = getCoOwnerDevStudioStats();
  const recent = listCoOwnerDevProjects().slice(0, 4);
  const agents = listCoOwnerAgentSpecs().slice(0, 3);
  return [
    `DEV STUDIO: ${stats.projects} projects (${stats.sitePatches} site · ${stats.external} external) · ${stats.agentSpecs} agent specs`,
    recent.length ? `Recent projects: ${recent.map((p) => `${p.title} [${p.kind}]`).join(' · ')}` : 'No projects yet — Ruth can author via coowner-dev blocks.',
    agents.length ? `Agent specs: ${agents.map((a) => a.displayTitle).join(' · ')}` : '',
  ].filter(Boolean).join('\n');
}
