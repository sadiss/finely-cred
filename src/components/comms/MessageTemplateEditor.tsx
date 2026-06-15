import React, { useCallback, useRef, useState } from 'react';
import { FileUp, Code, LayoutTemplate, MousePointerClick } from 'lucide-react';
import { RichTextEditor } from '../ui/RichTextEditor';
import { TEMPLATE_VARIABLE_GROUPS } from '../../comms/templateVariables';
import { renderTextTemplate } from '../../utils/textTemplate';
import { sanitizeHtmlForPreview } from '../../utils/richText';

type MessageTemplateEditorProps = {
  html: string;
  onChangeHtml: (html: string) => void;
  previewContext?: Record<string, any>;
  placeholder?: string;
  minHeightPx?: number;
};

export function MessageTemplateEditor({
  html,
  onChangeHtml,
  previewContext,
  placeholder = 'Design your message…',
  minHeightPx = 260,
}: MessageTemplateEditorProps) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const htmlRef = useRef<HTMLTextAreaElement>(null);

  const insertVar = useCallback(
    (key: string) => {
      const token = `{{${key}}}`;
      if (mode === 'html' && htmlRef.current) {
        const el = htmlRef.current;
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? start;
        const next = el.value.slice(0, start) + token + el.value.slice(end);
        onChangeHtml(next);
        requestAnimationFrame(() => {
          el.focus();
          const pos = start + token.length;
          el.setSelectionRange(pos, pos);
        });
        return;
      }
      onChangeHtml((html || '<p></p>') + `<p>${token}</p>`);
    },
    [html, mode, onChangeHtml],
  );

  const onFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChangeHtml(String(reader.result || ''));
    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type.includes('html') || file.name.endsWith('.html') || file.name.endsWith('.htm')) {
      onFile(file);
    }
  };

  const previewHtml = previewContext ? renderTextTemplate(html || '', previewContext) : html;

  const snippetVars = TEMPLATE_VARIABLE_GROUPS.flatMap((g) =>
    g.vars.slice(0, 6).map((v) => ({ id: v.key, label: v.label, text: `{{${v.key}}}` })),
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-2xl border border-dashed p-4 transition-colors ${
          dragOver ? 'border-fuchsia-400/60 bg-fuchsia-500/10' : 'border-white/15 bg-white/[0.05]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white/55 text-sm">
            <FileUp size={16} className="text-fuchsia-300" />
            Drag & drop an <span className="font-mono text-white/70">.html</span> template here, or upload
          </div>
          <input ref={fileRef} type="file" accept=".html,.htm,text/html" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.08] text-[10px] font-black uppercase tracking-widest text-white/70"
          >
            Upload HTML
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setMode('visual')} className={tabBtn(mode === 'visual')}>
          <LayoutTemplate size={14} /> Visual editor
        </button>
        <button type="button" onClick={() => setMode('html')} className={tabBtn(mode === 'html')}>
          <Code size={14} /> HTML source
        </button>
      </div>

      <div className="fc-light-glass-panel fc-light-chrome-panel p-4 space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/45">
          <MousePointerClick size={14} className="text-fuchsia-300" />
          Click to insert merge tags
        </div>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {TEMPLATE_VARIABLE_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-[10px] uppercase tracking-widest text-white/35 mb-1.5">{group.label}</div>
              <div className="flex flex-wrap gap-1.5">
                {group.vars.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVar(v.key)}
                    className="px-2.5 py-1 rounded-lg fc-light-glass-panel fc-light-chrome-panel border hover:bg-fuchsia-500/10 hover:border-fuchsia-500/30 text-[10px] font-mono text-white/65 transition-all"
                    title={v.example ? `Example: ${v.example}` : v.key}
                  >
                    {`{{${v.key}}}`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {mode === 'visual' ? (
        <RichTextEditor
          valueHtml={html || '<p></p>'}
          onChangeHtml={onChangeHtml}
          placeholder={placeholder}
          minHeightPx={minHeightPx}
          snippets={snippetVars}
        />
      ) : (
        <textarea
          ref={htmlRef}
          value={html}
          onChange={(e) => onChangeHtml(e.target.value)}
          rows={14}
          className="w-full px-4 py-3 rounded-xl bg-fc-input border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-violet-500/50 resize-y"
          spellCheck={false}
        />
      )}

      <div className="fc-light-glass-panel fc-light-chrome-panel p-4 space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Live preview</div>
        <div
          className="prose prose-invert max-w-none text-sm welcome-html-preview"
          dangerouslySetInnerHTML={{ __html: sanitizeHtmlForPreview(previewHtml || '<p class="text-white/40">Nothing to preview yet.</p>') }}
        />
      </div>
    </div>
  );
}
function tabBtn(active: boolean) {
  return `inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active
      ? 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-100'
      : 'border-white/[0.08] bg-white/[0.03] text-white/60 hover:bg-white/[0.06]'
  }`;
}

