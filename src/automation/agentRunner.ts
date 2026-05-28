import type { AutomationRule } from '../domain/automationStudio';
import type { AgentMode, AutomationRunLog } from '../domain/automationStudio';
import { newId } from '../utils/ids';
import { listPartners, upsertPartner } from '../data/partnersRepo';
import { listTasksByPartner, createTask } from '../data/tasksRepo';
import { upsertTask, setTaskStatus } from '../data/tasksRepo';
import { addTaskComment } from '../data/taskCommentsRepo';
import { listInvitesByPartner, upsertInvite } from '../data/invitesRepo';
import { getActiveBundleActivation } from '../data/productsRepo';
import { runWorkflow } from './runWorkflows';
import { addAutomationRun, listAutomationRules, upsertAutomationRule } from '../data/automationStudioRepo';
import { addDaysIso, nowIso } from '../domain/cases';
import { isFeatureEnabled } from '../data/settingsRepo';
import { sendInviteEmail, sendInviteSms } from '../lib/inviteDeliveryClient';
import { getCommsTemplate, hasRecentCommsSend } from '../data/commsRepo';
import { sendEmailFromTemplate, sendPortalFromTemplate, sendSmsFromTemplate } from '../lib/commsEngine';
import { addProjectNote, createProject, listProjectsByPartner, setProjectStage, setProjectStatus, upsertProject } from '../data/projectsRepo';
import { createNotification } from '../data/notificationsRepo';

function safeNum(n: any, fallback: number) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function hasOpenTasks(partnerId: string, min = 1) {
  const tasks = listTasksByPartner(partnerId);
  const open = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  return open >= min;
}

function hasUnclaimedInvite(partnerId: string, olderThanHours = 0) {
  const invs = listInvitesByPartner(partnerId);
  const now = Date.now();
  return (
    invs.find((i) => {
      if (i.claimedAt) return false;
      // Prevent spam: if already sent recently, skip for 24h by default.
      if (i.sentAt) {
        const sentAgeH = (now - Date.parse(i.sentAt)) / (1000 * 60 * 60);
        if (Number.isFinite(sentAgeH) && sentAgeH < 24) return false;
      }
      if (!olderThanHours) return true;
      const ageH = (now - Date.parse(i.createdAt)) / (1000 * 60 * 60);
      return ageH >= olderThanHours;
    }) ?? null
  );
}

function shouldRunForPartner(rule: AutomationRule, partner: any): boolean {
  for (const c of rule.conditions || []) {
    if (c.type === 'always') continue;
    if (c.type === 'partner_lane_in') {
      const lane = partner.lane ?? 'other';
      if (!c.lanes.includes(lane)) return false;
      continue;
    }
    if (c.type === 'partner_stage_in') {
      const stage = partner.journeyStage ?? 'intake';
      if (!c.stages.includes(stage)) return false;
      continue;
    }
    if (c.type === 'has_open_tasks') {
      if (!hasOpenTasks(partner.id, safeNum(c.minOpenTasks, 1))) return false;
      continue;
    }
    if (c.type === 'has_unclaimed_invite') {
      const inv = hasUnclaimedInvite(partner.id, safeNum(c.olderThanHours, 0));
      if (!inv) return false;
      continue;
    }
    if (c.type === 'has_active_bundle') {
      const act = getActiveBundleActivation(partner.id, c.bundleId as any);
      if (!act) return false;
      continue;
    }
  }
  return true;
}

export function isAutomationRuleDue(rule: AutomationRule, nowMs = Date.now()): boolean {
  if (!rule.enabled) return false;
  const trig = rule.trigger;
  if (!trig) return false;
  if (trig.type === 'manual') return false;
  if (trig.type === 'interval') {
    const everyH = safeNum(trig.everyHours, 24);
    const everyMs = Math.max(1, everyH) * 60 * 60 * 1000;
    const last = (rule.meta as any)?.lastRunAt as string | undefined;
    if (!last) return true;
    const lastMs = Date.parse(last);
    if (!Number.isFinite(lastMs)) return true;
    return nowMs - lastMs >= everyMs;
  }
  return false;
}

function anyMatch(hay: string[] | undefined, needles: string[] | undefined): boolean {
  if (!needles?.length) return true;
  const set = new Set((hay ?? []).map((x) => String(x).toLowerCase()));
  return needles.some((n) => set.has(String(n).toLowerCase()));
}

export async function runAutomationRule(rule: AutomationRule, mode: AgentMode): Promise<AutomationRunLog> {
  const startedAt = nowIso();
  const actions: AutomationRunLog['actions'] = [];

  const partners = await listPartners();
  const candidates = partners.filter((p) => rule.enabled && shouldRunForPartner(rule, p));

  for (const a of rule.actions || []) {
    if (a.type === 'send_comms_template') {
      const tpl = getCommsTemplate(a.templateId);
      if (!tpl) {
        actions.push({ type: 'warn', message: `Comms template not found: ${a.templateId}` });
        continue;
      }
      if (!tpl.enabled) {
        actions.push({ type: 'info', message: `Comms template disabled: ${tpl.name}` });
        continue;
      }

      const max = safeNum(a.maxPerRun, 50);
      const dedupeH = safeNum(a.dedupeWithinHours, 24);
      let sent = 0;

      for (const p of candidates) {
        if (sent >= max) break;
        if (dedupeH > 0 && hasRecentCommsSend({ templateId: tpl.id, partnerId: p.id, withinHours: dedupeH })) {
          continue;
        }
        const channel = a.channel ?? tpl.channel;
        const dry = mode !== 'live';
        if (channel === 'portal') {
          const res = sendPortalFromTemplate({ template: tpl, partner: p, dryRun: dry });
          actions.push({
            type: res.ok ? 'info' : 'warn',
            message: `${dry ? 'Would send' : 'Sent'} portal message: ${res.log.subject}`,
            meta: { templateId: tpl.id, partnerId: p.id, status: res.log.status },
          });
          if (res.ok) sent += 1;
        } else if (channel === 'email') {
          if (!dry && !isFeatureEnabled('commsDelivery')) {
            actions.push({ type: 'warn', message: `Comms delivery disabled. Skipping email for ${p.id}.`, meta: { templateId: tpl.id } });
            continue;
          }
          // eslint-disable-next-line no-await-in-loop
          const res = await sendEmailFromTemplate({ template: tpl, partner: p, dryRun: dry });
          actions.push({
            type: res.ok ? 'info' : 'warn',
            message: `${dry ? 'Would send' : 'Sent'} email: ${res.log.subject ?? tpl.name}`,
            meta: { templateId: tpl.id, partnerId: p.id, status: res.log.status, to: res.log.to },
          });
          if (res.ok) sent += 1;
        } else if (channel === 'sms') {
          if (!dry && !isFeatureEnabled('commsDelivery')) {
            actions.push({ type: 'warn', message: `Comms delivery disabled. Skipping SMS for ${p.id}.`, meta: { templateId: tpl.id } });
            continue;
          }
          // eslint-disable-next-line no-await-in-loop
          const res = await sendSmsFromTemplate({ template: tpl, partner: p, dryRun: dry });
          actions.push({
            type: res.ok ? 'info' : 'warn',
            message: `${dry ? 'Would send' : 'Sent'} SMS to ${res.log.to}`,
            meta: { templateId: tpl.id, partnerId: p.id, status: res.log.status, to: res.log.to },
          });
          if (res.ok) sent += 1;
        } else {
          actions.push({ type: 'warn', message: `Unknown comms channel: ${String(channel)}` });
        }
      }
      continue;
    }

    if (a.type === 'run_workflow') {
      const run = runWorkflow(a.workflowId, mode);
      actions.push({ type: 'info', message: `Workflow ${a.workflowId}: ${run.summary}`, meta: { workflowId: a.workflowId, actions: run.actions } });
      continue;
    }

    if (a.type === 'create_task') {
      for (const p of candidates) {
        const dueAt =
          typeof a.dueInDays === 'number' ? addDaysIso(nowIso(), Math.max(0, a.dueInDays)) : undefined;
        if (mode === 'live') {
          const created = createTask({
            partnerId: p.id,
            title: a.title,
            kind: a.kind,
            stage: a.stage,
            priority: a.priority,
            status: 'pending',
            dueAt,
            notes: a.notes,
            tags: a.tags,
            assignedTo: 'partner',
          });
          actions.push({ type: 'created_task', partnerId: p.id, title: created.title, meta: { taskId: created.id, dueAt } });
        } else {
          actions.push({ type: 'info', message: `Would create task for ${p.id}: ${a.title}` });
        }
      }
      continue;
    }

    if (a.type === 'send_invite_reminder') {
      const max = safeNum(a.maxPerRun, 20);
      const older = safeNum(a.olderThanHours, 24 * 3);
      let sent = 0;
      for (const p of partners) {
        if (sent >= max) break;
        const inv = hasUnclaimedInvite(p.id, older);
        if (!inv) continue;

        const toEmail = inv.channels?.email?.to;
        const toPhone = inv.channels?.sms?.to;
        const canDeliver = isFeatureEnabled('inviteDelivery');

        if (mode === 'live' && canDeliver) {
          try {
            if ((a.channel === 'email' || a.channel === 'both') && toEmail) {
              await sendInviteEmail({ toEmail, toName: p.profile.fullName, claimUrl: inv.claimUrl });
              upsertInvite({ ...inv, sentAt: nowIso(), sentBy: 'admin', channels: { ...(inv.channels ?? {}), email: { ...(inv.channels?.email ?? {}), status: 'sent' } } });
              actions.push({ type: 'sent_invite', partnerId: p.id, channel: 'email', to: toEmail, meta: { inviteId: inv.id } });
              sent += 1;
            }
            if ((a.channel === 'sms' || a.channel === 'both') && toPhone) {
              await sendInviteSms({ toPhone, claimUrl: inv.claimUrl });
              upsertInvite({ ...inv, sentAt: nowIso(), sentBy: 'admin', channels: { ...(inv.channels ?? {}), sms: { ...(inv.channels?.sms ?? {}), status: 'sent' } } });
              actions.push({ type: 'sent_invite', partnerId: p.id, channel: 'sms', to: toPhone, meta: { inviteId: inv.id } });
              sent += 1;
            }
          } catch (e: any) {
            actions.push({ type: 'warn', message: `Invite reminder failed for ${p.id}: ${e?.message || 'send failed'}`, meta: { partnerId: p.id } });
          }
        } else {
          actions.push({ type: 'info', message: `Would send invite reminder to ${p.id}`, meta: { inviteId: inv.id } });
        }
      }
      continue;
    }

    if (a.type === 'bundle_nudge') {
      const max = safeNum(a.maxPerRun, 20);
      const dueSoonDays = safeNum(a.dueSoonDays, 3);
      let nudged = 0;
      for (const p of partners) {
        if (nudged >= max) break;
        const open = listTasksByPartner(p.id).filter((t) => t.status === 'pending' || t.status === 'in_progress');
        const dueSoon = open.filter((t) => t.dueAt && Date.parse(t.dueAt) < Date.now() + dueSoonDays * 24 * 60 * 60 * 1000);
        const blocked = open.filter((t) => (t.blockedByTaskIds ?? []).length > 0);
        if (!dueSoon.length && !blocked.length) continue;
        if (mode === 'live') {
          // Set a signal so roadmap/chat can react; keep minimal.
          upsertPartner({
            ...p,
            journeySignals: { ...(p.journeySignals ?? {}), nudge: { at: nowIso(), dueSoon: dueSoon.length, blocked: blocked.length } },
          });
          actions.push({ type: 'info', message: `Bundle nudge signal set for ${p.id}`, meta: { dueSoon: dueSoon.length, blocked: blocked.length } });
        } else {
          actions.push({ type: 'info', message: `Would nudge ${p.id}`, meta: { dueSoon: dueSoon.length, blocked: blocked.length } });
        }
        nudged += 1;
      }
      continue;
    }

    // --- Workboard expansions (registry-driven) ---
    if (a.type === 'create_project') {
      for (const p of candidates) {
        if (mode === 'live') {
          const created = createProject({
            partnerId: p.id,
            scope: (a as any).scope ?? 'personal',
            title: String((a as any).title || 'Project'),
            stage: (a as any).stage,
            status: (a as any).status,
            tags: (a as any).tags,
            fundingGoal: (a as any).fundingGoal,
          } as any);
          actions.push({ type: 'info', message: `Created project for ${p.id}: ${created.title}`, meta: { projectId: created.id } });
        } else {
          actions.push({ type: 'info', message: `Would create project for ${p.id}: ${String((a as any).title || 'Project')}` });
        }
      }
      continue;
    }

    if (a.type === 'set_project_stage') {
      const maxPerPartner = safeNum((a as any).maxPerPartner, 1);
      for (const p of candidates) {
        const projs = listProjectsByPartner(p.id).filter((x) => ((a as any).scope ? (x.scope ?? 'personal') === (a as any).scope : true));
        const filtered = projs.filter((x) => anyMatch(x.tags ?? [], (a as any).matchTagsAny));
        let changed = 0;
        for (const pr of filtered) {
          if (changed >= maxPerPartner) break;
          if (mode === 'live') setProjectStage(pr.id, (a as any).stage);
          actions.push({ type: 'info', message: `${mode === 'live' ? 'Set' : 'Would set'} project stage: ${pr.title} → ${(a as any).stage}` });
          changed += 1;
        }
      }
      continue;
    }

    if (a.type === 'set_project_status') {
      const maxPerPartner = safeNum((a as any).maxPerPartner, 1);
      for (const p of candidates) {
        const projs = listProjectsByPartner(p.id).filter((x) => ((a as any).scope ? (x.scope ?? 'personal') === (a as any).scope : true));
        const filtered = projs.filter((x) => anyMatch(x.tags ?? [], (a as any).matchTagsAny));
        let changed = 0;
        for (const pr of filtered) {
          if (changed >= maxPerPartner) break;
          if (mode === 'live') setProjectStatus(pr.id, (a as any).status);
          actions.push({ type: 'info', message: `${mode === 'live' ? 'Set' : 'Would set'} project status: ${pr.title} → ${(a as any).status}` });
          changed += 1;
        }
      }
      continue;
    }

    if (a.type === 'add_project_note') {
      const note = String((a as any).note || '').trim();
      if (!note) {
        actions.push({ type: 'warn', message: 'add_project_note has empty note.' });
        continue;
      }
      const maxPerPartner = safeNum((a as any).maxPerPartner, 1);
      for (const p of candidates) {
        const projs = listProjectsByPartner(p.id).filter((x) => ((a as any).scope ? (x.scope ?? 'personal') === (a as any).scope : true));
        const filtered = projs.filter((x) => anyMatch(x.tags ?? [], (a as any).matchTagsAny));
        let changed = 0;
        for (const pr of filtered) {
          if (changed >= maxPerPartner) break;
          if (mode === 'live') addProjectNote(pr.id, note);
          actions.push({ type: 'info', message: `${mode === 'live' ? 'Added' : 'Would add'} project note to ${pr.title}` });
          changed += 1;
        }
      }
      continue;
    }

    if (a.type === 'set_task_stage') {
      const maxPerPartner = safeNum((a as any).maxPerPartner, 6);
      for (const p of candidates) {
        const tasks = listTasksByPartner(p.id).filter((t: any) => ((a as any).scope ? (t.scope ?? 'personal') === (a as any).scope : true));
        const filtered = tasks.filter((t: any) => {
          if ((a as any).matchKindsAny?.length && !(a as any).matchKindsAny.includes(t.kind)) return false;
          if (!anyMatch(t.tags ?? [], (a as any).matchTagsAny)) return false;
          return true;
        });
        let changed = 0;
        for (const t of filtered) {
          if (changed >= maxPerPartner) break;
          if (mode === 'live') upsertTask({ ...t, stage: (a as any).stage });
          actions.push({ type: 'info', message: `${mode === 'live' ? 'Set' : 'Would set'} task stage: ${t.title} → ${(a as any).stage}` });
          changed += 1;
        }
      }
      continue;
    }

    if (a.type === 'set_task_status') {
      const maxPerPartner = safeNum((a as any).maxPerPartner, 6);
      for (const p of candidates) {
        const tasks = listTasksByPartner(p.id).filter((t: any) => ((a as any).scope ? (t.scope ?? 'personal') === (a as any).scope : true));
        const filtered = tasks.filter((t: any) => {
          if ((a as any).matchKindsAny?.length && !(a as any).matchKindsAny.includes(t.kind)) return false;
          if (!anyMatch(t.tags ?? [], (a as any).matchTagsAny)) return false;
          return true;
        });
        let changed = 0;
        for (const t of filtered) {
          if (changed >= maxPerPartner) break;
          if (mode === 'live') setTaskStatus(t.id, (a as any).status);
          actions.push({ type: 'info', message: `${mode === 'live' ? 'Set' : 'Would set'} task status: ${t.title} → ${(a as any).status}` });
          changed += 1;
        }
      }
      continue;
    }

    if (a.type === 'add_task_checklist_items') {
      const items = Array.isArray((a as any).items) ? (a as any).items.map((x: any) => String(x ?? '').trim()).filter(Boolean) : [];
      if (!items.length) {
        actions.push({ type: 'warn', message: 'add_task_checklist_items has no items.' });
        continue;
      }
      const maxPerPartner = safeNum((a as any).maxPerPartner, 6);
      for (const p of candidates) {
        const tasks = listTasksByPartner(p.id);
        const filtered = tasks.filter((t: any) => {
          if ((a as any).matchKindsAny?.length && !(a as any).matchKindsAny.includes(t.kind)) return false;
          if (!anyMatch(t.tags ?? [], (a as any).matchTagsAny)) return false;
          return true;
        });
        let changed = 0;
        for (const t of filtered) {
          if (changed >= maxPerPartner) break;
          const existing = Array.isArray(t.checklist) ? t.checklist : [];
          const nextItems = items.map((text: string) => ({ id: newId('chk'), text, done: false }));
          if (mode === 'live') upsertTask({ ...t, checklist: [...existing, ...nextItems].slice(0, 200) });
          actions.push({ type: 'info', message: `${mode === 'live' ? 'Added' : 'Would add'} checklist items to ${t.title}` });
          changed += 1;
        }
      }
      continue;
    }

    if (a.type === 'append_task_notes') {
      const note = String((a as any).note || '').trim();
      if (!note) {
        actions.push({ type: 'warn', message: 'append_task_notes has empty note.' });
        continue;
      }
      const maxPerPartner = safeNum((a as any).maxPerPartner, 6);
      for (const p of candidates) {
        const tasks = listTasksByPartner(p.id);
        const filtered = tasks.filter((t: any) => {
          if ((a as any).matchKindsAny?.length && !(a as any).matchKindsAny.includes(t.kind)) return false;
          if (!anyMatch(t.tags ?? [], (a as any).matchTagsAny)) return false;
          return true;
        });
        let changed = 0;
        for (const t of filtered) {
          if (changed >= maxPerPartner) break;
          const merged = [String(t.notes || '').trim(), note].filter(Boolean).join('\n\n---\n\n').trim();
          if (mode === 'live') upsertTask({ ...t, notes: merged });
          actions.push({ type: 'info', message: `${mode === 'live' ? 'Appended' : 'Would append'} notes to ${t.title}` });
          changed += 1;
        }
      }
      continue;
    }

    if (a.type === 'add_task_tags' || a.type === 'add_task_labels') {
      const key = a.type === 'add_task_tags' ? 'tags' : 'labels';
      const items = Array.isArray((a as any)[key]) ? (a as any)[key].map((x: any) => String(x ?? '').trim()).filter(Boolean) : [];
      if (!items.length) {
        actions.push({ type: 'warn', message: `${a.type} has no ${key}.` });
        continue;
      }
      const maxPerPartner = safeNum((a as any).maxPerPartner, 6);
      for (const p of candidates) {
        const tasks = listTasksByPartner(p.id);
        const filtered = tasks.filter((t: any) => {
          if ((a as any).matchKindsAny?.length && !(a as any).matchKindsAny.includes(t.kind)) return false;
          if (!anyMatch(t.tags ?? [], (a as any).matchTagsAny)) return false;
          return true;
        });
        let changed = 0;
        for (const t of filtered) {
          if (changed >= maxPerPartner) break;
          const cur = Array.isArray((t as any)[key]) ? (t as any)[key] : [];
          const merged = Array.from(new Set([...cur, ...items])).slice(0, 50);
          if (mode === 'live') upsertTask({ ...t, [key]: merged } as any);
          actions.push({ type: 'info', message: `${mode === 'live' ? 'Added' : 'Would add'} ${key} to ${t.title}` });
          changed += 1;
        }
      }
      continue;
    }

    if (a.type === 'assign_task_users') {
      const assigneeUserIds = Array.isArray((a as any).assigneeUserIds) ? (a as any).assigneeUserIds.map((x: any) => String(x ?? '').trim()).filter(Boolean) : [];
      if (!assigneeUserIds.length) {
        actions.push({ type: 'warn', message: 'assign_task_users has no assigneeUserIds.' });
        continue;
      }
      const maxPerPartner = safeNum((a as any).maxPerPartner, 6);
      for (const p of candidates) {
        const tasks = listTasksByPartner(p.id);
        const filtered = tasks.filter((t: any) => {
          if ((a as any).matchKindsAny?.length && !(a as any).matchKindsAny.includes(t.kind)) return false;
          if (!anyMatch(t.tags ?? [], (a as any).matchTagsAny)) return false;
          return true;
        });
        let changed = 0;
        for (const t of filtered) {
          if (changed >= maxPerPartner) break;
          if (mode === 'live') upsertTask({ ...t, assigneeUserIds } as any);
          actions.push({ type: 'info', message: `${mode === 'live' ? 'Assigned' : 'Would assign'} users to ${t.title}`, meta: { assigneeUserIds } });
          changed += 1;
        }
      }
      continue;
    }

    if (a.type === 'add_task_comment') {
      const comment = String((a as any).comment || '').trim();
      if (!comment) {
        actions.push({ type: 'warn', message: 'add_task_comment has empty comment.' });
        continue;
      }
      const maxPerPartner = safeNum((a as any).maxPerPartner, 6);
      for (const p of candidates) {
        const tasks = listTasksByPartner(p.id);
        const filtered = tasks.filter((t: any) => {
          if ((a as any).matchKindsAny?.length && !(a as any).matchKindsAny.includes(t.kind)) return false;
          if (!anyMatch(t.tags ?? [], (a as any).matchTagsAny)) return false;
          return true;
        });
        let changed = 0;
        for (const t of filtered) {
          if (changed >= maxPerPartner) break;
          if (mode === 'live')
            addTaskComment({ partnerId: p.id, taskId: t.id, authorType: 'admin', authorEmail: 'automation@local', body: comment });
          actions.push({ type: 'info', message: `${mode === 'live' ? 'Added' : 'Would add'} comment to ${t.title}` });
          changed += 1;
        }
      }
      continue;
    }

    if (a.type === 'set_task_priority') {
      const priority = (a as any).priority;
      const maxPerPartner = safeNum((a as any).maxPerPartner, 6);
      for (const p of candidates) {
        const tasks = listTasksByPartner(p.id);
        const filtered = tasks.filter((t: any) => {
          if ((a as any).matchKindsAny?.length && !(a as any).matchKindsAny.includes(t.kind)) return false;
          if (!anyMatch(t.tags ?? [], (a as any).matchTagsAny)) return false;
          return true;
        });
        let changed = 0;
        for (const t of filtered) {
          if (changed >= maxPerPartner) break;
          if (mode === 'live') upsertTask({ ...t, priority });
          actions.push({ type: 'info', message: `${mode === 'live' ? 'Set' : 'Would set'} task priority: ${t.title} → ${priority}` });
          changed += 1;
        }
      }
      continue;
    }

    if (a.type === 'create_notification') {
      const title = String((a as any).title || '').trim();
      if (!title) {
        actions.push({ type: 'warn', message: 'create_notification has empty title.' });
        continue;
      }
      const body = (a as any).body ? String((a as any).body) : undefined;
      const href = (a as any).href ? String((a as any).href) : undefined;
      const audience = (a as any).audience ?? 'both';
      const max = safeNum((a as any).maxPerRun, 100);
      let sent = 0;
      for (const p of candidates) {
        if (sent >= max) break;
        if (mode === 'live') {
          createNotification({ partnerId: p.id, audience, kind: 'system', title, body, href, meta: { ruleId: rule.id } });
          actions.push({ type: 'info', message: `Created notification for ${p.id}: ${title}` });
        } else {
          actions.push({ type: 'info', message: `Would create notification for ${p.id}: ${title}` });
        }
        sent += 1;
      }
      continue;
    }

    if (a.type === 'upsert_partner_signal') {
      const key = String((a as any).key || '').trim();
      if (!key) {
        actions.push({ type: 'warn', message: 'upsert_partner_signal has empty key.' });
        continue;
      }
      for (const p of candidates) {
        if (mode === 'live') {
          upsertPartner({ ...p, journeySignals: { ...(p.journeySignals ?? {}), [key]: (a as any).value, at: nowIso() } });
          actions.push({ type: 'info', message: `Signal set for ${p.id}: ${key}` });
        } else {
          actions.push({ type: 'info', message: `Would set signal for ${p.id}: ${key}` });
        }
      }
      continue;
    }

    actions.push({ type: 'warn', message: `Unhandled action type: ${(a as any).type}`, meta: { action: a as any } });
  }

  const finishedAt = nowIso();
  const createdTasks = actions.filter((x) => x.type === 'created_task').length;
  const sentInvites = actions.filter((x) => x.type === 'sent_invite').length;
  const summary =
    mode === 'live'
      ? `Done. created_tasks=${createdTasks} sent_invites=${sentInvites}`
      : `Dry-run. would_create_tasks=${createdTasks} would_send_invites=${sentInvites}`;

  const run: AutomationRunLog = {
    id: newId('run'),
    ruleId: rule.id,
    mode,
    startedAt,
    finishedAt,
    summary,
    actions,
  };
  addAutomationRun(run);
  // Persist last-run metadata for interval semantics + observability.
  upsertAutomationRule({
    ...rule,
    meta: {
      ...(rule.meta ?? {}),
      lastRunAt: finishedAt,
      lastRunMode: mode,
      lastRunSummary: summary,
      lastRunId: run.id,
    },
  });
  return run;
}

export async function runAllEnabledAutomations(mode: AgentMode): Promise<AutomationRunLog[]> {
  const rules = listAutomationRules().filter((r) => r.enabled);
  const runs: AutomationRunLog[] = [];
  for (const r of rules) {
    // eslint-disable-next-line no-await-in-loop
    const run = await runAutomationRule(r, mode);
    runs.push(run);
  }
  return runs;
}

export async function runDueAutomations(mode: AgentMode): Promise<AutomationRunLog[]> {
  const nowMs = Date.now();
  const rules = listAutomationRules().filter((r) => isAutomationRuleDue(r, nowMs));
  const runs: AutomationRunLog[] = [];
  for (const r of rules) {
    // eslint-disable-next-line no-await-in-loop
    const run = await runAutomationRule(r, mode);
    runs.push(run);
  }
  return runs;
}

