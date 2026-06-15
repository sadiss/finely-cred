import React, { useMemo, useState } from 'react';
import type { CrmRoutingRule } from '../../../domain/crmRoutingRules';
import {
  createCrmRoutingRule,
  deleteCrmRoutingRule,
  listCrmRoutingRules,
  upsertCrmRoutingRule,
} from '../../../data/crmRoutingRulesRepo';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import {FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_INNER,
  FINELY_OS_NOTICE_INFO,
  FINELY_OS_PRIMARY_BTN,
  finelyOsGlassShell,
  finelyOsCatalogCard,} from '../../os/finelyOsLightUi';

export function CrmRoutingRulesPanel() {
  const [version, setVersion] = useState(0);
  const rules = useMemo(() => listCrmRoutingRules(), [version]);

  const bump = () => {
    setVersion((v) => v + 1);
    window.dispatchEvent(new Event('finely:store'));
  };

  const save = (rule: CrmRoutingRule) => {
    upsertCrmRoutingRule(rule);
    bump();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>
          Rules run on new inbound leads (and quick create). First matching rule by priority wins — stage moves, tags, and notes apply automatically.
        </p>
        <button
          type="button"
          onClick={() => {
            createCrmRoutingRule('New routing rule');
            bump();
          }}
          className={FINELY_OS_PRIMARY_BTN}
        >
          <Plus size={14} /> Add rule
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className={`space-y-3 p-4 ${finelyOsGlassShell('panel', 'violet')}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <GitBranch size={16} className="text-violet-300 shrink-0" />
                <input
                  value={rule.name}
                  onChange={(e) => save({ ...rule, name: e.target.value })}
                  className={`min-w-[200px] bg-transparent border-b border-transparent hover:border-white/15 focus:border-violet-400/60 focus:outline-none ${FINELY_OS_ENTITY_VALUE}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`inline-flex items-center gap-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) => save({ ...rule, enabled: e.target.checked })}
                    className="accent-violet-500"
                  />
                  Enabled
                </label>
                <input
                  type="number"
                  value={rule.priority}
                  onChange={(e) => save({ ...rule, priority: Number(e.target.value) || 0 })}
                  className={`w-16 ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}
                  title="Priority (lower runs first)"
                />
                <button
                  type="button"
                  onClick={() => {
                    deleteCrmRoutingRule(rule.id);
                    bump();
                  }}
                  className={`${FINELY_OS_DANGER_BTN} !px-2 !py-1.5`}
                  title="Delete rule"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>When</div>
                <select
                  value={rule.when.kind ?? ''}
                  onChange={(e) => save({ ...rule, when: { ...rule.when, kind: (e.target.value || undefined) as CrmRoutingRule['when']['kind'] } })}
                  className={`w-full ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}
                >
                  <option value="">Any kind</option>
                  <option value="inbound_lead">Inbound lead</option>
                  <option value="prospect">Prospect</option>
                </select>
                <input
                  placeholder="Interest contains…"
                  value={rule.when.interestContains ?? ''}
                  onChange={(e) => save({ ...rule, when: { ...rule.when, interestContains: e.target.value || undefined } })}
                  className={`w-full ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}
                />
                <select
                  value={rule.when.referralCode ?? ''}
                  onChange={(e) => save({ ...rule, when: { ...rule.when, referralCode: e.target.value || undefined } })}
                  className={`w-full ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}
                >
                  <option value="">Referral: any</option>
                  <option value="*">Has referral code</option>
                </select>
              </div>
              <div className={`${FINELY_OS_NOTICE_INFO} p-3 space-y-2`}>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>Then</div>
                <select
                  value={rule.then.moveStage ?? ''}
                  onChange={(e) => save({ ...rule, then: { ...rule.then, moveStage: (e.target.value || undefined) as CrmRoutingRule['then']['moveStage'] } })}
                  className={`w-full ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}
                >
                  <option value="">Keep stage</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="booked">Booked</option>
                  <option value="converted">Converted</option>
                </select>
                <input
                  placeholder="Tags (comma-separated)"
                  value={(rule.then.addTags ?? []).join(', ')}
                  onChange={(e) =>
                    save({
                      ...rule,
                      then: {
                        ...rule.then,
                        addTags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                      },
                    })
                  }
                  className={`w-full ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}
                />
                <input
                  placeholder="Routing note"
                  value={rule.then.note ?? ''}
                  onChange={(e) => save({ ...rule, then: { ...rule.then, note: e.target.value || undefined } })}
                  className={`w-full ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
