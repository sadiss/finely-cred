import React, { useEffect, useMemo, useState } from 'react';
import { Mic, RefreshCw } from 'lucide-react';
import { buildVoiceRenderHealthSnapshot, listVoiceRenderLogs } from '../../lib/voiceRenderHealth';
import { VOICE_PIPELINE_VERSION } from '../../lib/voicePipelineVersion';
import { getVoiceStudioStatus } from '../../lib/voiceStudioClient';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_SECONDARY_BTN,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

export function AdminVoiceOpsPanel() {
  const [version, setVersion] = useState(0);
  const snap = useMemo(() => {
    void version;
    return buildVoiceRenderHealthSnapshot();
  }, [version]);
  const logs = useMemo(() => {
    void version;
    return listVoiceRenderLogs(8);
  }, [version]);
  const studio = useMemo(() => getVoiceStudioStatus(), [version]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const ratePct = `${Math.round(snap.failureRate24h * 100)}%`;

  return (
    <div className={`${FINELY_OS_GLASS_CATALOG} space-y-4`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
            <Mic size={16} />
            <span>Voice Studio ops</span>
          </div>
          <h3 className={FINELY_OS_ENTITY_TITLE}>Render health (24h)</h3>
          <p className={FINELY_OS_ENTITY_BODY}>
            Pipeline {VOICE_PIPELINE_VERSION} · {studio.available ? 'Edge reachable' : studio.reason ?? 'Offline'}
          </p>
        </div>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setVersion((v) => v + 1)}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Renders (24h)" value={String(snap.total24h)} />
        <Metric label="Failures" value={String(snap.failures24h)} warn={snap.failures24h > 0} />
        <Metric label="Failure rate" value={snap.total24h ? ratePct : '—'} warn={snap.failureRate24h > 0.15} />
      </div>

      {logs.length === 0 ? (
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>No voice render attempts logged in this browser yet.</p>
      ) : (
        <ul className={`space-y-1 text-xs font-mono ${FINELY_OS_ENTITY_BODY}`}>
          {logs.map((e) => (
            <li key={e.id} className="truncate">
              {e.ok ? '✓' : '✗'} {e.contentId ?? '—'} · {e.provider ?? '—'} {e.error ? `· ${e.error}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3">
      <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{label}</div>
      <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-white/90">
        {value}
        {warn ? finelyOsStatusChip('warn') : null}
      </div>
    </div>
  );
}
