import React, { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BetweenHorizontalEnd,
  Bold,
  Eraser,
  FilePlus2,
  Heading,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Palette,
  Pilcrow,
  Quote,
  Redo2,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';

function btn(active: boolean, disabled: boolean) {
  return (
    'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ' +
    (disabled
      ? 'opacity-60 cursor-not-allowed border-white/10 bg-white/[0.02] text-white/40'
      : active
        ? 'border-amber-500/35 bg-amber-500/15 text-amber-100 hover:bg-amber-500/20'
        : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70')
  );
}

export function RichTextEditor(args: {
  valueHtml: string;
  onChangeHtml: (html: string) => void;
  placeholder?: string;
  /** Tailwind className for editor wrapper. */
  className?: string;
  /** Tailwind className for the editable area. */
  editorClassName?: string;
  /** Disable editing. */
  disabled?: boolean;
  /** Minimum editor height in pixels. */
  minHeightPx?: number;
  /** Show formatting toolbar. */
  showToolbar?: boolean;
  /** Optional placeholder/snippet choices for insertion. */
  snippets?: Array<{ id: string; label: string; text: string }>;
}) {
  const showToolbar = args.showToolbar ?? true;
  const minHeightPx = args.minHeightPx ?? 220;
  const disabled = Boolean(args.disabled);

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [styleOpen, setStyleOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [insertOpen, setInsertOpen] = useState(false);

  const placeholder = args.placeholder || 'Write here…';

  const snippets = useMemo(
    () =>
      args.snippets?.length
        ? args.snippets
        : [
            { id: 'date', label: '[DATE]', text: '[DATE]' },
            { id: 'full_name', label: '[FULL_NAME]', text: '[FULL_NAME]' },
            { id: 'address', label: '[ADDRESS]', text: '[ADDRESS]' },
            { id: 'bureau', label: '[BUREAU]', text: '[BUREAU]' },
            { id: 'state', label: '[STATE]', text: '[STATE]' },
            { id: 'creditor', label: '[CREDITOR_NAME]', text: '[CREDITOR_NAME]' },
            { id: 'account', label: '[ACCOUNT_REF]', text: '[ACCOUNT_REF]' },
          ],
    [args.snippets],
  );

  const extensions = useMemo(
    () => [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: 'noreferrer noopener', target: '_blank' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    [placeholder],
  );

  const editor = useEditor({
    extensions,
    content: args.valueHtml || '<p></p>',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      args.onChangeHtml(editor.getHTML());
    },
  });

  // Keep editor in sync when parent updates valueHtml (e.g., template insert).
  useEffect(() => {
    if (!editor) return;
    const next = (args.valueHtml || '<p></p>').trim();
    const cur = (editor.getHTML() || '').trim();
    if (next && next !== cur) editor.commands.setContent(next, { emitUpdate: false } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.valueHtml, editor]);

  const can = (cmd: () => boolean) => Boolean(editor && cmd());

  const currentStyleLabel = useMemo(() => {
    if (!editor) return 'Style';
    if (editor.isActive('heading', { level: 1 })) return 'H1';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    return 'Body';
  }, [editor, editor?.state]);

  const setStyle = (style: 'p' | 'h1' | 'h2' | 'h3') => {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (style === 'p') chain.setParagraph().run();
    else chain.toggleHeading({ level: style === 'h1' ? 1 : style === 'h2' ? 2 : 3 }).run();
    setStyleOpen(false);
  };

  const insertText = (text: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(text).run();
  };

  const insertImageFromFile = async (file: File) => {
    if (!editor) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read image.'));
      reader.readAsDataURL(file);
    });
    if (!dataUrl.startsWith('data:image/')) throw new Error('Unsupported image file.');
    editor.chain().focus().setImage({ src: dataUrl }).run();
  };

  return (
    <div className={args.className || ''}>
      {showToolbar ? (
        <div className="sticky top-24 z-20">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl p-2">
            {/* Style */}
            <div className="relative">
              <button
                type="button"
                className={btn(false, disabled || !editor)}
                disabled={disabled || !editor}
                onClick={() => setStyleOpen((v) => !v)}
                title="Text style"
              >
                <Heading size={14} /> {currentStyleLabel}
              </button>
              {styleOpen ? (
                <div className="absolute z-20 mt-2 w-44 rounded-2xl border border-white/10 bg-[#0a0f0d] shadow-2xl overflow-hidden">
                  {[
                    { id: 'p', label: 'Body', Icon: Pilcrow },
                    { id: 'h1', label: 'Heading 1', Icon: Heading },
                    { id: 'h2', label: 'Heading 2', Icon: Heading },
                    { id: 'h3', label: 'Heading 3', Icon: Heading },
                  ].map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => setStyle(x.id as any)}
                      className="w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-white/[0.06] flex items-center gap-2"
                    >
                      <x.Icon size={14} className="text-white/50" /> {x.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className={btn(Boolean(editor?.isActive('bold')), disabled || !can(() => editor!.can().toggleBold()))}
              disabled={disabled || !can(() => editor!.can().toggleBold())}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              title="Bold"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              className={btn(Boolean(editor?.isActive('italic')), disabled || !can(() => editor!.can().toggleItalic()))}
              disabled={disabled || !can(() => editor!.can().toggleItalic())}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              className={btn(Boolean(editor?.isActive('underline')), disabled || !can(() => editor!.can().toggleUnderline()))}
              disabled={disabled || !can(() => editor!.can().toggleUnderline())}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              title="Underline"
            >
              <UnderlineIcon size={14} />
            </button>

            <div className="h-6 w-px bg-white/10 mx-1" />

            {/* Color */}
            <div className="relative">
              <button type="button" className={btn(false, disabled || !editor)} disabled={disabled || !editor} onClick={() => setColorOpen((v) => !v)} title="Text color">
                <Palette size={14} />
              </button>
              {colorOpen ? (
                <div className="absolute z-20 mt-2 w-56 rounded-2xl border border-white/10 bg-[#0a0f0d] shadow-2xl overflow-hidden p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Text color</div>
                  <div className="mt-2 grid grid-cols-6 gap-2">
                    {[
                      '#ffffff',
                      '#fbbf24',
                      '#fb7185',
                      '#a78bfa',
                      '#60a5fa',
                      '#34d399',
                      '#e5e7eb',
                      '#d1d5db',
                      '#9ca3af',
                      '#f97316',
                      '#22c55e',
                      '#06b6d4',
                    ].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          if (!editor) return;
                          editor.chain().focus().setColor(c).run();
                          setColorOpen(false);
                        }}
                        className="h-7 rounded-lg border border-white/10"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editor) return;
                      editor.chain().focus().unsetColor().run();
                      setColorOpen(false);
                    }}
                    className="mt-3 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  >
                    Reset color
                  </button>
                </div>
              ) : null}
            </div>

            {/* Highlight */}
            <div className="relative">
              <button type="button" className={btn(Boolean(editor?.isActive('highlight')), disabled || !editor)} disabled={disabled || !editor} onClick={() => setHighlightOpen((v) => !v)} title="Highlight">
                <Highlighter size={14} />
              </button>
              {highlightOpen ? (
                <div className="absolute z-20 mt-2 w-56 rounded-2xl border border-white/10 bg-[#0a0f0d] shadow-2xl overflow-hidden p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Highlight</div>
                  <div className="mt-2 grid grid-cols-6 gap-2">
                    {['#fef08a', '#fde047', '#86efac', '#93c5fd', '#c4b5fd', '#fecaca'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          if (!editor) return;
                          editor.chain().focus().toggleHighlight({ color: c }).run();
                          setHighlightOpen(false);
                        }}
                        className="h-7 rounded-lg border border-white/10"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editor) return;
                      editor.chain().focus().unsetHighlight().run();
                      setHighlightOpen(false);
                    }}
                    className="mt-3 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  >
                    Remove highlight
                  </button>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className={btn(Boolean(editor?.isActive('bulletList')), disabled || !can(() => editor!.can().toggleBulletList()))}
              disabled={disabled || !can(() => editor!.can().toggleBulletList())}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              title="Bulleted list"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              className={btn(Boolean(editor?.isActive('orderedList')), disabled || !can(() => editor!.can().toggleOrderedList()))}
              disabled={disabled || !can(() => editor!.can().toggleOrderedList())}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              title="Numbered list"
            >
              <ListOrdered size={14} />
            </button>
            <button
              type="button"
              className={btn(Boolean(editor?.isActive('blockquote')), disabled || !can(() => editor!.can().toggleBlockquote()))}
              disabled={disabled || !can(() => editor!.can().toggleBlockquote())}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              title="Quote"
            >
              <Quote size={14} />
            </button>

            <button type="button" className={btn(false, disabled || !editor)} disabled={disabled || !editor} onClick={() => editor?.chain().focus().setTextAlign('left').run()} title="Align left">
              <AlignLeft size={14} />
            </button>
            <button type="button" className={btn(false, disabled || !editor)} disabled={disabled || !editor} onClick={() => editor?.chain().focus().setTextAlign('center').run()} title="Align center">
              <AlignCenter size={14} />
            </button>
            <button type="button" className={btn(false, disabled || !editor)} disabled={disabled || !editor} onClick={() => editor?.chain().focus().setTextAlign('right').run()} title="Align right">
              <AlignRight size={14} />
            </button>

            <div className="h-6 w-px bg-white/10 mx-1" />

            <button
              type="button"
              className={btn(Boolean(editor?.isActive('subscript')), disabled || !editor)}
              disabled={disabled || !editor}
              onClick={() => editor?.chain().focus().toggleSubscript().run()}
              title="Subscript"
            >
              <SubscriptIcon size={14} />
            </button>
            <button
              type="button"
              className={btn(Boolean(editor?.isActive('superscript')), disabled || !editor)}
              disabled={disabled || !editor}
              onClick={() => editor?.chain().focus().toggleSuperscript().run()}
              title="Superscript"
            >
              <SuperscriptIcon size={14} />
            </button>

            <button type="button" className={btn(Boolean(editor?.isActive('table')), disabled || !editor)} disabled={disabled || !editor} onClick={() => editor?.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()} title="Insert table">
              <TableIcon size={14} />
            </button>

            <label className={btn(false, disabled || !editor) + ' cursor-pointer'} title="Insert image">
              <ImageIcon size={14} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={disabled || !editor}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void insertImageFromFile(f);
                  e.currentTarget.value = '';
                }}
              />
            </label>

            <button
              type="button"
              className={btn(Boolean(editor?.isActive('link')), disabled || !editor)}
              disabled={disabled || !editor}
              onClick={() => {
                if (!editor) return;
                const prev = editor.getAttributes('link')?.href || '';
                setLinkValue(String(prev || ''));
                setLinkOpen(true);
              }}
              title="Set link"
            >
              <Link2 size={14} />
            </button>

            <button type="button" className={btn(false, disabled || !can(() => editor!.can().undo()))} disabled={disabled || !can(() => editor!.can().undo())} onClick={() => editor?.chain().focus().undo().run()} title="Undo">
              <Undo2 size={14} />
            </button>
            <button type="button" className={btn(false, disabled || !can(() => editor!.can().redo()))} disabled={disabled || !can(() => editor!.can().redo())} onClick={() => editor?.chain().focus().redo().run()} title="Redo">
              <Redo2 size={14} />
            </button>

            <button
              type="button"
              className={btn(false, disabled || !editor)}
              disabled={disabled || !editor}
              onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
              title="Clear formatting"
            >
              <Eraser size={14} />
            </button>

            {/* HR */}
            <button type="button" className={btn(false, disabled || !editor)} disabled={disabled || !editor} onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
              <BetweenHorizontalEnd size={14} />
            </button>

            {/* Insert snippets */}
            <div className="relative">
              <button type="button" className={btn(false, disabled || !editor)} disabled={disabled || !editor} onClick={() => setInsertOpen((v) => !v)} title="Insert placeholder">
                <FilePlus2 size={14} /> Insert
              </button>
              {insertOpen ? (
                <div className="absolute z-20 mt-2 w-64 rounded-2xl border border-white/10 bg-[#0a0f0d] shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 text-[10px] uppercase tracking-widest text-white/40 border-b border-white/10">Placeholders</div>
                  <div className="max-h-64 overflow-y-auto">
                    {snippets.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          insertText(s.text);
                          setInsertOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-white/[0.06]"
                        title={s.text}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {linkOpen ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Link</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 min-w-[220px] bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors text-sm"
            />
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
              onClick={() => {
                if (!editor) return;
                const href = linkValue.trim();
                if (!href) {
                  editor.chain().focus().unsetLink().run();
                  setLinkOpen(false);
                  return;
                }
                editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
                setLinkOpen(false);
              }}
            >
              Apply
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              onClick={() => setLinkOpen(false)}
            >
              Cancel
            </button>
          </div>
          <div className="mt-2 text-[11px] text-white/40">Leave blank and click Apply to remove a link.</div>
        </div>
      ) : null}

      <div
        className={
          args.editorClassName ||
          'mt-3 rounded-2xl border border-white/10 bg-black/40 focus-within:border-amber-500 transition-colors'
        }
      >
        <div
          className="fc-tiptap px-4 py-3"
          style={{
            minHeight: `${minHeightPx}px`,
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

