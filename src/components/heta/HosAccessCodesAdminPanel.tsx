import React, { useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Plus, RefreshCw, ShieldOff, User, Zap } from 'lucide-react';
import {
  assigneeDisplayName,
  generateHosAccessCodeRemote,
  listHosAccessCodes,
  pullHosAccessCodesFromServer,
  revokeHosAccessCode,
  type HosAccessCode,
} from '../../lib/hetaSocietyAccessCodes';
import { listLeadCaptures } from '../../data/leadsRepo';
import { HEAD_OF_SOCIETY_PATH } from '../../config/hetaSocietyProgram';
import { FINELY_OS_ENTITY_INPUT, FINELY_OS_ENTITY_LABEL, finelyOsInlineListItem } from '../../features/os/finelyOsLightUi';
import { Button } from '../ui';
import { HosAccessFlyer } from './HosAccessFlyer';

type Props = {
  compact?: boolean;
};

export function HosAccessCodesAdminPanel({ compact = false }: Props) {
  const [codes, setCodes] = useState<HosAccessCode[]>(() => listHosAccessCodes());
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cohort, setCohort] = useState('');
  const [notes, setNotes] = useState('');
  const [leadPick, setLeadPick] = useState('');
  const [expiresDays, setExpiresDays] = useState('30');
  const [copied, setCopied] = useState<string | null>(null);
  const [latest, setLatest] = useState<HosAccessCode | null>(null);
  const [expanded, setExpanded] = useState(!compact);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const leads = listLeadCaptures().slice(0, 40);

  const refresh = () => setCodes(listHosAccessCodes());

  useEffect(() => {
    void pullHosAccessCodesFromServer().then((n) => {
      if (n > 0) refresh();
    });
  }, []);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const fillFromLead = (leadId: string) => {
    setLeadPick(leadId);
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const parts = (lead.fullName || '').trim().split(/\s+/);
    setFirstName(parts[0] || '');
    setLastName(parts.slice(1).join(' ') || '');
    setEmail(lead.email || '');
    setPhone(lead.phone || '');
  };

  const create = async () => {
    setErr(null);
    if (!firstName.trim() || !lastName.trim()) return setErr('Enter the assignee first and last name.');
    if (!email.includes('@')) return setErr('Each key must be assigned to a specific email.');
    setBusy(true);
    try {
      const days = expiresDays.trim() ? Math.max(1, parseInt(expiresDays, 10) || 30) : undefined;
      const record = await generateHosAccessCodeRemote({
        assignee: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          leadId: leadPick || undefined,
        },
        label: `${firstName.trim()} ${lastName.trim()}${cohort.trim() ? ` · ${cohort.trim()}` : ''}`,
        maxUses: 1,
        expiresInDays: days,
        notes: notes.trim() || undefined,
        cohort: cohort.trim() || undefined,
      });
      setLatest(record);
      refresh();
      void copyCode(record.code);
    } catch (ex: unknown) {
      setErr((ex as Error)?.message ?? 'Could not generate key.');
    } finally {
      setBusy(false);
    }
  };

  const revoke = (id: string) => {
    revokeHosAccessCode(id);
    refresh();
  };

  const activeCount = codes.filter((c) => !c.revoked && c.useCount < c.maxUses).length;

  return (
    <div className={`${finelyOsInlineListItem()} p-5 space-y-4 border-amber-500/25`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10">
            <KeyRound className="h-5 w-5 text-amber-200" />
          </div>
          <div className="min-w-0">
            <p className="font-black text-white">Head of Society — person-assigned keys</p>
            <p className="mt-1 text-sm text-white/55">
              Every key is locked to one person&apos;s email · {activeCount} active
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void pullHosAccessCodesFromServer().then(() => refresh());
            }}
          >
            <RefreshCw size={14} /> Sync
          </Button>
          {compact ? (
            <Button variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Collapse' : 'Open panel'}
            </Button>
          ) : null}
        </div>
      </div>

      {err ? <p className="text-sm text-rose-300">{err}</p> : null}

      {latest ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-200/80">Latest key — assigned person</p>
          <p className="mt-1 text-sm text-white/75">
            <User size={14} className="inline mr-1 text-emerald-300" />
            {assigneeDisplayName(latest)} · {latest.assignedEmail}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="text-lg font-black tracking-wider text-white">{latest.code}</code>
            <button
              type="button"
              onClick={() => copyCode(latest.code)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              {copied === latest.code ? <Check size={14} /> : <Copy size={14} />}
              {copied === latest.code ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      ) : null}

      {expanded ? (
        <>
          <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-200/80">Assign to a specific person</p>
            {leads.length > 0 ? (
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Prefill from lead (optional)</label>
                <select
                  value={leadPick}
                  onChange={(e) => fillFromLead(e.target.value)}
                  className={FINELY_OS_ENTITY_INPUT}
                >
                  <option value="">— Select lead —</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.fullName || l.email} · {l.email}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>First name *</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Last name *</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Email * (must match at signup)</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Cohort / batch</label>
                <input value={cohort} onChange={(e) => setCohort(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="March 2026 cohort" />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Expires (days)</label>
                <input value={expiresDays} onChange={(e) => setExpiresDays(e.target.value)} type="number" min={1} className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div className="sm:col-span-2">
                <label className={FINELY_OS_ENTITY_LABEL}>Internal notes</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Referral source, coach, etc." />
              </div>
            </div>
            <Button variant="gold" size="sm" disabled={busy} onClick={() => void create()}>
              <Plus size={16} /> {busy ? 'Generating…' : 'Generate key for this person'}
            </Button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {codes.length === 0 ? (
              <p className="text-sm text-white/45">No keys yet. Assign a person above to generate their private key.</p>
            ) : (
              codes.map((c) => {
                const spent = c.useCount >= c.maxUses;
                const expired = c.expiresAt ? new Date(c.expiresAt).getTime() < Date.now() : false;
                return (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="font-bold text-amber-100">{c.code}</code>
                        {c.revoked ? (
                          <span className="text-[10px] font-bold uppercase text-rose-300">Revoked</span>
                        ) : spent ? (
                          <span className="text-[10px] font-bold uppercase text-white/40">Redeemed</span>
                        ) : expired ? (
                          <span className="text-[10px] font-bold uppercase text-rose-300">Expired</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase text-emerald-300">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-white/70 mt-0.5">
                        {assigneeDisplayName(c)} · {c.assignedEmail}
                      </p>
                      <p className="text-[10px] text-white/40 mt-0.5">
                        Uses {c.useCount}/{c.maxUses}
                        {c.cohort ? ` · ${c.cohort}` : ''}
                        {c.expiresAt ? ` · expires ${new Date(c.expiresAt).toLocaleDateString()}` : ''}
                        {c.redeemedBy.length ? ` · redeemed ${new Date(c.redeemedBy[c.redeemedBy.length - 1]!.at).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => copyCode(c.code)} className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/5" title="Copy">
                        {copied === c.code ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      {!c.revoked && !spent ? (
                        <button type="button" onClick={() => revoke(c.id)} className="rounded-lg border border-rose-500/25 p-2 text-rose-300 hover:bg-rose-500/10" title="Revoke">
                          <ShieldOff size={14} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : null}

      <div className="rounded-xl border border-amber-500/20 bg-black/25 p-4 space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-200/80">Access flyer</p>
          <p className="mt-1 text-sm text-white/50">Private HOS handoff poster — admin only.</p>
        </div>
        <HosAccessFlyer
          showDownload
          onEnterKey={() => {
            if (typeof window !== 'undefined') window.open(`${HEAD_OF_SOCIETY_PATH}#hos-access`, '_blank', 'noopener,noreferrer');
          }}
        />
      </div>
    </div>
  );
}
