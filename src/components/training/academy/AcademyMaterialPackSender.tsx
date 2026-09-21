import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { buildMaterialPackBody } from '../../../specialistAcademy/academyMaterialPack';
import { academyBaseUrl } from '../../../specialistAcademy/academyTraineeEmailPipeline';
import { dispatchAcademyTraineeNurture } from '../../../nurture/nurtureEngine';
import { getAcademyTraineeSettings } from '../../../data/settingsRepo';

export function AcademyMaterialPackSender({ lang }: { lang: 'en' | 'ht' }) {
  const [emails, setEmails] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const settings = getAcademyTraineeSettings();

  const send = async () => {
    const list = emails
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes('@'));
    if (!list.length) {
      setMsg(lang === 'ht' ? 'Ajoute imèl valab.' : 'Add valid email addresses.');
      return;
    }
    setBusy(true);
    setMsg(null);
    const body = buildMaterialPackBody(lang);
    let ok = 0;
    for (const to of list) {
      const res = await dispatchAcademyTraineeNurture({
        sequenceId: 'academy_trainee_v1',
        stepId: 'material_pack',
        event: 'material_pack',
        toEmail: to,
        toName: to.split('@')[0],
        dedupeKey: `material_pack:${to}:${Date.now()}`,
        ctx: {
          trainee: { name: to.split('@')[0], email: to, lang },
          academy: { url: academyBaseUrl() },
          materialPack: { body },
        },
      });
      if (res.ok) ok += 1;
    }
    setBusy(false);
    setMsg(
      settings.traineeEmailsEnabled
        ? lang === 'ht'
          ? `Voye / file ${ok} nan ${list.length} (verifye commsDelivery pou vre voye).`
          : `Processed ${ok}/${list.length} material pack emails (enable commsDelivery + SendGrid for live send).`
        : lang === 'ht'
          ? 'Trainee emails dezaktive — aktive nan Settings → Features.'
          : 'Trainee emails disabled — enable in Admin Settings → Features → Specialist Academy trainee emails.',
    );
  };

  return (
    <div className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-6 space-y-4 academy-foil-border">
      <div className="flex items-center gap-2 text-sky-100 font-semibold">
        <Mail size={18} /> {lang === 'ht' ? 'Pake materyèl trainee' : 'Trainee material pack'}
      </div>
      <p className="text-white/60 text-sm">
        {lang === 'ht'
          ? 'Voye lyen modil, SOP, ak kat referans bay trainee yo.'
          : 'Email module links, SOPs, and flash-card references to one or more trainees.'}
      </p>
      <textarea
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        rows={3}
        placeholder="trainee1@example.com, trainee2@example.com"
        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 font-mono"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => void send()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-100 text-xs font-black uppercase tracking-widest hover:bg-sky-500/30 disabled:opacity-50"
      >
        <Send size={14} /> {busy ? '…' : lang === 'ht' ? 'Voye pake' : 'Send material pack'}
      </button>
      {msg ? <p className="text-white/55 text-xs">{msg}</p> : null}
    </div>
  );
}
