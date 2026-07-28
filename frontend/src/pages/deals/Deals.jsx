import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trophy, Frown, Wallet, Pencil } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { DealKanban } from '../../components/crm/DealKanban';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardBody } from '../../components/ui/card';
import { api } from '../../api/endpoints';
import { DEAL_STAGES, PRIORITIES, PAYMENT_METHODS } from '../../constants/navigation';
import { formatCurrency, cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export default function Deals() {
  const queryClient = useQueryClient();
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [paymentDealId, setPaymentDealId] = useState(null);
  const [wonDealId, setWonDealId] = useState(null);
  const [lostDealId, setLostDealId] = useState(null);
  const [selectedStage, setSelectedStage] = useState('new_lead');
  const [editingDeal, setEditingDeal] = useState(null);
  const [editStage, setEditStage] = useState('new_lead');

  const companiesQuery = useQuery({
    queryKey: ['companies', 'select'],
    queryFn: async () => {
      const res = await api.companies.list({ limit: 200, sort: 'name' });
      return res.data.data || [];
    },
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'select'],
    queryFn: async () => {
      const res = await api.users.list({ limit: 200, sort: 'name' });
      return res.data.data || [];
    },
  });

  const defaultProbability = useMemo(() => {
    const stage = DEAL_STAGES.find((s) => s.key === selectedStage);
    return stage?.probability ?? 10;
  }, [selectedStage]);

  const createDealMut = useMutation({
    mutationFn: (payload) => api.deals.create(payload),
    onSuccess: () => {
      toast.success('Deal created successfully');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setNewDealOpen(false);
      setShowAdvanced(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to create deal');
    },
  });

  const updateDealMut = useMutation({
    mutationFn: ({ id, payload }) => api.deals.update(id, payload),
    onSuccess: () => {
      toast.success('Deal updated successfully');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setEditingDeal(null);
      setShowAdvanced(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update deal');
    },
  });

  useEffect(() => {
    if (editingDeal) {
      setEditStage(editingDeal.stage || 'new_lead');
    }
  }, [editingDeal]);

  const recordPaymentMut = useMutation({
    mutationFn: ({ id, payload }) => api.deals.recordPayment(id, payload),
    onSuccess: () => {
      toast.success('Payment recorded');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setPaymentDealId(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    },
  });

  const markWonMut = useMutation({
    mutationFn: (id) => api.deals.won(id),
    onSuccess: () => {
      toast.success('Deal marked as Won!');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setWonDealId(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to mark deal as won');
    },
  });

  const markLostMut = useMutation({
    mutationFn: ({ id, payload }) => api.deals.lost(id, payload),
    onSuccess: () => {
      toast.success('Deal marked as Lost');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'metrics'] });
      setLostDealId(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to mark deal as lost');
    },
  });

  const handleCreateDeal = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const payload = {};

    if (raw.title && raw.title.trim()) payload.title = raw.title.trim();
    if (raw.value) payload.value = Number(raw.value);
    if (raw.stage) payload.stage = raw.stage;
    if (raw.probability) payload.probability = Number(raw.probability);
    if (raw.priority) payload.priority = raw.priority;
    if (raw.expectedCloseDate) payload.expectedCloseDate = raw.expectedCloseDate;
    if (raw.companyId && raw.companyId !== '') payload.companyId = raw.companyId;
    if (raw.assignedTo && raw.assignedTo !== '') payload.assignedTo = raw.assignedTo;
    if (raw.description && raw.description.trim()) payload.description = raw.description.trim();
    if (raw.discountRate) payload.discountRate = Number(raw.discountRate);
    if (raw.taxRate) payload.taxRate = Number(raw.taxRate);

    if (!payload.title) {
      toast.error('Deal title is required');
      return;
    }
    if (!payload.value || payload.value <= 0) {
      toast.error('Deal value is required');
      return;
    }

    createDealMut.mutate(payload);
  };

  const handleUpdateDeal = (e) => {
    e.preventDefault();
    if (!editingDeal) return;
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const payload = {};

    if (raw.title && raw.title.trim()) payload.title = raw.title.trim();
    if (raw.value) payload.value = Number(raw.value);
    if (raw.stage) payload.stage = raw.stage;
    if (raw.probability) payload.probability = Number(raw.probability);
    if (raw.priority) payload.priority = raw.priority;
    if (raw.expectedCloseDate) payload.expectedCloseDate = raw.expectedCloseDate;
    else if (raw.expectedCloseDate === '') payload.expectedCloseDate = null;
    if (raw.companyId !== undefined) payload.companyId = raw.companyId || null;
    if (raw.assignedTo !== undefined) payload.assignedTo = raw.assignedTo || null;
    if (raw.description !== undefined) payload.description = raw.description.trim() || '';
    if (raw.discountRate) payload.discountRate = Number(raw.discountRate);
    else if (raw.discountRate === '') payload.discountRate = 0;
    if (raw.taxRate) payload.taxRate = Number(raw.taxRate);
    else if (raw.taxRate === '') payload.taxRate = 0;

    if (!payload.title) {
      toast.error('Deal title is required');
      return;
    }
    if (!payload.value || payload.value <= 0) {
      toast.error('Deal value is required');
      return;
    }

    const recId = editingDeal._id || editingDeal.id;
    updateDealMut.mutate({ id: recId, payload });
  };

  const editProbability = useMemo(() => {
    const stage = DEAL_STAGES.find((s) => s.key === editStage);
    return stage?.probability ?? (editingDeal?.probability ?? 10);
  }, [editStage, editingDeal]);

  const handleRecordPayment = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const payload = {};

    if (raw.amount) payload.amount = Number(raw.amount);
    if (raw.method && raw.method !== '') payload.method = raw.method;
    if (raw.note && raw.note.trim()) payload.note = raw.note.trim();

    if (!payload.amount || payload.amount <= 0) {
      toast.error('Payment amount is required');
      return;
    }

    recordPaymentMut.mutate({ id: paymentDealId, payload });
  };

  const handleMarkLost = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const reason = fd.get('lostReason')?.toString().trim();

    if (!reason) {
      toast.error('Please provide a reason for losing the deal');
      return;
    }

    markLostMut.mutate({ id: lostDealId, payload: { lostReason: reason } });
  };

  const priorityTone = (p) => {
    const match = PRIORITIES.find((x) => x.value === p);
    return match?.tone || 'slate';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        description="A drag-and-drop pipeline for revenue visibility, closing priorities, and stage history."
      >
        <Button onClick={() => setNewDealOpen(true)}>
          <Plus className="h-4 w-4" /> New Deal
        </Button>
      </PageHeader>

      <DealKanban
        onRecordPayment={(id) => setPaymentDealId(id)}
        onMarkWon={(id) => setWonDealId(id)}
        onMarkLost={(id) => setLostDealId(id)}
        onEditDeal={(deal) => {
          setEditingDeal(deal);
          setShowAdvanced(false);
        }}
      />

      <Modal
        open={newDealOpen}
        size="lg"
        title="New Deal"
        onClose={() => {
          setNewDealOpen(false);
          setShowAdvanced(false);
        }}
      >
        <form className="space-y-4" onSubmit={handleCreateDeal}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Deal Title *</span>
              <Input name="title" placeholder="e.g. Acme Corp Q3 Enterprise License" required />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Deal Value (₹) *</span>
              <Input type="number" name="value" min="0" step="0.01" placeholder="e.g. 500000" required />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Stage</span>
              <select
                name="stage"
                defaultValue="new_lead"
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s.key} value={s.key} className="bg-slate-900">
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Probability (%)</span>
              <Input type="number" name="probability" min="0" max="100" defaultValue={defaultProbability} />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Priority</span>
              <select
                name="priority"
                defaultValue="medium"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value} className="bg-slate-900">
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Expected Close Date</span>
              <Input type="date" name="expectedCloseDate" />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Company</span>
              <select
                name="companyId"
                defaultValue=""
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="" className="bg-slate-900">
                  — Select Company —
                </option>
                {(companiesQuery.data || []).map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id} className="bg-slate-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Assigned To</span>
              <select
                name="assignedTo"
                defaultValue=""
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="" className="bg-slate-900">
                  — Select User —
                </option>
                {(usersQuery.data || []).map((u) => (
                  <option key={u._id || u.id} value={u._id || u.id} className="bg-slate-900">
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Description</span>
              <textarea
                name="description"
                rows={3}
                placeholder="Notes about the deal, customer requirements, next steps..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300 hover:text-cyan-200"
          >
            {showAdvanced ? '▾ Hide Advanced' : '▸ Show Advanced (Discount & Tax)'}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Discount Rate (%)</span>
                <Input type="number" name="discountRate" min="0" max="100" step="0.01" placeholder="e.g. 10" />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tax Rate (%)</span>
                <Input type="number" name="taxRate" min="0" max="100" step="0.01" placeholder="e.g. 18" />
              </label>
            </div>
          )}

          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-3 border-t border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setNewDealOpen(false);
                setShowAdvanced(false);
              }}
              disabled={createDealMut.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createDealMut.isPending}>
              {createDealMut.isPending ? 'Creating...' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(paymentDealId)}
        size="md"
        title="Record Payment"
        onClose={() => setPaymentDealId(null)}
      >
        <form className="space-y-4" onSubmit={handleRecordPayment}>
          <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-sky-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Record a payment</h4>
                <p className="text-xs text-slate-300">Log a payment received against this won deal.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Amount (₹) *</span>
              <Input type="number" name="amount" min="0" step="0.01" placeholder="e.g. 250000" required />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Method</span>
              <select
                name="method"
                defaultValue="upi"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m} className="bg-slate-900">
                    {m.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Note</span>
              <textarea
                name="note"
                rows={2}
                placeholder="Optional: transaction reference, cheque number, etc."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </label>
          </div>
          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-3 border-t border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPaymentDealId(null)}
              disabled={recordPaymentMut.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={recordPaymentMut.isPending}>
              <Wallet className="h-4 w-4" />{' '}
              {recordPaymentMut.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(wonDealId)}
        size="md"
        title="Mark Deal as Won"
        onClose={() => setWonDealId(null)}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (wonDealId) markWonMut.mutate(wonDealId);
          }}
        >
          <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Congratulations!</h4>
                <p className="text-xs text-slate-300">
                  Confirming this deal as won will update your pipeline and revenue forecast.
                </p>
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-3 border-t border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setWonDealId(null)}
              disabled={markWonMut.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={markWonMut.isPending}>
              <Trophy className="h-4 w-4" />{' '}
              {markWonMut.isPending ? 'Marking...' : 'Mark as Won'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(lostDealId)}
        size="md"
        title="Mark Deal as Lost"
        onClose={() => setLostDealId(null)}
      >
        <form className="space-y-4" onSubmit={handleMarkLost}>
          <div className="rounded-2xl border border-rose-400/20 bg-gradient-to-br from-rose-500/10 via-red-500/5 to-pink-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300">
                <Frown className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Deal lost — capture the reason</h4>
                <p className="text-xs text-slate-300">
                  Recording why deals are lost helps improve future win rates.
                </p>
              </div>
            </div>
          </div>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Reason for Losing *
            </span>
            <textarea
              name="lostReason"
              rows={3}
              required
              placeholder="e.g. Lost to competitor, budget cut, timing mismatch..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-rose-400/20"
            />
          </label>
          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-3 border-t border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLostDealId(null)}
              disabled={markLostMut.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={markLostMut.isPending}>
              <Frown className="h-4 w-4" />{' '}
              {markLostMut.isPending ? 'Submitting...' : 'Mark as Lost'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editingDeal)}
        size="lg"
        title="Edit Deal"
        onClose={() => {
          setEditingDeal(null);
          setShowAdvanced(false);
        }}
      >
        <form className="space-y-4" onSubmit={handleUpdateDeal}>
          {editingDeal && (
            <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-violet-500/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Update deal details &amp; stage</h4>
                  <p className="text-xs text-slate-300">
                    Change the stage via the dropdown (alternative to drag-and-drop) or update any field below.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Deal Title *</span>
              <Input
                name="title"
                placeholder="e.g. Acme Corp Q3 Enterprise License"
                defaultValue={editingDeal?.title || ''}
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Deal Value (₹) *</span>
              <Input
                type="number"
                name="value"
                min="0"
                step="0.01"
                defaultValue={editingDeal?.value || editingDeal?.finalAmount || ''}
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Stage (Change Position Here)</span>
              <select
                name="stage"
                value={editStage}
                onChange={(e) => setEditStage(e.target.value)}
                className="h-11 w-full rounded-xl border border-cyan-400/30 bg-cyan-500/5 px-4 text-sm text-white outline-none transition focus:ring-2 focus:ring-cyan-400/30"
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s.key} value={s.key} className="bg-slate-900">
                    {s.label} · {s.probability}%
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Probability (%)</span>
              <Input
                type="number"
                name="probability"
                min="0"
                max="100"
                defaultValue={editingDeal?.probability ?? editProbability}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Priority</span>
              <select
                name="priority"
                defaultValue={editingDeal?.priority || 'medium'}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value} className="bg-slate-900">
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Expected Close Date</span>
              <Input
                type="date"
                name="expectedCloseDate"
                defaultValue={
                  editingDeal?.expectedCloseDate
                    ? new Date(editingDeal.expectedCloseDate).toISOString().split('T')[0]
                    : ''
                }
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Company</span>
              <select
                name="companyId"
                defaultValue={editingDeal?.company?._id || editingDeal?.company?.id || editingDeal?.company || ''}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="" className="bg-slate-900">
                  — None —
                </option>
                {(companiesQuery.data || []).map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id} className="bg-slate-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Assigned To</span>
              <select
                name="assignedTo"
                defaultValue={editingDeal?.assignedTo?._id || editingDeal?.assignedTo?.id || editingDeal?.assignedTo || ''}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="" className="bg-slate-900">
                  — None —
                </option>
                {(usersQuery.data || []).map((u) => (
                  <option key={u._id || u.id} value={u._id || u.id} className="bg-slate-900">
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Description</span>
              <textarea
                name="description"
                rows={3}
                defaultValue={editingDeal?.description || ''}
                placeholder="Notes about the deal, customer requirements, next steps..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300 hover:text-cyan-200"
          >
            {showAdvanced ? '▾ Hide Advanced' : '▸ Show Advanced (Discount & Tax)'}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Discount Rate (%)</span>
                <Input
                  type="number"
                  name="discountRate"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue={editingDeal?.discountRate ?? ''}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tax Rate (%)</span>
                <Input
                  type="number"
                  name="taxRate"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue={editingDeal?.taxRate ?? ''}
                />
              </label>
            </div>
          )}

          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-3 border-t border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditingDeal(null);
                setShowAdvanced(false);
              }}
              disabled={updateDealMut.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateDealMut.isPending}>
              <Pencil className="h-4 w-4" />{' '}
              {updateDealMut.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
