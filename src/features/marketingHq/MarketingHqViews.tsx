import React from 'react';
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

const channelIcon: Record<MarketingChannelId, React.ReactNode> = {
  email: <Mail size={18} />,
  social: <Megaphone size={18} />,
  sms: <MessageSquare size={18} />,
  paid: <BarChart3 size={18} />,
  content: <Newspaper size={18} />,
  'direct-mail': <Send size={18} />,
};

function StatusPill({ status }: { status: SendStatus }) {
  const map: Record<SendStatus, string> = {
    send: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    hold: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
    draft: 'bg-white/5 text-white/60 border-white/15',
    scheduled: 'bg-sky-500/15 text-sky-200 border-sky-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${map[status]}`}>
      {status === 'send' ? <PlayCircle size={10} /> : status === 'hold' ? <PauseCircle size={10} /> : null}
      {status}
    </span>
  );
}

function RoleTag({ role }: { role: string }) {
  return (
    <span className="text-[10px] uppercase tracking-widest text-white/40 border border-white/10 rounded px-1.5 py-0.5">
      {role}
    </span>
  );
}

export function MarketingCommandFloor() {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[#fbbf24]/25 bg-gradient-to-br from-[#0b1110] to-[#060908] p-8">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#fbbf24]">Welcome — Command Floor</div>
        <h2 className="text-3xl font-light text-white mt-2">Pick a department floor, then a channel room.</h2>
        <p className="text-white/55 mt-3 max-w-2xl text-sm leading-relaxed">
          Marketing HQ is organized like an office building: <strong className="text-white/80">departments first</strong>, channel desks
          inside each floor. Directors, Specialists, and VAs appear on work inside rooms — not in the top navigation.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <KpiCard label="Departments" value={String(MARKETING_DEPARTMENTS.length)} hint="Active floors" />
          <KpiCard label="Live campaign" value="Start Restore" hint="$147 · Growth Email/Social" />
          <KpiCard label="Comms wire" value="Studio" hint="/admin/comms" onClick={() => navigate('/admin/comms')} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MARKETING_DEPARTMENTS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => navigate(`/admin/marketing/${d.id}`)}
            className="text-left rounded-2xl border border-white/10 bg-[#0b1110] hover:border-[#fbbf24]/35 p-6 transition-all group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#fbbf24] text-xs font-black uppercase tracking-widest">{d.floorLabel}</span>
              {d.comingSoon && (
                <span className="text-[10px] uppercase tracking-wider text-white/40 border border-white/10 px-2 py-0.5 rounded-full">
                  Coming soon
                </span>
              )}
            </div>
            <div className="text-lg font-semibold text-white mt-2 group-hover:text-[#fbbf24] transition-colors">{d.name}</div>
            <p className="text-white/50 text-sm mt-2 line-clamp-2">{d.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {d.channels.map((c) => (
                <span key={c.id} className="text-[10px] px-2 py-0.5 rounded-md bg-black/40 border border-white/10 text-white/55">
                  {c.short}
                </span>
              ))}
            </div>
            <div className="mt-4 text-[#fbbf24] text-xs font-semibold flex items-center gap-1">
              Enter floor <ArrowRight size={14} />
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
      className="rounded-xl border border-white/10 bg-black/30 p-4 text-left hover:border-[#fbbf24]/30 transition-all"
    >
      <div className="text-[10px] uppercase tracking-widest text-white/40">{props.label}</div>
      <div className="text-2xl font-light text-white mt-1">{props.value}</div>
      <div className="text-xs text-white/45 mt-1">{props.hint}</div>
    </button>
  );
}

export function MarketingDepartmentFloor() {
  const { deptId } = useParams<{ deptId: string }>();
  const navigate = useNavigate();
  const dept = getDepartment(deptId ?? '');
  if (!dept) {
    return <p className="text-white/60">Unknown department.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#0b1110] p-6">
        <div className="text-[#fbbf24] text-xs font-black uppercase tracking-widest">{dept.floorLabel}</div>
        <h2 className="text-2xl font-semibold text-white mt-1">{dept.name}</h2>
        <p className="text-white/55 text-sm mt-2 max-w-2xl">{dept.tagline}</p>
        {dept.comingSoon && (
          <p className="mt-4 text-amber-200/80 text-sm border border-amber-500/25 bg-amber-500/10 rounded-xl px-4 py-3">
            Direct Mail floor is a planning stub — partner network and vendor connect come later. No fake vendors listed.
          </p>
        )}
      </div>

      <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Channel rooms on this floor</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dept.channels.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => navigate(`/admin/marketing/${dept.id}/${ch.id}`)}
            className="text-left rounded-2xl border border-white/10 bg-[#0b1110] p-5 hover:border-[#fbbf24]/40 transition-all"
          >
            <div className="flex items-center gap-2 text-[#fbbf24]">
              {channelIcon[ch.id]}
              <span className="font-semibold text-white">{ch.label}</span>
            </div>
            <p className="text-white/45 text-xs mt-3">Queue · assets · campaigns · send/hold</p>
            {ch.comingSoon && <p className="text-white/35 text-xs mt-2">Room shell only</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MarketingChannelRoom() {
  const { deptId, channelId } = useParams<{ deptId: string; channelId: string }>();
  const dept = getDepartment(deptId ?? '');
  const ch = dept?.channels.find((c) => c.id === channelId);
  if (!dept || !ch) {
    return <p className="text-white/60">Room not found.</p>;
  }

  const room = getRoomSnapshot(dept.id as MarketingDepartmentId, ch.id as MarketingChannelId);

  if (dept.id === 'direct-mail') {
    return (
      <div className="space-y-6 max-w-3xl">
        <RoomHeader dept={dept} ch={ch} />
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6 space-y-3 text-sm text-white/75">
          <div className="text-white font-semibold">Partner network later</div>
          <p>
            This room reserves space for co-branded direct mail with partner agencies and print vendors. We will connect real
            vendors from Admin Vendors when contracts exist — no placeholder vendor names in production UI.
          </p>
          <p className="text-white/50 text-xs">
            Brief: intake mail volume, compliance review, and regional partner print routes before enabling send.
          </p>
          <Link to="/admin/vendors" className="inline-flex text-[#fbbf24] text-sm font-semibold underline">
            Open vendor admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <RoomHeader dept={dept} ch={ch} />

      <div className="grid lg:grid-cols-3 gap-4">
        <KpiCard label="Queue today" value={String(room.queue.length)} hint="Items on desk" />
        <KpiCard label="Campaigns" value={String(room.campaigns.length)} hint="Active objects" />
        <KpiCard label="Assets" value={String(room.assets.length)} hint="In this room" />
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#0b1110] p-6">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Users size={18} className="text-[#fbbf24]" /> Today&apos;s queue
        </h3>
        <ul className="mt-4 space-y-3">
          {room.queue.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <div>
                <div className="text-white text-sm">{q.title}</div>
                <div className="text-white/40 text-xs mt-0.5">{q.dueLabel}</div>
              </div>
              <div className="flex items-center gap-2">
                <RoleTag role={q.ownerRole} />
                <StatusPill status={q.status} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0b1110] p-6">
        <h3 className="text-white font-semibold">Campaigns</h3>
        {room.campaigns.length === 0 ? (
          <p className="text-white/45 text-sm mt-3">No campaigns staged in this room yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {room.campaigns.map((c) => (
              <li key={c.id} className="rounded-xl border border-[#fbbf24]/20 bg-[#fbbf24]/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-white font-medium">{c.name}</div>
                    {c.note && <p className="text-white/55 text-xs mt-1">{c.note}</p>}
                    {c.publicPath && (
                      <a href={c.publicPath} target="_blank" rel="noreferrer" className="text-[#fbbf24] text-xs mt-2 inline-block underline">
                        Public: {c.publicPath}
                      </a>
                    )}
                    {c.packageId && (
                      <div className="text-white/40 text-[10px] font-mono mt-1">package: {c.packageId}</div>
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

      <section className="rounded-2xl border border-white/10 bg-[#0b1110] p-6">
        <h3 className="text-white font-semibold">Assets</h3>
        <ul className="mt-4 space-y-2">
          {room.assets.map((a) => (
            <li key={a.id} className="flex justify-between text-sm text-white/70 border-b border-white/5 pb-2">
              <span>{a.name}</span>
              <span className="text-white/40 text-xs">{a.type} · {a.updated}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0b1110] p-6">
        <h3 className="text-white font-semibold text-sm">Wired tools (existing admin)</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {room.wiredTools.map((t) => (
            <Link
              key={t.path}
              to={t.path}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-[#fbbf24] hover:bg-[#fbbf24]/10"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function RoomHeader({ dept, ch }: { dept: { floorLabel: string; name: string }; ch: { label: string } }) {
  return (
    <div className="rounded-2xl border border-[#fbbf24]/20 bg-gradient-to-r from-[#0b1110] to-[#060908] p-6">
      <div className="text-[10px] uppercase tracking-widest text-[#fbbf24]/80">{dept.floorLabel} · {dept.name}</div>
      <h2 className="text-2xl font-semibold text-white mt-1">{ch.label}</h2>
      <p className="text-white/50 text-sm mt-2">Desk operations — roles appear on tasks below, not in global nav.</p>
    </div>
  );
}
