import React, { useState } from 'react';
import type { CrmRecord } from '../../../domain/crmRecords';
import { createCrmInboundLead } from '../../../data/crmRecordsRepo';
import { UserPlus, X } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
} from '../../os/finelyOsLightUi';

export function CrmQuickCreatePanel({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (record: CrmRecord) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('');
  const [consentToContact, setConsentToContact] = useState(true);
  const [consentEmailMarketing, setConsentEmailMarketing] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!fullName.trim()) return setErr('Name is required.');
    if (!email.trim()) return setErr('Email is required.');
    if (!consentToContact) return setErr('Contact consent is required to create a lead.');

    const record = createCrmInboundLead({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      interest: interest.trim() || undefined,
      consentToContact,
      consentEmailMarketing,
    });
    window.dispatchEvent(new Event('finely:store'));
    onCreated(record);
    setFullName('');
    setEmail('');
    setPhone('');
    setInterest('');
    setConsentToContact(true);
    setConsentEmailMarketing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-fc-chrome/90 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className={`w-full max-w-md shadow-2xl p-5 space-y-4 ${finelyOsGlassShell('panel', 'violet')}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-violet-300" />
            <span className={FINELY_OS_ENTITY_VALUE}>Quick create lead</span>
          </div>
          <button type="button" onClick={onClose} className="text-white/45 hover:text-white/80">
            <X size={18} />
          </button>
        </div>

        {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}

        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={FINELY_OS_ENTITY_INPUT} autoFocus />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className={FINELY_OS_ENTITY_INPUT} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className={FINELY_OS_ENTITY_INPUT} />
        <input value={interest} onChange={(e) => setInterest(e.target.value)} placeholder="Interest / package lane (optional)" className={FINELY_OS_ENTITY_INPUT} />

        <label className={`flex items-start gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          <input
            type="checkbox"
            checked={consentToContact}
            onChange={(e) => setConsentToContact(e.target.checked)}
            className="mt-0.5 accent-violet-500"
          />
          <span>Lead consents to be contacted</span>
        </label>
        <label className={`flex items-start gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          <input
            type="checkbox"
            checked={consentEmailMarketing}
            onChange={(e) => setConsentEmailMarketing(e.target.checked)}
            className="mt-0.5 accent-violet-500"
          />
          <span>Email marketing opt-in</span>
        </label>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className={`flex-1 ${FINELY_OS_SECONDARY_BTN}`}>
            Cancel
          </button>
          <button type="submit" className={`flex-1 ${FINELY_OS_PRIMARY_BTN}`}>
            Create lead
          </button>
        </div>
      </form>
    </div>
  );
}
