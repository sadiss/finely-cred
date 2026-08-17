import React, { useEffect, useState } from 'react';
import {
  listCommunityListenDrafts,
  markCommunityDraftPosted,
  runCommunityListenScan,
} from './communityListenCopilot';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../os/finelyOsLightUi';

/** $0 community outreach — AI drafts, you copy and post manually. */
export function CommunityListenCopilotPanel() {
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const drafts = listCommunityListenDrafts(8);
  void tick;

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const scan = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await runCommunityListenScan();
      setMsg(r.message);
    } finally {
      setBusy(false);
      setTick((t) => t + 1);
    }
  };

  return (
    <div className={finelyOsCatalogCardCompact('violet')}>
      <p className={FINELY_OS_ENTITY_SUBLABEL}>Community listen ($0)</p>
      <p className="mt-1 text-sm font-semibold text-white">Find people asking questions — draft helpful replies</p>
      <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
        Miriam scans public forums via search (same Serper path as Caleb). You copy the draft and post yourself — no
        auto-login, no ban risk, $0 cost.
      </p>
      <button type="button" className={`${FINELY_OS_PRIMARY_BTN} mt-3`} disabled={busy} onClick={() => void scan()}>
        {busy ? 'Scanning…' : 'Scan forums & draft replies'}
      </button>
      {msg ? <p className="mt-2 text-xs text-emerald-200/90">{msg}</p> : null}
      {drafts.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {drafts.map((d) => (
            <li key={d.id} className="rounded-lg border border-white/10 bg-black/25 p-3 text-xs">
              <a href={d.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-sky-200 hover:underline">
                {d.sourceTitle.slice(0, 72)}
              </a>
              <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap text-white/75">{d.suggestedReply}</pre>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => void navigator.clipboard.writeText(d.suggestedReply)}
                >
                  Copy reply
                </button>
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => {
                    markCommunityDraftPosted(d.id);
                    setTick((t) => t + 1);
                  }}
                >
                  Mark posted
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
