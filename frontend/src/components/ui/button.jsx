import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export function Button({ className = '', variant = 'primary', size = 'md', as: Component = 'button', ...props }) {
  const theme = useAuthStore((state) => state.theme);
  const variants = {
    primary: 'bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 text-white shadow-lg shadow-sky-500/20 hover:brightness-110',
    secondary: theme === 'light' ? 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50' : 'bg-white/8 text-slate-100 border border-white/10 hover:bg-white/12',
    ghost: 'bg-transparent text-slate-100 hover:bg-white/8',
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
  };

  return <Component className={cn('inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 disabled:cursor-not-allowed disabled:opacity-60', variants[variant], sizes[size], className)} {...props} />;
}