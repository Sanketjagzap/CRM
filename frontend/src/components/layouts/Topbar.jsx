import { Search, Bell, Menu, MoonStar, SunMedium, LogOut, Shield } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/endpoints';

export function Topbar({ onSearch }) {
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const theme = useAuthStore((state) => state.theme);
  const setTheme = useAuthStore((state) => state.setTheme);
  const navigate = useNavigate();
  const themeClass = theme === 'light' ? 'sticky top-0 z-30 border-b border-slate-200 bg-white/75 px-4 py-4 backdrop-blur-xl sm:px-6' : 'sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 px-4 py-4 backdrop-blur-xl sm:px-6';

  const logout = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      clearSession();
      toast.success('Logged out');
      navigate('/login', { replace: true });
    },
    onError: () => {
      clearSession();
      navigate('/login', { replace: true });
    },
  });

  return (
    <header className={themeClass}>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setMobileNavOpen(true)}><Menu className="h-4 w-4" /></Button>
        <div className="relative hidden flex-1 items-center lg:flex">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
          <Input placeholder="Search leads, contacts, deals, tasks" onChange={onSearch} className="pl-9" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user?.role === 'admin' ? (
            <div className="hidden items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 sm:flex">
              <Shield className="h-3.5 w-3.5" />
              Admin
            </div>
          ) : null}
          <Button variant="secondary" size="sm" className="hidden sm:inline-flex" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </Button>
          <Button variant="secondary" size="sm"><Bell className="h-4 w-4" /></Button>
          <Button variant="secondary" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}