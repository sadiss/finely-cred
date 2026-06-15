import type { DocumentType } from '../domain/documents';
import { listCasesByPartner } from '../data/casesRepo';
import { createDebtCase, listDebtByPartner, upsertDebt } from '../data/debtRepo';
import { createTask } from '../data/tasksRepo';
import { createNotification } from '../data/notificationsRepo';
import { addDaysIso, nowIso } from '../domain/cases';

export type DocumentRouteAction = {
  id: string;
  label: string;
  description: string;
  path: string;
  priority: 'normal' | 'high' | 'urgent';
};

export type DocumentRouteResult = {
  docType: DocumentType;
  actions: DocumentRouteAction[];
  linkedDebtCaseId?: string;
  linkedDisputeCaseId?: string;
  tasksCreated: number;
  summary: string;
};

function norm(s: string) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchCreditor(name: string, haystack: string) {
  const n = norm(name);
  const h = norm(haystack);
  if (!n || n.length < 3) return false;
  if (h.includes(n)) return true;
  const parts = n.split(' ').filter((p) => p.length > 3);
  return parts.some((p) => h.includes(p));
}

function guessDocTypeFromText(caption?: string, filename?: string): DocumentType {
  const s = `${caption || ''} ${filename || ''}`.toLowerCase();
  if (/bureau|experian|equifax|transunion|investigation|e-oscar|credit report results|dispute results/.test(s)) return 'bureau_response';
  if (/summons|complaint|court|subpoena|judgment/.test(s)) return 'summons';
  if (/collection|collector|debt validation|validation notice|charge.?off letter/.test(s)) return 'collection_notice';
  if (/driver|passport|id card|identification|state id/.test(s)) return 'id_document';
  if (/ssn|social security|ss card/.test(s)) return 'ssn_card';
  if (/utility|electric|gas bill|proof of address|lease|mortgage statement/.test(s)) return 'utility_bill';
  if (/bank statement|checking|savings account/.test(s)) return 'bank_statement';
  if (/credit report|tri-merge|myfico/.test(s)) return 'credit_report';
  if (/ein|irs|employer identification/.test(s)) return 'ein_letter';
  if (/articles|incorporation|certificate of formation/.test(s)) return 'articles_of_incorporation';
  if (/contract|agreement|signed/.test(s)) return 'contract';
  return 'unknown';
}

function findOpenDisputeCase(partnerId: string, entities: Record<string, string>) {
  const cases = listCasesByPartner(partnerId).filter((c) => c.status === 'open');
  const creditor = entities.creditorName || entities.businessLegalName || entities.accountName || '';
  if (creditor) {
    const hit = cases.find((c) => matchCreditor(creditor, c.title || c.bureau || ''));
    if (hit) return hit;
  }
  return cases[0] ?? null;
}

function findOrCreateDebtCase(partnerId: string, entities: Record<string, string>, docType: DocumentType) {
  const existing = listDebtByPartner(partnerId).filter((d) => d.status === 'open' || d.status === 'in_review');
  const name =
    entities.creditorName ||
    entities.collectorName ||
    entities.businessLegalName ||
    (docType === 'summons' ? 'Summons / court matter' : 'Collection account');

  const hit = existing.find((d) => matchCreditor(name, d.name));
  if (hit) {
    upsertDebt({
      ...hit,
      status: 'in_review',
      notes: [hit.notes, `New document uploaded (${docType}). Review in Debt Center.`].filter(Boolean).join('\n'),
    });
    return hit;
  }

  if (docType === 'collection_notice' || docType === 'summons' || docType === 'bureau_response') {
    return createDebtCase({
      partnerId,
      type: docType === 'summons' ? 'summons' : 'debt',
      name: name.slice(0, 120) || 'Uploaded collection matter',
      amountCents: 0,
      status: 'in_review',
      notes: `Auto-opened from uploaded ${docType.replace(/_/g, ' ')}. Attach evidence and choose response lane.`,
      stateJurisdiction: entities.state || undefined,
      courtCaseNumber: entities.caseNumber || undefined,
    });
  }
  return null;
}

export function routeProcessedDocument(args: {
  partnerId: string;
  docType: DocumentType;
  evidenceId?: string;
  entities?: Record<string, string>;
  caption?: string;
  filename?: string;
  summary?: string;
}): DocumentRouteResult {
  const entities = args.entities ?? {};
  const effectiveType =
    args.docType === 'unknown' || args.docType === 'other'
      ? guessDocTypeFromText(args.caption, args.filename)
      : args.docType;

  const actions: DocumentRouteAction[] = [];
  let linkedDebtCaseId: string | undefined;
  let linkedDisputeCaseId: string | undefined;
  let tasksCreated = 0;

  const pushTask = (task: Parameters<typeof createTask>[0]) => {
    createTask(task);
    tasksCreated += 1;
  };

  const disputeCase = findOpenDisputeCase(args.partnerId, entities);

  switch (effectiveType) {
    case 'bureau_response': {
      linkedDisputeCaseId = disputeCase?.id;
      const debtCase = findOrCreateDebtCase(args.partnerId, entities, effectiveType);
      linkedDebtCaseId = debtCase?.id;

      pushTask({
        partnerId: args.partnerId,
        title: 'Review bureau response — update dispute round',
        kind: 'review_results',
        status: 'pending',
        stage: 'disputes',
        priority: 'high',
        relatedCaseId: disputeCase?.id,
        evidenceIds: args.evidenceId ? [args.evidenceId] : undefined,
        assignedTo: 'partner',
        notes: disputeCase
          ? `Bureau mail linked to case "${disputeCase.title || disputeCase.id}". Mark round response, decide next action.`
          : 'Upload matched a bureau response. Open Dispute Center to attach to a case or start Round 2.',
        meta: { route: 'bureau_response', href: disputeCase ? `/portal/disputes/${disputeCase.id}` : '/portal/disputes' },
      });

      if (debtCase) {
        pushTask({
          partnerId: args.partnerId,
          title: `Debt Center: review collector angle — ${debtCase.name}`,
          kind: 'follow_up',
          status: 'pending',
          stage: 'debt',
          priority: 'normal',
          evidenceIds: args.evidenceId ? [args.evidenceId] : undefined,
          assignedTo: 'partner',
          notes: 'Bureau responses sometimes confirm collection tradelines. Check validation / debt center lanes.',
          meta: { route: 'bureau_to_debt', debtCaseId: debtCase.id, href: `/portal/debt/${debtCase.id}` },
        });
      }

      actions.push(
        {
          id: 'disputes',
          label: 'Open Dispute Center',
          description: disputeCase ? 'Update the active case with this bureau response.' : 'Create or link a dispute case.',
          path: disputeCase ? `/portal/disputes/${disputeCase.id}` : '/portal/disputes',
          priority: 'high',
        },
        {
          id: 'letters',
          label: 'Letter Studio — Round follow-up',
          description: 'Draft escalated round letter using this response.',
          path: '/portal/letters',
          priority: 'high',
        },
      );
      if (debtCase) {
        actions.push({
          id: 'debt',
          label: 'Open Debt Center',
          description: 'Validate collector claims tied to this response.',
          path: `/portal/debt/${debtCase.id}`,
          priority: 'normal',
        });
      }
      break;
    }

    case 'collection_notice':
    case 'summons': {
      const debtCase = findOrCreateDebtCase(args.partnerId, entities, effectiveType);
      linkedDebtCaseId = debtCase?.id;
      const urgent = effectiveType === 'summons';

      pushTask({
        partnerId: args.partnerId,
        title: urgent ? 'URGENT: Summons uploaded — check answer deadline' : 'Collection notice uploaded — validation window',
        kind: urgent ? 'general' : 'follow_up',
        status: 'pending',
        stage: 'debt',
        priority: urgent ? 'urgent' : 'high',
        dueAt: urgent ? addDaysIso(nowIso(), 7) : addDaysIso(nowIso(), 14),
        evidenceIds: args.evidenceId ? [args.evidenceId] : undefined,
        assignedTo: 'partner',
        notes: urgent
          ? 'Summons detected. Open Debt Center for jurisdiction tools and response templates.'
          : 'Collection notice detected. Send validation / dispute from Debt Center within 30 days when applicable.',
        meta: { route: effectiveType, debtCaseId: debtCase?.id, href: debtCase ? `/portal/debt/${debtCase.id}` : '/portal/debt' },
      });

      actions.push(
        {
          id: 'debt',
          label: 'Open Debt Center',
          description: urgent ? 'Answer deadline tools + affidavit lanes.' : 'Validation request + dispute sequencing.',
          path: debtCase ? `/portal/debt/${debtCase.id}` : '/portal/debt',
          priority: urgent ? 'urgent' : 'high',
        },
        {
          id: 'documents',
          label: 'Attach supporting proof',
          description: 'Add bank statements or payment proof to the same case.',
          path: '/portal/documents',
          priority: 'normal',
        },
      );
      break;
    }

    case 'id_document':
    case 'ssn_card': {
      pushTask({
        partnerId: args.partnerId,
        title: 'Verify identity documents on file',
        kind: 'upload_document',
        status: 'pending',
        stage: 'identity',
        priority: 'normal',
        evidenceIds: args.evidenceId ? [args.evidenceId] : undefined,
        assignedTo: 'partner',
        notes: 'Government ID / SSN card scanned. Confirm legibility before identity theft or bureau disputes.',
        meta: { route: effectiveType, href: '/portal/identity-theft' },
      });
      actions.push(
        { id: 'identity', label: 'Identity Theft Center', description: 'Fraud alerts, freezes, FTC report.', path: '/portal/identity-theft', priority: 'normal' },
        { id: 'profile', label: 'Confirm profile address', description: 'Match ID address to dispute letters.', path: '/account/settings?tab=contact', priority: 'normal' },
      );
      break;
    }

    case 'utility_bill':
    case 'bank_statement': {
      pushTask({
        partnerId: args.partnerId,
        title: 'Proof of address / income document filed',
        kind: 'upload_document',
        status: 'pending',
        stage: 'evidence',
        priority: 'normal',
        evidenceIds: args.evidenceId ? [args.evidenceId] : undefined,
        assignedTo: 'partner',
        notes: 'Use for identity disputes, lender relationship docs, or debt validation packets.',
        meta: { route: effectiveType, href: '/portal/documents' },
      });
      actions.push(
        { id: 'letters', label: 'Attach to dispute letter', description: 'Link as exhibit in Letter Studio.', path: '/portal/letters', priority: 'normal' },
        { id: 'debt', label: 'Debt proof packet', description: 'Add to debt case validation folder.', path: '/portal/debt', priority: 'normal' },
      );
      break;
    }

    case 'credit_report': {
      pushTask({
        partnerId: args.partnerId,
        title: 'New credit report document — parse & compare',
        kind: 'upload_document',
        status: 'pending',
        stage: 'reports',
        priority: 'high',
        evidenceIds: args.evidenceId ? [args.evidenceId] : undefined,
        assignedTo: 'partner',
        notes: 'Upload HTML/PDF to Reports for full parsing, or keep as vault backup.',
        meta: { route: 'credit_report', href: '/portal/reports' },
      });
      actions.push(
        { id: 'reports', label: 'Upload to Reports', description: 'Parse tradelines and scores.', path: '/portal/reports', priority: 'high' },
        { id: 'disputes', label: 'Dispute Center', description: 'Start or update cases from new negatives.', path: '/portal/disputes', priority: 'normal' },
      );
      break;
    }

    case 'ein_letter':
    case 'articles_of_incorporation': {
      pushTask({
        partnerId: args.partnerId,
        title: 'Business formation doc — complete EIN profile',
        kind: 'review_results',
        status: 'pending',
        stage: 'funding',
        priority: 'normal',
        evidenceIds: args.evidenceId ? [args.evidenceId] : undefined,
        assignedTo: 'partner',
        notes: 'Confirm EIN and legal name match your business profile before funding stack.',
        meta: { route: effectiveType, href: '/business/profile' },
      });
      actions.push(
        { id: 'business', label: 'Business profile', description: 'Sync EIN + entity data.', path: '/business/profile', priority: 'normal' },
        { id: 'funding', label: 'Capital readiness', description: 'Update lender targets on profile.', path: '/portal/dashboard#profile-goals-readiness', priority: 'normal' },
      );
      break;
    }

    default: {
      pushTask({
        partnerId: args.partnerId,
        title: 'Review uploaded document',
        kind: 'general',
        status: 'pending',
        stage: 'evidence',
        priority: 'normal',
        evidenceIds: args.evidenceId ? [args.evidenceId] : undefined,
        assignedTo: 'partner',
        notes: args.summary || 'Document saved to vault. Classify and route manually if needed.',
        meta: { route: 'other', href: '/portal/documents' },
      });
      actions.push({
        id: 'documents',
        label: 'Documents vault',
        description: 'Tag and attach to disputes or debt cases.',
        path: '/portal/documents',
        priority: 'normal',
      });
    }
  }

  if (actions.length) {
    createNotification({
      partnerId: args.partnerId,
      audience: 'partner',
      kind: 'case_update',
      title: `Document routed: ${effectiveType.replace(/_/g, ' ')}`,
      body: actions[0]?.description,
      href: actions[0]?.path,
      meta: { docType: effectiveType, evidenceId: args.evidenceId ?? null, tasksCreated },
    });
  }

  return {
    docType: effectiveType,
    actions,
    linkedDebtCaseId,
    linkedDisputeCaseId,
    tasksCreated,
    summary: `${effectiveType.replace(/_/g, ' ')} → ${actions.length} action lane${actions.length === 1 ? '' : 's'}`,
  };
}
