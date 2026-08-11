import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, MapPin, Rocket, Target } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import {
  DESTINATION_OPTIONS,
  MATURITY_OPTIONS,
  recommendBusinessCreditPackage,
  type BusinessDestination,
  type BusinessMaturity,
} from '../../config/businessCreditQuoteEngine';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowTile,
} from '../../features/os/finelyOsLightUi';

const STORE_KEY = 'finely.bc.destination.v1';

type CockpitState = {
  maturity: BusinessMaturity;
  destination: BusinessDestination;
  namedCards: string[];
  draftCard: string;
};

function load(partnerId: string): CockpitState {
  try {
    const raw = localStorage.getItem(`${STORE_KEY}:${partnerId}`);
    if (raw) return JSON.parse(raw) as CockpitState;
  } catch {
    /* ignore */
  }
  return { maturity: 'startup', destination: 'G2_fundability', namedCards: [], draftCard: '' };
}

function save(partnerId: string, state: CockpitState) {
  try {
    localStorage.setItem(`${STORE_KEY}:${partnerId}`, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

const DEST_ICON = {
  G1_vendor: Target,
  G2_fundability: Rocket,
  G3_named_cards: CreditCard,
  G4_scale: MapPin,
} as const;

export function BusinessCreditDestinationCockpit({ partner }: { partner: Partner }) {
  const [state, setState] = useState(() => load(partner.id));

  useEffect(() => {
    setState(load(partner.id));
  }, [partner.id]);

  useEffect(() => {
    save(partner.id, state);
  }, [partner.id, state]);

  const destMeta = useMemo(
    () => DESTINATION_OPTIONS.find((d) => d.id === state.destination),
    [state.destination],
  );
  const quote = useMemo(
    () =>
      recommendBusinessCreditPackage({
        maturity: state.maturity,
        destination: state.destination,
        wantsNamedCards: state.namedCards.length > 0,
        namedProducts: state.namedCards.join(', '),
        delivery: 'HYBRID',
      }),
    [state.maturity, state.destination, state.namedCards],
  );
  const Icon = DEST_ICON[state.destination] ?? Target;

  const nextDo =
    state.destination === 'G1_vendor'
      ? 'Finish entity hygiene, then open Tier 1 reporting vendors.'
      : state.destination === 'G2_fundability'
        ? 'Deepen reporting trade stack before revolving products.'
        : state.destination === 'G3_named_cards'
          ? 'Document target cards, gather underwriting docs — process tracking only (no approval promises).'
          : 'Confirm entity structure and capital package for scale goals.';

  return (
    <section className={`${finelyOsCatalogCardCompact('amber')} space-y-3`} data-fc-accent="amber">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Destination cockpit</div>
          <h3 className={`mt-1 flex items-center gap-2 ${FINELY_OS_ENTITY_VALUE}`}>
            <Icon size={18} className="text-amber-300" /> What matters now
          </h3>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{nextDo}</p>
        </div>
        <div className="text-right">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Mode</div>
          <div className="text-sm font-semibold text-white">
            {MATURITY_OPTIONS.find((m) => m.id === state.maturity)?.label}
          </div>
          <div className="text-xs text-white/55">{destMeta?.label}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {MATURITY_OPTIONS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setState((s) => ({ ...s, maturity: m.id }))}
            className={`${finelyOsGlowTile('amber', state.maturity === m.id)} px-3 py-2 text-sm text-white`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {DESTINATION_OPTIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setState((s) => ({ ...s, destination: d.id }))}
            className={`${finelyOsGlowTile('emerald', state.destination === d.id)} px-3 py-2 text-sm text-white`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className={`${finelyOsCatalogCardCompact('sky')} !p-3 space-y-2`} data-fc-accent="sky">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Why this matches you</div>
        <p className={`text-sm font-semibold text-white`}>
          {quote.pkg.name} · {quote.totalLabel}
        </p>
        <ul className={`space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          {quote.why.map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
        <p className="text-[10px] uppercase tracking-wider text-white/45">
          Results vary · funding subject to underwriting · not legal advice
        </p>
      </div>

      <div className={`${finelyOsCatalogCardCompact('fuchsia')} !p-3`} data-fc-accent="fuchsia">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Named cards / products tracker</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Track what you asked for. Status is operational — not a guarantee of approval. Funding subject to underwriting.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={state.draftCard}
            onChange={(e) => setState((s) => ({ ...s, draftCard: e.target.value }))}
            placeholder="Add card or product…"
            className="min-w-[200px] flex-1 rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            onClick={() => {
              const name = state.draftCard.trim();
              if (!name) return;
              setState((s) => ({
                ...s,
                namedCards: Array.from(new Set([...s.namedCards, name])),
                draftCard: '',
                destination: s.destination === 'G1_vendor' || s.destination === 'G2_fundability' ? 'G3_named_cards' : s.destination,
              }));
            }}
          >
            Add
          </button>
        </div>
        {state.namedCards.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {state.namedCards.map((c) => (
              <span key={c} className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-100">
                {c}
                <button
                  type="button"
                  className="text-white/50 hover:text-white"
                  onClick={() => setState((s) => ({ ...s, namedCards: s.namedCards.filter((x) => x !== c) }))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>No named products yet — add any issuers you want tracked.</p>
        )}
        <button
          type="button"
          className={`${FINELY_OS_SECONDARY_BTN} mt-3`}
          onClick={() => setState((s) => ({ ...s, namedCards: [], draftCard: '' }))}
        >
          Clear tracker
        </button>
      </div>
    </section>
  );
}
