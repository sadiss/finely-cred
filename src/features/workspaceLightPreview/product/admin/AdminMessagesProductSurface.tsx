import React, { useMemo } from 'react';
import { ArrowRight, MessageSquare, Radio, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FinelyCommunicationHub } from '../../../../components/chat/FinelyCommunicationHub';
import { listStaffOnDutyNow, loadStaffRoster } from '../../../../data/staffRoster';
import { getAgentPersona } from '../../../../domain/agentPersonas';
import { staffMemberFullName } from '../../../../domain/staffMember';
import { StaffPortraitImg } from '../../../../components/staff/StaffPortraitImg';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import type { ProductMetric } from '../components/ProductUi';

const RAIL_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

export default function AdminMessagesProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const PageIcon = navItem?.icon ?? MessageSquare;

  const onDuty = useMemo(() => listStaffOnDutyNow().slice(0, 8), []);
  const roster = useMemo(() => loadStaffRoster().filter((s) => s.active), []);
  const rosterSize = roster.length;
  const onDutyIds = useMemo(() => new Set(onDuty.map((m) => m.id)), [onDuty]);

  const metrics: ProductMetric[] = [
    {
      label: 'On duty',
      value: onDuty.length,
      hint: 'Staff available now',
      accent: 'emerald',
      icon: Users,
    },
    {
      label: 'Roster',
      value: rosterSize,
      hint: 'Active specialists',
      accent: 'sky',
      icon: Radio,
    },
    {
      label: 'Mode',
      value: 'Staff desk',
      hint: 'Not partner inbox',
      accent: 'violet',
      icon: Sparkles,
    },
    {
      label: 'Partner threads',
      value: 'Support',
      hint: 'Open partner conversations',
      accent: 'rose',
      icon: MessageSquare,
      onClick: () => navigate('/admin/support'),
    },
  ];

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Staff comms"
      title="Staff radio desk"
      description="Roster on the left, live hub in the center, signal rail on the right — partner support stays in Partner conversations."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Radio desk"
      metricDescription="Ask Finely routes to any roster member. Partner threads open in Support."
      primaryAction={
        <ProductPagePrimaryAction label="Partner conversations" onClick={() => navigate('/admin/support')} />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/comms')}>
          Communications hub
        </button>
      }
    >
      <div className={FINELY_OS_PAGE} data-surface-layout="split-workbench">
        {/* Signal pulse hero */}
        <section
          className={`${finelyOsCatalogCard('sky')} p-6 lg:p-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end`}
          data-fc-accent="sky"
        >
          <div>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Radio size={16} /> Staff radio pulse
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <span className="text-6xl font-extrabold leading-none">{onDuty.length}</span>
              <span className="pb-2 text-xl font-extrabold opacity-90">
                on duty now · {rosterSize} on roster
              </span>
            </div>
            <p className={`mt-4 max-w-2xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {onDuty.length > 0
                ? `${onDuty.length} specialist${onDuty.length === 1 ? '' : 's'} available for internal staff chat — use Ask Finely in the hub to route.`
                : 'No one is on shift right now — the full roster is still reachable from the live hub.'}
            </p>
            <button type="button" onClick={() => navigate('/admin/support')} className={`${FINELY_OS_PRIMARY_BTN} mt-5`}>
              Partner conversations <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'On duty', value: onDuty.length, family: 'emerald' as const },
              { label: 'Roster', value: rosterSize, family: 'violet' as const },
              { label: 'Desk', value: 'Staff', family: 'rose' as const },
            ].map((tile) => (
              <div key={tile.label} className={`${finelyOsCatalogCard(tile.family)} p-4 text-center`} data-fc-accent={tile.family}>
                <div className={`text-[10px] font-black uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>{tile.label}</div>
                <div className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{tile.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Split workbench — roster rail · live hub · signal rail */}
        <div className="grid gap-6 lg:grid-cols-12 items-start min-h-[560px]">
          <nav
            className={`lg:col-span-3 ${finelyOsCatalogCard('emerald')} p-5 lg:p-6 flex flex-col max-h-[72vh]`}
            data-fc-accent="emerald"
            aria-label="Staff roster"
          >
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Users size={16} />
              <span>Roster navigator</span>
            </div>
            <p className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {onDuty.length} on duty · {rosterSize} active
            </p>

            <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
              {roster.length === 0 ? (
                <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>No active roster members.</p>
              ) : (
                roster.map((member, idx) => {
                  const persona = getAgentPersona(member.primaryRoleId);
                  const roleTitle = persona?.displayTitle ?? 'Specialist';
                  const isOnDuty = onDutyIds.has(member.id);
                  const family = RAIL_ACCENTS[idx % RAIL_ACCENTS.length];
                  return (
                    <div
                      key={member.id}
                      className={`rounded-2xl border px-3 py-3 transition ${
                        isOnDuty ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-black/15'
                      }`}
                      data-fc-accent={isOnDuty ? 'emerald' : family}
                    >
                      <div className="flex items-center gap-3">
                        <StaffPortraitImg staff={member} className="h-11 w-11 rounded-full object-cover shrink-0" alt="" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-extrabold truncate">{staffMemberFullName(member)}</div>
                          <div className="text-xs font-bold opacity-80 truncate">{roleTitle}</div>
                          {isOnDuty ? (
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> On duty
                            </div>
                          ) : (
                            <div className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>
                              Off shift
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </nav>

          <main className={`lg:col-span-6 ${finelyOsCatalogCard('violet')} p-5 lg:p-6 flex flex-col min-h-[520px]`} data-fc-accent="violet">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-violet-300">Live hub</div>
              <h2 className="mt-2 text-2xl font-extrabold">Staff communication center</h2>
              <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Same Communication Hub as the portal — admin mode with the full agent roster.
              </p>
            </div>
            <div className="mt-4 flex-1 min-h-0">
              <FinelyCommunicationHub mode="page" initialTab="ai" showAllAgents adminMode />
            </div>
          </main>

          <aside className="lg:col-span-3 space-y-4">
            <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6 space-y-4`} data-fc-accent="rose">
              <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Signal rail</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>On duty now</span>
                  <span className="text-2xl font-extrabold">{onDuty.length}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Active roster</span>
                  <span className="text-2xl font-extrabold">{rosterSize}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Desk mode</span>
                  <span className="text-sm font-extrabold">Staff</span>
                </div>
              </div>
              <button type="button" className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center`} onClick={() => navigate('/admin/support')}>
                Partner conversations <ArrowRight size={14} />
              </button>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} p-5 lg:p-6 space-y-3`} data-fc-accent="sky">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>On duty now</div>
              {onDuty.length === 0 ? (
                <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  No one is on shift — route through Ask Finely to reach off-shift specialists.
                </p>
              ) : (
                <ul className="space-y-2">
                  {onDuty.map((member, idx) => {
                    const persona = getAgentPersona(member.primaryRoleId);
                    const family = RAIL_ACCENTS[(idx + 1) % RAIL_ACCENTS.length];
                    return (
                      <li
                        key={member.id}
                        className={`rounded-xl border px-3 py-2 ${finelyOsCatalogCard(family)} !p-3`}
                        data-fc-accent={family}
                      >
                        <div className="text-sm font-extrabold truncate">{staffMemberFullName(member)}</div>
                        <div className="text-xs font-bold opacity-80">{persona?.displayTitle ?? 'Specialist'}</div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6 space-y-3`} data-fc-accent="emerald">
              <div className={FINELY_OS_ENTITY_VALUE}>Quick jumps</div>
              <button type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`} onClick={() => navigate('/admin/comms')}>
                Communications hub
              </button>
              <button type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`} onClick={() => navigate('/admin/staff')}>
                Staff roster admin
              </button>
            </div>
          </aside>
        </div>
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
