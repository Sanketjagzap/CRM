import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ChevronDown } from 'lucide-react';
import { mainNavigation, utilityNavigation } from '../../constants/navigation';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

function flatNav(items) {
  const result = [];
  items.forEach((i) => {
    if (i.children) {
      i.children.forEach((c) => result.push({ ...c, group: i.label }));
    } else {
      result.push(i);
    }
  });
  return result;
}

export function Sidebar() {
  const location = useLocation();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const setCollapsed = useUiStore((state) => state.setSidebarCollapsed);
  const user = useAuthStore((state) => state.user);
  const theme = useAuthStore((state) => state.theme);
  const [openGroups, setOpenGroups] = useState(() => ({ CRM: true, Finance: true, Activities: true }));
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const filtered = (items) =>
    items
      .map((it) =>
        it.children
          ? { ...it, children: it.children.filter((c) => isAdmin || !c.adminOnly) }
          : it
      )
      .filter((it) => (it.children ? it.children.length > 0 : (isAdmin || !it.adminOnly)));

  const visibleMain = filtered(mainNavigation);
  const visibleUtil = filtered(utilityNavigation);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const groupIsActive = (group) => group.children?.some((c) => isActive(c.path));

  const toggleGroup = (label) =>
    setOpenGroups((s) => ({ ...s, [label]: !s[label] }));

  const rowClass = (active) =>
    cn(
      'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition',
      active
        ? 'bg-gradient-to-r from-sky-500/20 to-cyan-500/10 text-white ring-1 ring-cyan-400/25'
        : 'text-slate-300 hover:bg-white/6 hover:text-white'
    );

  const renderItem = (item) => {
    const active = isActive(item.path);
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        className={cn(rowClass(active), collapsed ? 'justify-center' : '')}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed ? <span className="truncate">{item.label}</span> : null}
      </Link>
    );
  };

  const renderSection = (section) => {
    if (section.children) {
      const active = groupIsActive(section);
      const open = openGroups[section.label] ?? true;
      return (
        <div key={section.label} className="space-y-1">
          {!collapsed ? (
            <button
              onClick={() => toggleGroup(section.label)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition',
                active ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span>{section.label}</span>
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform', open ? '' : '-rotate-90')}
              />
            </button>
          ) : (
            <div className="h-2" />
          )}
          <AnimatePresence initial={false}>
            {(open || collapsed) && (
              <motion.div
                key={section.label + (collapsed ? 'c' : 'o')}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden space-y-1"
              >
                {section.children.map(renderItem)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
    return renderItem(section);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 92 : 292 }}
      transition={{ duration: 0.22 }}
      className={theme === 'light'
        ? 'hidden min-h-screen flex-col border-r border-slate-200 bg-white/75 px-3 py-5 backdrop-blur-xl lg:flex'
        : 'hidden min-h-screen flex-col border-r border-white/10 bg-slate-950/70 px-3 py-5 backdrop-blur-xl lg:flex'}
    >
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-indigo-500 text-white shadow-lg shadow-sky-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          {!collapsed ? (
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Modern</p>
              <h2 className="text-lg font-semibold text-white">CRM</h2>
            </div>
          ) : null}
        </div>
        <button
          className={theme === 'light'
            ? 'rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50'
            : 'rounded-xl border border-white/10 bg-white/6 p-2 text-slate-200 hover:bg-white/10'}
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Collapse sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="mt-7 flex-1 space-y-2 overflow-y-auto no-scrollbar px-1">
        {visibleMain.map(renderSection)}
        <div className="my-4 border-t border-white/8" />
        {visibleUtil.map(renderSection)}
      </nav>

      <div
        className={theme === 'light'
          ? 'mt-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-cyan-500/10 to-indigo-500/5 p-4'
          : 'mt-4 rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/15 to-indigo-500/10 p-4'}
      >
        {!collapsed ? (
          <p className="text-sm text-slate-200">
            Realtime signals, pipeline tracking, and high-velocity operations.
          </p>
        ) : null}
      </div>
    </motion.aside>
  );
}
