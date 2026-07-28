import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  Target,
  Calendar,
  DollarSign,
  Percent,
  Receipt,
  AlertCircle,
  CheckCircle2,
  UsersRound,
  Building2,
  Package,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/ui/card';
import { StatCard } from '../../components/common/StatCard';
import { Skeleton } from '../../components/common/Skeleton';
import { api } from '../../api/endpoints';
import { formatCurrency } from '../../components/dashboard/DashboardWidgets';
import { cn } from '../../lib/utils';
import { formatDate } from '../../lib/utils';

const PIE_COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22d3ee', '#818cf8', '#f97316'];

function KpiRow({ summary }) {
  const items = [
    { label: 'Total Revenue', value: formatCurrency(summary.totalRevenue), icon: Wallet, tone: 'emerald' },
    { label: 'Won Deal Value', value: formatCurrency(summary.wonDealRevenue), icon: TrendingUp, tone: 'teal' },
    { label: 'Expected Revenue', value: formatCurrency(summary.expectedRevenue), icon: Target, tone: 'cyan' },
    { label: 'Pipeline Value', value: formatCurrency(summary.pipelineValue), icon: DollarSign, tone: 'violet' },
    { label: 'Monthly Revenue', value: formatCurrency(summary.monthlyRevenue), sub: `Growth ${summary.monthlyGrowth}%`, icon: Calendar, tone: 'sky' },
    { label: 'Yearly Revenue', value: formatCurrency(summary.yearlyRevenue), sub: `Growth ${summary.yearlyGrowth}%`, icon: TrendingUp, tone: 'indigo' },
    { label: 'Paid Amount', value: formatCurrency(summary.paidAmount), icon: CheckCircle2, tone: 'emerald' },
    { label: 'Outstanding', value: formatCurrency(summary.outstandingAmount), icon: AlertCircle, tone: 'rose' },
    { label: 'Pending Payments', value: summary.pendingCount || 0, sub: formatCurrency(summary.pendingAmount), icon: Receipt, tone: 'amber' },
    { label: 'Total Discount', value: formatCurrency(summary.totalDiscount), icon: Percent, tone: 'slate' },
    { label: 'Total Tax', value: formatCurrency(summary.totalTax), icon: Receipt, tone: 'orange' },
    { label: 'Net Revenue', value: formatCurrency(summary.netRevenue), icon: Wallet, tone: 'cyan' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((it) => (
        <StatCard key={it.label} label={it.label} value={it.value} delta={it.sub || ''} icon={it.icon} tone={it.tone} />
      ))}
    </div>
  );
}

export default function Revenue() {
  const [range, setRange] = useState('12m');
  const months = range === '6m' ? 6 : range === '3m' ? 3 : range === 'all' ? 24 : 12;

  const summaryQuery = useQuery({
    queryKey: ['financeSummary', range],
    queryFn: async () => (await api.settings.financeSummary()).data.data,
  });
  const monthlyQuery = useQuery({
    queryKey: ['monthlyRevenue', months],
    queryFn: async () => (await api.settings.monthlyRevenue({ months })).data.data,
  });
  const byUserQuery = useQuery({
    queryKey: ['revenueByUser'],
    queryFn: async () => (await api.settings.revenueByUser()).data.data,
  });
  const byCompanyQuery = useQuery({
    queryKey: ['revenueByCompany'],
    queryFn: async () => (await api.settings.revenueByCompany()).data.data,
  });
  const byProductQuery = useQuery({
    queryKey: ['revenueByProduct'],
    queryFn: async () => (await api.settings.revenueByProduct()).data.data,
  });

  const summary = summaryQuery.data?.summary || {};
  const monthly = monthlyQuery.data || [];
  const byUser = byUserQuery.data || [];
  const byCompany = byCompanyQuery.data || [];
  const byProduct = byProductQuery.data || [];

  const combinedMonthly = useMemo(() => {
    return monthly.map((m) => ({
      ...m,
      expected: m.expectedRevenue || 0,
    }));
  }, [monthly]);

  const userPie = useMemo(() => byUser.slice(0, 8).map((u, i) => ({ name: u.name || 'Unknown', value: u.totalRevenue || 0, color: PIE_COLORS[i % PIE_COLORS.length] })), [byUser]);
  const productPie = useMemo(() => byProduct.slice(0, 8).map((p, i) => ({ name: p.name, value: p.totalRevenue || 0, color: PIE_COLORS[i % PIE_COLORS.length] })), [byProduct]);

  const loading = summaryQuery.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="Revenue & Finance" description="Comprehensive view of your revenue, expected deals, payments, outstanding amounts, and growth metrics." actionLabel="Record Payment" />

      <div className="flex flex-wrap items-center gap-2">
        {[
          { value: '3m', label: '3 Months' },
          { value: '6m', label: '6 Months' },
          { value: '12m', label: '12 Months' },
          { value: 'all', label: '24 Months' },
        ].map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={cn(
              'rounded-xl px-3 py-1.5 text-sm transition',
              range === r.value
                ? 'bg-gradient-to-r from-cyan-500/20 to-sky-500/15 text-white ring-1 ring-cyan-400/30'
                : 'text-slate-300 hover:bg-white/6'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <>
          <KpiRow summary={summary} />

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardBody>
                <h3 className="mb-4 text-base font-semibold text-white">Revenue vs Expected Trend</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedMonthly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="c_rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="c_exp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                        labelStyle={{ color: '#f1f5f9' }}
                        itemStyle={{ color: '#cbd5e1' }}
                      />
                      <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2.5} fill="url(#c_rev)" name="Actual Revenue" />
                      <Area type="monotone" dataKey="expected" stroke="#38bdf8" strokeWidth={2} fill="url(#c_exp)" name="Expected Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                  <UsersRound className="h-4 w-4 text-cyan-400" /> Revenue by User
                </h3>
                <div className="h-80">
                  {userPie.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-400">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={userPie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} innerRadius={45} paddingAngle={2} label={({ name, percent }) => `${name.split(' ')[0]} ${Math.round((percent || 0) * 100)}%`}>
                          {userPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} formatter={(v) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardBody>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                  <Building2 className="h-4 w-4 text-violet-400" /> Revenue by Company
                </h3>
                <div className="h-80">
                  {byCompany.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-400">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={byCompany.slice(0, 10)} margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={110} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="totalRevenue" fill="#a78bfa" radius={[0, 8, 8, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                  <Package className="h-4 w-4 text-amber-400" /> Revenue by Product / Service
                </h3>
                <div className="h-80">
                  {productPie.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-400">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={productPie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={90} paddingAngle={2} label={({ name, percent }) => `${name.split(' ')[0]} ${Math.round((percent || 0) * 100)}%`}>
                          {productPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} formatter={(v) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardBody>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                  <UsersRound className="h-4 w-4 text-sky-400" /> User Performance
                </h3>
                <div className="space-y-2 max-h-80 overflow-auto">
                  {byUser.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">No data yet</div>
                  ) : byUser.map((u) => (
                    <div key={u.userId || u.name} className="flex items-center justify-between gap-4 rounded-xl border border-white/6 bg-white/4 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/30 to-violet-500/30 text-sm font-semibold text-white">
                          {(u.name || '?').slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-300">{formatCurrency(u.totalRevenue)}</p>
                        <p className="text-xs text-slate-400">{u.dealsCount || 0} deals</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                  <Building2 className="h-4 w-4 text-violet-400" /> Company Totals
                </h3>
                <div className="space-y-2 max-h-80 overflow-auto">
                  {byCompany.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">No data yet</div>
                  ) : byCompany.slice(0, 15).map((c) => (
                    <div key={c.companyId || c.name} className="flex items-center justify-between gap-4 rounded-xl border border-white/6 bg-white/4 p-3">
                      <div>
                        <p className="font-medium text-white">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.dealsCount || 0} deals</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-300">{formatCurrency(c.totalRevenue)}</p>
                        {c.pendingAmount > 0 && (
                          <p className="text-xs text-amber-300">Pending: {formatCurrency(c.pendingAmount)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
