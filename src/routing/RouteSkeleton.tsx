import React from 'react';

/** Visible immediately on route change — avoids “blank page under fixed nav” during chunk load. */
export function RouteSkeleton(props: { label?: string }) {
  return (
    <div
      className="w-full min-h-[50vh] bg-transparent px-4 sm:px-6 py-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-xl bg-white/10" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 rounded-2xl bg-white/5 border border-white/10" />
          <div className="h-24 rounded-2xl bg-white/5 border border-white/10" />
          <div className="h-24 rounded-2xl bg-white/5 border border-white/10" />
        </div>
        <div className="h-40 rounded-2xl bg-white/5 border border-white/10" />
        <div className="h-56 rounded-2xl bg-white/5 border border-white/10" />
        {props.label ? (
          <p className="text-center text-white/40 text-sm pt-2">{props.label}</p>
        ) : null}
      </div>
    </div>
  );
}
