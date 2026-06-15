import React, { useMemo, useState } from 'react';
import { AlertTriangle, Landmark, Plus, TrendingUp } from 'lucide-react';
import type { InquiryBureau } from '../../domain/fundingLadder';
import {
  computeInquiryBudgetStatus,
  recordInquiryPull,
  updateFundingPlan,
} from '../../lib/fundingLadderEngine';
import {
  createBankerRelationship,
  listBankerRelationships,
  listInquiryPullsByPartner,
} from '../../data/fundingLadderRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

export function FundingLadderPanel({ partnerId }: { partnerId: string }) {
  const [version, setVersion] = useState(0);
  const [lender, setLender] = useState('');
  const [bureau, setBureau] = useState<InquiryBureau>('equifax');
  const [bankerName, setBankerName] = useState('');
  const [bankerInst, setBankerInst] = useState('');

  const status = useMemo(() => computeInquiryBudgetStatus(partnerId), [partnerId, version]);
  const pulls = useMemo(() => listInquiryPullsByPartner(partnerId, 8), [partnerId, version]);
  const bankers = useMemo(() => listBankerRelationships(partnerId), [partnerId, version]);

  const bump = () => setVersion((v) => v + 1);

  const logPull = () => {
    if (!lender.trim()) return;
    recordInquiryPull({
      partnerId,
      lenderName: lender.trim(),
      bureau,
      pulledAt: new Date().toISOString(),
      result: 'pending',
    });
    setLender('');
    bump();
  };

  const addBanker = () => {
    if (!bankerName.trim() || !bankerInst.trim()) return;
    createBankerRelationship({
      partnerId,
      name: bankerName.trim(),
      institution: bankerInst.trim(),
      lastContactAt: new Date().toISOString(),
    });
    setBankerName('');
    setBankerInst('');
    bump();
  };

  return (
    <div className={`space-y-4 ${finelyOsGlassShell('panel', 'emerald')}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <TrendingUp size={14} className="text-emerald-300" /> Funding Ladder OS
          </div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE} text-xl font-bold`}>
            {status.remainingThisMonth} pull{status.remainingThisMonth === 1 ? '' : 's'} left (30d)
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => {
              updateFundingPlan({ partnerId, minDaysBetweenPulls: 21 });
              bump();
            }}
          >
            Conservative spacing
          </button>
        </div>
      </div>

      {status.warnings.length ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle size={14} className="inline mr-2" />
          {status.warnings[0]}
        </div>
      ) : null}

      <div className="grid md:grid-cols-3 gap-3 text-xs">
        <div className={`${finelyOsGlassShell('inner', 'sky')} p-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>30-day pulls</div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{status.pullsLast30.length}</div>
        </div>
        <div className={`${finelyOsGlassShell('inner', 'violet')} p-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>90-day pulls</div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{status.pullsLast90.length}</div>
        </div>
        <div className={`${finelyOsGlassShell('inner', 'emerald')} p-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Min spacing</div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{status.plan.minDaysBetweenPulls} days</div>
        </div>
      </div>

      <div className={`${finelyOsGlassShell('inner', 'emerald')} p-4 space-y-3`}>
        <div className={FINELY_OS_ENTITY_LABEL}>Log inquiry pull</div>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            value={lender}
            onChange={(e) => setLender(e.target.value)}
            placeholder="Lender / card name"
            className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}
          />
          <select
            value={bureau}
            onChange={(e) => setBureau(e.target.value as InquiryBureau)}
            className={FINELY_OS_ENTITY_SELECT}
          >
            <option value="equifax">Equifax</option>
            <option value="experian">Experian</option>
            <option value="transunion">TransUnion</option>
            <option value="unknown">Unknown</option>
          </select>
          <button type="button" onClick={logPull} className={FINELY_OS_SUCCESS_BTN}>
            <Plus size={14} /> Record pull
          </button>
        </div>
      </div>

      {pulls.length ? (
        <ul className="space-y-2 text-xs">
          {pulls.map((p) => (
            <li key={p.id} className={FINELY_OS_ENTITY_BODY}>
              <span className="text-emerald-200 font-semibold">{p.lenderName}</span> · {p.bureau} ·{' '}
              {new Date(p.pulledAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      ) : null}

      <div className={`${finelyOsGlassShell('inner', 'sky')} p-4 space-y-3`}>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <Landmark size={12} /> Banker relationships
        </div>
        {bankers.length === 0 ? (
          <p className={FINELY_OS_ENTITY_BODY}>Track RM / banker contacts for relationship-based funding.</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {bankers.slice(0, 4).map((b) => (
              <li key={b.id} className={FINELY_OS_ENTITY_BODY}>
                {b.name} · {b.institution}
              </li>
            ))}
          </ul>
        )}
        <div className="grid sm:grid-cols-3 gap-2">
          <input
            value={bankerName}
            onChange={(e) => setBankerName(e.target.value)}
            placeholder="Contact name"
            className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}
          />
          <input
            value={bankerInst}
            onChange={(e) => setBankerInst(e.target.value)}
            placeholder="Institution"
            className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}
          />
          <button type="button" onClick={addBanker} className={FINELY_OS_PRIMARY_BTN}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
