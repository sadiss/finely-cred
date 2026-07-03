import React, { useMemo, useState } from 'react';
import { MessageSquare, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getBankruptcyScenarioSelection } from '../../data/bankruptcyLaneStateRepo';
import { getPartnerSuccessRecord } from '../../data/partnerSuccessExperienceRepo';
import { resolveStaffForBankruptcyScenario } from '../../data/staffRoster';
import { staffMemberFullName } from '../../domain/staffMember';
import { BANKRUPTCY_LIBERATION_SCENARIOS } from '../../legal/bankruptcyLiberationPaths';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PRIMARY_BTN } from '../../features/os/finelyOsLightUi';

export function BankruptcyCommsHandoffStrip({ partnerId }: { partnerId: string }) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  const selection = useMemo(() => {
    void version;
    return getBankruptcyScenarioSelection(partnerId);
  }, [partnerId, version]);

  const milestone = useMemo(() => {
    void version;
    return getPartnerSuccessRecord(partnerId, 'ps_bankruptcy_milestone');
  }, [partnerId, version]);

  const coach = useMemo(() => {
    if (!selection?.scenarioId) return null;
    return resolveStaffForBankruptcyScenario(
      selection.scenarioId,
      selection.scenarioId === 'fix_credit_after' ? 'bankruptcy_discharge' : 'bankruptcy',
    );
  }, [selection?.scenarioId]);

  React.useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore);
    return () => window.removeEventListener('finely:store', onStore);
  }, []);

  if (!selection && !milestone?.completedAt) return null;

  const scenario =
    BANKRUPTCY_LIBERATION_SCENARIOS.find((s) => s.id === selection?.scenarioId) ??
    (selection?.scenarioTitle ? { title: selection.scenarioTitle, headline: '' } : null);

  return (
    <div className="rounded-2xl border border-sky-500/25 bg-gradient-to-r from-sky-500/10 to-violet-500/5 p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {coach ? (
          <StaffPortraitImg staff={coach} className="h-12 w-12 rounded-xl border border-sky-400/30 shrink-0" />
        ) : (
          <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-2 text-sky-300">
            <Mail size={16} />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-bold text-white">
            {scenario?.title ? `Path active: ${scenario.title}` : 'Bankruptcy specialist aligned'}
          </div>
          <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>
            {coach
              ? `${staffMemberFullName(coach)} is your dedicated coach — thread + email/SMS follow-up are ready.`
              : 'Your coach thread and email/SMS follow-up are ready. Message your specialist anytime.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        className={FINELY_OS_PRIMARY_BTN}
        onClick={() => navigate('/portal/messages?hub=team')}
      >
        <MessageSquare size={14} /> Open messages
      </button>
    </div>
  );
}
