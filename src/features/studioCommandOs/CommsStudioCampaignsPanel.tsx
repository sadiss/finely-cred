import React, { useMemo, useState } from 'react';
import { Megaphone, Users } from 'lucide-react';
import { listCommsTemplates } from '../../data/commsRepo';
import { listPartnersLocal } from '../../data/partnersRepo';
import { bulkSendPortalFromTemplate } from '../../lib/commsEngine';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PRIMARY_BTN } from '../os/finelyOsLightUi';
import { StudioSection } from './StudioKpiCards';

export function CommsStudioCampaignsPanel({ onSent }: { onSent?: () => void }) {
  const templates = useMemo(() => listCommsTemplates().filter((t) => t.enabled), []);
  const partners = useMemo(() => listPartnersLocal(), []);
  const [templateId, setTemplateId] = useState('');
  const [segment, setSegment] = useState<'all' | 'active' | 'lead'>('all');
  const [dryRun, setDryRun] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const audience = useMemo(() => {
    if (segment === 'active') return partners.filter((p) => p.status === 'active');
    if (segment === 'lead') return partners.filter((p) => p.status === 'lead');
    return partners;
  }, [partners, segment]);

  const broadcast = () => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) {
      setResult('Pick a template.');
      return;
    }
    setBusy(true);
    const res = bulkSendPortalFromTemplate({ template: tpl, partners: audience, dryRun });
    setResult(`${dryRun ? 'Dry-run' : 'Live'}: ${res.sent} sent · ${res.failed} failed · ${audience.length} in segment`);
    setBusy(false);
    onSent?.();
  };

  return (
    <StudioSection eyebrow="broadcasts" title="Campaigns — segment, throttle, compliance gate">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Template</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="fc-input mt-1 w-full">
              <option value="">— Select —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.channel})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Segment</label>
            <select value={segment} onChange={(e) => setSegment(e.target.value as typeof segment)} className="fc-input mt-1 w-full">
              <option value="all">All partners ({partners.length})</option>
              <option value="active">Active only</option>
              <option value="lead">Leads only</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/60">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Dry-run (logs only)
          </label>
          <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy} onClick={broadcast}>
            <Megaphone size={14} /> {busy ? 'Queuing…' : 'Queue broadcast'}
          </button>
          {result ? <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>{result}</p> : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center gap-2 text-white font-bold">
            <Users size={18} className="text-violet-300" /> Audience preview
          </div>
          <p className={`text-sm mt-2 ${FINELY_OS_ENTITY_BODY}`}>
            {audience.length} partner(s) match. Live email/SMS broadcasts require provider credentials and compliance approval (Velvet Hammer + David Okonkwo).
          </p>
          <p className="text-xs text-white/45 mt-3">Portal broadcasts post into Hub threads when template channel is portal.</p>
        </div>
      </div>
    </StudioSection>
  );
}
