import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardBody } from '../ui/card';
import { formatCompactNumber } from '../../lib/utils';

export function StatCard({ label, value, delta, icon: Icon, tone = 'sky' }) {
  const toneMap = {
    sky: 'from-sky-500/25 via-cyan-500/20 to-transparent text-sky-200',
    violet: 'from-violet-500/25 via-fuchsia-500/20 to-transparent text-violet-200',
    emerald: 'from-emerald-500/25 via-teal-500/20 to-transparent text-emerald-200',
    amber: 'from-amber-500/25 via-orange-500/20 to-transparent text-amber-200',
  };

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.18 }}>
      <Card className="h-full overflow-hidden">
        <CardBody className="relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${toneMap[tone]}`} />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{typeof value === 'number' ? formatCompactNumber(value) : value}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white">
              {Icon ? <Icon className="h-5 w-5" /> : null}
            </div>
          </div>
          <div className="relative mt-6 flex items-center gap-2 text-sm text-emerald-300">
            <ArrowUpRight className="h-4 w-4" />
            <span>{delta}</span>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}