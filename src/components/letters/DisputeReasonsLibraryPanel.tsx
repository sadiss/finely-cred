import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, BookmarkPlus, Search, Trash2, X } from 'lucide-react';
import { DISPUTE_REASONS_LIBRARY, getFactualDisputeReasonsLibrary } from '../../creditReports/disputeReasons';
import { deletePartnerReason, listSavedReasonsByPartner, savePartnerReason } from '../../data/partnerReasonPacksRepo';
import { ReasonsCommandHub } from '../../features/reasons/ReasonsCommandHub';

type Props = {
  open?: boolean;
  inline?: boolean;
  commandHub?: boolean;
  onClose?: () => void;
  onApplyReason: (text: string) => void;
  focusLabel?: string;
  partnerId?: string;
};

export function DisputeReasonsLibraryPanel({
  open = true,
  inline = false,
  commandHub = false,
  onClose,
  onApplyReason,
  focusLabel,
  partnerId,
}: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [tab, setTab] = useState<'library' | 'saved'>('library');
  const [saveText, setSaveText] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const savedReasons = useMemo(
    () => (partnerId ? listSavedReasonsByPartner(partnerId) : []),
    [partnerId, version],
  );

  const factualLibrary = useMemo(() => getFactualDisputeReasonsLibrary(), []);

  const categories = useMemo(
    () => [{ key: 'all', label: 'All categories' }, ...Object.entries(factualLibrary).map(([key, v]) => ({ key, label: v.label }))],
    [factualLibrary],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const entries: { categoryKey: string; categoryLabel: string; text: string; index: number }[] = [];
    for (const [key, { label, reasons }] of Object.entries(factualLibrary)) {
      if (category !== 'all' && category !== key) continue;
      reasons.forEach((text, index) => {
        if (q && !text.toLowerCase().includes(q) && !label.toLowerCase().includes(q)) return;
        entries.push({ categoryKey: key, categoryLabel: label, text, index });
      });
    }
    return entries;
  }, [query, category, factualLibrary]);

  const filteredSaved = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return savedReasons;
    return savedReasons.filter((r) => r.text.toLowerCase().includes(q) || (r.category ?? '').toLowerCase().includes(q));
  }, [query, savedReasons]);

  if (!inline && !open) return null;

  if (!inline && commandHub) {
    return (
      <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Close reasons OS" />
        <div className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/[0.08] bg-[#0a0a0f] shadow-2xl p-4 sm:p-6">
          <div className="flex justify-end mb-2">
            <button type="button" onClick={onClose} className="p-2 rounded-xl border border-white/[0.08] text-white/60 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <ReasonsCommandHub partnerId={partnerId} focusLabel={focusLabel} onApplyReason={onApplyReason} />
        </div>
      </div>
    );
  }

  const body = (
    <>
      <div className={`flex items-start justify-between gap-4 ${inline ? 'pb-4 border-b border-white/[0.08]' : 'p-5 border-b border-white/[0.08]'}`}>
        <div>
          <div className="inline-flex items-center gap-2 text-amber-400">
            <BookOpen size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Reasons library</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-white">Browse, save & apply dispute reasons</h3>
          <p className="mt-1 text-sm text-white/55 max-w-xl">
            {inline
              ? 'Your saved reasons and the built-in reference library live here. Auto-generated dispute reasons elsewhere are factual findings from the report — this library is for manual copy/paste only.'
              : `Click to add to ${focusLabel ? `"${focusLabel}"` : 'the active dispute item'}. Snippets here may use letter-style language; auto-pick uses factual report findings only.`}
          </p>
          <p className="mt-2 text-xs text-amber-200/80 max-w-xl rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
            Reference library — not used for auto-reasons. Prefer auto-picked factual findings (what is reporting on the file) over procedural “please verify/delete” snippets.
          </p>
        </div>
        {!inline && onClose ? (
          <button type="button" onClick={onClose} className="p-2 rounded-xl border border-white/[0.08] text-white/60 hover:text-white">
            <X size={18} />
          </button>
        ) : null}
      </div>

        <div className="px-5 pt-4 flex gap-2">
          {(['library', 'saved'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
                tab === t ? 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-100' : 'border-white/[0.08] bg-white/5 text-white/55'
              }`}
            >
              {t === 'library' ? `Built-in (${filtered.length})` : `My saved (${savedReasons.length})`}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-3 border-b border-white/[0.08]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reasons…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.08] bg-fc-input text-white text-sm outline-none focus:border-fuchsia-500/40"
            />
          </div>
          {tab === 'library' ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
                    category === c.key ? 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-100' : 'border-white/[0.08] bg-white/5 text-white/55'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : partnerId ? (
            <div className="flex flex-wrap gap-2">
              <input
                value={saveText}
                onChange={(e) => setSaveText(e.target.value)}
                placeholder="Save a custom reason snippet for reuse…"
                className="flex-1 min-w-[200px] rounded-xl border border-white/[0.08] bg-fc-input px-4 py-2 text-sm text-white outline-none focus:border-fuchsia-500/40"
              />
              <button
                type="button"
                disabled={!saveText.trim()}
                onClick={() => {
                  savePartnerReason({ partnerId, text: saveText.trim(), category: category !== 'all' ? category : undefined });
                  setSaveText('');
                  setVersion((v) => v + 1);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest text-emerald-200 disabled:opacity-40"
              >
                <BookmarkPlus size={14} /> Save
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {tab === 'library' ? (
            filtered.length === 0 ? (
              <p className="text-white/45 text-sm">No reasons match your search.</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={`${item.categoryKey}-${item.index}`}
                  type="button"
                  onClick={() => onApplyReason(item.text)}
                  className="w-full text-left fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-fuchsia-500/10 hover:border-fuchsia-500/25 p-4 transition-colors"
                >
                  <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">{item.categoryLabel}</div>
                  <p className="text-sm text-white/80 leading-relaxed">{item.text}</p>
                </button>
              ))
            )
          ) : filteredSaved.length === 0 ? (
            <p className="text-white/45 text-sm">No saved reasons yet. Type one above and click Save, or save from a letter draft.</p>
          ) : (
            filteredSaved.map((item) => (
              <div key={item.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3">
                <button type="button" onClick={() => onApplyReason(item.text)} className="flex-1 text-left min-w-0">
                  {item.category ? (
                    <div className="text-[10px] uppercase tracking-widest text-emerald-300/70 mb-2">{item.category}</div>
                  ) : null}
                  <p className="text-sm text-white/80 leading-relaxed">{item.text}</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deletePartnerReason(item.id);
                    setVersion((v) => v + 1);
                  }}
                  className="p-2 rounded-lg border border-white/[0.08] text-white/40 hover:text-red-300 shrink-0"
                  title="Delete saved reason"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
    </>
  );

  if (inline) {
    return (
      <div className="fc-light-glass-panel fc-light-chrome-panel flex flex-col min-h-[520px] overflow-hidden">
        <div className="p-5 flex-1 flex flex-col min-h-0">{body}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Close reasons library" />
      <div className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-t-3xl sm:rounded-3xl border border-white/[0.08] bg-[#0a0a0f] shadow-2xl flex flex-col">
        {body}
      </div>
    </div>
  );
}
