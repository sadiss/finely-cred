import React, { useState } from 'react';
import type { CrmRecord } from '../../../domain/crmRecords';
import { updateCrmRecordConsent } from '../../../data/crmRecordsRepo';
import { Shield, Mail, MessageSquare } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  finelyOsGlassShell,
} from '../../os/finelyOsLightUi';

export function CrmConsentPanel({ record, onUpdated }: { record: CrmRecord; onUpdated?: () => void }) {
  const [saving, setSaving] = useState(false);
  const attr = record.attribution;
  const isLead = record.kind === 'inbound_lead' && record.sourceRef?.type === 'lead';

  if (!isLead) {
    return (
      <div className={`p-4 text-sm ${finelyOsGlassShell('panel', 'violet')}`}>
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-violet-300" />
          <span className={FINELY_OS_ENTITY_VALUE}>Consent center</span>
        </div>
        <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Consent is tracked on inbound leads. For prospects, capture consent at conversion or on the partner profile.
        </p>
      </div>
    );
  }

  const save = async (patch: Parameters<typeof updateCrmRecordConsent>[1]) => {
    setSaving(true);
    try {
      updateCrmRecordConsent(record.id, patch);
      onUpdated?.();
      window.dispatchEvent(new Event('finely:store'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`space-y-3 p-4 ${finelyOsGlassShell('panel', 'fuchsia')}`}>
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-fuchsia-300" />
        <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>Consent center</span>
      </div>

      <label className={`flex items-start gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
        <input
          type="checkbox"
          checked={attr?.consentToContact !== false}
          disabled={saving}
          onChange={(e) => void save({ consentToContact: e.target.checked })}
          className="mt-0.5 accent-fuchsia-500"
        />
        <span>
          <span className={FINELY_OS_ENTITY_VALUE}>Contact consent</span>
          <span className={`block text-xs ${FINELY_OS_ENTITY_BODY}`}>Required to call, email, or text this lead.</span>
        </span>
      </label>

      <label className={`flex items-start gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
        <input
          type="checkbox"
          checked={Boolean(attr?.consentEmailMarketing)}
          disabled={saving || !record.contact.email}
          onChange={(e) => void save({ consentEmailMarketing: e.target.checked })}
          className="mt-0.5 accent-fuchsia-500"
        />
        <span className="flex items-start gap-1.5">
          <Mail size={14} className="mt-0.5 text-white/35 shrink-0" />
          <span>
            <span className={FINELY_OS_ENTITY_VALUE}>Email marketing</span>
            <span className={`block text-xs ${FINELY_OS_ENTITY_BODY}`}>Newsletters and promotional email.</span>
          </span>
        </span>
      </label>

      <label className={`flex items-start gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
        <input
          type="checkbox"
          checked={Boolean(attr?.consentSmsMarketing)}
          disabled={saving || !record.contact.phone}
          onChange={(e) => void save({ consentSmsMarketing: e.target.checked })}
          className="mt-0.5 accent-fuchsia-500"
        />
        <span className="flex items-start gap-1.5">
          <MessageSquare size={14} className="mt-0.5 text-white/35 shrink-0" />
          <span>
            <span className={FINELY_OS_ENTITY_VALUE}>SMS marketing</span>
            <span className={`block text-xs ${FINELY_OS_ENTITY_BODY}`}>Text promos and campaign messages.</span>
          </span>
        </span>
      </label>

      {attr?.consentToContact === false ? (
        <div className={`${FINELY_OS_NOTICE_ERROR} text-xs font-semibold`}>
          Do not contact — outreach blocked in copilot drafts.
        </div>
      ) : null}
    </div>
  );
}
