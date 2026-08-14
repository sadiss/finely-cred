import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Mail, Play, Zap } from 'lucide-react';
import { GrowthAgentWorkspaceShell } from './GrowthAgentWorkspaceShell';
import { getGrowthAgent } from './growthAgentRegistry';
import { getAlexMaturity } from './growthAgentMaturity';
import { buildGrowthResultsSnapshot } from './growthResultsMetrics';
import { BookingInvitePanel } from '../../components/calendar/BookingInvitePanel';
import {
  countAlexOutreachToday,
  isAlexAppointmentAutopilotEnabled,
  listAlexOutreachRecent,
  listWarmLeadsForBooking,
  runAlexAppointmentOutreach,
  setAlexAppointmentAutopilotEnabled,
} from './alexAppointmentAutomation';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';
import { crmRecordDisplayName } from '../../domain/crmRecords';

export function GrowthAgentAlexWorkspace() {
  const navigate = useNavigate();
  const agent = getGrowthAgent('appointment-setter')!;
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  // Autopilot outreach runs from Growth autopilot tick — not on every workspace mount.

  const maturity = useMemo(() => {
    void tick;
    return getAlexMaturity();
  }, [tick]);

  const results = useMemo(() => {
    void tick;
    return buildGrowthResultsSnapshot();
  }, [tick]);

  const warmLeads = useMemo(() => {
    void tick;
    return listWarmLeadsForBooking(8);
  }, [tick]);

  const outreachToday = useMemo(() => {
    void tick;
    return countAlexOutreachToday();
  }, [tick]);

  const recentOutreach = useMemo(() => {
    void tick;
    return listAlexOutreachRecent(5);
  }, [tick]);

  const autopilotOn = useMemo(() => {
    void tick;
    return isAlexAppointmentAutopilotEnabled();
  }, [tick]);

  const runNow = async () => {
    setBusy(true);
    try {
      const r = await runAlexAppointmentOutreach({ limit: 5, force: false });
      setLastRun(`${r.invitesCreated} invite(s) · ${r.emailsSent} email(s) · ${r.tasksCreated} task(s)`);
      setTick((t) => t + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <GrowthAgentWorkspaceShell
      accent={agent.accent}
      name={agent.name}
      roleTitle={agent.roleTitle}
      mission={agent.mission}
      maturityPercent={maturity.percent}
      maturityLabel={maturity.label}
      alertMessage="Warm CRM leads get a self-book link — Comms Delivery sends the email."
      primaryAction={{ label: 'Run outreach now', onClick: () => void runNow() }}
      nextStep={warmLeads[0] ? `Next: ${crmRecordDisplayName(warmLeads[0].record)} (${warmLeads[0].score})` : 'No warm leads — check CRM Board.'}
      setupBlock={
        <p>
          Alex scans contacted + warm-score CRM records, creates `/book/i/:token` links, and queues follow-up tasks.
        </p>
      }
      lastRunBlock={<p>{lastRun || results.lastFindSummary || 'No outreach run yet today.'}</p>}
      statusBlock={
        <p>
          Outreach today: {outreachToday} · Booked (7d): {results.booked7d}
        </p>
      }
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className={FINELY_OS_PRIMARY_BTN}
          onClick={() => void runNow()}
        >
          <Play size={14} /> {busy ? 'Running…' : 'Book-session blast (5)'}
        </button>
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() => {
            setAlexAppointmentAutopilotEnabled(!autopilotOn);
            setTick((t) => t + 1);
          }}
        >
          <Zap size={14} /> Autopilot {autopilotOn ? 'ON' : 'OFF'}
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/calendar')}>
          <Calendar size={14} /> Calendar
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/crm')}>
          Open CRM
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        <div className={finelyOsMicroStat('sky')}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Warm leads</div>
          <div className="text-lg font-black text-white">{warmLeads.length}</div>
        </div>
        <div className={finelyOsMicroStat('emerald')}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Outreach today</div>
          <div className="text-lg font-black text-white">{outreachToday}</div>
        </div>
        <div className={finelyOsMicroStat('violet')}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Autopilot</div>
          <div className="text-lg font-black text-white">{autopilotOn ? 'On' : 'Off'}</div>
        </div>
      </div>

      <BookingInvitePanel compact />

      <div className={finelyOsCatalogCardCompact('sky')}>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-200`}>
          <Mail size={14} /> Warm lead queue
        </div>
        {warmLeads.length === 0 ? (
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>No warm leads right now — run Caleb find or move CRM cards to Contacted.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {warmLeads.map(({ record, score, reason }) => (
              <li key={record.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs">
                <div>
                  <div className="font-semibold text-white">{crmRecordDisplayName(record)}</div>
                  <div className="text-white/50">{record.contact.email} · score {score}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-sky-300/90">{reason}</span>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(`/admin/crm?record=${record.id}`)}>
                    CRM
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {recentOutreach.length ? (
        <div className={finelyOsCatalogCardCompact('emerald')}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent outreach</div>
          <ul className="mt-2 space-y-1 text-xs text-white/70">
            {recentOutreach.map((r) => (
              <li key={`${r.crmRecordId}-${r.sentAt}`}>
                {new Date(r.sentAt).toLocaleString()} · {r.emailOk ? 'email ok' : 'link only'}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </GrowthAgentWorkspaceShell>
  );
}
