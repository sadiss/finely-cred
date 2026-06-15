import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Bot,
  ClipboardList,
  Inbox,
  Megaphone,
  Plus,
  Settings,
  Share2,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import type { MetaIntegrationConfig } from '../../domain/metaIntegration';
import {
  isMetaIntegrationLive,
  loadMetaIntegrationConfig,
  saveMetaIntegrationConfig,
} from '../../data/metaIntegrationRepo';
import {
  getSocialHubStats,
  listInboxMessages,
  listScheduledPosts,
  queueSocialPost,
  simulateMetaLeadInbox,
  syncMetaInboxFromSupabase,
  updateSocialPostStatus,
  type SocialScheduledPost,
} from '../../data/socialHubRepo';
import { SOCIAL_SOP_LIBRARY } from '../../domain/socialContentSop';
import {
  draftCaptionFromSop,
  loadSocialAutopilotConfig,
  processSocialAutopilotTick,
  publishDueSocialPosts,
  queueSopPostNow,
  reviewSocialCaptionCompliance,
  saveSocialAutopilotConfig,
} from '../../lib/socialAutopilotEngine';
import { publishSocialPostLive } from '../../lib/metaSocialPublish';
import { resolveStaffOnDuty } from '../../data/staffRoster';
import { StaffPortraitImg } from '../../components/staff/StaffPortraitImg';
import { staffMemberFullName } from '../../domain/staffMember';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { SocialWorkflowWeekStrip } from '../../features/social/SocialWorkflowWeekStrip';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsListItem,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

type Tab = 'dashboard' | 'composer' | 'calendar' | 'inbox' | 'autopilot' | 'sop' | 'settings';

export default function AdminSocialHubPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get('tab');
    if (t === 'composer' || t === 'calendar' || t === 'inbox' || t === 'settings' || t === 'autopilot' || t === 'sop') return t;
    return 'dashboard';
  });
  const [config, setConfig] = useState<MetaIntegrationConfig>(() => loadMetaIntegrationConfig());
  const [caption, setCaption] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [posts, setPosts] = useState<SocialScheduledPost[]>(() => listScheduledPosts());
  const [inbox, setInbox] = useState(() => listInboxMessages());
  const [storeTick, setStoreTick] = useState(0);
  const [autopilotCfg, setAutopilotCfg] = useState(() => loadSocialAutopilotConfig());
  const [selectedSopId, setSelectedSopId] = useState(SOCIAL_SOP_LIBRARY[0]?.id ?? '');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'composer' || t === 'calendar' || t === 'inbox' || t === 'settings' || t === 'autopilot' || t === 'sop') {
      setTab(t);
    } else if (t === 'dashboard') {
      setTab('dashboard');
    }
  }, [searchParams]);

  const selectTab = (id: Tab) => {
    setTab(id);
    navigate(`/admin/social-hub?tab=${id}`, { replace: true });
  };

  const refreshLocal = useCallback(() => {
    setPosts(listScheduledPosts());
    setInbox(listInboxMessages());
    setStoreTick((n) => n + 1);
  }, []);

  useEffect(() => {
    const onStore = () => refreshLocal();
    window.addEventListener('finely:store', onStore);
    return () => window.removeEventListener('finely:store', onStore);
  }, [refreshLocal]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void (async () => {
      try {
        const added = await syncMetaInboxFromSupabase(async () => {
          const { data, error } = await supabase
            .from('meta_inbox_messages')
            .select('id, thread_id, channel, direction, text, created_at, page_id')
            .order('created_at', { ascending: false })
            .limit(50);
          if (error) throw error;
          return data ?? [];
        });
        if (added > 0) refreshLocal();
      } catch {
        /* table may not exist until migration */
      }
    })();
  }, [refreshLocal]);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code || !isSupabaseConfigured) return;
    void (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('meta-oauth', {
          body: { code, redirectUri: `${window.location.origin}/admin/social-hub?tab=settings` },
        });
        if (error) throw new Error(error.message);
        if (!data?.ok) throw new Error(data?.error || 'OAuth failed');
        setConfig((c) => {
          const next = {
            ...c,
            status: 'connected' as const,
            connectedPages: data.pages ?? c.connectedPages,
            tokenExpiresAt: data.tokenExpiresIn
              ? new Date(Date.now() + Number(data.tokenExpiresIn) * 1000).toISOString()
              : c.tokenExpiresAt,
          };
          saveMetaIntegrationConfig(next);
          return next;
        });
        setNotice(`Meta connected — ${data.pages?.length ?? 0} page(s) synced to meta_connections.`);
        setTab('settings');
      } catch (e: unknown) {
        setNotice((e as Error)?.message ?? 'Meta OAuth failed.');
      }
    })();
  }, [searchParams]);

  const stats = useMemo(() => {
    const hub = getSocialHubStats();
    const reviewQueue = posts.filter(
      (p) => p.status === 'needs_review' || p.complianceStatus === 'needs_review',
    );
    const dueToPublish = posts.filter(
      (p) => p.status === 'queued' && Date.parse(p.scheduledAt) <= Date.now(),
    );
    return {
      scheduledToday: hub.scheduledToday,
      inboxUnread: hub.inboxUnread,
      leadsThisWeek: hub.leadsThisWeek,
      connectedPages: config.connectedPages.length,
      queuedPosts: hub.queuedPosts,
      reviewQueue,
      dueToPublish,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.connectedPages.length, posts.length, inbox.length, storeTick]);

  const connectMeta = () => {
    const appId = (config.appId ?? '').trim();
    if (!appId || appId === 'YOUR_META_APP_ID') {
      setNotice('Enter your Meta App ID in Settings, then try again.');
      setTab('settings');
      return;
    }
    const redirectUri = `${window.location.origin}/admin/social-hub?tab=settings`;
    const scopes = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'instagram_basic', 'leads_retrieval'].join(',');
    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code`;
    window.location.href = url;
  };

  const saveSettings = () => {
    saveMetaIntegrationConfig(config);
    setNotice('Settings saved. Webhook URL: /functions/v1/meta-webhook — see docs/SOCIAL_HUB_META.md.');
  };

  const handleQueuePost = () => {
    if (!caption.trim()) {
      setNotice('Add a caption before queuing.');
      return;
    }
    const scheduledAt = scheduleDate ? new Date(scheduleDate).toISOString() : new Date().toISOString();
    const pageId = config.connectedPages[0]?.pageId;
    queueSocialPost({ caption, scheduledAt, pageId });
    setCaption('');
    setScheduleDate('');
    refreshLocal();
    setNotice('Post queued locally. Live publish uses page token from meta_connections.');
  };

  const handleSimulateLead = () => {
    const pageId = config.connectedPages[0]?.pageId ?? 'demo_page';
    simulateMetaLeadInbox({ pageId, name: 'Jordan Lee', email: 'jordan@example.com' });
    refreshLocal();
    setNotice('Simulated Meta lead added to inbox (local dev).');
    setTab('inbox');
  };

  const calendarDays = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const days: { date: string; label: number; posts: SocialScheduledPost[] }[] = [];
    for (let d = 1; d <= end.getDate(); d++) {
      const iso = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: iso,
        label: d,
        posts: posts.filter((p) => p.scheduledAt.slice(0, 10) === iso && p.status === 'queued'),
      });
    }
    return days;
  }, [posts]);

  return (
    <PageShell title="Social Hub" subtitle="Meta-first scheduling, inbox, and Media Studio handoff">
      <div className="space-y-6">
        <div className={FINELY_OS_VIEW_TABS}>
          {(
            [
              ['dashboard', 'Dashboard', Sparkles],
              ['composer', 'Composer', Megaphone],
              ['calendar', 'Calendar', Calendar],
              ['autopilot', 'Autopilot', Zap],
              ['sop', 'SOP library', ClipboardList],
              ['inbox', 'Inbox', Inbox],
              ['settings', 'Settings', Settings],
            ] as const
          ).map(([id, label, Icon]) => (
            <button key={id} type="button" onClick={() => selectTab(id)} className={finelyOsViewTab(tab === id)}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {notice ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>
        ) : null}

        {!isMetaIntegrationLive() ? (
          <div className={`${FINELY_OS_NOTICE_WARN} flex flex-wrap items-center justify-between gap-3`}>
            <p className="text-sm">
              Meta is in demo/local mode — connect OAuth in Settings or simulate leads for dev. Live Lead Ads require webhook verification.
            </p>
            <button type="button" onClick={() => navigate('/admin/settings?tab=integrations')} className={FINELY_OS_SECONDARY_BTN}>
              Meta settings
            </button>
          </div>
        ) : null}

        {tab === 'dashboard' && (
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: 'Scheduled today', value: stats.scheduledToday, icon: Calendar },
              { label: 'Inbox unread', value: stats.inboxUnread, icon: Inbox },
              { label: 'Leads this week', value: stats.leadsThisWeek, icon: TrendingUp },
              { label: 'Connected pages', value: stats.connectedPages, icon: Share2 },
            ].map((s) => (
              <FinelyOsGlassPanel key={s.label} icon={s.icon} title={s.label} accent="emerald">
                <div className={`${FINELY_OS_ENTITY_VALUE} text-3xl font-black mt-1`}>{s.value}</div>
              </FinelyOsGlassPanel>
            ))}
          </div>
        )}

        {tab === 'composer' && (
          <FinelyOsGlassPanel icon={Megaphone} title="New post" accent="violet">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              placeholder="Write caption — attach media from Media Studio…"
              className={`${FINELY_OS_ENTITY_INPUT} mt-2 resize-y`}
            />
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Schedule</label>
                <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div className="flex items-end gap-2">
                <button type="button" onClick={() => navigate('/admin/media-studio')} className={FINELY_OS_SECONDARY_BTN}>
                  Attach from Media Studio
                </button>
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={handleQueuePost}>
                  <Plus size={14} /> Queue post
                </button>
              </div>
            </div>
            {stats.queuedPosts > 0 ? (
              <p className={`${FINELY_OS_ENTITY_BODY} mt-3 text-xs text-white/50`}>{stats.queuedPosts} post(s) in queue — see Calendar.</p>
            ) : null}
          </FinelyOsGlassPanel>
        )}

        {tab === 'calendar' && (
          <FinelyOsGlassPanel icon={Calendar} title="Content calendar" accent="emerald">
            <p className={`${FINELY_OS_ENTITY_BODY} mt-2`}>
              {posts.length === 0
                ? 'No queued posts yet — use Composer or connect Meta for live scheduling.'
                : `${posts.filter((p) => p.status === 'queued').length} queued post(s) this month.`}
            </p>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-white/40">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`pad-${i}`} className="h-14" />
              ))}
              {calendarDays.map((day) => (
                <div
                  key={day.date}
                  className={`h-14 rounded-lg border text-xs p-1 ${
                    day.posts.length ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/[0.08] bg-white/[0.02]'
                  }`}
                >
                  <div className="text-white/50">{day.label}</div>
                  {day.posts.length > 0 ? <div className="text-emerald-300 truncate">{day.posts.length} post</div> : null}
                </div>
              ))}
            </div>
          </FinelyOsGlassPanel>
        )}

        {tab === 'autopilot' && (
          <div className="space-y-4">
          <SocialWorkflowWeekStrip />
          <FinelyOsGlassPanel icon={Zap} title="Social autopilot" accent="amber">
            <p className={`${FINELY_OS_ENTITY_BODY} mt-2`}>
              Jamie & Ethan (Brand) + affiliate/nurture roles draft SOP-based captions on platform cron. Enable live publish after Meta connect.
            </p>
            <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
              <div className={`${finelyOsCatalogCard('emerald')} !p-3 fc-surface-harmony`} data-fc-accent="emerald">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Status</div>
                <div className={FINELY_OS_ENTITY_VALUE}>{autopilotCfg.enabled ? 'Enabled' : 'Paused'}</div>
              </div>
              <div className={`${finelyOsCatalogCard('emerald')} !p-3 fc-surface-harmony`} data-fc-accent="emerald">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Mode</div>
                <div className={FINELY_OS_ENTITY_VALUE}>{autopilotCfg.dryRun ? 'Dry run' : 'Live queue'}</div>
              </div>
              <div className={`${finelyOsCatalogCard('emerald')} !p-3 fc-surface-harmony`} data-fc-accent="emerald">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>This week</div>
                <div className={FINELY_OS_ENTITY_VALUE}>{autopilotCfg.postsGeneratedThisWeek} posts</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              <label className="inline-flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={autopilotCfg.enabled}
                  onChange={(e) => {
                    const next = { ...autopilotCfg, enabled: e.target.checked };
                    setAutopilotCfg(next);
                    saveSocialAutopilotConfig(next);
                  }}
                />
                Autopilot enabled
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={autopilotCfg.dryRun}
                  onChange={(e) => {
                    const next = { ...autopilotCfg, dryRun: e.target.checked };
                    setAutopilotCfg(next);
                    saveSocialAutopilotConfig(next);
                  }}
                />
                Dry run (preview only)
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={autopilotCfg.autoPublish}
                  onChange={(e) => {
                    const next = { ...autopilotCfg, autoPublish: e.target.checked };
                    setAutopilotCfg(next);
                    saveSocialAutopilotConfig(next);
                  }}
                />
                Auto-publish when due
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={FINELY_OS_PRIMARY_BTN}
                onClick={() => {
                  const result = processSocialAutopilotTick({ force: true, dryRun: autopilotCfg.dryRun });
                  refreshLocal();
                  setNotice(
                    `Autopilot run: ${result.generated} queued · ${result.skipped} skipped · ${result.complianceBlocked} blocked · ${result.published} published`,
                  );
                }}
              >
                <Bot size={14} /> Run autopilot now
              </button>
              <button
                type="button"
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() => {
                  void (async () => {
                    if (autopilotCfg.dryRun) {
                      setNotice(`Dry run — ${stats.dueToPublish.length} post(s) would publish now`);
                      return;
                    }
                    if (isMetaIntegrationLive()) {
                      let published = 0;
                      let failed = 0;
                      for (const p of stats.dueToPublish) {
                        const live = await publishSocialPostLive(p);
                        if (live.ok) {
                          updateSocialPostStatus(p.id, 'published');
                          published += 1;
                        } else {
                          updateSocialPostStatus(p.id, 'failed');
                          failed += 1;
                        }
                      }
                      refreshLocal();
                      setNotice(`Meta live publish: ${published} published${failed ? ` · ${failed} failed` : ''}`);
                      return;
                    }
                    const result = publishDueSocialPosts({ force: true, dryRun: false });
                    refreshLocal();
                    setNotice(`Published ${result.published} due post(s) locally${result.failed ? ` · ${result.failed} failed` : ''}`);
                  })();
                }}
              >
                <Megaphone size={14} /> Publish due now
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => selectTab('sop')}>
                View SOP library
              </button>
            </div>
            {stats.reviewQueue.length > 0 ? (
              <div className="mt-4">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Compliance review queue</div>
                <div className="mt-2">
                  <FinelyOsPaginatedStack
                    items={stats.reviewQueue}
                    pageSize={4}
                    emptyMessage="Review queue empty."
                    renderItem={(p) => (
                      <div key={p.id} className={`${finelyOsInlineListItem()} px-3 py-2 text-sm`}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className={FINELY_OS_ENTITY_VALUE}>{(p.platforms ?? []).join(', ') || 'Social'}</div>
                            <div className={`${FINELY_OS_ENTITY_BODY} text-xs line-clamp-2 mt-1`}>{p.caption}</div>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              className={FINELY_OS_SECONDARY_BTN}
                              onClick={() => {
                                updateSocialPostStatus(p.id, 'queued', { complianceStatus: 'approved' });
                                refreshLocal();
                                setNotice('Post approved — moved to publish queue');
                              }}
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
            ) : null}
            {stats.dueToPublish.length > 0 ? (
              <p className={`${FINELY_OS_ENTITY_BODY} mt-3 text-xs text-emerald-300/90`}>
                {stats.dueToPublish.length} post(s) past schedule — use Publish due now or enable auto-publish.
              </p>
            ) : null}
            {autopilotCfg.lastRunAt ? (
              <p className={`${FINELY_OS_ENTITY_BODY} mt-3 text-xs`}>Last run: {new Date(autopilotCfg.lastRunAt).toLocaleString()}</p>
            ) : null}
          </FinelyOsGlassPanel>
          </div>
        )}

        {tab === 'sop' && (
          <div className="grid lg:grid-cols-2 gap-4">
            <FinelyOsGlassPanel icon={ClipboardList} title="Content SOP templates" accent="violet">
              <div className="mt-2">
                <FinelyOsPaginatedStack
                  items={SOCIAL_SOP_LIBRARY}
                  pageSize={6}
                  emptyMessage="No SOP templates."
                  renderItem={(sop) => (
                    <button
                      key={sop.id}
                      type="button"
                      onClick={() => setSelectedSopId(sop.id)}
                      className={finelyOsListItem(selectedSopId === sop.id, 'violet')}
                    >
                      <div className={FINELY_OS_ENTITY_VALUE}>{sop.title}</div>
                      <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>
                        {sop.pillar} · {sop.cadence} · {sop.platforms.join(', ')}
                      </div>
                    </button>
                  )}
                />
              </div>
            </FinelyOsGlassPanel>
            <FinelyOsGlassPanel icon={Megaphone} title="Preview & queue" accent="emerald">
              {(() => {
                const sop = SOCIAL_SOP_LIBRARY.find((s) => s.id === selectedSopId) ?? SOCIAL_SOP_LIBRARY[0];
                if (!sop) return null;
                const draft = draftCaptionFromSop(sop);
                const review = reviewSocialCaptionCompliance(draft, sop);
                const staff = resolveStaffOnDuty(sop.assignedRoleId);
                return (
                  <>
                    {staff ? (
                      <div className="mt-2 flex items-center gap-3">
                        <StaffPortraitImg staff={staff} className="w-10 h-10 rounded-full border border-white/15" />
                        <div>
                          <div className={FINELY_OS_ENTITY_VALUE}>{staffMemberFullName(staff)}</div>
                          <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Assigned voice · {sop.assignedRoleId.replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                    ) : null}
                    <pre className={`mt-4 whitespace-pre-wrap text-sm ${FINELY_OS_ENTITY_BODY} ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony max-h-64 overflow-y-auto`}>{draft}</pre>
                    {!review.ok ? (
                      <ul className="mt-3 text-xs text-amber-200/90 space-y-1">
                        {review.issues.map((issue) => (
                          <li key={issue}>⚠ {issue}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-xs text-emerald-300">Compliance check passed.</p>
                    )}
                    <button
                      type="button"
                      className={`${FINELY_OS_PRIMARY_BTN} mt-4`}
                      onClick={() => {
                        queueSopPostNow(sop.id);
                        refreshLocal();
                        setNotice(`Queued SOP post: ${sop.title}`);
                      }}
                    >
                      <Plus size={14} /> Queue this SOP post
                    </button>
                  </>
                );
              })()}
            </FinelyOsGlassPanel>
          </div>
        )}

        {tab === 'inbox' && (
          <FinelyOsGlassPanel icon={Inbox} title="Unified inbox" accent="amber">
            <p className={`${FINELY_OS_ENTITY_BODY} mt-2`}>
              Meta DMs and lead forms — production messages land via meta-webhook into meta_inbox_messages + lead_captures.
            </p>
            <button type="button" onClick={() => navigate('/admin/support?source=meta')} className={`${FINELY_OS_SECONDARY_BTN} mt-3`}>
              Open omnichannel Support Inbox →
            </button>
            {inbox.length === 0 ? (
              <p className="mt-4 text-sm text-white/45">No messages yet. Use Settings → Simulate lead (dev) or connect Meta webhooks.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {inbox.map((m) => (
                  <li key={m.id} className={`${finelyOsInlineListItem()} px-3 py-2 text-sm`}>
                    <div className="flex justify-between gap-2 text-white/45 text-[10px] uppercase">
                      <span>{m.channel}</span>
                      <span>{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-white/80 mt-1">{m.text}</div>
                  </li>
                ))}
              </ul>
            )}
          </FinelyOsGlassPanel>
        )}

        {tab === 'settings' && (
          <FinelyOsGlassPanel icon={Settings} title="Meta connections" accent="violet">
            <p className={`${FINELY_OS_ENTITY_BODY} mt-1`}>Status: {config.status}</p>
            {config.connectedPages.length > 0 ? (
              <ul className="mt-2 text-sm text-white/70 space-y-1">
                {config.connectedPages.map((p) => (
                  <li key={p.pageId}>
                    {p.pageName} {p.igUsername ? `· @${p.igUsername}` : ''}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4 space-y-3 max-w-lg">
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Default Instagram image URL</label>
                <input
                  value={config.defaultIgImageUrl ?? ''}
                  onChange={(e) => setConfig((c) => ({ ...c, defaultIgImageUrl: e.target.value }))}
                  className={FINELY_OS_ENTITY_INPUT}
                  placeholder="https://…/og-default.jpg"
                />
                <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>Used for IG media-container posts when no creative is attached.</p>
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>App ID</label>
                <input
                  value={config.appId ?? ''}
                  onChange={(e) => setConfig((c) => ({ ...c, appId: e.target.value }))}
                  className={FINELY_OS_ENTITY_INPUT}
                  placeholder="Meta App ID"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={connectMeta} className={FINELY_OS_PRIMARY_BTN}>
                  Connect Meta account
                </button>
                <button type="button" onClick={saveSettings} className={FINELY_OS_SECONDARY_BTN}>
                  Save settings
                </button>
                <button type="button" onClick={handleSimulateLead} className={FINELY_OS_SECONDARY_BTN}>
                  Simulate lead (dev)
                </button>
              </div>
              <p className="text-xs text-white/45">
                Deploy <span className="font-mono">meta-oauth</span> + <span className="font-mono">meta-webhook</span>, set META_* secrets, and apply{' '}
                <span className="font-mono">20260615000000_meta_connections.sql</span>. See docs/SOCIAL_HUB_META.md.
              </p>
            </div>
          </FinelyOsGlassPanel>
        )}
      </div>
    </PageShell>
  );
}
