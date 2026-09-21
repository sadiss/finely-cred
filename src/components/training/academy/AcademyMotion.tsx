import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AcademyFade({
  children,
  reduceMotion,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  reduceMotion: boolean;
  className?: string;
  delay?: number;
}) {
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function AcademyPresence({
  showKey,
  children,
  reduceMotion,
}: {
  showKey: string;
  children: React.ReactNode;
  reduceMotion: boolean;
}) {
  if (reduceMotion) return <div key={showKey}>{children}</div>;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={showKey}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.35 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function AcademyLangChip({
  active,
  children,
  onClick,
  reduceMotion,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  reduceMotion: boolean;
}) {
  const base =
    'relative px-3 py-2 text-[10px] font-black uppercase tracking-widest overflow-hidden rounded-xl transition-colors';
  if (reduceMotion) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${active ? 'bg-amber-500 text-black' : 'bg-black/30 text-white/70'}`}>
        {children}
      </button>
    );
  }
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`${base} ${active ? 'text-black' : 'text-white/70 bg-black/30'}`}
      whileTap={{ scale: 0.96 }}
      layout
    >
      {active && (
        <motion.span
          layoutId="academy-lang-bg"
          className="absolute inset-0 bg-amber-500 rounded-xl"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

export function fireAcademyConfetti(reduceMotion: boolean) {
  if (reduceMotion) return;
  const colors = ['#fbbf24', '#10b981', '#a78bfa', '#38bdf8', '#fb7185'];
  for (let i = 0; i < 48; i++) {
    const el = document.createElement('div');
    el.className = 'academy-confetti-piece';
    el.style.left = `${40 + Math.random() * 20}%`;
    el.style.top = `${30 + Math.random() * 10}%`;
    el.style.background = colors[i % colors.length];
    el.style.animationDelay = `${Math.random() * 0.3}s`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
}
