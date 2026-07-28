import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Phone,
  Mail,
  MessageSquare,
  CalendarCheck,
  CheckSquare,
  FileEdit,
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';
import { Badge } from '../../components/ui/badge';
import { api } from '../../api/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types', icon: Sparkles },
  { value: 'call', label: 'Calls', icon: Phone },
  { value: 'meeting', label: 'Meetings', icon: CalendarCheck },
  { value: 'email', label: 'Emails', icon: Mail },
  { value: 'note', label: 'Notes', icon: FileEdit },
  { value: 'task', label: 'Tasks', icon: CheckSquare },
  { value: 'follow_up', label: 'Follow-ups', icon: MessageSquare },
  { value: 'stage_change', label: 'Stage Changes', icon: RefreshCw },
  { value: 'payment', label: 'Payments', icon: CheckSquare },
];

const TONE_MAP = {
  create: 'sky',
  update: 'violet',
  delete: 'rose',
  call: 'sky',
  meeting: 'amber',
  email: 'indigo',
  note: 'slate',
  task: 'cyan',
  follow_up: 'violet',
  status_change: 'orange',
  stage_change: 'emerald',
  convert: 'teal',
  payment: 'emerald',
  comment: 'slate',
};

const columnHelper = createColumnHelper();

export default function Activities() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(search, 300);

  const listQuery = useQuery({
    queryKey: ['activities', type, debounced],
    queryFn: async () => {
      const params = {};
      if (type && type !== 'all') params.type = type;
      if (debounced) params.search = debounced;
      params.limit = 50;
      const r = await api.activities.list(params);
      return r.data.data || r.data;
    },
  });

  const removeMut = useMutation({
    mutationFn: api.activities.remove,
    onSuccess: () => {
      toast.success('Activity deleted');
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const createMut = useMutation({
    mutationFn: api.activities.create,
    onSuccess: () => {
      toast.success('Activity logged');
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setOpen(false);
    },
  });

  const columns = [
    columnHelper.accessor('type', {
      header: 'Type',
      cell: (info) => {
        const v = info.getValue();
        return <Badge tone={TONE_MAP[v] || 'slate'}>{(v || '').replace('_', ' ').toUpperCase()}</Badge>;
      },
    }),
    columnHelper.accessor('title', {
      header: 'Title',
      cell: (info) => (
        <div>
          <p className="font-medium text-white">{info.getValue()}</p>
          {info.row.original.description && (
            <p className="max-w-lg truncate text-xs text-slate-400">{info.row.original.description}</p>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('entityType', {
      header: 'Related To',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <Badge tone="violet">{info.getValue()}</Badge>
          {info.row.original.meta && Object.keys(info.row.original.meta).length > 0 && (
            <span className="text-xs text-slate-400">{Object.keys(info.row.original.meta).length} details</span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('actor', {
      header: 'By',
      cell: (info) => {
        const a = info.getValue();
        const name = typeof a === 'object' ? a?.name : '—';
        const avatar = typeof a === 'object' ? a?.avatar : '';
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/25 to-violet-500/25 text-xs font-semibold text-white">
              {avatar ? <img src={avatar} className="h-full w-full rounded-full object-cover" /> : (name || '?').slice(0, 1)}
            </div>
            <span className="text-slate-200">{name}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('occurredAt', {
      header: 'When',
      cell: (info) => <span className="text-slate-400">{formatDate(info.getValue())}</span>,
    }),
  ];

  const table = useReactTable({
    data: listQuery.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    if (payload.duration) payload.duration = Number(payload.duration);
    createMut.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Activities" description="A complete timeline of every call, meeting, email, note, status change, and payment across your CRM." actionLabel="Log Activity" onAction={() => setOpen(true)} />

      <Card>
        <CardBody>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activities" className="pl-9" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {TYPE_OPTIONS.map((t) => {
                const active = type === t.value;
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition',
                      active
                        ? 'bg-gradient-to-r from-cyan-500/25 to-sky-500/15 text-white ring-1 ring-cyan-400/25'
                        : 'bg-white/4 text-slate-300 hover:bg-white/8'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {listQuery.isLoading ? (
            <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-64" /></div>
          ) : (listQuery.data || []).length === 0 ? (
            <EmptyState
              title="No activities yet"
              description="Activities appear automatically as you work in the CRM. You can also log them manually."
              actionLabel="Log Activity"
              onAction={() => setOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => (
                        <th key={h.id} className="px-4 py-3 font-medium">
                          {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                      <th className="px-4 py-3"></th>
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-t border-white/8 text-slate-200 transition hover:bg-white/5">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-4 align-top">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                      <td className="px-4 py-4">
                        <button
                          className="rounded-lg p-2 hover:bg-white/8 text-rose-300"
                          onClick={() => removeMut.mutate(row.original.id || row.original._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal open={open} title="Log Activity" onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Type</span>
            <select name="type" defaultValue="call" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20">
              {TYPE_OPTIONS.filter(t => t.value !== 'all').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Entity Type</span>
              <select name="entityType" defaultValue="lead" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20">
                <option value="lead">Lead</option>
                <option value="contact">Contact</option>
                <option value="company">Company</option>
                <option value="deal">Deal</option>
                <option value="task">Task</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Entity ID</span>
              <Input name="entityId" placeholder="ObjectId of related record" />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Title</span>
            <Input name="title" placeholder="Summary of the activity" />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Description</span>
            <textarea name="description" rows="3" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20" placeholder="Extra notes or outcome" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Duration (min)</span>
              <Input type="number" name="duration" defaultValue="0" />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Occurred At</span>
              <Input type="datetime-local" name="occurredAt" />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save Activity</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
