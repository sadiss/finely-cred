import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, KeyRound, Plus, RefreshCw, ShieldOff, User, ChevronDown, ChevronUp, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { FINELY_OS_ENTITY_INPUT, FINELY_OS_ENTITY_LABEL } from '../../features/os/finelyOsLightUi';
import { Button } from '../ui';
import { HosAccessFlyer } from './HosAccessFlyer';

type Props = {
  /** @deprecated use variant */
  compact?: boolean;
  variant?: 'full' | 'dashboard';
};

export function HosAccessCodesAdminPanel({ compact = false, variant }: Props) {
  const resolvedVariant = variant ?? (compact ? 'dashboard' : 'full');
  const navigate = useNavigate();
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
  const [expanded, setExpanded] = useState(resolvedVariant === 'full');
  const [showFlyer, setShowFlyer] = useState(false);
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
  const redeemedCount = codes.filter((c) => c.useCount >= c.maxUses).length;

  if (resolvedVariant === 'dashboard') {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/[0.08] via-black/40 to-black/50 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/15 shadow-lg shadow-amber-900/20">
            <KeyRound className="h-5 w-5 text-amber-200" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white leading-tight">Head of Society</p>
            <p className="text-xs text-white/50">Invite-only keys · one person per email</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              {activeCount} active
            </span>
            {redeemedCount > 0 ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/45">
                {redeemedCount} used
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75 hover:bg-white/10"
              onClick={() => {
                void pullHosAccessCodesFromServer().then(() => refresh());
              }}
            >
              <RefreshCw size={13} /> Sync
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75 hover:bg-white/10"
              onClick={() => navigate('/admin/role-preview?role=heta_society')}
            >
              <ExternalLink size={13} /> Preview
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-500/25"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? 'Collapse' : 'Manage keys'}
            </button>
          </div>
        </div>

        {latest && !expanded ? (
          <div className="border-t border-white/5 px-4 py-2 flex flex-wrap items-center gap-2 text-xs text-emerald-200/90 bg-emerald-500/5">
            <Check size={14} />
            Latest: <code className="font-bold text-white">{latest.code}</code> → {assigneeDisplayName(latest)}
            <button type="button" onClick={() => copyCode(latest.code)} className="underline text-white/60 hover:text-white">
              {copied === latest.code ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : null}

        {expanded ? (
          <div className="border-t border-white/8 bg-black/30 p-4 space-y-4">
            {err ? <p className="text-sm text-rose-300">{err}</p> : null}
            {latest ? (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 flex flex-wrap items-center gap-2 text-sm">
                <User size={14} className="text-emerald-300" />
                <span className="text-white/80">{assigneeDisplayName(latest)} · {latest.assignedEmail}</span>
                <code className="font-black text-white">{latest.code}</code>
                <button type="button" onClick={() => copyCode(latest.code)} className="text-xs text-emerald-200 underline">
                  {copied === latest.code ? 'Copied' : 'Copy'}
                </button>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {leads.length > 0 ? (
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className={FINELY_OS_ENTITY_LABEL}>Prefill from lead</label>
                  <select value={leadPick} onChange={(e) => fillFromLead(e.target.value)} className={FINELY_OS_ENTITY_INPUT}>
                    <option value="">— Select lead —</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>{l.fullName || l.email}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>First name *</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Last name *</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Email *</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Expires (days)</label>
                <input value={expiresDays} onChange={(e) => setExpiresDays(e.target.value)} type="number" min={1} className={FINELY_OS_ENTITY_INPUT} />
              </div>
            </div>
            <Button variant="gold" size="sm" disabled={busy} onClick={() => void create()}>
              <Plus size={16} /> {busy ? 'Generating…' : 'Generate key'}
            </Button>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {codes.length === 0 ? (
                <p className="text-xs text-white/40">No keys yet.</p>
              ) : (
                codes.slice(0, 12).map((c) => {
                  const spent = c.useCount >= c.maxUses;
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-1.5">
                      <div className="min-w-0 text-xs">
                        <code className="font-bold text-amber-100">{c.code}</code>
                        <span className="text-white/40 ml-2 truncate">{assigneeDisplayName(c)}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button type="button" onClick={() => copyCode(c.code)} className="p-1 text-white/50 hover:text-white">
                          {copied === c.code ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        {!c.revoked && !spent ? (
                          <button type="button" onClick={() => revoke(c.id)} className="p-1 text-rose-400 hover:text-rose-300">
                            <ShieldOff size={12} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs font-semibold text-amber-200/80 hover:text-amber-100"
              onClick={() => setShowFlyer((v) => !v)}
            >
              <FileDown size={14} /> {showFlyer ? 'Hide access flyer' : 'Show access flyer'}
            </button>
            {showFlyer ? (
              <div className="rounded-xl border border-amber-500/15 bg-black/25 p-3 max-h-[420px] overflow-y-auto">
                <HosAccessFlyer
                  showDownload
                  onEnterKey={() => {
                    window.open(`${HEAD_OF_SOCIETY_PATH}#hos-access`, '_blank', 'noopener,noreferrer');
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-black/30 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10">
            <KeyRound className="h-5 w-5 text-amber-200" />
          </div>
          <div className="min-w-0">
            <p className="font-black text-white">Head of Society — person-assigned keys</p>
            <p className="mt-1 text-sm text-white/55">Every key is locked to one person&apos;s email · {activeCount} active</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => { void pullHosAccessCodesFromServer().then(() => refresh()); }}>
            <RefreshCw size={14} /> Sync
          </Button>
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
            <button type="button" onClick={() => copyCode(latest.code)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10">
              {copied === latest.code ? <Check size={14} /> : <Copy size={14} />}
              {copied === latest.code ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-200/80">Assign to a specific person</p>
        {leads.length > 0 ? (
          <div>
            <label className={FINELY_OS_ENTITY_LABEL}>Prefill from lead (optional)</label>
            <select value={leadPick} onChange={(e) => fillFromLead(e.target.value)} className={FINELY_OS_ENTITY_INPUT}>
              <option value="">— Select lead —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.fullName || l.email} · {l.email}</option>
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
                    {c.revoked ? <span className="text-[10px] font-bold uppercase text-rose-300">Revoked</span>
                      : spent ? <span className="text-[10px] font-bold uppercase text-white/40">Redeemed</span>
                      : expired ? <span className="text-[10px] font-bold uppercase text-rose-300">Expired</span>
                      : <span className="text-[10px] font-bold uppercase text-emerald-300">Active</span>}
                  </div>
                  <p className="text-xs text-white/70 mt-0.5">{assigneeDisplayName(c)} · {c.assignedEmail}</p>
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

      <div className="rounded-xl border border-amber-500/20 bg-black/25 p-4 space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-200/80">Access flyer</p>
          <p className="mt-1 text-sm text-white/50">Private HOS handoff poster — admin only.</p>
        </div>
        <HosAccessFlyer
          showDownload
          onEnterKey={() => {
            window.open(`${HEAD_OF_SOCIETY_PATH}#hos-access`, '_blank', 'noopener,noreferrer');
          }}
        />
      </div>
    </div>
  );
}
