import React, { useMemo, useState } from 'react';
import { CmoPublishAsset } from '../../domain/cmoPhase4';
import { loadCmoPhase4State, upsertCmoPublishAsset, upsertCmoPublishJob } from '../../data/cmoPhase4Repo';
import { scanCmoPublishRisk } from '../../lib/cmoPhase4/cmoCompliancePublishGate';
import { createCmoPublishJob, dispatchManualPublish } from '../../lib/cmoPhase4/cmoOfficialPublisherAdapters';

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function CmoPublishingQueuePanel() {
  const [state, setState] = useState(loadCmoPhase4State());
  const [caption, setCaption] = useState('Business owners: stop guessing. Get a funding-readiness roadmap before you apply. Book your Finely Cred consultation today.');
  const firstAccount = state.accounts[0];
  const pendingJobs = useMemo(() => state.queue.filter((job) => ['needs_review', 'approved', 'scheduled'].includes(job.status)), [state.queue]);

  function refresh() {
    setState(loadCmoPhase4State());
  }

  function createQueueItem() {
    if (!firstAccount) return;
    const scan = scanCmoPublishRisk(caption);
    const now = new Date().toISOString();
    const asset: CmoPublishAsset = {
      id: id('asset'),
      accountId: firstAccount.id,
      platform: firstAccount.platform,
      assetType: firstAccount.platform === 'sms' ? 'sms' : firstAccount.platform === 'email' ? 'email' : 'short',
      title: 'CMO generated growth asset',
      caption,
      cta: 'Book consultation',
      mediaUrls: [],
      hashtags: ['finelycred', 'businesscredit', 'fundingreadiness'],
      complianceScore: scan.score,
      conversionScore: Math.max(55, Math.min(150, 90 + (caption.length > 120 ? 18 : 0) - scan.reasons.length * 6)),
      riskLevel: scan.riskLevel,
      riskFlags: scan.reasons,
      createdAt: now,
      updatedAt: now,
    };
    const job = createCmoPublishJob({ asset, account: firstAccount, approved: false });
    upsertCmoPublishAsset(asset);
    upsertCmoPublishJob(job);
    refresh();
  }

  function markReady(jobId: string) {
    const job = state.queue.find((item) => item.id === jobId);
    const asset = job ? state.assets.find((item) => item.id === job.assetId) : undefined;
    const account = job ? state.accounts.find((item) => item.id === job.accountId) : undefined;
    if (!job || !asset || !account) return;
    const result = dispatchManualPublish({ job, asset, account, adminApproved: true });
    upsertCmoPublishJob(result.job);
    refresh();
  }

  return (
    <section className="fc-panel p-5 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">Publishing governance</p>
        <h2 className="text-2xl font-semibold text-white">CMO Publishing Queue</h2>
        <p className="mt-1 text-sm text-slate-300">Approval-first publishing. The CMO prepares assets; humans approve; official APIs come after credentials and platform approval.</p>
      </div>

      <div className="fc-card p-4 space-y-3">
        <textarea
          className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="fc-button-brand" onClick={createQueueItem} disabled={!firstAccount}>
            Create queue item
          </button>
          {!firstAccount ? <p className="text-sm text-amber-100">Add a managed account first.</p> : null}
        </div>
      </div>

      <div className="grid gap-3">
        {pendingJobs.map((job) => {
          const asset = state.assets.find((item) => item.id === job.assetId);
          const account = state.accounts.find((item) => item.id === job.accountId);
          return (
            <article key={job.id} className="fc-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{account?.label ?? job.platform}</p>
                  <h3 className="mt-1 font-semibold text-white">{asset?.title ?? 'Queued asset'}</h3>
                  <p className="mt-2 text-sm text-slate-300">{asset?.caption}</p>
                  {asset?.riskFlags.length ? <p className="mt-2 text-xs text-amber-100">{asset.riskFlags.join(' ')}</p> : null}
                </div>
                <div className="shrink-0 space-y-2 text-right">
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{job.status}</span>
                  <button type="button" className="fc-button-soft block" onClick={() => markReady(job.id)}>
                    Approve manual card
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {pendingJobs.length === 0 ? <div className="fc-card p-5 text-sm text-slate-300">No active queue items yet.</div> : null}
      </div>
    </section>
  );
}
