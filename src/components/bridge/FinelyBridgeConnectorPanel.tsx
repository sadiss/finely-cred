import React, { useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Download, Sparkles } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import { buildClientCreditProgram } from '../../lib/finelyBridgeCreditProgram';
import { buildPartnerFundingReadiness } from '../../lib/partnerFundingReadiness';
import {
  fetchUnderwritingPacketV2,
  getProviderGatewayUrl,
  runMlAdvisory,
  runMlFundingPath,
  triggerBridgeFundReady,
} from '../../lib/finelyBridgeClient';
import { submitPartnerFundingHandoff } from '../../lib/noraFundingHandoff';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type Props = {
  partner: Partner;
  reportCount?: number;
  letterCount?: number;
  mode?: 'readiness' | 'origination';
  onPartnerRefresh?: () => void;
};

export function FinelyBridgeConnectorPanel({ partner, reportCount, letterCount, mode = 'readiness', onPartnerRefresh }: Props) {
  const program = useMemo(() => buildClientCreditProgram(partner, { reportCount, letterCount }), [partner, reportCount, letterCount]);
  const readiness = useMemo(() => buildPartnerFundingReadiness(partner, { reportCount, letterCount }), [partner, reportCount, letterCount]);
  const gatewayUrl = getProviderGatewayUrl();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setErr(null);
    setMsg(null);
    try {
      await fn();
    } catch (e: any) {
      setErr(e?.message || 'Action failed.');
    } finally {
      setBusy(null);
    }
  };

  const headline = mode === 'origination' ? 'Bridge origination' : 'Finely ↔ Bridge connector';
  const subline =
    mode === 'origination'
      ? 'Register wealth path and push fund-ready profile into Bridge when handoff is flagged.'
      : 'Phase tracking, ML advisory, and guided next steps for Provider Gateway handoff.';

  return (
    <div className="space-y-3">
      <FinelyOsRoleCommandCenter
        roleLabel="Bridge · Finely Cred"
        headline={headline}
        subline={subline}
        alert={
          !program.exportGateOpen && mode === 'origination'
            ? { tone: 'warning', message: program.exportGateReason ?? 'Fund-ready required for packet export.' }
            : program.exportGateOpen
              ? { tone: 'success', message: 'Fund-ready — Bridge handoff available.' }
              : undefined
        }
        tiles={[
          { id: 'phase', label: 'Finely phase', value: program.phase.replace(/_/g, ' '), accent: 'violet' },
          { id: 'score', label: 'Readiness', value: `${program.readinessScore}%`, accent: 'emerald' },
          { id: 'gate', label: 'Export gate', value: program.exportGateOpen ? 'Open' : 'Blocked', accent: program.exportGateOpen ? 'emerald' : 'amber' },
          { id: 'handoff', label: 'Handoff', value: program.bridgeHandoffQueued ? 'Queued' : program.phase === 'bridge_handoff' ? 'Active' : '—', accent: 'sky' },
        ]}
        primaryAction={
          program.exportGateOpen && mode === 'readiness'
            ? {
                label: busy === 'handoff' ? 'Queuing…' : 'Queue Bridge handoff',
                onClick: () =>
                  void run('handoff', async () => {
                    const res = await triggerBridgeFundReady({ partnerId: partner.id });
                    setMsg(`Created ${res.bridgeTasksCreated ?? 0} underwriting tasks.`);
                    onPartnerRefresh?.();
                  }),
              }
            : program.exportGateOpen && mode === 'origination'
              ? {
                  label: busy === 'register' ? 'Registering…' : 'Register with Bridge',
                  onClick: () =>
                    void run('register', async () => {
                      const res = await submitPartnerFundingHandoff(partner);
                      if (!res.ok) throw new Error(res.error);
                      setMsg('Wealth registration submitted to Bridge path.');
                      onPartnerRefresh?.();
                    }),
                }
              : undefined
        }
        secondaryAction={
          gatewayUrl
            ? { label: 'Open Provider Gateway', onClick: () => window.open(gatewayUrl, '_blank', 'noopener,noreferrer') }
            : undefined
        }
      />

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 space-y-3">
        <div className={`text-xs font-bold uppercase tracking-wider text-white/60`}>Guided next steps</div>
        <ul className={`space-y-1.5 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          {program.guidedNextSteps.map((step) => (
            <li key={step} className="flex items-start gap-2">
              <ArrowRight size={14} className="text-violet-400 shrink-0 mt-0.5" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={!!busy}
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() =>
              void run('ml', async () => {
                await runMlAdvisory({ partnerId: partner.id });
                setMsg('ML advisory v4 refreshed.');
              })
            }
          >
            <Sparkles size={14} className="inline mr-1" />
            ML advisory
          </button>
          <button
            type="button"
            disabled={!!busy}
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() =>
              void run('path', async () => {
                await runMlFundingPath({ partnerId: partner.id });
                setMsg('Funding path scan complete.');
              })
            }
          >
            <BriefcaseBusiness size={14} className="inline mr-1" />
            Funding path
          </button>
          <button
            type="button"
            disabled={!!busy || !program.exportGateOpen}
            className={program.exportGateOpen ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN}
            title={program.exportGateOpen ? undefined : program.exportGateReason}
            onClick={() =>
              void run('export', async () => {
                const res = await fetchUnderwritingPacketV2({ partnerId: partner.id });
                const blob = new Blob([JSON.stringify(res.packet, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `underwriting-packet-v2-${partner.id}.json`;
                a.click();
                URL.revokeObjectURL(url);
                setMsg('Underwriting packet v2 exported (includes Finely Cred credit program).');
              })
            }
          >
            <Download size={14} className="inline mr-1" />
            Packet export
          </button>
        </div>
        {!program.exportGateOpen ? (
          <p className={FINELY_OS_NOTICE_WARN}>
            Export gate: complete Phase 4 fund-ready milestones before Bridge packet export. Admins can override via ops dashboard.
          </p>
        ) : null}
        {readiness.blockers[0] && !readiness.ready ? (
          <span className={`inline-flex ${finelyOsStatusChip('warn')}`}>{readiness.blockers[0]}</span>
        ) : null}
        {msg ? <p className="text-sm text-emerald-300">{msg}</p> : null}
        {err ? <p className="text-sm text-rose-300">{err}</p> : null}
      </div>
    </div>
  );
}
