import React, { useMemo, useState } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { DENEFITS, DENEFITS_AFFILIATE_COPY, DENEFITS_SPECIALIST_COPY } from '../../config/denefitsProgram';
import {
  computeDenefitsContractProjection,
  computeDenefitsMonthlyAccrual,
  formatUsdFromCents,
  formatUsdFromCentsPrecise,
} from '../../domain/partnerEconomics';
import {
  CalculatorField,
  CalculatorMetricGrid,
  CalculatorPresetPills,
  CalculatorShell,
  calcInputClass,
} from './CalculatorShell';
import { CalculatorBarChart, CalculatorSparkline } from './CalculatorBarChart';
import { DENEFITS_CONTRACT_PRESETS } from './calculatorPresets';
import {FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_INNER,
  finelyOsCatalogCard,} from '../../features/os/finelyOsLightUi';
import { isDenefitsConfigured, isFeatureEnabled } from '../../data/settingsRepo';

type Props = {
  defaultSpecialistSharePct?: number;
  compact?: boolean;
  audience?: 'specialist' | 'affiliate';
};

function parseMoney(raw: string): number {
  const n = parseFloat(raw.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

type PresetId = (typeof DENEFITS_CONTRACT_PRESETS)[number]['id'];

export function DenefitsContractCalculator({
  defaultSpecialistSharePct = DENEFITS.defaultSpecialistSharePct,
  compact = false,
  audience = 'specialist',
}: Props) {
  const [presetId, setPresetId] = useState<PresetId>('standard');
  const [contractValue, setContractValue] = useState(String(DENEFITS.exampleContractValue));
  const [termYears, setTermYears] = useState(String(DENEFITS.exampleTermYears));
  const [monthlyPayment, setMonthlyPayment] = useState(String(DENEFITS.exampleMonthlyPayment));
  const defaultPct = audience === 'affiliate' ? DENEFITS.defaultAffiliateSharePct : defaultSpecialistSharePct;
  const [sharePct, setSharePct] = useState(String(defaultPct));

  const copy = audience === 'affiliate' ? DENEFITS_AFFILIATE_COPY : DENEFITS_SPECIALIST_COPY;
  const isLive = isFeatureEnabled('denefitsEnabled') && isDenefitsConfigured();

  const applyPreset = (id: PresetId) => {
    setPresetId(id);
    const p = DENEFITS_CONTRACT_PRESETS.find((x) => x.id === id);
    if (!p || id === 'custom') return;
    setContractValue(String(p.value));
    setMonthlyPayment(String(p.monthly));
    setTermYears(String(p.years));
  };

  const termMonths = Math.max(1, Math.round(parseFloat(termYears || '5') * 12));

  const projection = useMemo(
    () =>
      computeDenefitsContractProjection({
        contractValueCents: parseMoney(contractValue),
        termMonths,
        monthlyPaymentCents: parseMoney(monthlyPayment),
        specialistSharePct: parseFloat(sharePct || '0'),
      }),
    [contractValue, termYears, monthlyPayment, sharePct, termMonths],
  );

  const accrual = useMemo(
    () =>
      computeDenefitsMonthlyAccrual({
        contractValueCents: parseMoney(contractValue),
        termMonths,
        monthlyPaymentCents: parseMoney(monthlyPayment),
        specialistSharePct: parseFloat(sharePct || '0'),
      }),
    [contractValue, termMonths, monthlyPayment, sharePct],
  );

  const sparkValues = useMemo(() => {
    const step = Math.max(1, Math.floor(accrual.length / 24));
    return accrual.filter((_, i) => i % step === 0 || i === accrual.length - 1).map((r) => r.cumulativeSpecialistCents);
  }, [accrual]);

  return (
    <CalculatorShell
      compact={compact}
      badge={DENEFITS.productLabel}
      badgeIcon={<Calculator size={14} />}
      accent="emerald"
      title={copy.title}
      description={copy.description}
      heroLabel="Your total over term"
      heroValue={formatUsdFromCents(projection.specialistTotalCents)}
      heroSub={`~${formatUsdFromCentsPrecise(projection.specialistMonthlyCents)}/mo accrual`}
      footer={`${isLive ? DENEFITS.equifaxNote : 'Preview calculator only — live financing requires In-House Financing to be enabled and contract URLs assigned in Admin Settings.'} Example: $${DENEFITS.exampleContractValue.toLocaleString()} · ~$${DENEFITS.exampleMonthlyPayment}/mo × ${DENEFITS.exampleTermYears * 12} months.`}
    >
      <div className="space-y-2">
        <span className={FINELY_OS_ENTITY_LABEL}>Contract preset</span>
        <CalculatorPresetPills
          options={DENEFITS_CONTRACT_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
          value={presetId}
          onChange={(id) => applyPreset(id)}
          accent="emerald"
        />
      </div>

      <div className={`grid gap-4 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        <CalculatorField label="Contract value ($)">
          <input value={contractValue} onChange={(e) => { setContractValue(e.target.value); setPresetId('custom'); }} className={calcInputClass} />
        </CalculatorField>
        <CalculatorField label={`Term (${termYears} years)`}>
          <input type="range" min={1} max={10} value={termYears} onChange={(e) => setTermYears(e.target.value)} className="w-full mt-3 accent-emerald-600" />
          <input value={termYears} onChange={(e) => setTermYears(e.target.value)} className={`${calcInputClass} mt-2`} />
        </CalculatorField>
        <CalculatorField label="Customer pays / month ($)">
          <input value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} className={calcInputClass} />
        </CalculatorField>
        <CalculatorField label={`Your share (${sharePct}%)`}>
          <input type="range" min={4} max={25} value={sharePct} onChange={(e) => setSharePct(e.target.value)} className="w-full mt-3 accent-emerald-600" />
          <input value={sharePct} onChange={(e) => setSharePct(e.target.value)} className={`${calcInputClass} mt-2`} />
        </CalculatorField>
      </div>

      <CalculatorMetricGrid
        accent="emerald"
        items={[
          { label: 'Collected over term', value: formatUsdFromCents(projection.totalCollectedCents) },
          { label: `Finely (${projection.platformSharePct}%)`, value: formatUsdFromCents(projection.platformTotalCents) },
          { label: `You (${projection.specialistSharePct}%)`, value: formatUsdFromCents(projection.specialistTotalCents), highlight: true },
        ]}
      />

      <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
        <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_VALUE} text-sm`}>
          <TrendingUp size={16} className="text-emerald-300" /> Revenue split over contract
        </div>
        <CalculatorBarChart
          formatValue={(n) => formatUsdFromCents(n)}
          bars={[
            { label: 'You', value: projection.specialistTotalCents, color: 'linear-gradient(180deg, #34d399, #059669)' },
            { label: 'Platform', value: projection.platformTotalCents, color: 'linear-gradient(180deg, #fbbf24, #d97706)' },
            { label: 'Total', value: projection.totalCollectedCents, color: 'linear-gradient(180deg, #94a3b8, #64748b)' },
          ]}
        />
      </div>

      <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Cumulative accrual ({termMonths} months)</div>
        <CalculatorSparkline values={sparkValues} color="#059669" height={56} />
        {projection.yearlySpecialistCents.length > 1 ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {projection.yearlySpecialistCents.map((cents, i) => (
              <div key={i} className="px-3 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-sm">
                <span className="text-emerald-300/70">Year {i + 1}</span>{' '}
                <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{formatUsdFromCents(cents)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </CalculatorShell>
  );
}

/** @deprecated Wrong legacy name — use DenefitsContractCalculator. Brand is Denefit, not Benefits. */
export const BenefitsContractCalculator = DenefitsContractCalculator;
