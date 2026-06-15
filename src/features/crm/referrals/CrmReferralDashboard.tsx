import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, TrendingUp, Users } from 'lucide-react';
import { listCrmRecords } from '../../../data/crmRecordsRepo';
import { buildReferralDashboard, formatForecastCents } from './buildReferralDashboard';
import { FinelyOsOverviewStatTile } from '../../os/FinelyOsOverviewStatTile';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_INNER,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
  finelyOsCatalogCard,} from '../../os/finelyOsLightUi';

export function CrmReferralDashboard() {
  const navigate = useNavigate();
  const dash = useMemo(() => buildReferralDashboard(listCrmRecords()), []);

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <FinelyOsOverviewStatTile icon={Users} label="Attributed leads" value={dash.totalAttributed} accent="violet" iconAccent="violet" />
        <FinelyOsOverviewStatTile icon={TrendingUp} label="Open pipeline" value={dash.totalOpen} accent="amber" iconAccent="amber" />
        <FinelyOsOverviewStatTile
          icon={Gift}
          label="Converted"
          value={dash.totalConverted}
          accent="emerald"
          iconAccent="emerald"
          hint={`${dash.overallConversionRate}% conversion rate`}
        />
        <FinelyOsOverviewStatTile
          icon={TrendingUp}
          label="Pipeline value"
          value={formatForecastCents(dash.pipelineValueCents)}
          accent="sky"
          iconAccent="sky"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`lg:col-span-2 overflow-hidden ${finelyOsGlassShell('panel', 'violet')}`}>
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>By referral code</span>
            <button type="button" onClick={() => navigate('/admin/crm?smartList=affiliate_attributed')} className={FINELY_OS_SECONDARY_BTN}>
              View in CRM →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left ${FINELY_OS_ENTITY_SUBLABEL} border-b border-white/[0.08]`}>
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2">Leads</th>
                  <th className="px-4 py-2">Open</th>
                  <th className="px-4 py-2">Converted</th>
                  <th className="px-4 py-2">Rate</th>
                  <th className="px-4 py-2">Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {dash.byCode.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8">
                      <div className={FINELY_OS_LUXURY_EMPTY}>No referral-attributed records yet. Leads from /g/code and promo links appear here.</div>
                    </td>
                  </tr>
                ) : (
                  dash.byCode.map((row) => (
                    <tr key={row.code} className="border-b border-white/[0.08] hover:bg-white/[0.03]">
                      <td className={`px-4 py-2 font-mono text-xs ${FINELY_OS_ENTITY_VALUE}`}>{row.code}</td>
                      <td className={`px-4 py-2 ${FINELY_OS_ENTITY_BODY}`}>{row.leads}</td>
                      <td className={`px-4 py-2 ${FINELY_OS_ENTITY_BODY}`}>{row.open}</td>
                      <td className="px-4 py-2 text-emerald-300 font-semibold">{row.converted}</td>
                      <td className={`px-4 py-2 ${FINELY_OS_ENTITY_BODY}`}>{row.conversionRate}%</td>
                      <td className={`px-4 py-2 ${FINELY_OS_ENTITY_BODY}`}>{formatForecastCents(row.pipelineCents)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-3`}>Top promoter roles</div>
            <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
              {dash.topPromoters.length === 0 ? (
                <li className="text-xs text-white/50">No role data yet.</li>
              ) : (
                dash.topPromoters.map((p) => (
                  <li key={p.role} className="flex justify-between gap-2">
                    <span className={FINELY_OS_ENTITY_VALUE}>{p.role}</span>
                    <span>{p.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-3`}>Top promo assets</div>
            <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
              {dash.topAssets.length === 0 ? (
                <li className="text-xs text-white/50">No asset data yet.</li>
              ) : (
                dash.topAssets.map((a) => (
                  <li key={a.asset} className="flex justify-between gap-2">
                    <span className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{a.asset}</span>
                    <span className="shrink-0">{a.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
