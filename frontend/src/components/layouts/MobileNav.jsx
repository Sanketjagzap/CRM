import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { mainNavigation } from '../../constants/navigation';
import { useUiStore } from '../../store/uiStore';

export function MobileNav() {
  const open = useUiStore((state) => state.mobileNavOpen);
  const setOpen = useUiStore((state) => state.setMobileNavOpen);
  const location = useLocation();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close navigation" />
          <motion.div className="absolute bottom-0 left-0 right-0 rounded-t-[2rem] border-t border-white/10 bg-slate-950/95 p-4 shadow-glass" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ duration: 0.22 }}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Navigate CRM</p>
              <button onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-300 hover:bg-white/8"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${active ? 'border-cyan-400/30 bg-cyan-500/15 text-white' : 'border-white/10 bg-white/5 text-slate-200'}`}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}