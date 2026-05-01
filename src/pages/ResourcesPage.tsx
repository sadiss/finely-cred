import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, ExternalLink, FileText, Library, Shield, ShieldCheck, Sparkles, X, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { useAuth } from '../auth/AuthProvider';
import { isAdminEmail } from '../auth/admin';
import { submitLeadCapture } from '../data/leadsRepo';
import { MarketingConsentBlock } from '../components/fields/MarketingConsentBlock';
import { findFreeGuideByTitleEffective, listFreeGuidesEffective } from '../data/freeGuidesRepo';
import { listPublicResourceVideos } from '../data/resourceVideosRepo';
import { downloadFreeGuidePdf } from '../resources/downloadGuidePdf';
import { getBlobUrl } from '../storage/getBlobUrl';

export default function ResourcesPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const isAdmin = isAdminEmail(auth.user?.email);
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const businessCreditMaxLinks = [
    { label: 'Link A', href: 'https://www.myscoreiq.com/business-credit-max.aspx?offercode=432133WW' },
    { label: 'Link B', href: 'https://www.myscoreiq.com/business-credit-max.aspx?offercode=432133WX' },
    { label: 'Link C', href: 'https://www.myscoreiq.com/business-credit-max.aspx?offercode=432133X3' },
  ] as const;
  const [businessLinkIdx, setBusinessLinkIdx] = useState<0 | 1 | 2>(0);

  const partnerLinks: Array<{
    provider: string;
    title: string;
    desc: string;
    href: string;
    accent: 'emerald' | 'amber' | 'red' | 'slate';
    meta: string;
  }> = [
    {
      provider: 'MyScoreIQ',
      title: 'Get FICO® Max',
      desc: '3‑bureau reports + FICO® scores, daily monitoring & alerts, dark web/internet monitoring, fraud restoration support (case manager), a FICO® score simulator, and up to $1M identity theft insurance (AIG).',
      href: 'https://www.myscoreiq.com/get-fico-max.aspx?offercode=432133RQ',
      accent: 'amber' as const,
      meta: 'Personal monitoring',
    },
    {
      provider: 'IdentityIQ',
      title: 'SecurePreferred+',
      desc: '3‑bureau reports & scores (refreshable every 30 days), daily monitoring & alerts, dark web monitoring, ScoreCasterIQ insights, identity monitoring (records/watchlists), and up to $1M identity theft insurance (AIG).',
      href: 'https://www.identityiq.com/sc-securepreferred.aspx?offercode=43113820',
      accent: 'red' as const,
      meta: 'Personal monitoring',
    },
    {
      provider: 'AnnualCreditReport.com',
      title: 'Official free credit reports',
      desc: 'The federally authorized site to request free credit reports from Equifax, Experian, and TransUnion (free weekly online reports are available). Great for baseline accuracy checks and identity-theft review.',
      href: 'https://www.annualcreditreport.com/requestReport/landingPage.action',
      accent: 'slate' as const,
      meta: 'Official source',
    },
  ];

  const freeGuides = useMemo(() => listFreeGuidesEffective(), [storeVersion]);
  const resourceVideos = useMemo(() => listPublicResourceVideos(), [storeVersion]);

  const [videoPreview, setVideoPreview] = useState<null | { title: string; url: string; revoke?: () => void }>(null);

  const openVideo = async (id: string) => {
    const v = resourceVideos.find((x) => x.id === id);
    if (!v) return;
    try {
      videoPreview?.revoke?.();
    } catch {
      // ignore
    }
    const res = await getBlobUrl(v.blobRef, { mimeType: v.mimeType, preferSigned: true, signedTtlSeconds: 60 * 20 });
    if (!res?.url) return;
    setVideoPreview({ title: v.title, url: res.url, revoke: res.revoke });
  };

  const closeVideo = () => {
    try {
      videoPreview?.revoke?.();
    } catch {
      // ignore
    }
    setVideoPreview(null);
  };

  const [leadOpen, setLeadOpen] = useState(false);
  const [leadInterest, setLeadInterest] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState({ email: false, sms: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [remoteStatus, setRemoteStatus] = useState<'ok' | 'failed' | 'not_configured' | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const phoneDigits = useMemo(() => phone.replace(/\D/g, ''), [phone]);
  const phoneOk = useMemo(() => phoneDigits.length >= 10 && phoneDigits.length <= 15, [phoneDigits]);

  const openLead = (interest: string) => {
    setLeadInterest(interest);
    setLeadOpen(true);
    setSubmitErr(null);
    setSubmittedId(null);
    setRemoteStatus(null);
    setRemoteError(null);
  };

  const closeLead = () => {
    setLeadOpen(false);
    setSubmitting(false);
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setConsent(false);
    setMarketingConsent({ email: false, sms: false });
    setSubmitErr(null);
    setSubmittedId(null);
    setRemoteStatus(null);
    setRemoteError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    if (!fullName.trim()) return setSubmitErr('Please enter your name.');
    if (!emailOk) return setSubmitErr('Please enter a valid email.');
    if (!phoneOk) return setSubmitErr('Please enter a valid phone number (10–15 digits).');
    if (!consent) return setSubmitErr('Consent is required to request the enlightenment session.');

    setSubmitting(true);
    try {
      const result = await submitLeadCapture({
        source: 'resources',
        offer: 'free_1h_consult',
        interest: leadInterest ?? undefined,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        consentToContact: true,
        consentEmailMarketing: marketingConsent.email,
        consentSmsMarketing: marketingConsent.sms,
      });
      setSubmittedId(result.lead.id);
      setRemoteStatus(result.remote);
      setRemoteError(result.remoteError ?? null);
    } catch (err: any) {
      setSubmitErr(err?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      badge="Public"
      title="Resource Library"
      subtitle="Guides, templates, and references — built to keep your execution clean and your decisions informed."
    >
      <div className="space-y-6">
        {isAdmin && (
          <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 backdrop-blur-xl p-6 space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-amber-200 font-black">Admin tools</div>
            <div className="text-white/70 text-sm">
              Create and edit in-depth guides, books, and courses. Changes are stored locally (and can be synced if you configure Supabase).
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate('/admin/resources')} className="fc-button-brand">
                Edit free guides <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/courses')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                Course builder <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/bookstore')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                Manage bookstore <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-white/[0.04] to-emerald-500/10 backdrop-blur-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-400">
                <ShieldCheck size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Credit monitoring tools</span>
              </div>
              <p className="mt-2 text-white/60 text-sm max-w-3xl">
                These monitoring providers can help you track changes and export reports. For best results in Finely Cred, prefer an <span className="text-white/80">HTML export</span>
                (we parse tradelines, scores, sections, and 24‑month history). PDFs are supported for text reference.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest">
              <Sparkles size={14} className="text-amber-400" />
              trusted workflow
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Business Credit Max (consolidated selector) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => window.open(businessCreditMaxLinks[businessLinkIdx].href, '_blank', 'noopener,noreferrer')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') window.open(businessCreditMaxLinks[businessLinkIdx].href, '_blank', 'noopener,noreferrer');
              }}
              className="group rounded-2xl border border-white/10 bg-white/[0.06] p-6 hover:bg-white/[0.09] hover:border-emerald-500/30 transition-all cursor-pointer"
              title="Open MyScoreIQ Business Credit Max"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-white font-semibold">Business Credit Max</div>
                    <span className="text-[9px] px-2 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 uppercase tracking-widest font-bold">
                      Business monitoring
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40">MyScoreIQ</div>
                  <div className="mt-3 text-white/70 text-sm">
                    Business credit tools including file creation + monitoring (inquiries, score changes, UCC/public record filings), plus cyber monitoring and business identity fraud restoration.
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {businessCreditMaxLinks.map((l, idx) => (
                      <button
                        key={l.href}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setBusinessLinkIdx(idx as 0 | 1 | 2);
                        }}
                        className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          businessLinkIdx === idx
                            ? 'bg-emerald-500 text-black border-emerald-300'
                            : 'bg-black/20 text-white/70 border-white/10 hover:bg-white/[0.06] hover:text-white'
                        }`}
                        title={`Select ${l.label}`}
                      >
                        {l.label}
                      </button>
                    ))}
                    <span className="text-[10px] uppercase tracking-widest text-white/40 ml-1">
                      selected: {businessCreditMaxLinks[businessLinkIdx].label}
                    </span>
                  </div>
                </div>
                <ExternalLink size={16} className="text-emerald-300 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            {partnerLinks.map((x) => (
              <a
                key={x.href}
                href={x.href}
                target="_blank"
                rel="noreferrer"
                className={`group rounded-2xl border border-white/10 bg-white/[0.06] p-6 hover:bg-white/[0.09] transition-all ${
                  x.accent === 'emerald' ? 'hover:border-emerald-500/30' :
                  x.accent === 'amber' ? 'hover:border-amber-500/30' :
                  x.accent === 'red' ? 'hover:border-rose-500/30' :
                  'hover:border-white/20'
                }`}
                title={`Open ${x.provider} link in a new tab`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-white font-semibold">{x.title}</div>
                      <span
                        className={`text-[9px] px-2 py-1 rounded-full border uppercase tracking-widest font-bold ${
                          x.accent === 'emerald'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : x.accent === 'amber'
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                              : x.accent === 'red'
                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                                : 'border-white/15 bg-white/5 text-white/60'
                        }`}
                      >
                        {x.meta}
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40">{x.provider}</div>
                    <div className="mt-3 text-white/70 text-sm">{x.desc}</div>
                  </div>
                  <ExternalLink size={16} className="text-amber-400 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </a>
            ))}
          </div>
          <div className="text-[11px] text-white/40">
            Tip: For disputes and case-building, always keep a clean baseline by checking the official free reports and then monitoring ongoing changes with alerts.
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.03] to-amber-500/5 backdrop-blur-xl p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <Library size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Quick references</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Dispute workflow overview', desc: 'How evidence, reasons, letters, rounds, and follow-ups connect.' },
                { title: 'Document discipline', desc: 'What to upload, when, and how to label it for clean execution.' },
                { title: 'Score model cheat sheet', desc: 'FICO vs VantageScore, and why lenders differ by product.' },
                { title: 'Funding readiness sequencing', desc: 'Avoidable denials: timing, utilization, and profile structure.' },
              ].map((x) => (
                <div key={x.title} className="rounded-2xl border border-white/10 bg-black/30 p-6 hover:bg-white/[0.03] transition-colors">
                  <div className="text-white font-semibold">{x.title}</div>
                  <div className="mt-2 text-white/60 text-sm">{x.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-gradient-to-br from-black/40 via-black/30 to-emerald-500/5 backdrop-blur-xl p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <BookOpen size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Premium playbooks</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-white/60 text-sm">
              Browse premium e-books and playbooks in the Bookstore.
            </div>
            <button
              onClick={() => navigate('/bookstore')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Open bookstore <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/5 via-white/[0.03] to-amber-500/10 backdrop-blur-xl p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-amber-400">
            <BookOpen size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Free guides</span>
          </div>
          <p className="text-white/60 text-sm max-w-3xl">
            High-signal field guides designed for clean execution. Request access and you’ll also receive a complimentary 60‑minute enlightenment session to
            map your next moves.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {freeGuides.map((x) => (
              <div key={x.title} className="rounded-2xl border border-white/10 bg-black/30 p-6 hover:bg-white/[0.03] transition-colors">
                <div className="text-white font-semibold">{x.title}</div>
                <div className="mt-2 text-white/60 text-sm">{x.desc}</div>
                <button
                  onClick={() => openLead(x.title)}
                  className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  title="Unlock via quick form"
                  type="button"
                >
                  Request guide + session <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Videos */}
        {resourceVideos.length ? (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-black/40 via-white/[0.03] to-sky-500/10 backdrop-blur-xl p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <Film size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Videos</span>
            </div>
            <p className="text-white/60 text-sm max-w-3xl">
              Short, high-signal video lessons from the Finely Cred library.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resourceVideos.map((v) => (
                <div key={v.id} className="rounded-2xl border border-white/10 bg-black/30 p-6 hover:bg-white/[0.03] transition-colors">
                  <div className="text-white font-semibold">{v.title}</div>
                  {v.desc ? <div className="mt-2 text-white/60 text-sm">{v.desc}</div> : null}
                  <button
                    onClick={() => void openVideo(v.id)}
                    className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    type="button"
                  >
                    Watch video <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-3">
          <div className="inline-flex items-center gap-2 text-amber-400">
            <Shield size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Legal / compliance</span>
          </div>
          <p className="text-white/60 text-sm">
            This library is educational. Dispute workflows and letter generation features are tools to organize information and execution —
            not legal advice.
          </p>
          <div className="text-[11px] text-white/50">We continuously harden privacy, audit depth, and access control across the platform.</div>
        </div>
      </div>

      {/* Lead capture modal */}
      {leadOpen && (
        <div className="fixed inset-0 z-[300]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeLead} />
          <div className="absolute inset-x-0 top-10 px-4">
            <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-[#0d1512] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Free guide + 60‑minute enlightenment session</div>
                  <div className="mt-2 text-white font-semibold text-lg">Request your guide and schedule your session</div>
                  <div className="mt-1 text-white/60 text-sm">
                    {leadInterest ? (
                      <>Requested guide: <span className="text-white/80">{leadInterest}</span></>
                    ) : (
                      <>Guide request</>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeLead}
                  className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/70"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                {submittedId ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-white/80">
                      <div className="inline-flex items-center gap-2 text-emerald-300">
                        <CheckCircle2 size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Request received</span>
                      </div>
                      <p className="mt-2 text-white font-semibold">You’re in. We’ll contact you to schedule your 60‑minute enlightenment session.</p>
                      <p className="mt-2 text-white/70 text-sm">
                        Reference ID: <span className="font-mono text-white/90">{submittedId}</span>
                      </p>
                      {remoteStatus === 'ok' && (
                        <p className="mt-2 text-emerald-200/80 text-sm">
                          Saved to our system. You’ll receive scheduling outreach shortly.
                        </p>
                      )}
                      {remoteStatus === 'not_configured' && (
                        <p className="mt-2 text-amber-200/80 text-sm">
                          Saved locally in this browser. To enable live capture in your backend, connect Supabase.
                        </p>
                      )}
                      {remoteStatus === 'failed' && (
                        <p className="mt-2 text-amber-200/80 text-sm">
                          Saved locally, but couldn’t reach Supabase right now. {remoteError ? `(${remoteError})` : ''}
                        </p>
                      )}
                      <p className="mt-2 text-white/60 text-sm">
                        Next: watch your inbox and phone. If you want to reach us immediately, email <span className="text-white/80">info@finelycred.com</span>.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const guide = findFreeGuideByTitleEffective(leadInterest) ?? freeGuides[0]!;
                          void downloadFreeGuidePdf({ guide, leadId: submittedId, fullName: fullName.trim() || undefined });
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        title="Download the guide PDF now"
                      >
                        Download guide PDF <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          closeLead();
                          resetForm();
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                      >
                        Done <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/portal/messages')}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        title="If you’re logged in, you can message support to schedule"
                      >
                        Message support <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Name</label>
                        <input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                          placeholder="Your full name"
                          autoComplete="name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Email</label>
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                          placeholder="you@email.com"
                          type="email"
                          autoComplete="email"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Phone</label>
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                          placeholder="(555) 555-5555"
                          type="tel"
                          autoComplete="tel"
                          required
                        />
                        <div className="mt-2 text-[11px] text-white/40">
                          We’ll use this to schedule your 60‑minute enlightenment session.
                        </div>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <span className="text-white/60 text-sm">
                        I consent to be contacted by Finely Cred about this guide request and the complimentary enlightenment session.
                      </span>
                    </label>

                    <MarketingConsentBlock value={marketingConsent} onChange={setMarketingConsent} phone={phone} />

                    {submitErr && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200/90 text-sm">
                        {submitErr}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Submitting…' : 'Request guide + session'} <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          closeLead();
                          resetForm();
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="text-[11px] text-white/40">
                      This is saved locally (offline-safe). If Supabase is connected, it’s also sent to `lead_captures` for real-time capture.
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video modal */}
      {videoPreview && (
        <div className="fixed inset-0 z-[310]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeVideo} />
          <div className="absolute inset-x-0 top-10 px-4">
            <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#0d1512] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Video</div>
                  <div className="mt-2 text-white font-semibold text-lg truncate">{videoPreview.title}</div>
                </div>
                <button
                  type="button"
                  onClick={closeVideo}
                  className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/70"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <video src={videoPreview.url} controls className="w-full rounded-2xl border border-white/10 bg-black" />
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

