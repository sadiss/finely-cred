import React, { useMemo, useState } from 'react';
import { CmoManagedAccount, CmoSocialPlatform } from '../../domain/cmoPhase4';
import { loadCmoPhase4State, saveCmoPhase4State, upsertCmoManagedAccount } from '../../data/cmoPhase4Repo';
import { buildDefaultFinelyAccountPlan, createManualCmoAccount, summarizeCmoAccountTargets } from '../../lib/cmoPhase4/cmoAccountRegistry';

const platforms: CmoSocialPlatform[] = ['instagram', 'tiktok', 'youtube', 'linkedin', 'facebook', 'email', 'sms', 'manual'];

export function CmoAccountOpsPanel() {
  const [state, setState] = useState(loadCmoPhase4State());
  const [label, setLabel] = useState('');
  const [platform, setPlatform] = useState<CmoSocialPlatform>('instagram');
  const summary = useMemo(() => summarizeCmoAccountTargets(state.accounts), [state.accounts]);

  function refresh() {
    setState(loadCmoPhase4State());
  }

  function seedDefaultAccounts() {
    const next = { ...state, accounts: buildDefaultFinelyAccountPlan() };
    saveCmoPhase4State(next);
    setState(next);
  }

  function addAccount() {
    if (!label.trim()) return;
    const account = createManualCmoAccount({ platform, label: label.trim(), dailyLeadTarget: 10, dailyPostTarget: 1 });
    upsertCmoManagedAccount(account);
    setLabel('');
    refresh();
  }

  return (
    <section className="fc-panel p-5 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">Phase 4</p>
          <h2 className="text-2xl font-semibold text-white">CMO Account Command</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">
            Manage every growth account from one place: social channels, Shorts, email, SMS, affiliates, and manual publishing paths.
          </p>
        </div>
        <button type="button" className="fc-button-brand" onClick={seedDefaultAccounts}>
          Seed 200-lead account plan
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Daily lead target" value={summary.dailyLeads} />
        <Metric label="Daily post target" value={summary.dailyPosts} />
        <Metric label="Connected" value={summary.connected} />
        <Metric label="Needs auth" value={summary.needsAuth} />
      </div>

      <div className="fc-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Account label, e.g. Finely Cred YouTube Shorts"
          />
          <select
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
            value={platform}
            onChange={(event) => setPlatform(event.target.value as CmoSocialPlatform)}
          >
            {platforms.map((item) => (
              <option key={item} value={item}>
                {item.replace('_', ' ')}
              </option>
            ))}
          </select>
          <button type="button" className="fc-button-soft" onClick={addAccount}>
            Add account
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {state.accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
        {state.accounts.length === 0 ? (
          <div className="fc-card p-5 text-sm text-slate-300">
            No managed accounts yet. Seed the recommended plan or add accounts manually.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AccountCard({ account }: { account: CmoManagedAccount }) {
  return (
    <article className="fc-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-200/60">{account.platform}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{account.label}</h3>
          <p className="mt-1 text-sm text-slate-400">{account.handle || account.publicUrl || 'Handle/link not configured yet'}</p>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">{account.status}</span>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
        <span>Leads/day: {account.dailyLeadTarget ?? 0}</span>
        <span>Posts/day: {account.dailyPostTarget ?? 0}</span>
        <span>Health: {account.healthScore}</span>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="fc-card p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
