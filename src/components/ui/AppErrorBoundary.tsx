import React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

type Props = {
  children: React.ReactNode;
  onHome?: () => void;
};

type State = { hasError: boolean; message?: string };

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: undefined };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, message: error?.message || 'Unexpected error' };
  }

  componentDidCatch() {
    // Global error reporting is handled elsewhere (window listeners).
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full rounded-3xl border border-rose-500/25 bg-rose-500/10 backdrop-blur-xl p-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-500/25 bg-black/30 text-rose-100 text-[10px] font-black uppercase tracking-widest">
            <ShieldAlert size={14} /> Something went wrong
          </div>
          <div className="text-white font-semibold text-xl">We hit an unexpected issue.</div>
          <div className="text-white/70 text-sm">
            {this.state.message ?? 'Try refreshing the page. If it persists, our team can review monitoring logs.'}
          </div>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Refresh <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={() => (this.props.onHome ? this.props.onHome() : (window.location.href = '/'))}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
            >
              Home <Home size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

