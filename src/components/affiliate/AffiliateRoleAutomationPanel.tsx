import React, { useMemo, useState } from 'react';
import { Bot, Repeat, Sparkles, TrendingUp } from 'lucide-react';
import { AF } from '../../config/affiliateProgram';
import { listAutomationsForRole, listResidualIncomeAutomations, toSiteAutomationRole } from '../../lib/siteAutomationAccess';
import { callAiGateway } from '../../lib/aiClient';
import { AffiliatePitchPanel } from '../affiliate/AffiliatePitchPanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsKpiTile,
} from '../../features/os/finelyOsLightUi';

type Props = {
  partnerId?: string;
  role?: string | null;
  referralUrl?: string;
};

export function AffiliateRoleAutomationPanel({ partnerId, role, referralUrl }: Props) {
  const autoRole = toSiteAutomationRole(role ?? 'affiliate');
  const automations = useMemo(
    () => listAutomationsForRole({ role: autoRole, partnerId, includePrepared: false }),
    [autoRole, partnerId],
  );
  const residual = useMemo(() => listResidualIncomeAutomations('affiliate'), []);
  const [aiPitch, setAiPitch] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const runAiPitch = async () => {
    setBusy(true);
    try {
      const res = await callAiGateway({
        taskType: 'marketing.copy',
        messages: [
          {
            role: 'system',
            content:
              'Write compliant affiliate referral copy for Finely Cred. No guaranteed credit outcomes. Include CTA with referral link placeholder {{referralUrl}}. 3 short variants.',
          },
          { role: 'user', content: 'Audience: credit-conscious professionals exploring DIY restore vs DFY.' },
        ],
      });
      setAiPitch(res.text.trim());
    } catch {
      setAiPitch('AI pitch unavailable — use the pitch panel below for templates.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`grid md:grid-cols-3 gap-4 ${finelyOsCatalogCard('sky')} !p-5`}>
        <div className={finelyOsKpiTile(0)}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Upfront commission</div>
          <div className="text-2xl font-bold text-sky-200">{AF.defaultCommissionPct}%</div>
        </div>
        <div className={finelyOsKpiTile(1)}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Recurring residual</div>
          <div className="text-2xl font-bold text-violet-200">{AF.defaultRecurringCommissionPct}%/mo</div>
        </div>
        <div className={finelyOsKpiTile(2)}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Denefit stream</div>
          <div className="text-2xl font-bold text-emerald-200">{AF.defaultDenefitsSharePct}%</div>
        </div>
      </div>

      <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm inline-flex items-center gap-2`}>
          <Repeat size={16} /> Residual income engine
        </div>
        <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
          Earn upfront on referred packages, then monthly residual while referrals stay on membership plans. Denefit contracts add a long-tail stream.
        </p>
        <ul className={`text-xs ${FINELY_OS_ENTITY_BODY} space-y-1`}>
          {residual.map((r) => (
            <li key={r.id}>• {r.title}</li>
          ))}
        </ul>
      </div>

      <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-3`}>
        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm inline-flex items-center gap-2`}>
          <Sparkles size={16} /> AI-powered tools
        </div>
        <button type="button" onClick={() => void runAiPitch()} disabled={busy} className={FINELY_OS_PRIMARY_BTN}>
          <Bot size={14} /> {busy ? 'Generating…' : 'Generate referral pitch variants'}
        </button>
        {aiPitch ? <pre className={`text-xs whitespace-pre-wrap ${FINELY_OS_ENTITY_BODY} max-h-48 overflow-y-auto`}>{aiPitch}</pre> : null}
        <AffiliatePitchPanel referralUrl={referralUrl} />
      </div>

      <div className="space-y-2">
        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm inline-flex items-center gap-2`}>
          <TrendingUp size={16} /> Your automations
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {automations.map((a) => (
            <div key={a.id} className={`${finelyOsCatalogCard('sky')} !p-4`}>
              <div className="text-sm font-semibold text-white">{a.title}</div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>{a.description}</p>
            </div>
          ))}
        </div>
        {automations.length === 0 ? (
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Complete affiliate activation to unlock automations.</p>
        ) : null}
      </div>

      <button type="button" onClick={() => window.open('/admin/automations', '_blank')} className={FINELY_OS_SECONDARY_BTN}>
        Open Automation Studio (admin)
      </button>
    </div>
  );
}
