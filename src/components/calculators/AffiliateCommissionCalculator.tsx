import React, { useMemo, useState } from 'react';
import { DollarSign, Percent, TrendingUp, Users } from 'lucide-react';
import { AF } from '../../config/affiliateProgram';
import {
  computeAffiliateCommission,
  computeAffiliateVolumeProjection,
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
import { COMMISSION_PACKAGE_PRESETS } from './calculatorPresets';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_INNER,
  finelyOsCatalogCard,} from '../../features/os/finelyOsLightUi';

function parseMoney(raw: string): number {
  const n = parseFloat(raw.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

type PresetId = (typeof COMMISSION_PACKAGE_PRESETS)[number]['id'];

export function AffiliateCommissionCalculator() {
  const [presetId, setPresetId] = useState<PresetId>('restore_starter');
  const [saleAmount, setSaleAmount] = useState('497');
  const [commissionPct, setCommissionPct] = useState(String(AF.defaultCommissionPct));
  const [recurringAmount, setRecurringAmount] = useState('49');
  const [recurringMonths, setRecurringMonths] = useState('12');
  const [includeRecurring, setIncludeRecurring] = useState(true);
  const [referralsPerMonth, setReferralsPerMonth] = useState('2');
  const [projectionMonths, setProjectionMonths] = useState('12');

  const applyPreset = (id: PresetId) => {
    setPresetId(id);
    const p = COMMISSION_PACKAGE_PRESETS.find((x) => x.id === id);
    if (!p || id === 'custom') return;
    setSaleAmount(String(p.sale));
    setRecurringAmount(String(p.recurring));
    setRecurringMonths(String(p.recurringMonths));
    setIncludeRecurring(p.recurring > 0);
  };

  const projection = useMemo(
    () =>
      computeAffiliateCommission({
        saleAmountCents: parseMoney(saleAmount),
        commissionPct: parseFloat(commissionPct || '0'),
        recurringAmountCents: includeRecurring ? parseMoney(recurringAmount) : 0,
        recurringMonths: includeRecurring ? parseInt(recurringMonths || '0', 10) : 0,
      }),
    [saleAmount, commissionPct, recurringAmount, recurringMonths, includeRecurring],
  );

  const volume = useMemo(
    () =>
      computeAffiliateVolumeProjection({
        referralsPerMonth: parseInt(referralsPerMonth || '0', 10),
        months: parseInt(projectionMonths || '12', 10),
        perReferralGrandTotalCents: projection.grandTotalCents,
      }),
    [referralsPerMonth, projectionMonths, projection.grandTotalCents],
  );

  return (
    <CalculatorShell
      badge="Affiliate commission"
      badgeIcon={<Percent size={14} />}
      accent="sky"
      title="Model your referral earnings"
      description="Pick a Finely package preset, tune commission %, then scale with referrals per month. Upfront + recurring membership share stacks over time."
      heroLabel="Per referral"
      heroValue={formatUsdFromCents(projection.grandTotalCents)}
      heroSub={includeRecurring ? `incl. ${recurringMonths} mo recurring` : 'upfront only'}
      footer={`Default affiliate rate ${AF.defaultCommissionPct}% upfront · ${AF.defaultRecurringCommissionPct}% recurring when eligible. Denefit contract stream (${AF.defaultDenefitsSharePct}%) stacks separately in the Denefit tab.`}
    >
      <div className="space-y-2">
        <span className={FINELY_OS_ENTITY_LABEL}>Package preset</span>
        <CalculatorPresetPills
          options={COMMISSION_PACKAGE_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
          value={presetId}
          onChange={(id) => applyPreset(id)}
          accent="sky"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CalculatorField label="Referred sale ($)">
          <input value={saleAmount} onChange={(e) => { setSaleAmount(e.target.value); setPresetId('custom'); }} className={calcInputClass} />
        </CalculatorField>
        <CalculatorField label={`Commission % (${commissionPct}%)`}>
          <input
            type="range"
            min={5}
            max={40}
            value={commissionPct}
            onChange={(e) => setCommissionPct(e.target.value)}
            className="w-full mt-3 accent-sky-600"
          />
          <input value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} className={`${calcInputClass} mt-2`} />
        </CalculatorField>
        <CalculatorField label="Referrals / month">
          <input value={referralsPerMonth} onChange={(e) => setReferralsPerMonth(e.target.value)} className={calcInputClass} />
        </CalculatorField>
        <CalculatorField label="Projection window (months)">
          <input value={projectionMonths} onChange={(e) => setProjectionMonths(e.target.value)} className={calcInputClass} />
        </CalculatorField>
      </div>

      <label className={`flex items-center gap-3 ${FINELY_OS_ENTITY_BODY}`}>
        <input type="checkbox" checked={includeRecurring} onChange={(e) => setIncludeRecurring(e.target.checked)} className="accent-sky-600 w-4 h-4" />
        Include recurring membership commission
      </label>

      {includeRecurring ? (
        <div className="grid md:grid-cols-2 gap-4">
          <CalculatorField label="Monthly plan ($)">
            <input value={recurringAmount} onChange={(e) => setRecurringAmount(e.target.value)} className={calcInputClass} />
          </CalculatorField>
          <CalculatorField label="Months active">
            <input value={recurringMonths} onChange={(e) => setRecurringMonths(e.target.value)} className={calcInputClass} />
          </CalculatorField>
        </div>
      ) : null}

      <CalculatorMetricGrid
        accent="sky"
        items={[
          { label: 'Upfront commission', value: formatUsdFromCents(projection.upfrontCents), sub: `${commissionPct}% of sale` },
          {
            label: 'Recurring total',
            value: formatUsdFromCents(projection.recurringTotalCents),
            sub: includeRecurring ? `${formatUsdFromCentsPrecise(projection.recurringMonthlyCents)}/mo` : '—',
          },
          { label: `${projectionMonths}-mo volume`, value: formatUsdFromCents(volume.yearTotalCents), sub: `${referralsPerMonth} refs/mo`, highlight: true },
        ]}
      />

      <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
        <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_VALUE} text-sm`}>
          <TrendingUp size={16} className="text-sky-300" /> Per-referral breakdown
        </div>
        <CalculatorBarChart
          formatValue={(n) => formatUsdFromCents(n)}
          bars={[
            { label: 'Upfront', value: projection.upfrontCents, color: 'linear-gradient(180deg, #38bdf8, #0284c7)' },
            { label: 'Recurring', value: projection.recurringTotalCents, color: 'linear-gradient(180deg, #34d399, #059669)' },
            { label: 'Total', value: projection.grandTotalCents, color: 'linear-gradient(180deg, #fbbf24, #d97706)' },
          ]}
        />
      </div>

      <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
        <div className="flex items-center justify-between gap-2">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_VALUE} text-sm`}>
            <Users size={16} className="text-sky-300" /> Cumulative earnings projection
          </div>
          <span className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{referralsPerMonth} referrals × {formatUsdFromCents(projection.grandTotalCents)}</span>
        </div>
        <CalculatorSparkline values={volume.cumulativeCents} color="#0284c7" height={56} />
        <div className="flex flex-wrap gap-2">
          {volume.monthlyTotalsCents.slice(0, 12).map((cents, i) => (
            <div key={i} className="px-2.5 py-1.5 rounded-lg fc-light-glass-panel fc-light-chrome-panel border text-xs">
              <span className="text-white/45">M{i + 1}</span>{' '}
              <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{formatUsdFromCents(cents)}</span>
            </div>
          ))}
        </div>
      </div>
    </CalculatorShell>
  );
}
