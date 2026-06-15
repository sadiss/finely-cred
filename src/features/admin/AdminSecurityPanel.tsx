import React, { useMemo } from 'react';
import { Shield, ExternalLink } from 'lucide-react';
import { listAuditEvents } from '../../data/auditRepo';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_SECONDARY_BTN,
} from '../os/finelyOsLightUi';

const SECURITY_ACTIONS = /webhook|api_key|vault|access|rls|security|token|revoke|disabled|enabled/i;

const SECRETS_ROTATION = [
  { label: 'Supabase service role', cadence: '90d', note: 'Rotate in dashboard → Settings → API' },
  { label: 'Cartesia API key', cadence: 'Annual', note: 'voice-studio edge function secret' },
  { label: 'Stripe webhook secret', cadence: 'On compromise', note: 'Stripe dashboard → Webhooks' },
  { label: 'Meta verify token', cadence: 'On app reset', note: 'Meta Business app → Webhooks' },
  { label: 'Partner API keys', cadence: '90d', note: '/admin/integrations → revoke + reissue' },
];

export function AdminSecurityPanel() {
  const events = useMemo(
    () =>
      listAuditEvents()
        .filter((e) => SECURITY_ACTIONS.test(e.action))
        .slice(0, 12),
    [],
  );

  return (
    <div className={`${FINELY_OS_GLASS_CATALOG} space-y-4`}>
      <div>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-rose-300`}>
          <Shield size={16} />
          <span>Security & audit</span>
        </div>
        <h3 className={FINELY_OS_ENTITY_TITLE}>RLS + sensitive actions</h3>
        <p className={FINELY_OS_ENTITY_BODY}>
          Supabase RLS {isSupabaseConfigured ? 'configured (live)' : 'pending env'} — rotate secrets per playbook.
        </p>
      </div>

      <a
        href="/docs/RLS_HARDENING_CHECKLIST.md"
        target="_blank"
        rel="noreferrer"
        className={FINELY_OS_SECONDARY_BTN}
      >
        RLS hardening checklist <ExternalLink size={12} />
      </a>

      {events.length === 0 ? (
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>No security audit events recorded yet.</p>
      ) : (
        <ul className={`space-y-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          {events.map((e) => (
            <li key={e.id} className="rounded-lg fc-light-glass-panel fc-light-chrome-panel border px-3 py-2 font-mono text-xs">
              {e.createdAt} · {e.action} · {e.entityType ?? '—'} {e.entityId ?? ''}
            </li>
          ))}
        </ul>
      )}

      <div className={`pt-2 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>Secrets rotation playbook</div>
      <ul className={`space-y-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
        {SECRETS_ROTATION.map((item) => (
          <li key={item.label} className="rounded-lg fc-light-glass-panel fc-light-chrome-panel border px-3 py-2">
            <div className="font-medium text-white/85">{item.label}</div>
            <div className="text-white/55">{item.cadence} · {item.note}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
