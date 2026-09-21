import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Mail,
  Megaphone,
  MessageSquare,
  Newspaper,
  PauseCircle,
  PlayCircle,
  Send,
  Users,
} from 'lucide-react';
import {
  MARKETING_DEPARTMENTS,
  getDepartment,
  getRoomSnapshot,
  type MarketingChannelId,
  type MarketingDepartmentId,
  type SendStatus,
} from './marketingHqModel';
import { MarketingStartHereStrip } from './MarketingStartHereStrip';
import { MarketingReadyAssetCard } from './MarketingReadyAssetCard';
import { getFeaturedPackAssetsForRoom, getPackAssetsForRoom } from './finelyPackCatalog';

const channelIcon: Record<MarketingChannelId, React.ReactNode> = {
  email: <Mail size={20} />,
  social: <Megaphone size={20} />,
  sms: <MessageSquare size={20} />,
  paid: <BarChart3 size={20} />,
  content: <Newspaper size={20} />,
  'direct-mail': <Send size={20} />,
};

function StatusPill({ status }: { status: SendStatus }) {
  const label =
    status === 'send' ? 'Ready' : status === 'hold' ? 'Hold' : status === 'scheduled' ? 'Scheduled' : 'Draft';
  const map: Record<SendStatus, string> = {
    send: 'bg-[#fbbf24]/20 text-[#fde68a] border-[#fbbf24]/45',
    hold: 'bg-amber-900/50 text-amber-100 border-amber-500/40',
    draft: 'bg-white/10 text-white/75 border-white/20',
    scheduled: 'bg-sky-500/20 text-sky-100 border-sky-400/35',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${map[status]}`}>
      {status === 'send' ? <PlayCircle size={11} /> : status === 'hold' ? <PauseCircle size={11} /> : null}
      {label}
    </span>
  );
}

function RoleTag({ role }: { role: string }) {
  return (
    <span className="text-[10px] uppercase tracking-widest text-white/65 border border-white/15 rounded px-1.5 py-0.5">
      {role}
    </span>
  );
}

function ManualSendBanner() {
  return (
    <div className="rounded-xl border border-[#fbbf24]/35 bg-[#fbbf24]/10 px-4 py-3 text-sm text-[#fde68a]">
      <strong className="text-white">Manual send only.</strong> Marketing HQ never auto-sends email, SMS, or social posts. Preview → copy → send from your tools.
    </div>
  );
}

export function MarketingCommandFloor() {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      <MarketingStartHereStrip />

      <div className="rounded-2xl border border-[#fbbf24]/30 bg-gradient-to-br from-[#0b1110] to-[#060908] p-8 sm:p-10">
        <div className="text-[11px] font-black uppercase tracking-[0.4em] text-[#fbbf24]">Welcome — Command Floor</div>
        <h2 className="text-3xl sm:text-4xl font-semibold text-white mt-3 leading-tight">
          Pick a department floor, then a channel room.
        </h2>
        <p className="text-white/75 mt-4 max-w-2xl text-base leading-relaxed">
          Finely Marketing HQ mirrors Nora-style sales packs — but <strong className="text-white">Finely gold + medallion only</strong> on cold creatives.
          Departments are floors; desks are rooms with ready-to-use copy.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <KpiCard label="Departments" value={String(MARKETING_DEPARTMENTS.length)} hint="Active floors" />
          <KpiCard label="21-day pack" value="Shipped" hint="Emails + SMS + HTML" />
          <KpiCard label="Comms wire" value="Studio" hint="/admin/comms" onClick={() => navigate('/admin/comms')} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MARKETING_DEPARTMENTS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => navigate(`/admin/marketing/${d.id}`)}
            className="text-left rounded-2xl border border-white/15 bg-[#0b1110] hover:border-[#fbbf24]/45 p-6 transition-all group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#fbbf24] text-xs font-black uppercase tracking-widest">{d.floorLabel}</span>
              {d.comingSoon && (
                <span className="text-[10px] uppercase tracking-wider text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  Future
                </span>
              )}
            </div>
            <div className="text-xl font-bold text-white mt-2 group-hover:text-[#fbbf24] transition-colors">{d.name}</div>
            <p className="text-white/65 text-sm mt-2 line-clamp-2">{d.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {d.channels.map((c) => (
                <span key={c.id} className="text-[10px] px-2 py-0.5 rounded-md bg-black/50 border border-white/15 text-white/70">
                  {c.short}
                </span>
              ))}
            </div>
            <div className="mt-4 text-[#fbbf24] text-sm font-bold flex items-center gap-1">
              Enter floor <ArrowRight size={16} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function KpiCard(props: { label: string; value: string; hint: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="rounded-xl border border-white/15 bg-black/40 p-4 text-left hover:border-[#fbbf24]/40 transition-all"
    >
      <div className="text-[10px] uppercase tracking-widest text-white/55">{props.label}</div>
      <div className="text-2xl sm:text-3xl font-semibold text-white mt-1">{props.value}</div>
      <div className="text-sm text-white/60 mt-1">{props.hint}</div>
    </button>
  );
}

export function MarketingDepartmentFloor() {
  const { deptId } = useParams<{ deptId: string }>();
  const navigate = useNavigate();
  const dept = getDepartment(deptId ?? '');
  if (!dept) {
    return <p className="text-white/70">Unknown department.</p>;
  }

  return (
    <div className="space-y-6">
      {dept.id === 'growth-acquisition' && <MarketingStartHereStrip />}
      <div className="rounded-2xl border border-white/15 bg-[#0b1110] p-6 sm:p-8">
        <div className="text-[#fbbf24] text-xs font-black uppercase tracking-widest">{dept.floorLabel}</div>
        <h2 className="text-3xl font-bold text-white mt-2">{dept.name}</h2>
        <p className="text-white/75 text-base mt-3 max-w-2xl">{dept.tagline}</p>
        {dept.comingSoon && (
          <p className="mt-4 text-amber-100 text-sm border border-amber-500/30 bg-amber-500/10 rounded-xl px-4 py-3">
            Direct Mail floor is a planning stub — partner network and vendor connect come later.
          </p>
        )}
      </div>

      <div className="text-xs font-black uppercase tracking-widest text-white/55">Channel rooms on this floor</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dept.channels.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => navigate(`/admin/marketing/${dept.id}/${ch.id}`)}
            className="text-left rounded-2xl border border-white/15 bg-[#0b1110] p-5 hover:border-[#fbbf24]/45 transition-all"
          >
            <div className="flex items-center gap-2 text-[#fbbf24]">
              {channelIcon[ch.id]}
              <span className="font-bold text-white text-lg">{ch.label}</span>
            </div>
            <p className="text-white/70 text-sm mt-3 leading-relaxed">{ch.deskGuide}</p>
            {ch.comingSoon && <p className="text-amber-200/80 text-xs mt-2 font-semibold">Room shell only</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReadyToUseSection({
  departmentId,
  channelId,
}: {
  departmentId: MarketingDepartmentId;
  channelId: MarketingChannelId;
}) {
  const [showAll, setShowAll] = useState(false);
  const all = useMemo(() => getPackAssetsForRoom(departmentId, channelId), [departmentId, channelId]);
  const featured = useMemo(() => getFeaturedPackAssetsForRoom(departmentId, channelId), [departmentId, channelId]);
  const list = showAll ? all : featured;

  if (all.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[#fbbf24]/25 bg-[#060908] p-6 sm:p-8 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white">Ready to use</h3>
          <p className="text-white/70 text-sm mt-1">Finely sales pack assets — preview, copy, or download. Hold items stay internal until approved.</p>
        </div>
        {all.length > featured.length && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="px-4 py-2 rounded-xl border border-[#fbbf24]/40 text-[#fde68a] text-xs font-black uppercase tracking-wider hover:bg-[#fbbf24]/10"
          >
            {showAll ? 'Show featured only' : `Show all (${all.length})`}
          </button>
        )}
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((asset) => (
          <MarketingReadyAssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </section>
  );
}

export function MarketingChannelRoom() {
  const { deptId, channelId } = useParams<{ deptId: string; channelId: string }>();
  const dept = getDepartment(deptId ?? '');
  const ch = dept?.channels.find((c) => c.id === channelId);
  if (!dept || !ch) {
    return <p className="text-white/70">Room not found.</p>;
  }

  const room = getRoomSnapshot(dept.id as MarketingDepartmentId, ch.id as MarketingChannelId);

  if (dept.id === 'direct-mail') {
    return (
      <div className="space-y-6 max-w-3xl">
        <RoomHeader dept={dept} ch={ch} />
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-3 text-base text-white/85">
          <div className="text-white font-bold text-lg">Partner network later</div>
          <p>
            This room reserves space for co-branded direct mail with partner agencies and print vendors. We will connect real
            vendors from Admin Vendors when contracts exist — no placeholder vendor names in production UI.
          </p>
          <Link to="/admin/vendors" className="inline-flex text-[#fbbf24] text-sm font-bold underline">
            Open vendor admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <RoomHeader dept={dept} ch={ch} />
      <ManualSendBanner />
      {(dept.id === 'growth-acquisition' && (ch.id === 'email' || ch.id === 'social')) && <MarketingStartHereStrip />}

      <ReadyToUseSection departmentId={dept.id as MarketingDepartmentId} channelId={ch.id as MarketingChannelId} />

      <div className="grid lg:grid-cols-3 gap-4">
        <KpiCard label="Queue today" value={String(room.queue.length)} hint="Desk checklist" />
        <KpiCard label="Campaigns" value={String(room.campaigns.length)} hint="Tracked offers" />
        <KpiCard label="Pack assets" value={String(getPackAssetsForRoom(dept.id as MarketingDepartmentId, ch.id as MarketingChannelId).length)} hint="In this room" />
      </div>

      <section className="rounded-2xl border border-white/15 bg-[#0b1110] p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Users size={20} className="text-[#fbbf24]" /> Today&apos;s queue
        </h3>
        <ul className="mt-4 space-y-3">
          {room.queue.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/15 bg-black/40 px-4 py-3">
              <div>
                <div className="text-white text-base">{q.title}</div>
                <div className="text-white/55 text-sm mt-0.5">{q.dueLabel}</div>
              </div>
              <div className="flex items-center gap-2">
                <RoleTag role={q.ownerRole} />
                <StatusPill status={q.status} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/15 bg-[#0b1110] p-6">
        <h3 className="text-lg font-bold text-white">Campaigns</h3>
        {room.campaigns.length === 0 ? (
          <p className="text-white/60 text-sm mt-3">No campaigns staged in this room yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {room.campaigns.map((c) => (
              <li key={c.id} className="rounded-xl border border-[#fbbf24]/25 bg-[#fbbf24]/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-white font-semibold text-base">{c.name}</div>
                    {c.note && <p className="text-white/70 text-sm mt-1">{c.note}</p>}
                    {c.publicPath && (
                      <a href={c.publicPath} target="_blank" rel="noreferrer" className="text-[#fbbf24] text-sm mt-2 inline-block underline font-semibold">
                        Public: {c.publicPath}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <RoleTag role={c.ownerRole} />
                    <StatusPill status={c.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/15 bg-[#0b1110] p-6">
        <h3 className="text-lg font-bold text-white">Wired tools</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {room.wiredTools.map((t) => (
            <Link
              key={t.path}
              to={t.path}
              className="px-4 py-2 rounded-xl border border-[#fbbf24]/35 bg-[#fbbf24]/10 text-sm text-[#fde68a] font-semibold hover:bg-[#fbbf24]/20"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function RoomHeader({ dept, ch }: { dept: { floorLabel: string; name: string }; ch: { label: string; deskGuide: string } }) {
  return (
    <div className="rounded-2xl border border-[#fbbf24]/30 bg-gradient-to-r from-[#0b1110] to-[#060908] p-6 sm:p-8">
      <div className="text-[11px] uppercase tracking-widest text-[#fbbf24] font-black">{dept.floorLabel} · {dept.name}</div>
      <h2 className="text-3xl font-bold text-white mt-2">{ch.label}</h2>
      <p className="text-white/75 text-base mt-3 max-w-3xl leading-relaxed">{ch.deskGuide}</p>
    </div>
  );
}
