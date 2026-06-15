import React, { useCallback, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardCopy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getSeniorQaSignoffProgress,
  loadSeniorQaSignoffs,
  saveSeniorQaSignoff,
  SENIOR_QA_SIGNOFF_ITEMS,
} from '../../lib/seniorQaSignoffOps';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

const QA_COMMAND = 'npm run launch:senior:qa';

export function AdminSeniorQaSignoffPanel() {
  const navigate = useNavigate();
  const [signoffs, setSignoffs] = useState(() => loadSeniorQaSignoffs());
  const [copied, setCopied] = useState(false);
  const progress = useMemo(() => getSeniorQaSignoffProgress(), [signoffs]);

  const toggle = useCallback((id: string, checked: boolean) => {
    setSignoffs(saveSeniorQaSignoff(id, checked));
  }, []);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(QA_COMMAND);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div id="senior-qa" className={`${finelyOsCatalogCard('fuchsia')} !p-5 space-y-4`} data-fc-accent="fuchsia">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
            <Users size={16} />
            <span>Senior QA human sign-off</span>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm max-w-2xl`}>
            Walk the nine core paths with a non-technical tester, then check each item. Pair with{' '}
            <code className="font-mono text-xs">{QA_COMMAND}</code> for automated coverage (23 Playwright paths).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className={finelyOsStatusChip(progress.complete ? 'ok' : progress.signed > 0 ? 'warn' : 'blocked')}>
            {progress.signed}/{progress.total}
          </span>
          <button type="button" className={`${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-2 text-xs`} onClick={copyCommand}>
            {copied ? 'Copied' : 'Copy QA cmd'}
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {SENIOR_QA_SIGNOFF_ITEMS.map((item) => {
          const checked = Boolean(signoffs[item.id]);
          return (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm"
            >
              <label className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-white/30"
                  checked={checked}
                  onChange={(e) => toggle(item.id, e.target.checked)}
                />
                <span className="min-w-0">
                  <span className="font-medium text-white/90">{item.label}</span>
                  <span className={`block text-xs ${FINELY_OS_ENTITY_BODY} mt-0.5`}>{item.criterion}</span>
                  {item.automated ? (
                    <span className="text-[10px] opacity-50">Playwright covered</span>
                  ) : (
                    <span className="text-[10px] opacity-50">Manual — Chrome/Edge</span>
                  )}
                </span>
              </label>
              <button
                type="button"
                className={`inline-flex items-center gap-1 ${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-2 text-xs shrink-0`}
                onClick={() => navigate(item.path)}
              >
                Open <ArrowRight size={12} />
              </button>
            </li>
          );
        })}
      </ul>

      {progress.complete ? (
        <div className={`inline-flex items-center gap-2 text-sm text-emerald-300`}>
          <CheckCircle2 size={16} /> Human sign-off complete — ready for production deploy.
        </div>
      ) : null}
    </div>
  );
}
