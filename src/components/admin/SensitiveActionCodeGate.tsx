import React, { useState } from 'react';
import { AlertTriangle, Lock, X } from 'lucide-react';
import type { SensitiveActionKey } from '../../lib/sensitiveActionGuard';
import { hasSensitiveActionCode, sensitiveActionLabel, verifySensitiveActionCode } from '../../lib/sensitiveActionGuard';

type Props = {
  open: boolean;
  action: SensitiveActionKey;
  title: string;
  description: string;
  onClose: () => void;
  onVerified: () => void;
};

export function SensitiveActionCodeGate({ open, action, title, description, onClose, onVerified }: Props) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const codeConfigured = hasSensitiveActionCode(action);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!codeConfigured) {
      setErr('No security code configured. Set one in Admin → Access Center → Sensitive action codes.');
      return;
    }
    if (!verifySensitiveActionCode(action, code)) {
      setErr('Incorrect security code.');
      return;
    }
    setCode('');
    onVerified();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-rose-400/25 bg-[#0b1220] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-300">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{title}</h3>
              <p className="mt-1 text-sm text-white/60">{description}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-white/50">
            {sensitiveActionLabel(action)}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} />
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter authorization code"
              className="h-12 w-full rounded-xl border border-white/12 bg-black/40 pl-10 pr-4 text-sm text-white outline-none focus:border-rose-400/40"
              autoComplete="off"
            />
          </div>
          {!codeConfigured ? (
            <p className="text-xs text-amber-300">Configure this code in Admin → Access Center before proceeding.</p>
          ) : null}
          {err ? <p className="text-sm text-rose-300">{err}</p> : null}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/12 px-4 py-3 text-sm font-bold text-white/70">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!code.trim()}
              className="flex-1 rounded-xl border border-rose-400/40 bg-rose-500/20 px-4 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
            >
              Authorize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
