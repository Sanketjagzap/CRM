import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export function Card({ className = '', children }) {
  const theme = useAuthStore((state) => state.theme);
  return <div className={cn(theme === 'light' ? 'glass-light border-slate-200/80' : 'glass border-white/10 shadow-glass', 'rounded-3xl', className)}>{children}</div>;
}

export function CardBody({ className = '', children }) {
  return <div className={cn('p-5 sm:p-6', className)}>{children}</div>;
}