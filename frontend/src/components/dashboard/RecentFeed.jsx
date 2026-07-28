import { Card, CardBody } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDate } from '../../lib/utils';

export function RecentFeed({ title, items = [], emptyLabel = 'Nothing recent' }) {
  return (
    <Card>
      <CardBody>
        <h3 className="mb-4 text-base font-semibold text-white">{title}</h3>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400">{emptyLabel}</p>
          ) : (
            items.map((item) => (
              <div key={item._id || item.id || item.title} className="flex items-start justify-between gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{item.title || item.name || item.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(item.createdAt || item.occurredAt || new Date())}</p>
                </div>
                <Badge tone="info">{item.status || item.type || 'new'}</Badge>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}