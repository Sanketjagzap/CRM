import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { pageVariants } from '../../animations/pageVariants';

export function PageHeader({ title, description, actionLabel, onAction, children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass sm:flex-row sm:items-end sm:justify-between sm:p-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">Modern CRM</p>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {children}
        {actionLabel ? <Button onClick={onAction}>{actionLabel}</Button> : null}
      </div>
    </motion.div>
  );
}