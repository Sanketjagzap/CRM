import { motion } from 'framer-motion';
import {
  UsersRound,
  UserRound,
  Building2,
  BriefcaseBusiness,
  Trophy,
  Frown,
  TrendingUp,
  Target,
  Wallet,
  AlertCircle,
  CheckSquare,
  Clock,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';

const formatCurrency = (n = 0, symbol = '₹') => {
  if (n >= 1e7) return `${symbol}${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `${symbol}${(n / 1e5).toFixed(2)} L`;
  return `${symbol}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

export function DashboardWidgets({ counters = {} }) {
  const widgets = [
    {
      label: 'Total Leads',
      value: counters.leadsCount || 0,
      icon: UsersRound,
      tone: 'sky',
    },
    {
      label: 'Total Contacts',
      value: counters.contactsCount || 0,
      icon: UserRound,
      tone: 'blue',
    },
    {
      label: 'Companies',
      value: counters.companiesCount || 0,
      icon: Building2,
      tone: 'indigo',
    },
    {
      label: 'Active Deals',
      value: counters.activeDeals || 0,
      icon: BriefcaseBusiness,
      tone: 'violet',
    },
    {
      label: 'Won Deals',
      value: counters.wonDeals || 0,
      icon: Trophy,
      tone: 'emerald',
    },
    {
      label: 'Lost Deals',
      value: counters.lostDeals || 0,
      icon: Frown,
      tone: 'rose',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(counters.totalRevenue),
      sub: `Avg ${formatCurrency(counters.avgDealRevenue)}`,
      icon: TrendingUp,
      tone: 'teal',
    },
    {
      label: 'Expected Revenue',
      value: formatCurrency(counters.expectedRevenue),
      icon: Target,
      tone: 'cyan',
    },
    {
      label: 'Pending Payments',
      value: counters.pendingPaymentsCount || 0,
      sub: formatCurrency(counters.pendingPaymentsAmount) + ' outstanding',
      icon: Wallet,
      tone: 'amber',
    },
    {
      label: 'Pending Tasks',
      value: counters.pendingTasks || 0,
      icon: CheckSquare,
      tone: 'sky',
    },
    {
      label: 'Overdue Tasks',
      value: counters.overdueTasks || 0,
      icon: AlertCircle,
      tone: 'rose',
    },
  ];

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.06 }}
    >
      {widgets.map((w) => (
        <StatCard
          key={w.label}
          label={w.label}
          value={w.value}
          delta={w.sub || ''}
          icon={w.icon}
          tone={w.tone}
        />
      ))}
    </motion.div>
  );
}

export { formatCurrency };
