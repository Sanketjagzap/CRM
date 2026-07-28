import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { StatCard } from '../../components/common/StatCard';
import { Skeleton } from '../../components/common/Skeleton';
import { Input } from '../../components/ui/input';
import {
  Trophy,
  Frown,
  Target,
  TrendingUp,
  UsersRound,
  Building2,
  Package,
  BarChart3,
  PieChart as PieIcon,
  Download,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/endpoints';
import { formatCurrency } from '../../components/dashboard/DashboardWidgets';

const PIE_COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22d3ee', '#818cf8', '#f97316'];

export default function Analytics() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const params = useMemo(() => ({ ...(from ? { from } : {}), ...(to ? { to } : {}) }), [from, to]);

  const analyticsQuery = useQuery({
    queryKey: ['analytics', 'metrics', from, to],
    queryFn: async () => (await api.analytics.metrics(params)).data.data,
  });
  const revenueQuery = useQuery({
    queryKey: ['monthlyRevenue', 12, from, to],
    queryFn: async () => (await api.settings.monthlyRevenue({ months: 12 })).data.data,
  });
  const byProductQuery = useQuery({
    queryKey: ['revenueByProduct'],
    queryFn: async () => (await api.settings.revenueByProduct()).data.data,
  });

  const loading = analyticsQuery.isLoading || revenueQuery.isLoading;
  const a = analyticsQuery.data || {};
  const leads = a.leads || {};
  const deals = a.deals || {};
  const sources = a.sources || [];
  const performers = a.performers || [];
  const monthly = revenueQuery.data || [];
  const byProduct = byProductQuery.data || [];

  const leadConversionPie = useMemo(() => {
    const arr = leads.byStatus || {};
    const out = [];
    Object.entries(arr).forEach(([k, v]) => {
      const label = (k || '').charAt(0).toUpperCase() + (k || '').slice(1);
      out.push({ name: label, value: v });
    });
    if (out.length === 0) out.push({ name: 'New', value: leads.total || 0 });
    return out;
  }, [leads]);

  const productPie = useMemo(() => byProduct.slice(0, 8).map((p, i) => ({ ...p, color: PIE_COLORS[i % PIE_COLORS.length] })), [byProduct]);

  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Leads', leads.total || 0],
      ['Lead Conversion %', leads.conversionRate || 0],
      ['Total Deals', deals.total || 0],
      ['Won Deals', deals.won || 0],
      ['Lost Deals', deals.lost || 0],
      ['Win Rate %', deals.winRate || 0],
      ['Total Won Value', deals.totalWonValue || 0],
    ];
    performers.forEach((p, i) => rows.push([`Performer ${i + 1}: ${p.name}`, `${p.wonValue} (${p.winRate}%)`]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const aEl = document.createElement('a');
    aEl.href = url;
    aEl.download = `crm-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    aEl.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description="Lead conversion, revenue trends, win rates, sales performance, product insights, and exports."
        actionLabel="Export CSV"
        onAction={exportCSV}
        actionIcon={Download}
      />

      <Card>
        <CardBody>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-96" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Leads" value={leads.total || 0} sub={`Converted: ${leads.converted || 0}`} icon={UsersRound} tone="sky" />
            <StatCard label="Conversion Rate" value={`${leads.conversionRate || 0}%`} icon={TrendingUp} tone="emerald" />
            <StatCard label="Total Won Revenue" value={formatCurrency(deals.totalWonValue || 0)} sub={`${deals.won || 0} won deals`} icon={Trophy} tone="teal" />
            <StatCard label="Win Rate" value={`${deals.winRate || 0}%`} sub={`${deals.won || 0}W / ${deals.lost || 0}L`} icon={Target} tone="violet" />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardBody>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                  <BarChart3 className="h-4 w-4 text-cyan-400" /> Monthly Won Revenue
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} formatter={(v) => formatCurrency(v)} />
                      <Bar dataKey="revenue" fill="#22d3ee" radius={[8, 8, 0, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                  <PieIcon className="h-4 w-4 text-violet-400" /> Lead Status Split
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={leadConversionPie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={90} label={({ name, percent }) => `${name} ${Math.round((percent || 0) * 100)}%`}>
                        {leadConversionPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardBody>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                  <Target className="h-4 w-4 text-amber-400" /> Lead Source Performance
                </h3>
                <div className="space-y-3 max-h-80 overflow-auto">
                  {sources.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">Add leads with different sources</div>
                  ) : sources.map((src) => (
                    <div key={src.source} className="rounded-xl border border-white/6 bg-white/4 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-white capitalize">{src.source.replace('_', ' ')}</span>
                        <span className="text-slate-300">{src.leads} leads · {src.conversionRate}% conversion</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/6">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                          style={{ width: `${Math.min(100, (src.converted / Math.max(1, src.leads)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                  <UsersRound className="h-4 w-4 text-sky-400" /> Salesperson Performance
                </h3>
                <div className="space-y-3 max-h-80 overflow-auto">
                  {performers.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">Assign deals to users to see performance</div>
                  ) : performers.map((u, i) => (
                    <div key={u.userId || u.name || i} className="rounded-xl border border-white/6 bg-white/4 p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/30 to-violet-500/30 font-semibold text-white">
                            {(u.name || '?').slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">{u.name || 'Unassigned'}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email || ''}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-emerald-300">{formatCurrency(u.wonValue)}</p>
                          <p className="text-xs text-slate-400">{u.wonCount}W · {u.lostCount}L · {u.winRate}% win</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardBody>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                  <Package className="h-4 w-4 text-amber-400" /> Product-wise Revenue
                </h3>
                <div className="h-80">
                  {productPie.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-400">Attach products to deals</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={productPie} dataKey="totalRevenue" nameKey="name" cx="50%" cy="45%" outerRadius={90} paddingAngle={2} label={({ name, percent }) => `${name.split(' ')[0]} ${Math.round((percent || 0) * 100)}%`}>
                          {productPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} formatter={(v) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                  <Building2 className="h-4 w-4 text-violet-400" /> Company Wins
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} formatter={(v) => formatCurrency(v)} />
                      <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={3} dot={{ fill: '#34d399', r: 4 }} name="Actual Revenue" />
                      <Line type="monotone" dataKey="expectedRevenue" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#a78bfa', r: 3 }} name="Expected" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardBody>
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                <Sparkles className="h-4 w-4 text-cyan-400" /> Recent Won / Lost Deals
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {(a.recentDeals || []).map((d) => (
                  <div key={d.id || d._id} className="flex items-start justify-between gap-3 rounded-xl border border-white/6 bg-white/4 p-4">
                    <div>
                      <p className="font-medium text-white">{d.title}</p>
                      <p className="text-xs text-slate-400">
                        {d.contact?.name || 'No contact'}
                        {d.company?.name ? ` · ${d.company.name}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge tone={d.stage === 'won' ? 'emerald' : 'rose'}>{d.stage}</Badge>
                      <p className="mt-1 font-semibold text-emerald-300">{formatCurrency(d.finalAmount || d.value || 0)}</p>
                    </div>
                  </div>
                ))}
                {(a.recentDeals || []).length === 0 && (
                  <div className="md:col-span-2 py-8 text-center text-slate-400">No won or lost deals yet. Move deals to Won / Lost to track outcomes.</div>
                )}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
