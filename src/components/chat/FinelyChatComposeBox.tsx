import React, { useRef, useState } from 'react';
import { Paperclip, Send, Smile, UploadCloud, X } from 'lucide-react';
import { FinelyPremiumEmojiPicker } from './FinelyPremiumEmojiPicker';
import { CHAT_ATTACHMENT_ACCEPT } from '../../lib/chatAttachments';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_LABEL, FINELY_OS_PRIMARY_BTN } from '../../features/os/finelyOsLightUi';

export type FinelyChatComposeAttachment = {
  id: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  rows?: number;
  busy?: boolean;
  disabled?: boolean;
  submitLabel?: string;
  attachments?: FinelyChatComposeAttachment[];
  selectedAttachmentIds?: string[];
  onToggleAttachment?: (id: string) => void;
  onUploadFile?: (file: File) => void | Promise<void>;
  uploadBusy?: boolean;
  uploadError?: string | null;
  compact?: boolean;
  label?: string;
};

export function FinelyChatComposeBox({
  value,
  onChange,
  onSubmit,
  placeholder = 'Write your message…',
  rows = 4,
  busy = false,
  disabled = false,
  submitLabel = 'Send',
  attachments = [],
  selectedAttachmentIds = [],
  onToggleAttachment,
  onUploadFile,
  uploadBusy = false,
  uploadError = null,
  compact = false,
  label = 'Your message',
}: Props) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(`${value}${text}`);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    onChange(`${value.slice(0, start)}${text}${value.slice(end)}`);
  };

  /** Text or vault evidence is enough — attachment-only sends must stay available. */
  const canSend = Boolean(value.trim() || selectedAttachmentIds.length);
  const selectedVaultItems = attachments.filter((item) => selectedAttachmentIds.includes(item.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || disabled || busy || uploadBusy) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-2xl border-2 border-fuchsia-500/35 bg-[#0b1210] shadow-[0_18px_50px_-30px_rgba(217,70,239,0.45)] overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-amber-500/20 bg-gradient-to-r from-fuchsia-500/12 via-[#101815] to-emerald-500/10">
          <span className={FINELY_OS_ENTITY_LABEL}>{label}</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-200/80">
            {value.trim().length} chars
            {selectedAttachmentIds.length ? ` · ${selectedAttachmentIds.length} attached` : ''}
          </span>
        </div>

        <div className="p-3">
          <div className="rounded-xl border-2 border-amber-400/25 bg-[#151d19] shadow-inner">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={compact ? 3 : rows}
              className="w-full bg-transparent border-0 outline-none px-4 py-3 text-white text-sm leading-relaxed resize-none placeholder:text-white/35 min-h-[112px]"
            />
          </div>
        </div>

        {attachments.length > 0 && onToggleAttachment ? (
          <div className="px-3 pb-3 space-y-2">
            <div className="rounded-xl border border-sky-500/25 bg-sky-500/8 p-3 space-y-2">
              <div className={FINELY_OS_ENTITY_LABEL}>Attach from vault</div>
              <div className="flex flex-wrap gap-2">
                {attachments.map((item) => {
                  const selected = selectedAttachmentIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onToggleAttachment(item.id)}
                      className={
                        'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-medium transition-all ' +
                        (selected
                          ? 'border-sky-400/50 bg-sky-500/20 text-sky-100'
                          : 'border-white/12 bg-[#101815] text-white/65 hover:border-sky-400/30 hover:text-white')
                      }
                    >
                      <Paperclip size={11} />
                      <span className="max-w-[140px] truncate">{item.label}</span>
                      {selected ? <X size={10} /> : null}
                    </button>
                  );
                })}
              </div>
              {selectedVaultItems.length ? (
                <p className="text-[11px] text-emerald-200/90">
                  {selectedVaultItems.length} evidence file{selectedVaultItems.length === 1 ? '' : 's'} ready —{' '}
                  {value.trim() ? 'add a note if you want, then send.' : 'Send is available now (note optional).'}
                </p>
              ) : (
                <p className="text-[11px] text-white/45">Tap files to attach them to this partner message.</p>
              )}
            </div>
          </div>
        ) : null}

        <div className="px-3 pb-3">
          <div className="rounded-xl border border-white/12 bg-black/35 px-3 py-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEmojiOpen((open) => !open)}
              className={
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ' +
                (emojiOpen
                  ? 'border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-100 shadow-[0_0_0_1px_rgba(217,70,239,0.25)]'
                  : 'border-white/15 bg-white/[0.06] text-white/80 hover:border-fuchsia-400/35 hover:bg-fuchsia-500/10')
              }
            >
              <Smile size={14} /> Emoji
            </button>
            {onUploadFile ? (
              <label
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-white/[0.06] text-xs font-semibold text-white/80 hover:border-sky-400/35 hover:bg-sky-500/10 ${
                  uploadBusy ? 'opacity-60 cursor-wait' : 'cursor-pointer'
                }`}
              >
                <UploadCloud size={14} /> {uploadBusy ? 'Uploading…' : 'Upload file'}
                <input
                  type="file"
                  className="hidden"
                  accept={CHAT_ATTACHMENT_ACCEPT}
                  disabled={uploadBusy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onUploadFile(file);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
            ) : null}
            {selectedAttachmentIds.length ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-400/40 bg-emerald-500/12 text-xs font-semibold text-emerald-50">
                <Paperclip size={13} /> {selectedAttachmentIds.length} attached
              </span>
            ) : null}
            <button
              type="submit"
              disabled={!canSend || disabled || busy || uploadBusy}
              className={`ml-auto ${FINELY_OS_PRIMARY_BTN} !py-2.5 !px-5 disabled:opacity-45 shadow-lg shadow-fuchsia-500/10`}
              title={
                canSend
                  ? submitLabel
                  : 'Write a message or attach evidence from the vault, then send'
              }
            >
              <Send size={14} /> {busy ? 'Sending…' : submitLabel}
            </button>
          </div>
        </div>
      </div>

      {emojiOpen ? (
        <FinelyPremiumEmojiPicker
          onPick={(emoji) => {
            insertAtCursor(emoji);
            setEmojiOpen(false);
          }}
        />
      ) : null}

      {uploadError ? (
        <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{uploadError}</div>
      ) : null}
      {!compact ? (
        <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
          Choose vault evidence above the send button — text is optional when files are attached.
        </p>
      ) : null}
    </form>
  );
}
