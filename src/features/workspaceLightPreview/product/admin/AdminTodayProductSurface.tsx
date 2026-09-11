import React, { useCallback, useMemo, useState } from 'react';
import { ArrowRight, Sun, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  doOwnerTodayRow,
  loadOwnerTodayRows,
  loadOwnerTomorrowRows,
  skipOwnerTodayRow,
  type OwnerTodayRow,
} from '../../../../lib/ownerTodayDeck';
import { writeTomorrowGrowthPack } from '../../../../lib/tomorrowGrowthPack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminTodayProductSurface.css';

function TodayRowButton({
  row,
  index,
  active,
  onSelect,
}: {
  row: OwnerTodayRow;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`fc-today-row fc-today-row--${row.accent} ${active ? 'fc-today-row--active' : ''}`}
    >
      <span className={`fc-today-stamp fc-today-stamp--${row.accent}`}>{index + 1}</span>
      <span>
        <span className="fc-today-row-role">{row.role}</span>
        <span className="fc-today-row-title">{row.happened}</span>
      </span>
    </button>
  );
}

export default function AdminTodayProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const [tick, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [packBusy, setPackBusy] = useState(false);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  const rows = useMemo(() => {
    void tick;
    return loadOwnerTodayRows();
  }, [tick]);

  const tomorrowRows = useMemo(() => {
    void tick;
    return loadOwnerTomorrowRows();
  }, [tick]);

  const selected: OwnerTodayRow | null =
    rows.find((r) => r.id === selectedId) ?? tomorrowRows.find((r) => r.id === selectedId) ?? null;

  const doIt = (row: OwnerTodayRow) => {
    setBusy(true);
    void doOwnerTodayRow(row)
      .then((result) => {
        setNotice(result.notice);
        refresh();
        navigate(result.href);
      })
      .finally(() => setBusy(false));
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Command · today"
      title="Today"
      description="Review overnight activity and the drafts waiting for your approval. Staff stay in their lane."
      accent={navItem?.accent ?? 'rose'}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon ?? Sun}
      status={`${rows.length} today · ${tomorrowRows.length} tomorrow`}
      primaryAction={
        <ProductPagePrimaryAction
          label={packBusy ? 'Writing pack…' : 'Write tomorrow’s pack'}
          disabled={packBusy}
          onClick={() => {
            setPackBusy(true);
            void writeTomorrowGrowthPack()
              .then((pack) => {
                setNotice(`${pack.weekday} · ${pack.lane}: ${pack.queuedPosts} post queued for review.`);
                refresh();
              })
              .finally(() => setPackBusy(false));
          }}
        />
      }
      secondaryAction={
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/data-feeds')}>
          Data feeds
        </button>
      }
    >
      <div className="fc-today-stack">
        {notice ? <p className={`${FINELY_OS_ENTITY_BODY} mb-2`}>{notice}</p> : null}

        <section className="fc-today-room" data-fc-accent="rose" aria-label="Today">
          <p className="fc-today-room__kicker">Today</p>
          <h2 className="fc-today-room__title">Waiting for you now</h2>
          {rows.length === 0 ? (
            <div className="fc-today-empty">Nothing waiting. Write tomorrow’s pack, then come back to approve.</div>
          ) : (
            <div className="fc-today-list fc-wlp-list-chamber">
              <FinelyOsPaginatedStack
                items={rows}
                pageSize={8}
                emptyMessage="Nothing waiting."
                itemSpacingClassName="space-y-5"
                renderItem={(row, index) => (
                  <TodayRowButton
                    key={row.id}
                    row={row}
                    index={index}
                    active={selected?.id === row.id}
                    onSelect={() => setSelectedId(row.id)}
                  />
                )}
              />
            </div>
          )}
        </section>

        <section className="fc-today-room" data-fc-accent="sky" aria-label="Tomorrow">
          <p className="fc-today-room__kicker">Tomorrow</p>
          <h2 className="fc-today-room__title">The pack you already wrote</h2>
          {tomorrowRows.length === 0 ? (
            <div className="fc-today-empty">No tomorrow pack yet. Write it from the top of this page.</div>
          ) : (
            <div className="fc-today-list fc-wlp-list-chamber">
              <FinelyOsPaginatedStack
                items={tomorrowRows}
                pageSize={8}
                emptyMessage="No tomorrow pack yet."
                itemSpacingClassName="space-y-5"
                renderItem={(row, index) => (
                  <TodayRowButton
                    key={row.id}
                    row={row}
                    index={index}
                    active={selected?.id === row.id}
                    onSelect={() => setSelectedId(row.id)}
                  />
                )}
              />
            </div>
          )}
        </section>
      </div>

      {selected ? (
        <div
          className="fc-today-sheet-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Today item"
          onClick={() => setSelectedId(null)}
        >
          <div className="fc-today-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="fc-today-sheet__head">
              <div>
                <p className="fc-today-sheet__kicker">{selected.role}</p>
                <h3 className="fc-today-sheet__title">{selected.happened}</h3>
              </div>
              <button
                type="button"
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() => setSelectedId(null)}
                aria-label="Close today item"
              >
                <X size={16} /> Close
              </button>
            </div>
            <p className="fc-today-sheet__draft">{selected.drafted}</p>
            <div className="fc-today-sheet__actions">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy} onClick={() => doIt(selected)}>
                {selected.doLabel} <ArrowRight size={15} />
              </button>
              {selected.kind === 'desk' ? null : (
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => {
                    skipOwnerTodayRow(selected);
                    setNotice('Skipped.');
                    setSelectedId(null);
                    refresh();
                  }}
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </ProductHubScaffold>
  );
}
