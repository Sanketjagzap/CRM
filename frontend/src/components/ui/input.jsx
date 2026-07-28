import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export function Input({ className = '', ...props }) {
  const theme = useAuthStore((state) => state.theme);
  return <input className={cn(theme === 'light' ? 'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20' : 'h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20', className)} {...props} />;
}