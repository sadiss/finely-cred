import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { getCrmRecord, convertCrmRecordToPartner, getRecommendedPackageForRecord, patchCrmRecordDealValue } from '../../data/crmRecordsRepo';
import { CrmAICopilotPanel } from '../../features/crm/components/CrmAICopilotPanel';
import { CrmCallTimeOptimizerPanel } from '../../features/crm/components/CrmCallTimeOptimizerPanel';
import { CrmRecordSequencePanel } from '../../features/crm/components/CrmRecordSequencePanel';
import { CrmServiceBundlePanel } from '../../features/crm/components/CrmServiceBundlePanel';
import { CrmConsentPanel } from '../../features/crm/components/CrmConsentPanel';
import { crmRecordDisplayName } from '../../domain/crmRecords';
import { formatForecastCents } from '../../features/crm/forecast/buildPipelineForecast';
import { FinelyOsCatalogBrowser, type FinelyOsCatalogItem } from '../../features/os/FinelyOsCatalogBrowser';
import {
  FINELY_OS_BACK_LINK,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';

export default function AdminCrmRecordPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [dealDraft, setDealDraft] = useState('');
  const record = useMemo(() => (id ? getCrmRecord(decodeURIComponent(id)) : null), [id, version]);

  React.useEffect(() => {
    if (!record) return;
    setDealDraft(record.dealValueCents ? String(Math.round(record.dealValueCents / 100)) : '');
  }, [record?.id, record?.dealValueCents]);

  if (!id || !record) {
    return <PageShell badge="Admin" title="Record not found" subtitle="" />;
  }

  const packages = getRecommendedPackageForRecord(record);

  const timelineItems = useMemo((): FinelyOsCatalogItem[] =>
    record.timeline.map((t, i) => ({
      id: t.id,
      title: t.label,
      subtitle: t.kind.replace(/_/g, ' '),
      groupKey: t.kind,
      accentIndex: i,
      meta: [new Date(t.createdAt).toLocaleString()],
    })),
  [record.timeline]);

  return (
    <PageShell badge="Admin" title={crmRecordDisplayName(record)} subtitle={`${record.kind} • ${record.stage}`}>
      <div className="max-w-3xl space-y-4">
        <button type="button" onClick={() => navigate('/admin/crm')} className={FINELY_OS_BACK_LINK}>
          ← Back to CRM
        </button>

        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`} data-fc-accent="violet">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className={FINELY_OS_ENTITY_SUBLABEL}>Email</span><div className={FINELY_OS_ENTITY_VALUE}>{record.contact.email || '—'}</div></div>
            <div><span className={FINELY_OS_ENTITY_SUBLABEL}>Phone</span><div className={FINELY_OS_ENTITY_VALUE}>{record.contact.phone || '—'}</div></div>
            <div><span className={FINELY_OS_ENTITY_SUBLABEL}>Company</span><div className={FINELY_OS_ENTITY_VALUE}>{record.contact.company || '—'}</div></div>
            <div><span className={FINELY_OS_ENTITY_SUBLABEL}>Score</span><div className={FINELY_OS_ENTITY_VALUE}>{record.score ?? '—'}</div></div>
            <div><span className={FINELY_OS_ENTITY_SUBLABEL}>Deal value</span><div className={FINELY_OS_ENTITY_VALUE}>{record.dealValueCents ? formatForecastCents(record.dealValueCents) : '—'}</div></div>
          </div>

          <div className={`${finelyOsCatalogCard('emerald')} !p-4 fc-surface-harmony border-emerald-500/25 space-y-2`} data-fc-accent="emerald">
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Deal value (forecast)</div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>$</span>
              <input
                type="number"
                min={0}
                value={dealDraft}
                onChange={(e) => setDealDraft(e.target.value)}
                className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} w-28 !py-1.5 text-sm`}
              />
              <button
                type="button"
                onClick={() => {
                  const dollars = parseFloat(dealDraft || '0');
                  patchCrmRecordDealValue(record.id, Number.isFinite(dollars) ? Math.round(dollars * 100) : 0);
                  window.dispatchEvent(new Event('finely:store'));
                  setVersion((v) => v + 1);
                }}
                className={FINELY_OS_SUCCESS_BTN}
              >
                Save
              </button>
            </div>
          </div>

          {record.workSignals ? (
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm`} data-fc-accent="sky">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Work OS signals</div>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                Idle {Math.round(record.workSignals.idleDays)} days • {record.workSignals.slaBreachCount} SLA breach(es) • risk{' '}
                <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{record.workSignals.riskLevel}</span>
              </p>
              {record.partnerId ? (
                <button
                  type="button"
                  onClick={() => navigate(`/admin/partners/${record.partnerId}`)}
                  className={`mt-2 ${FINELY_OS_SECONDARY_BTN}`}
                >
                  Open partner →
                </button>
              ) : null}
            </div>
          ) : null}

          {packages.length ? (
            <div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Recommended packages</div>
              <ul className={`mt-2 space-y-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                {packages.map((p) => p && (
                  <li key={p.id} className={FINELY_OS_ENTITY_VALUE}>{p.name} — {p.delivery}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <CrmServiceBundlePanel record={record} />

          <button
            type="button"
            onClick={async () => {
              const result = await convertCrmRecordToPartner({ recordId: record.id, packageId: packages[0]?.id });
              if (result?.partnerId) navigate(`/admin/partners/${result.partnerId}`);
            }}
            className={FINELY_OS_PRIMARY_BTN}
          >
            Convert → partner + work project
          </button>
        </div>

        <CrmConsentPanel record={record} onUpdated={() => setVersion((v) => v + 1)} />

        <CrmCallTimeOptimizerPanel record={record} />

        <CrmRecordSequencePanel record={record} onUpdated={() => setVersion((v) => v + 1)} />

        <CrmAICopilotPanel record={record} />

        <div className={`${finelyOsCatalogCard('amber')} !p-5`} data-fc-accent="amber">
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-3`}>Timeline</div>
          <FinelyOsCatalogBrowser
            items={timelineItems}
            pageSize={8}
            searchPlaceholder="Search timeline…"
            emptyMessage="No timeline events yet."
            initialView="grid"
            showViewToggle={false}
          />
        </div>
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}
