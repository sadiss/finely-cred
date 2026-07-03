import React, { useMemo, useState } from 'react';
import { Building2, Calculator, TrendingUp } from 'lucide-react';
import { FunnelToolkitChecklistPanel } from './FunnelToolkitChecklistPanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../../features/os/finelyOsLightUi';
import { BUSINESS_TYPE_OPTIONS } from '../../../lib/businessVendorSequencing';

const ENTITY_ITEMS = [
  { id: 'llc_filed', label: 'Entity filed with Secretary of State', hint: 'LLC, Corp, or registered trade name on file.' },
  { id: 'ein', label: 'EIN issued (CP 575 on file)', hint: 'IRS letter stored in your document vault.' },
  { id: 'sos_match', label: 'Operating address matches SOS records', hint: 'No mismatched suite or city abbreviations.' },
  { id: 'biz_phone', label: 'Dedicated business phone line', hint: 'Not your personal cell for vendor apps.' },
  { id: 'domain_email', label: 'Domain email (you@company.com)', hint: 'Trust signal for vendors and lenders.' },
  { id: 'biz_bank', label: 'Business bank account opened', hint: 'Separate from personal — underwriting expects it.' },
  { id: 'duns', label: 'D-U-N-S requested or assigned', hint: 'D&B commercial identity anchor.' },
  { id: '411', label: '411 / directory listing aligned', hint: 'Phone + address match across listings.' },
];

const VENDOR_SEQUENCE = [
  { tier: 'Tier 1', vendors: 'Starter net-30 (office, fuel, supplies)', weeks: 'Weeks 1–4' },
  { tier: 'Tier 2', vendors: 'Reporting depth (industrial, SaaS, fleet)', weeks: 'Weeks 5–10' },
  { tier: 'Tier 3', vendors: 'Revolving + higher limits', weeks: 'Months 3–6' },
  { tier: 'Tier 4', vendors: 'Fleet / fleet cards / LOC prep', weeks: 'Month 6+' },
];

type Props = { leadId: string; email: string };

export function FunnelBusinessCreditToolkit({ leadId, email }: Props) {
  const [businessType, setBusinessType] = useState('general');
  const [monthsOperating, setMonthsOperating] = useState(3);
  const [personalScore, setPersonalScore] = useState(680);

  const fundability = useMemo(() => {
    let score = 0;
    const tips: string[] = [];
    if (monthsOperating >= 6) score += 25;
    else if (monthsOperating >= 3) {
      score += 15;
      tips.push('Most vendor tiers unlock best after 3–6 months of consistent operations.');
    } else tips.push('Focus entity hygiene first — many vendors want 3+ months in business.');
    if (personalScore >= 700) score += 30;
    else if (personalScore >= 650) {
      score += 20;
      tips.push('Personal guarantor scores under 700 may limit Tier 3+ approvals.');
    } else {
      score += 8;
      tips.push('Strengthen personal credit before high-limit business applications.');
    }
    const typeLabel = BUSINESS_TYPE_OPTIONS.find((t) => t.id === businessType)?.label ?? 'General';
    score += 20;
    tips.push(`${typeLabel} businesses: start with industry-aligned Tier 1 vendors before revolving products.`);
    score = Math.min(100, score);
    const band = score >= 75 ? 'Strong foundation' : score >= 50 ? 'Building phase' : 'Entity-first';
    return { score, band, tips };
  }, [businessType, monthsOperating, personalScore]);

  return (
    <div className="space-y-4">
      <FunnelToolkitChecklistPanel
        leadId={leadId}
        email={email}
        funnelId="business"
        title="Entity fundability checklist"
        subtitle="Check off each signal before vendor applications — saves denials and wasted inquiries."
        accent="amber"
        items={ENTITY_ITEMS}
        footerTip="Your 15-day business portal preview includes a full roadmap that syncs with this checklist."
      />

      <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4 text-left`}>
        <div className="flex items-center gap-2 text-amber-200 text-[10px] font-black uppercase tracking-widest">
          <Calculator size={14} /> Fundability score estimator
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block space-y-1">
            <span className={FINELY_OS_ENTITY_LABEL}>Business type</span>
            <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={FINELY_OS_ENTITY_SELECT}>
              {BUSINESS_TYPE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className={FINELY_OS_ENTITY_LABEL}>Months operating</span>
            <input type="number" min={0} max={120} value={monthsOperating} onChange={(e) => setMonthsOperating(Number(e.target.value) || 0)} className={FINELY_OS_ENTITY_INPUT} />
          </label>
          <label className="block space-y-1">
            <span className={FINELY_OS_ENTITY_LABEL}>Personal score (est.)</span>
            <input type="number" min={300} max={850} value={personalScore} onChange={(e) => setPersonalScore(Number(e.target.value) || 0)} className={FINELY_OS_ENTITY_INPUT} />
          </label>
        </div>
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <div>
            <div className={`text-sm font-bold ${FINELY_OS_ENTITY_VALUE}`}>{fundability.band}</div>
            <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Educational estimate — not a lending decision.</div>
          </div>
          <div className="text-3xl font-black text-amber-300">{fundability.score}</div>
        </div>
        <ul className={`text-xs ${FINELY_OS_ENTITY_BODY} space-y-1 list-disc pl-4`}>
          {fundability.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-3 text-left`}>
        <div className="flex items-center gap-2 text-emerald-200 text-[10px] font-black uppercase tracking-widest">
          <TrendingUp size={14} /> Vendor sequencing map
        </div>
        <div className="grid gap-2">
          {VENDOR_SEQUENCE.map((row) => (
            <div key={row.tier} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-black/20">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 size={14} className="text-emerald-400 shrink-0" />
                <div>
                  <div className={`text-sm font-bold ${FINELY_OS_ENTITY_VALUE}`}>{row.tier}</div>
                  <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{row.vendors}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 shrink-0">{row.weeks}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
