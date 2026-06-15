import React, { useMemo, useState } from 'react';
import { Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CrmRecord } from '../../../domain/crmRecords';
import { formatForecastCents } from '../forecast/buildPipelineForecast';
import { crmRecordDisplayName } from '../../../domain/crmRecords';
import { patchCrmRecordDealValue } from '../../../data/crmRecordsRepo';
import { CrmCallTimeOptimizerPanel } from './CrmCallTimeOptimizerPanel';
import { CrmRecordSequencePanel } from './CrmRecordSequencePanel';
import { FinelyOsPaginatedStack } from '../../os/FinelyOsPaginatedStack';
import { FinelyOsSidePanel } from '../../os/FinelyOsSidePanel';
import {FINELY_OS_ENTITY_INPUT, FINELY_OS_ENTITY_PANEL, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_ACCENT_LINK, FINELY_OS_KPI_ACCENTS, FINELY_OS_PRIMARY_BTN, FINELY_OS_SUCCESS_BTN, finelyOsStatusChip,
  finelyOsCatalogCard,} from '../../os/finelyOsLightUi';

export function CrmRecordPanel({
  record,
  onClose,
  onConvert,
  onUpdated,
}: {
  record: CrmRecord | null;
  onClose: () => void;
  onConvert?: (record: CrmRecord) => void | Promise<void>;
  onUpdated?: () => void;
}) {
  const navigate = useNavigate();
  const [dealDraft, setDealDraft] = useState('');
  const timelineItems = useMemo(
    () => (record?.timeline ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [record?.timeline],
  );

  React.useEffect(() => {
    if (!record) return;
    setDealDraft(record.dealValueCents ? String(Math.round(record.dealValueCents / 100)) : '');
  }, [record?.id, record?.dealValueCents]);

  if (!record) return null;

  return (
    <FinelyOsSidePanel
      icon={Target}
      label="CRM record"
      title={crmRecordDisplayName(record)}
      subtitle={`${record.kind} • ${record.stage}`}
      accent="violet"
      iconAccent="violet"
      widthClass="w-full lg:w-[440px]"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={() => navigate(`/admin/crm/records/${encodeURIComponent(record.id)}`)}
            className={FINELY_OS_PRIMARY_BTN}
          >
            Open full record
          </button>
          {onConvert ? (
            <button type="button" onClick={() => void onConvert(record)} className={FINELY_OS_SUCCESS_BTN}>
              Convert → partner
            </button>
          ) : null}
        </>
      }
    >
      <div className={`${finelyOsCatalogCard('violet')} !p-5 grid grid-cols-2 gap-3 text-sm`}>
        <div><span className={FINELY_OS_ENTITY_SUBLABEL}>Kind</span><div className={FINELY_OS_ENTITY_VALUE}>{record.kind}</div></div>
        <div><span className={FINELY_OS_ENTITY_SUBLABEL}>Stage</span><div className={FINELY_OS_ENTITY_VALUE}>{record.stage}</div></div>
        <div><span className={FINELY_OS_ENTITY_SUBLABEL}>Email</span><div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{record.contact.email || '—'}</div></div>
        <div><span className={FINELY_OS_ENTITY_SUBLABEL}>Phone</span><div className={FINELY_OS_ENTITY_VALUE}>{record.contact.phone || '—'}</div></div>
        <div className="col-span-2"><span className={FINELY_OS_ENTITY_SUBLABEL}>Deal value</span><div className={FINELY_OS_ENTITY_VALUE}>{record.dealValueCents ? formatForecastCents(record.dealValueCents) : '—'}</div></div>
      </div>

      <div className={`${finelyOsCatalogCard('violet')} !p-5 text-sm space-y-2`}>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300/80`}>Deal value (forecast)</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>$</span>
          <input
            type="number"
            min={0}
            step={1}
            value={dealDraft}
            onChange={(e) => setDealDraft(e.target.value)}
            placeholder="0"
            className={`w-28 ${FINELY_OS_ENTITY_INPUT} mt-0 py-2`}
          />
          <button
            type="button"
            onClick={() => {
              const dollars = parseFloat(dealDraft || '0');
              const cents = Number.isFinite(dollars) ? Math.round(dollars * 100) : 0;
              patchCrmRecordDealValue(record.id, cents);
              window.dispatchEvent(new Event('finely:store'));
              onUpdated?.();
            }}
            className={FINELY_OS_SUCCESS_BTN}
          >
            Save
          </button>
        </div>
        <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Powers pipeline forecast weight and smart lists.</p>
      </div>

      {record.workSignals ? (
        <div className={`${finelyOsCatalogCard('violet')} !p-5 text-sm`}>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-300/80`}>Work OS signals</div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            <span className={finelyOsStatusChip('ok')}>Idle {Math.round(record.workSignals.idleDays)}d</span>
            <span className={finelyOsStatusChip('warn')}>SLA {record.workSignals.slaBreachCount}</span>
            <span className={finelyOsStatusChip(record.workSignals.riskLevel === 'high' ? 'blocked' : record.workSignals.riskLevel === 'medium' ? 'warn' : 'ok')}>
              {record.workSignals.riskLevel}
            </span>
          </div>
          {record.partnerId ? (
            <button
              type="button"
              onClick={() => navigate(`/admin/partners/${record.partnerId}`)}
              className={`mt-2 ${FINELY_OS_ENTITY_ACCENT_LINK} text-[10px] font-bold uppercase tracking-wider no-underline`}
            >
              Open partner →
            </button>
          ) : null}
        </div>
      ) : null}

      {record.nextAction ? (
        <div className={`${finelyOsCatalogCard('violet')} !p-5 text-sm`}>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-300/80`}>Next action</div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{record.nextAction.label}</div>
          {record.nextAction.dueAt ? (
            <div className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>Due {new Date(record.nextAction.dueAt).toLocaleString()}</div>
          ) : null}
        </div>
      ) : null}

      <CrmCallTimeOptimizerPanel record={record} />

      <CrmRecordSequencePanel record={record} onUpdated={onUpdated} />

      <div>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>Timeline</div>
        <FinelyOsPaginatedStack
          items={timelineItems}
          pageSize={5}
          emptyMessage="No timeline events yet."
          renderItem={(t, i) => (
            <div key={t.id} className={`rounded-lg border px-3 py-2 text-xs ${FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]}`}>
              <div className={FINELY_OS_ENTITY_VALUE}>{t.label}</div>
              <div className={`mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{new Date(t.createdAt).toLocaleString()}</div>
            </div>
          )}
        />
      </div>
    </FinelyOsSidePanel>
  );
}
