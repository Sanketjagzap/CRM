import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardBody } from '../ui/card';
import { formatCurrency } from '../../components/dashboard/DashboardWidgets';
import { toast } from 'react-hot-toast';
import { DEAL_STAGES } from '../../constants/navigation';
import { Building2, Calendar, Trophy, Frown, Briefcase, Wallet, Pencil, GripVertical, MoveRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

const STAGE_TONE = {
  sky: 'from-sky-500/15 to-cyan-500/5 ring-sky-400/15',
  violet: 'from-violet-500/15 to-fuchsia-500/5 ring-violet-400/15',
  amber: 'from-amber-500/15 to-orange-500/5 ring-amber-400/15',
  orange: 'from-orange-500/15 to-red-500/5 ring-orange-400/15',
  emerald: 'from-emerald-500/15 to-teal-500/5 ring-emerald-400/15',
  rose: 'from-rose-500/15 to-pink-500/5 ring-rose-400/15',
};

function QuickActions({ deal, onRecordPayment, onMarkWon, onMarkLost }) {
  const stage = deal.stage;
  const isWon = stage === 'won';
  const isLost = stage === 'lost';
  const isTerminal = isWon || isLost;

  if (isWon && onRecordPayment) {
    return (
      <div className="mt-3">
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onRecordPayment(deal._id || deal.id);
          }}
          className="w-full bg-emerald-500/15 text-emerald-300 border-emerald-400/20 hover:bg-emerald-500/25"
        >
          <Wallet className="h-3.5 w-3.5" /> Record Payment
        </Button>
      </div>
    );
  }

  if (isTerminal) return null;
  if (!onMarkWon && !onMarkLost) return null;

  return (
    <div className="mt-3 relative">
      <div className="flex gap-2">
        {onMarkWon && (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onMarkWon(deal._id || deal.id);
            }}
            className="flex-1 bg-emerald-500/10 text-emerald-300 border-emerald-400/15 hover:bg-emerald-500/20"
          >
            <Trophy className="h-3.5 w-3.5" /> Won
          </Button>
        )}
        {onMarkLost && (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onMarkLost(deal._id || deal.id);
            }}
            className="flex-1 bg-rose-500/10 text-rose-300 border-rose-400/15 hover:bg-rose-500/20"
          >
            <Frown className="h-3.5 w-3.5" /> Lost
          </Button>
        )}
      </div>
    </div>
  );
}

export function DealKanban({ onRecordPayment, onMarkWon, onMarkLost, onEditDeal }) {
  const queryClient = useQueryClient();
  const [dragOverStage, setDragOverStage] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [enterCount, setEnterCount] = useState(0);
  const [quickMoveTarget, setQuickMoveTarget] = useState(null);

  const dealsQuery = useQuery({
    queryKey: ['deals', 'kanban'],
    queryFn: async () => {
      const response = await api.deals.list({ limit: 200, sort: '-pipelineOrder,-createdAt' });
      return response.data.data || [];
    },
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, stage }) => api.deals.stage(id, { stage }),
    onSuccess: () => {
      toast.success('Deal moved');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to move deal');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const quickMoveMut = useMutation({
    mutationFn: async ({ id, stage }) => api.deals.stage(id, { stage }),
    onSuccess: () => {
      toast.success('Deal stage updated');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update deal stage');
    },
  });

  const deals = dealsQuery.data || [];

  const handleDragStart = (event, id) => {
    setDraggingId(id);
    try {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.dropEffect = 'move';
      event.dataTransfer.setData('text/plain', String(id));
    } catch (_) {}
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
    setEnterCount(0);
  };

  const handleDragEnter = (event, stage) => {
    event.preventDefault();
    try {
      event.dataTransfer.dropEffect = 'move';
    } catch (_) {}
    setEnterCount((c) => c + 1);
    setDragOverStage(stage);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    try {
      event.dataTransfer.dropEffect = 'move';
    } catch (_) {}
  };

  const handleDragLeave = (event, stage) => {
    event.preventDefault();
    setEnterCount((c) => {
      const next = Math.max(0, c - 1);
      if (next === 0 && dragOverStage === stage) {
        setDragOverStage(null);
      }
      return next;
    });
  };

  const handleDrop = (event, stage) => {
    event.preventDefault();
    event.stopPropagation();
    let id = null;
    try {
      id = event.dataTransfer.getData('text/plain');
    } catch (_) {}
    setDraggingId(null);
    setDragOverStage(null);
    setEnterCount(0);
    if (!id) {
      toast.error('Could not read dragged deal');
      return;
    }
    updateStage.mutate({ id, stage });
  };

  const totalsByStage = {};
  deals.forEach((d) => {
    totalsByStage[d.stage] = (totalsByStage[d.stage] || 0) + (d.finalAmount || d.value || 0);
  });

  return (
    <div className="overflow-x-auto pb-4">
      <div className="grid min-w-[980px] gap-4 xl:grid-cols-2 2xl:grid-cols-6">
        {DEAL_STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const total = totalsByStage[stage.key] || 0;
          const isTerminal = stage.key === 'won' || stage.key === 'lost';
          const isActive = dragOverStage === stage.key;
          return (
            <Card
              key={stage.key}
              className={cn(
                'min-h-[500px] bg-gradient-to-br transition-all duration-200',
                STAGE_TONE[stage.color] || STAGE_TONE.sky,
                'ring-1',
                isActive && 'ring-2 ring-cyan-400/50 scale-[1.01] shadow-2xl shadow-cyan-500/10'
              )}
            >
              <CardBody
                onDrop={(event) => handleDrop(event, stage.key)}
                onDragOver={handleDragOver}
                onDragEnter={(event) => handleDragEnter(event, stage.key)}
                onDragLeave={(event) => handleDragLeave(event, stage.key)}
                className={cn(
                  'space-y-4 transition-colors duration-150',
                  isActive && 'bg-white/5 rounded-2xl'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      stage.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300'
                        : stage.color === 'rose' ? 'bg-rose-500/20 text-rose-300'
                        : stage.color === 'amber' ? 'bg-amber-500/20 text-amber-300'
                        : stage.color === 'orange' ? 'bg-orange-500/20 text-orange-300'
                        : stage.color === 'violet' ? 'bg-violet-500/20 text-violet-300'
                        : 'bg-sky-500/20 text-sky-300'
                    )}>
                      {stage.key === 'won' ? <Trophy className="h-4 w-4" />
                        : stage.key === 'lost' ? <Frown className="h-4 w-4" />
                        : <Briefcase className="h-4 w-4" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-200">{stage.label}</h3>
                      <p className="text-[11px] text-slate-400">{stage.probability}% probability</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge tone={stage.color === 'rose' ? 'rose' : stage.color === 'emerald' ? 'emerald' : 'sky'}>{stageDeals.length}</Badge>
                    <p className="mt-1 text-xs font-semibold text-slate-300">{formatCurrency(total)}</p>
                  </div>
                </div>
                <div className={cn(
                  'space-y-3 min-h-[180px] rounded-2xl transition-all duration-150',
                  isActive && 'bg-cyan-500/5 ring-1 ring-dashed ring-cyan-400/30 p-2'
                )}>
                  {stageDeals.length === 0 ? (
                    <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
                      <div className="space-y-1">
                        <Briefcase className="mx-auto h-6 w-6 text-slate-600" />
                        <p>{isActive ? 'Drop here' : 'Drop deals here'}</p>
                      </div>
                    </div>
                  ) : stageDeals.map((deal) => {
                    const dealId = deal._id || deal.id;
                    const isDragging = draggingId === dealId;
                    return (
                      <div
                        key={dealId}
                        draggable
                        onDragStart={(e) => handleDragStart(e, dealId)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'group relative rounded-2xl border border-white/10 bg-slate-950/50 p-4 shadow-md backdrop-blur transition-all duration-150 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg',
                          isDragging && 'opacity-50 scale-95 ring-2 ring-cyan-400/60 shadow-2xl cursor-grabbing',
                          !isDragging && 'cursor-grab active:cursor-grabbing'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-white">{deal.title}</p>
                            {deal.contact?.name && (
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400">
                                <Building2 className="h-3 w-3 shrink-0" />
                                {deal.contact?.name}
                                {deal.company?.name ? ` · ${deal.company.name}` : ''}
                              </p>
                            )}
                          </div>
                          <div className="flex items-start gap-1.5">
                            <button
                              type="button"
                              title="Edit deal"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEditDeal) onEditDeal(deal);
                              }}
                              className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-cyan-300"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <Badge
                              tone={
                                deal.priority === 'urgent' ? 'rose'
                                  : deal.priority === 'high' ? 'amber'
                                  : deal.priority === 'medium' ? 'violet'
                                  : 'slate'
                              }
                            >
                              {deal.priority}
                            </Badge>
                            <div
                              className="flex shrink-0 items-center text-slate-600 opacity-0 transition-opacity group-hover:opacity-100"
                              title="Drag to move between stages"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                          <span className="font-semibold text-emerald-300">{formatCurrency(deal.finalAmount || deal.value || 0)}</span>
                          <span>{deal.probability || 0}%</span>
                        </div>
                        {deal.expectedCloseDate && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar className="h-3 w-3" />
                            Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                          </div>
                        )}
                        {deal.outstandingAmount > 0 && deal.stage === 'won' && (
                          <div className="mt-2 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
                            Outstanding: {formatCurrency(deal.outstandingAmount)}
                          </div>
                        )}
                        {deal.lostReason && deal.stage === 'lost' && (
                          <div className="mt-2 rounded-md bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300 line-clamp-2">
                            Reason: {deal.lostReason}
                          </div>
                        )}

                        {!isTerminal && (
                          <div className="mt-3">
                            {quickMoveTarget === dealId ? (
                              <div className="space-y-1.5 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-2">
                                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                                  <MoveRight className="h-3 w-3" /> Quick move to:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {DEAL_STAGES.filter((s) => s.key !== deal.stage).map((s) => (
                                    <button
                                      key={s.key}
                                      type="button"
                                      disabled={quickMoveMut.isPending}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        quickMoveMut.mutate({ id: dealId, stage: s.key });
                                        setQuickMoveTarget(null);
                                      }}
                                      className={cn(
                                        'rounded-lg border px-2 py-1 text-[11px] font-medium transition',
                                        s.color === 'emerald' && 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
                                        s.color === 'rose' && 'border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
                                        s.color === 'amber' && 'border-amber-400/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20',
                                        s.color === 'orange' && 'border-orange-400/20 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20',
                                        s.color === 'violet' && 'border-violet-400/20 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20',
                                        s.color === 'sky' && 'border-sky-400/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20'
                                      )}
                                    >
                                      {s.label}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickMoveTarget(null);
                                    }}
                                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-400 hover:bg-white/10"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickMoveTarget(quickMoveTarget === dealId ? null : dealId);
                                }}
                                className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-white/10 bg-white/5 px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400 transition hover:border-cyan-400/30 hover:bg-cyan-500/5 hover:text-cyan-300"
                              >
                                <MoveRight className="h-3 w-3" /> Move Stage (Alternative to drag)
                              </button>
                            )}
                          </div>
                        )}

                        <QuickActions
                          deal={deal}
                          onRecordPayment={onRecordPayment}
                          onMarkWon={onMarkWon}
                          onMarkLost={onMarkLost}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
