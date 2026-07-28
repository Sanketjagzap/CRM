import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { UsersRound, Mail, Phone, ArrowRight, Sparkles, Star, Target, UserRoundCheck } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { ResourcePage } from '../../components/crm/ResourcePage';
import { api } from '../../api/endpoints';
import { LEAD_STATUSES, LEAD_SOURCES, PRIORITIES } from '../../constants/navigation';
import { formatCurrency } from '../../components/dashboard/DashboardWidgets';
import { formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';

const columnHelper = createColumnHelper();

function toneFor(status) {
  const match = LEAD_STATUSES.find((s) => s.value === status);
  return match?.tone || 'slate';
}

function toneForPriority(p) {
  const match = PRIORITIES.find((s) => s.value === p);
  return match?.tone || 'slate';
}

export default function Leads() {
  const queryClient = useQueryClient();
  const [convertId, setConvertId] = useState(null);

  const convertMut = useMutation({
    mutationFn: ({ id, payload }) => api.leads.convert(id, payload),
    onSuccess: () => {
      toast.success('Lead converted to Contact + Company + Deal');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setConvertId(null);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Conversion failed. Please try again.';
      toast.error(msg);
    },
  });

  const columns = [
    columnHelper.accessor('name', {
      header: 'Lead',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 text-sky-300">
            <UsersRound className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{info.getValue()}</p>
            {info.row.original.jobTitle && info.row.original.company ? (
              <p className="truncate text-xs text-slate-400">
                {info.row.original.jobTitle}
                {info.row.original.company ? ` · ${info.row.original.company}` : ''}
              </p>
            ) : info.row.original.company ? (
              <p className="truncate text-xs text-slate-400">{info.row.original.company}</p>
            ) : null}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => info.getValue() ? (
        <div className="flex items-center gap-2 text-slate-300">
          <Mail className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate max-w-[180px]">{info.getValue()}</span>
        </div>
      ) : <span className="text-slate-500">—</span>,
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: (info) => info.getValue() ? (
        <div className="flex items-center gap-2 text-slate-300">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          <span>{info.getValue()}</span>
        </div>
      ) : <span className="text-slate-500">—</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const match = LEAD_STATUSES.find((s) => s.value === info.getValue());
        return <Badge tone={toneFor(info.getValue())}>{match?.label || info.getValue()}</Badge>;
      },
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: (info) => <Badge tone={toneForPriority(info.getValue())}>{(info.getValue() || 'medium').charAt(0).toUpperCase() + (info.getValue() || 'medium').slice(1)}</Badge>,
    }),
    columnHelper.accessor('score', {
      header: 'Score',
      cell: (info) => (
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-medium text-white">{info.getValue() || 0}</span>
        </div>
      ),
    }),
    columnHelper.accessor('value', {
      header: 'Value',
      cell: (info) => (
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-medium text-emerald-300">{formatCurrency(info.getValue() || 0)}</span>
        </div>
      ),
    }),
    columnHelper.accessor('converted', {
      header: 'Converted',
      cell: (info) => info.getValue() ? (
        <Badge tone="emerald"><UserRoundCheck className="mr-1 h-3 w-3 inline-block" /> Yes</Badge>
      ) : (
        <button
          className="flex items-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
          onClick={() => setConvertId(info.row.original._id || info.row.original.id)}
        >
          <Sparkles className="h-3 w-3" /> Convert
        </button>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: (info) => <span className="text-slate-400">{formatDate(info.getValue())}</span>,
    }),
  ];

  const fields = [
    { name: 'name', label: 'Full Name', placeholder: 'e.g. Rajesh Kumar', type: 'text' },
    { name: 'jobTitle', label: 'Job Title', placeholder: 'VP of Sales', type: 'text' },
    { name: 'company', label: 'Company', placeholder: 'Acme Ltd', type: 'text' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'rajesh@acme.com' },
    { name: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
    {
      name: 'source',
      label: 'Source',
      type: 'select',
      placeholder: 'Select source',
      options: LEAD_SOURCES.map((s) => ({
        value: s,
        label: s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '),
      })),
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'Select status',
      options: LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label })),
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      placeholder: 'Select priority',
      options: PRIORITIES.map((p) => ({ value: p.value, label: p.label })),
    },
    { name: 'score', label: 'Lead Score (0-100)', type: 'number', defaultValue: '0' },
    { name: 'value', label: 'Estimated Value (₹)', type: 'number', defaultValue: '0' },
    { name: 'address.city', label: 'City', placeholder: 'Mumbai' },
    { name: 'address.country', label: 'Country', placeholder: 'India' },
    { name: 'nextFollowUpAt', label: 'Next Follow-up Date', type: 'datetime-local' },
  ];

  return (
    <>
      <ResourcePage
        title="Leads"
        description="Capture new prospects, prioritize with scores, assign owners, and convert to Contacts + Companies + Deals."
        queryKey="leads"
        listFn={api.leads.list}
        createFn={api.leads.create}
        updateFn={api.leads.update}
        deleteFn={api.leads.remove}
        columns={columns}
        fields={fields}
        emptyActionLabel="Create Lead"
        emptyDescription="Add your first lead and begin converting prospects into revenue."
      />
      <Modal open={Boolean(convertId)} size="lg" title="Convert Lead" onClose={() => setConvertId(null)}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!convertId) return;
            const fd = new FormData(e.currentTarget);
            const payload = Object.fromEntries(fd.entries());
            Object.keys(payload).forEach((k) => {
              if (payload[k] === '' || payload[k] == null) delete payload[k];
            });
            const createDealEl = e.currentTarget.elements.namedItem('createDeal');
            payload.createDeal = createDealEl ? createDealEl.checked : true;
            if (payload.dealValue) payload.dealValue = Number(payload.dealValue);
            if (payload.probability) payload.probability = Number(payload.probability);
            if (!payload.createDeal) {
              delete payload.dealTitle;
              delete payload.dealValue;
              delete payload.dealStage;
              delete payload.probability;
              delete payload.expectedCloseDate;
            }
            convertMut.mutate({ id: convertId, payload });
          }}
        >
          <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-violet-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Lead conversion</h4>
                <p className="text-xs text-slate-300">
                  A Contact and (optionally) a Company will be created automatically. Choose whether to also create a Deal.
                </p>
              </div>
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <input name="createDeal" type="checkbox" defaultChecked className="h-4 w-4 rounded border-white/10 bg-white/5" />
            <div>
              <p className="text-sm font-medium text-white">Create Deal as well</p>
              <p className="text-xs text-slate-400">Recommended to track opportunity value.</p>
            </div>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Deal Title (optional)</span>
              <Input name="dealTitle" placeholder="Leave empty to auto-generate" />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Deal Value (₹)</span>
              <Input type="number" name="dealValue" placeholder="e.g. 500000" min="0" step="0.01" />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Stage</span>
              <select name="dealStage" defaultValue="new_lead" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20">
                <option value="new_lead">New Lead</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Probability (%)</span>
              <Input type="number" name="probability" defaultValue="10" min="0" max="100" />
            </label>
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Expected Close Date</span>
              <Input type="date" name="expectedCloseDate" />
            </label>
          </div>
          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-3 border-t border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConvertId(null)}
              disabled={convertMut.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={convertMut.isPending}>
              {convertMut.isPending ? 'Converting…' : (
                <>
                  Convert <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
