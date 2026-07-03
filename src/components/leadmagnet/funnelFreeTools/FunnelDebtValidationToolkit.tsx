import React, { useEffect, useMemo, useState } from 'react';
import { Clock, FileText, MessageSquare, ShieldCheck } from 'lucide-react';
import { FunnelToolkitChecklistPanel } from './FunnelToolkitChecklistPanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../../features/os/finelyOsLightUi';
import { loadJson, saveJson } from '../../../data/localJsonStore';
import { newId } from '../../../utils/ids';

const VALIDATION_ITEMS = [
  { id: 'identify_collector', label: 'Identify collector & original creditor', hint: 'Get company name, account number, and balance in writing.' },
  { id: 'cease_calls', label: 'Log all contact attempts', hint: 'Date, time, agent name — FDCPA documentation.' },
  { id: 'send_validation', label: 'Send written validation request (within 30 days of first contact)', hint: 'Certified mail recommended.' },
  { id: 'pause_payment', label: 'Pause payment until validation received', hint: 'Do not pay unverified debts under pressure.' },
  { id: 'review_response', label: 'Review validation response for gaps', hint: 'Missing contract, chain of title, or amount breakdown.' },
  { id: 'summons_check', label: 'If summons received — calendar court deadline', hint: 'Never ignore court papers.' },
];

const KEY = 'finely.leadMagnet.debtValidation.v1';

type DebtCase = {
  id: string;
  leadId: string;
  collectorName: string;
  balance: string;
  validationSentAt?: string;
  timeline: Array<{ label: string; at: string }>;
};

type Store = { cases: DebtCase[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { cases: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

type Props = { leadId: string; email: string };

export function FunnelDebtValidationToolkit({ leadId, email }: Props) {
  const [collectorName, setCollectorName] = useState('');
  const [balance, setBalance] = useState('');
  const [caseRecord, setCaseRecord] = useState<DebtCase | null>(null);

  useEffect(() => {
    const found = loadStore().cases.find((c) => c.leadId === leadId);
    if (found) {
      setCaseRecord(found);
      setCollectorName(found.collectorName);
      setBalance(found.balance);
    }
  }, [leadId]);

  const daysRemaining = useMemo(() => {
    if (!caseRecord?.validationSentAt) return null;
    const sent = new Date(caseRecord.validationSentAt);
    const deadline = new Date(sent);
    deadline.setDate(deadline.getDate() + 30);
    const diff = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [caseRecord?.validationSentAt]);

  const callScript = useMemo(() => {
    const name = collectorName.trim() || '[Collector name]';
    return `"This is a recorded line. I dispute this debt and request validation in writing per FDCPA §809(b). Please send all validation to my address on file and cease telephone contact until validation is complete. Company: ${name}."`;
  }, [collectorName]);

  const startCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectorName.trim()) return;
    const store = loadStore();
    const record: DebtCase = {
      id: newId('lm_debt'),
      leadId,
      collectorName: collectorName.trim(),
      balance: balance.trim(),
      timeline: [{ label: 'Case opened', at: new Date().toISOString() }],
    };
    saveStore({ cases: [...store.cases.filter((c) => c.leadId !== leadId), record] });
    setCaseRecord(record);
  };

  const markValidationSent = () => {
    if (!caseRecord) return;
    const store = loadStore();
    const updated: DebtCase = {
      ...caseRecord,
      validationSentAt: new Date().toISOString(),
      timeline: [
        ...caseRecord.timeline,
        { label: 'Validation letter sent', at: new Date().toISOString() },
      ],
    };
    saveStore({
      cases: store.cases.map((c) => (c.id === caseRecord.id ? updated : c)),
    });
    setCaseRecord(updated);
  };

  return (
    <div className="space-y-4">
      <FunnelToolkitChecklistPanel
        leadId={leadId}
        email={email}
        funnelId="debt"
        title="Debt validation command center"
        subtitle="FDCPA-aware workflow — track validation, deadlines, and collector contact."
        accent="sky"
        items={VALIDATION_ITEMS}
        footerTip="Educational only — not legal advice. Consult an attorney for summons or court deadlines."
      />

      <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-4 text-left`}>
        <div className="flex items-center gap-2 text-sky-200 text-[10px] font-black uppercase tracking-widest">
          <ShieldCheck size={14} /> Active collection case
        </div>
        <form onSubmit={startCase} className="grid sm:grid-cols-2 gap-3">
          <label className="block space-y-1 sm:col-span-2">
            <span className={FINELY_OS_ENTITY_LABEL}>Collector / account name</span>
            <input value={collectorName} onChange={(e) => setCollectorName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="e.g. ABC Recovery LLC" />
          </label>
          <label className="block space-y-1">
            <span className={FINELY_OS_ENTITY_LABEL}>Balance claimed</span>
            <input value={balance} onChange={(e) => setBalance(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="e.g. $2,450" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="w-full py-2.5 rounded-xl bg-sky-500/20 border border-sky-400/40 text-xs font-bold uppercase tracking-wider text-sky-100">
              Open case tracker
            </button>
          </div>
        </form>

        {caseRecord ? (
          <div className="space-y-3">
            {daysRemaining != null ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
                <Clock size={18} className="text-amber-300" />
                <div>
                  <div className={`text-sm font-bold ${FINELY_OS_ENTITY_VALUE}`}>
                    {daysRemaining > 0 ? `${daysRemaining} days left in validation window` : 'Validation window elapsed'}
                  </div>
                  <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Collectors must validate before continuing collection.</div>
                </div>
              </div>
            ) : (
              <button type="button" onClick={markValidationSent} className="w-full py-2.5 rounded-xl border border-emerald-400/40 bg-emerald-500/15 text-xs font-bold uppercase tracking-wider">
                Mark validation letter sent (start 30-day clock)
              </button>
            )}
            <div className={`text-xs ${FINELY_OS_ENTITY_BODY} space-y-1`}>
              {caseRecord.timeline.map((t, i) => (
                <div key={i}>• {t.label} — {new Date(t.at).toLocaleString()}</div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3 text-left`}>
        <div className="flex items-center gap-2 text-violet-200 text-[10px] font-black uppercase tracking-widest">
          <MessageSquare size={14} /> Collector call script card
        </div>
        <p className={`text-sm italic ${FINELY_OS_ENTITY_BODY} p-3 rounded-xl border border-white/10 bg-black/25`}>
          {callScript}
        </p>
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          <FileText size={12} className="inline mr-1" />
          Save this script — your PDF includes expanded FDCPA language and written request templates.
        </p>
      </div>
    </div>
  );
}
