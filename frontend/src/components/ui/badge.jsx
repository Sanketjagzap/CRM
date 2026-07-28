import { cn } from '../../lib/utils';

export function Badge({ className = '', tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-white/8 text-slate-200 border-white/10',
    slate: 'bg-slate-500/15 text-slate-100 border-slate-400/20',
    zinc: 'bg-zinc-500/15 text-zinc-100 border-zinc-400/20',
    info: 'bg-sky-500/15 text-sky-100 border-sky-400/20',
    sky: 'bg-sky-500/15 text-sky-100 border-sky-400/20',
    blue: 'bg-blue-500/15 text-blue-100 border-blue-400/20',
    success: 'bg-emerald-500/15 text-emerald-100 border-emerald-400/20',
    emerald: 'bg-emerald-500/15 text-emerald-100 border-emerald-400/20',
    teal: 'bg-teal-500/15 text-teal-100 border-teal-400/20',
    cyan: 'bg-cyan-500/15 text-cyan-100 border-cyan-400/20',
    warning: 'bg-amber-500/15 text-amber-100 border-amber-400/20',
    amber: 'bg-amber-500/15 text-amber-100 border-amber-400/20',
    orange: 'bg-orange-500/15 text-orange-100 border-orange-400/20',
    danger: 'bg-rose-500/15 text-rose-100 border-rose-400/20',
    rose: 'bg-rose-500/15 text-rose-100 border-rose-400/20',
    pink: 'bg-pink-500/15 text-pink-100 border-pink-400/20',
    violet: 'bg-violet-500/15 text-violet-100 border-violet-400/20',
    fuchsia: 'bg-fuchsia-500/15 text-fuchsia-100 border-fuchsia-400/20',
    indigo: 'bg-indigo-500/15 text-indigo-100 border-indigo-400/20',
  };

  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]', tones[tone] || tones.neutral, className)}>{children}</span>;
}