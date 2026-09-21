import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send, Sparkles, Users, Trophy, Video } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { LOUNGE_CHANNELS, type LoungeChannelId, type LoungeRole } from '../../domain/specialistLounge';
import {
  createLoungePost,
  listLoungePosts,
  loungeKpis,
  loungeUnreadCount,
  markLoungeChannelRead,
} from '../../data/specialistLoungeRepo';
import { callAiGateway } from '../../lib/aiClient';
import { buildAgentSystemPrompt } from '../../lib/knowledgeBase/agentPersonas';
import { detectKbLang, retrieveKnowledgeSync } from '../../lib/knowledgeBaseRouter';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { listCalendarEvents } from '../../data/calendarRepo';
import { AcademyResourcesShelf } from '../../components/training/academy/AcademyResourcesShelf';
import { KpiCard } from '../../components/ui/KpiCards';

export default function AdminSpecialistLoungePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [params, setParams] = useSearchParams();
  const lang = params.get('lang') === 'ht' ? 'ht' : 'en';
  const channel = (params.get('ch') as LoungeChannelId) || 'general';
  const [body, setBody] = useState('');
  const [version, setVersion] = useState(0);
  const [aiBusy, setAiBusy] = useState(false);

  const email = auth.user?.email ?? 'trainee@local';
  const name = email.split('@')[0];
  const role: LoungeRole = email.includes('admin') || email.includes('coach') ? 'coach' : 'specialist';

  const posts = useMemo(() => {
    markLoungeChannelRead(channel);
    return listLoungePosts(channel);
  }, [channel, version]);

  const kpis = useMemo(() => loungeKpis(), [version]);
  const events = useMemo(() => listCalendarEvents().slice(0, 5), []);

  const post = () => {
    const text = body.trim();
    if (!text) return;
    createLoungePost({
      channelId: channel,
      authorEmail: email,
      authorName: name,
      role,
      body: text,
      moduleLessonId: params.get('lesson') ?? undefined,
    });
    setBody('');
    setVersion((v) => v + 1);
  };

  const askDeskAi = async () => {
    const text = body.trim();
    if (!text || !isFeatureEnabled('aiGateway')) return;
    setAiBusy(true);
    try {
      const replyLang = detectKbLang(text);
      const kb = retrieveKnowledgeSync(text, replyLang);
      const system = buildAgentSystemPrompt('academy_coach', kb, replyLang);
      const res = await callAiGateway({
        taskType: 'lounge_ask_desk',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: text },
        ],
        context: { channel: 'ask_desk' },
      });
      createLoungePost({
        channelId: 'ask_desk',
        authorEmail: 'lounge-helper@finelycred.com',
        authorName: 'Lounge Helper',
        role: 'coach',
        body: `**AI first-reply (educational):**\n${res.text || '—'}\n\n— escalate to coach if legal/court specifics.`,
        threadParentId: undefined,
      });
      setVersion((v) => v + 1);
    } finally {
      setAiBusy(false);
    }
  };

  const setChannel = (ch: LoungeChannelId) => {
    const p = new URLSearchParams(params);
    p.set('ch', ch);
    setParams(p, { replace: true });
  };

  return (
    <PageShell
      badge="Specialist Lounge"
      title={lang === 'ht' ? 'Lounge espesyalis' : 'Specialist Lounge'}
      subtitle="Discord-energy, Finely brand — announce, huddles, wins, meet lobby. Not partner prospecting."
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin/specialist-academy')} className="text-white/60 hover:text-white text-sm inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Academy
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/specialist-academy')}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-black uppercase tracking-widest"
          >
            Course library
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <KpiCard label="Posts" value={kpis.totalPosts} tone="amber" />
          <KpiCard label="Ask the Desk" value={kpis.askDeskOpen} hint="threads" tone="violet" />
          <KpiCard label="Wins shared" value={kpis.winsShared} tone="emerald" />
          <KpiCard label="Meet threads" value={kpis.meetThreads} tone="sky" />
        </div>

        <div className="flex flex-wrap gap-2">
          {LOUNGE_CHANNELS.map((c) => {
            const unread = loungeUnreadCount(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  channel === c.id
                    ? 'bg-amber-500 text-black border-amber-400'
                    : 'bg-black/30 text-white/70 border-white/10 hover:border-amber-500/30'
                }`}
              >
                {lang === 'ht' ? c.labelHt : c.label}
                {unread > 0 ? <span className="ml-1 text-rose-400">({unread})</span> : null}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4 min-h-[400px]">
            <div className="flex items-center gap-2 text-white/80 font-semibold">
              <MessageSquare size={18} className="text-amber-300" />
              {LOUNGE_CHANNELS.find((c) => c.id === channel)?.label}
            </div>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto fc-scroll-area">
              {posts.length === 0 ? (
                <p className="text-white/50 text-sm animate-pulse">Be the first voice in this room — share a takeaway or question.</p>
              ) : (
                posts.map((p) => (
                  <div key={p.id} className={`rounded-xl border p-4 ${p.pinned ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
                    <div className="text-[10px] uppercase tracking-widest text-white/45">
                      {p.authorName} · {p.role}
                      {p.reviewScore != null ? ` · review ${p.reviewScore}/5` : ''}
                    </div>
                    <p className="mt-2 text-white/80 text-sm whitespace-pre-wrap">{p.body}</p>
                    {p.meetLink ? (
                      <a href={p.meetLink} className="mt-2 inline-block text-sky-300 text-xs" target="_blank" rel="noreferrer">
                        Join meet
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={lang === 'ht' ? 'Ekri mesaj…' : 'Write a message…'}
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85"
                onKeyDown={(e) => e.key === 'Enter' && post()}
              />
              <button type="button" onClick={post} className="p-2 rounded-xl bg-amber-500 text-black">
                <Send size={16} />
              </button>
              {channel === 'ask_desk' && isFeatureEnabled('aiGateway') ? (
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={() => void askDeskAi()}
                  className="px-3 py-2 rounded-xl border border-emerald-500/40 text-emerald-100 text-xs font-bold"
                >
                  <Sparkles size={14} className="inline" /> KB reply
                </button>
              ) : null}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Video size={16} className="text-sky-300" /> Meeting lobby
              </div>
              <p className="mt-2 text-white/55 text-xs">Calendar events + consultation booking (extend to guest /meet when wired).</p>
              <ul className="mt-3 space-y-2 text-xs text-white/65">
                {events.length ? events.map((e) => (
                  <li key={e.id}>{e.title} — {e.startAt?.slice(0, 10)}</li>
                )) : (
                  <li>No upcoming events — book via Consultation.</li>
                )}
              </ul>
              <button type="button" onClick={() => navigate('/consultation')} className="mt-3 text-amber-300 text-xs">
                Open consultation booking →
              </button>
            </div>
            {channel === 'resources' ? <AcademyResourcesShelf lang={lang} /> : null}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 text-xs text-white/60">
              <Users size={14} className="inline text-violet-300" /> Roles: trainee · specialist · coach · admin (moderation via coach/admin posts).
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-white/60">
              <Trophy size={14} className="inline text-emerald-300" /> Wins: celebrate restore discipline & funding-readiness — never promise scores or approvals.
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
