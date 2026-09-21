import React from 'react';
import { RefreshCw } from 'lucide-react';

type Props = { children: React.ReactNode; onRetry?: () => void };

type State = { hasError: boolean; message?: string };

export class RouteChunkErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const message =
      (error as any)?.message ||
      'This section failed to load. This often happens right after a site update.';
    return { hasError: true, message };
  }

  private retry = () => {
    this.setState({ hasError: false, message: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="w-full min-h-[calc(100dvh-5rem)] bg-[#0d1512] px-6 py-12 flex items-start justify-center">
        <div className="max-w-md w-full rounded-2xl border border-amber-500/25 bg-black/40 p-8 space-y-4 text-center">
          <div className="text-white font-semibold text-lg">Couldn’t load this page</div>
          <p className="text-white/60 text-sm">{this.state.message}</p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={this.retry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:brightness-110"
            >
              <RefreshCw size={16} /> Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 text-white/80 text-sm hover:bg-white/5"
            >
              Refresh site
            </button>
          </div>
        </div>
      </div>
    );
  }
}
