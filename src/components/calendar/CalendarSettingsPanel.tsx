import React, { useMemo, useState } from 'react';
import { CalendarClock, Cloud, Plus, RotateCcw, Save, X } from 'lucide-react';
import type { CalendarBlockedWindow, CalendarBookingSettings, SlotDuration } from '../../domain/calendar';
import { resetCalendarBookingSettings, saveCalendarBookingSettings } from '../../data/calendarSettingsRepo';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { getCalendarExternalSyncPreviewStatus } from '../../lib/calendarProviderSync';
import { newId } from '../../utils/ids';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_INNER,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_DANGER_BTN,
  finelyOsGlassShell,
  finelyOsKpiTile,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsStatusChip,} from '../../features/os/finelyOsLightUi';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DURATION_OPTIONS: SlotDuration[] = [20, 30, 60, 90];

function seg(active: boolean) {
  return `px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100' : 'border-white/[0.08] bg-white/[0.05] text-white/55 hover:text-white/80'
  }`;
}

export function CalendarSettingsPanel({
  settings,
  onChange,
}: {
  settings: CalendarBookingSettings;
  onChange: (settings: CalendarBookingSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [notice, setNotice] = useState<string | null>(null);

  React.useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const blockedSummary = useMemo(() => {
    if (!draft.blockedWindows.length) return 'No blocked windows';
    return `${draft.blockedWindows.length} blocked window${draft.blockedWindows.length === 1 ? '' : 's'}`;
  }, [draft.blockedWindows.length]);

  const save = () => {
    const next = saveCalendarBookingSettings(draft);
    onChange(next);
    setNotice('Calendar settings saved.');
    setTimeout(() => setNotice(null), 2200);
  };

  const reset = () => {
    const next = resetCalendarBookingSettings();
    onChange(next);
    setDraft(next);
    setNotice('Calendar settings reset with sample blocked slots.');
    setTimeout(() => setNotice(null), 2200);
  };

  const addBlocked = () => {
    const block: CalendarBlockedWindow = {
      id: newId('calblock'),
      label: 'Blocked time',
      dayOfWeek: 2,
      startTime: '14:00',
      endTime: '15:00',
    };
    setDraft((p) => ({ ...p, blockedWindows: [...p.blockedWindows, block] }));
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      <div className={`lg:col-span-4 space-y-5 ${finelyOsGlassShell('panel', 'emerald')}`}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest text-emerald-300">
          <CalendarClock size={14} /> Calendar Settings
        </div>
        <h3 className={`${FINELY_OS_ENTITY_TITLE} text-2xl`}>Control when people can book.</h3>
        <p className={`${FINELY_OS_ENTITY_BODY}`}>
          Edit same-day rules, day-before cutoff, working hours, durations, meeting options, and blocked slots. The default sample blocks
          make some slots unavailable immediately so nobody double-books those windows.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className={finelyOsKpiTile(1)}>
            <div className={FINELY_OS_ENTITY_LABEL}>Notice</div>
            <div className="mt-1 text-xl font-black text-emerald-300">{draft.minNoticeHours}h</div>
          </div>
          <div className={finelyOsKpiTile(2)}>
            <div className={FINELY_OS_ENTITY_LABEL}>Blocked</div>
            <div className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{blockedSummary}</div>
          </div>
        </div>
        {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
      </div>

      <div className={`lg:col-span-8 space-y-6 ${finelyOsGlassShell('panel', 'sky')}`}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="space-y-2">
            <span className={FINELY_OS_ENTITY_LABEL}>Start hour</span>
            <input type="number" min={0} max={23} value={draft.startHour} onChange={(e) => setDraft((p) => ({ ...p, startHour: Number(e.target.value) }))} className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} w-full`} />
          </label>
          <label className="space-y-2">
            <span className={FINELY_OS_ENTITY_LABEL}>End hour</span>
            <input type="number" min={1} max={24} value={draft.endHour} onChange={(e) => setDraft((p) => ({ ...p, endHour: Number(e.target.value) }))} className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} w-full`} />
          </label>
          <label className="space-y-2">
            <span className={FINELY_OS_ENTITY_LABEL}>Slot interval</span>
            <input type="number" min={10} step={5} value={draft.slotIntervalMinutes} onChange={(e) => setDraft((p) => ({ ...p, slotIntervalMinutes: Number(e.target.value) }))} className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} w-full`} />
          </label>
          <label className="space-y-2">
            <span className={FINELY_OS_ENTITY_LABEL}>Min notice hours</span>
            <input type="number" min={0} value={draft.minNoticeHours} onChange={(e) => setDraft((p) => ({ ...p, minNoticeHours: Number(e.target.value) }))} className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} w-full`} />
          </label>
          <label className="space-y-2">
            <span className={FINELY_OS_ENTITY_LABEL}>Day-before cutoff</span>
            <input type="number" min={0} max={23} value={draft.cutoffHourPreviousDay} onChange={(e) => setDraft((p) => ({ ...p, cutoffHourPreviousDay: Number(e.target.value) }))} className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} w-full`} />
          </label>
          <label className="space-y-2">
            <span className={FINELY_OS_ENTITY_LABEL}>Booking horizon</span>
            <input type="number" min={1} max={365} value={draft.maxAdvanceDays} onChange={(e) => setDraft((p) => ({ ...p, maxAdvanceDays: Number(e.target.value) }))} className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} w-full`} />
          </label>
        </div>

        <div className="space-y-3">
          <div className={FINELY_OS_ENTITY_LABEL}>Default duration</div>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((duration) => (
              <button
                key={duration}
                type="button"
                onClick={() => setDraft((p) => ({ ...p, defaultDuration: duration }))}
                className={seg(draft.defaultDuration === duration)}
              >
                {duration}m
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className={FINELY_OS_ENTITY_LABEL}>Open weekdays</div>
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((label, day) => {
              const active = draft.allowedWeekdays.includes(day);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setDraft((p) => ({
                    ...p,
                    allowedWeekdays: active ? p.allowedWeekdays.filter((d) => d !== day) : [...p.allowedWeekdays, day].sort(),
                  }))}
                  className={seg(active)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className={FINELY_OS_ENTITY_LABEL}>Allowed durations</div>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((duration) => {
              const active = draft.allowedDurations.includes(duration);
              return (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setDraft((p) => ({
                    ...p,
                    allowedDurations: active ? p.allowedDurations.filter((d) => d !== duration) : [...p.allowedDurations, duration].sort((a, b) => a - b),
                  }))}
                  className={seg(active)}
                >
                  {duration}m
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className={FINELY_OS_ENTITY_LABEL}>Blocked slots</div>
            <button type="button" onClick={addBlocked} className={FINELY_OS_SECONDARY_BTN}>
              <Plus size={13} /> Add block
            </button>
          </div>
          <div className="space-y-2">
            {draft.blockedWindows.map((block) => (
              <div key={block.id} className={`space-y-2 p-3 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                <div className="flex items-center gap-2">
                  <input value={block.label} onChange={(e) => setDraft((p) => ({ ...p, blockedWindows: p.blockedWindows.map((b) => b.id === block.id ? { ...b, label: e.target.value } : b) }))} className={`flex-1 ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`} />
                  <input type="time" value={block.startTime} onChange={(e) => setDraft((p) => ({ ...p, blockedWindows: p.blockedWindows.map((b) => b.id === block.id ? { ...b, startTime: e.target.value } : b) }))} className={`w-auto ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`} />
                  <input type="time" value={block.endTime} onChange={(e) => setDraft((p) => ({ ...p, blockedWindows: p.blockedWindows.map((b) => b.id === block.id ? { ...b, endTime: e.target.value } : b) }))} className={`w-auto ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`} />
                  <button type="button" onClick={() => setDraft((p) => ({ ...p, blockedWindows: p.blockedWindows.filter((b) => b.id !== block.id) }))} className={FINELY_OS_DANGER_BTN}>
                    <X size={13} /> Remove
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DAY_LABELS.map((label, day) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, blockedWindows: p.blockedWindows.map((b) => b.id === block.id ? { ...b, dayOfWeek: day, dayKey: undefined } : b) }))}
                      className={seg((block.dayOfWeek ?? 1) === day)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <ExternalCalendarSyncTeaser />

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button type="button" onClick={reset} className={FINELY_OS_SECONDARY_BTN}>
            <RotateCcw size={14} /> Reset samples
          </button>
          <button type="button" onClick={save} className={FINELY_OS_PRIMARY_BTN}>
            <Save size={14} /> Save settings
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * J1 groundwork — compact "coming soon" affordance for external calendar
 * sync. Always shows a one-line notice so the roadmap item is visible; the
 * expanded provider preview (sourced from the real stub adapter, not
 * hardcoded copy) only appears once `calendarExternalSync` is flipped on —
 * see src/lib/calendarProviderSync.ts and src/domain/settings.ts.
 */
function ExternalCalendarSyncTeaser() {
  const enabled = isFeatureEnabled('calendarExternalSync');

  if (!enabled) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
        <Cloud size={13} className="shrink-0 text-white/40" />
        Google Calendar &amp; Outlook sync — coming soon.
      </div>
    );
  }

  const providers = getCalendarExternalSyncPreviewStatus();
  return (
    <div className={`space-y-3 p-3 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
      <div className="flex items-center gap-2">
        <Cloud size={14} className="text-sky-300" />
        <span className={FINELY_OS_ENTITY_LABEL}>External calendar sync (preview)</span>
      </div>
      <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
        Push confirmed sessions to a connected Google Calendar or Outlook and pull busy/free time to avoid double-booking.
        Not live yet — needs a registered OAuth app before a real connection can be made.
      </p>
      <div className="flex flex-wrap gap-2">
        {providers.map((p) => (
          <div key={p.provider} className={`${finelyOsInlineListItem()} flex items-center gap-2 px-3 py-2`}>
            <span className={FINELY_OS_ENTITY_VALUE}>{p.label}</span>
            <span className={finelyOsStatusChip('blocked')}>Coming soon</span>
          </div>
        ))}
      </div>
      <button type="button" disabled className={`${FINELY_OS_SECONDARY_BTN} opacity-50 cursor-not-allowed`}>
        Connect (requires OAuth setup)
      </button>
    </div>
  );
}
