import React, { useEffect, useMemo, useState } from 'react';
import { listCrmRecords, setCrmRecordStage } from '../../../data/crmRecordsRepo';
import { applyCrmRoutingRules } from '../../crm/routing/applyCrmRoutingRules';
import { CrmPipelineBoard, CrmRecordPanel } from '../../crm/components/CrmPipelineBoard';
import type { CrmRecord, CrmRecordStage } from '../../../domain/crmRecords';
import {
  FINELY_OS_BOARD_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../os/finelyOsLightUi';
import { useNavigate } from 'react-router-dom';
import { onBoardStageMaybeBooked } from '../marketingDeskBookedHandoff';
import { FinelyOsAlertBanner } from '../../os/FinelyOsAlertBanner';

export function BoardRoom() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState<CrmRecord | null>(null);
  const [handoffNotice, setHandoffNotice] = useState<string | null>(null);

  const records = useMemo(
    () => listCrmRecords({ kind: 'inbound_lead' }),
    [version],
  );

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 rounded-2xl border border-violet-400/25 bg-black/70 backdrop-blur-md p-6 space-y-3">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Board</div>
        <h2 className="text-xl font-bold text-white">People who asked</h2>
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
          New → Talking → Booked → Won / No. Cleaned-out people stay off this board.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/admin/marketing-desk?helper=clean')}>
            Clean out junk
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/crm?pipeline=inbound')}>
            Full CRM
          </button>
        </div>
      </div>

      {handoffNotice ? <FinelyOsAlertBanner tone="success" message={handoffNotice} /> : null}

      <div className="flex flex-col xl:flex-row gap-3">
        <div className={`flex-1 min-w-0 ${FINELY_OS_BOARD_SHELL}`}>
          <CrmPipelineBoard
            pipelineId="inbound"
            records={records}
            onSelect={setSelected}
            onStageChange={(recordId, stage) => {
              setCrmRecordStage(recordId, stage as CrmRecordStage);
              applyCrmRoutingRules(recordId);
              if (stage === 'booked') {
                onBoardStageMaybeBooked(recordId, stage);
                setHandoffNotice(
                  'Booked — handoff ready; partner seed when email on file; cold/nurture paused; confirm mail when Ready.',
                );
              }
              window.dispatchEvent(new Event('finely:store'));
              setVersion((v) => v + 1);
            }}
          />
        </div>
        <div className="xl:w-80 shrink-0">
          <CrmRecordPanel record={selected} onClose={() => setSelected(null)} onUpdated={() => setVersion((v) => v + 1)} />
        </div>
      </div>
    </div>
  );
}
