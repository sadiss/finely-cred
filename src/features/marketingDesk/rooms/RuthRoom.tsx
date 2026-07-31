import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RuthLeadEngineBrief } from '../../../components/coOwner/RuthLeadEngineBrief';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
} from '../../os/finelyOsLightUi';
import {
  ensureNurtureSequenceForProspects,
  getLaneCta,
  listLeadEngineProspects,
  type LeadEngineLane,
} from '../../leadIntel/leadEngineAutonomy';
import { FinelyOsAlertBanner } from '../../os/FinelyOsAlertBanner';
import { createBookTask, createOfferTask } from '../marketingDeskTasks';
import { enrollColdProspectMail, enrollOrSendOfferMail } from '../marketingDeskMail';
import { getRuthWeeklyLaneTip } from '../marketingDeskRuthLaneTip';

/**
 * Ruth helper room — action chips that create Marketing Pipeline tasks + enroll mail.
 */
export function RuthRoom() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState<string | null>(null);
  const weeklyTip = getRuthWeeklyLaneTip();

  const topProspect = () => listLeadEngineProspects()[0];

  const queueNurture = () => {
    const r = ensureNurtureSequenceForProspects();
    setNotice(
      r.created
        ? `Queued ${r.created} follow-up to-do(s) on Marketing Pipeline. Open My work when you return home.`
        : r.skipped
          ? 'Follow-ups already queued for these people.'
          : 'No prospects yet — Find new people first.',
    );
  };

  const bookTop = () => {
    const top = topProspect();
    if (!top) {
      setNotice('No prospect yet — Find new people first.');
      return;
    }
    const lanes: LeadEngineLane[] = [
      'business_credit',
      'credit_restore',
      'debt',
      'agency_affiliates',
      'local_service',
      'funded_business',
    ];
    const lane = (lanes.find((l) => (top.tags ?? []).includes(l)) || 'business_credit') as LeadEngineLane;
    const task = createBookTask({
      name: top.company?.name || top.contact?.name || 'Prospect',
      prospectId: top.id,
      lane,
    });
    const cta = getLaneCta(lane);
    setNotice(`Book to-do created. Open booking: ${cta.book}`);
    navigate(`/admin/projects/${task.projectId}?task=${task.id}`);
  };

  const offerTop = () => {
    const top = topProspect();
    if (!top) {
      setNotice('No prospect yet — Find new people first.');
      return;
    }
    const lanes: LeadEngineLane[] = [
      'business_credit',
      'credit_restore',
      'debt',
      'agency_affiliates',
      'local_service',
      'funded_business',
    ];
    const lane = (lanes.find((l) => (top.tags ?? []).includes(l)) || 'business_credit') as LeadEngineLane;
    const name = top.company?.name || top.contact?.name || 'Prospect';
    const mail = enrollOrSendOfferMail({
      name,
      email: top.contact?.emails?.[0],
      prospectId: top.id,
      lane,
    });
    if (!mail.enrolled) {
      // enrollOrSendOfferMail already creates the Offer to-do on fallback — do not double-create
      if (mail.fallbackTask) {
        setNotice('Offer to-do created (mail not Ready). Open My work.');
        navigate('/admin/my-tasks');
        return;
      }
      const task = createOfferTask({ name, prospectId: top.id, lane });
      setNotice('Offer to-do created.');
      navigate(`/admin/projects/${task.projectId}?task=${task.id}`);
      return;
    }
    setNotice('Offer pack mail enrolled — sends on the nurture schedule.');
  };

  const enrollTop = () => {
    const top = topProspect();
    if (!top) {
      setNotice('Need a prospect — approve someone from Find first.');
      return;
    }
    const mail = enrollColdProspectMail({
      prospectId: top.id,
      email: top.contact?.emails?.[0],
      fullName: top.contact?.name || top.company?.name,
      lane: 'business_credit',
    });
    setNotice(
      mail.enrolled
        ? 'Enrolled top prospect in cold mail — sends on the nurture schedule.'
        : mail.fallbackTask
          ? 'Mail not Ready — follow-up to-do created instead.'
          : 'Could not enroll — check Mail room.',
    );
  };

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 rounded-2xl border border-amber-400/25 bg-black/70 backdrop-blur-md !p-4 space-y-2">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Ruth</div>
        <h2 className="text-xl font-bold text-white">What to do · what to say</h2>
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Short brief + chips that do real work — not decorative copy.
        </p>
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/admin/marketing-desk?helper=find')}>
          Find new people
        </button>
      </div>

      {notice ? <FinelyOsAlertBanner tone="success" message={notice} /> : null}

      {weeklyTip ? (
        <div className={`${finelyOsCatalogCardCompact('amber')} space-y-2`} data-fc-accent="amber">
          <div className="flex flex-wrap items-center gap-2">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>This week’s lane tip</div>
            <span className={finelyOsMicroStat('amber')}>{weeklyTip.laneLabel}</span>
          </div>
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>{weeklyTip.tip}</p>
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => navigate('/admin/marketing-desk?helper=find')}
          >
            Open Find
          </button>
        </div>
      ) : null}

      <div className={`${finelyOsCatalogCardCompact('amber')} space-y-2`} data-fc-accent="amber">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Action chips</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={bookTop}>
            Book session (top)
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={offerTop}>
            Send offer (top)
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={queueNurture}>
            Queue nurture to-dos
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={enrollTop}>
            Enroll top in mail
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/my-tasks')}>
            Open My work
          </button>
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => window.open('/resources/business-credit-one-sheets', '_blank')}
          >
            Partner one-sheets
          </button>
        </div>
      </div>

      <RuthLeadEngineBrief compact />
    </div>
  );
}
