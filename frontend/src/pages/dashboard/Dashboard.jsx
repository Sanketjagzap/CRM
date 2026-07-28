import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardWidgets } from '../../components/dashboard/DashboardWidgets';
import { AnalyticsCharts } from '../../components/dashboard/AnalyticsCharts';
import { RecentFeed } from '../../components/dashboard/RecentFeed';
import { api } from '../../api/endpoints';
import { Skeleton } from '../../components/common/Skeleton';

export default function Dashboard() {
  const overviewQuery = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const response = await api.dashboard.overview();
      return response.data.data;
    },
  });

  const data = overviewQuery.data || {};

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="A live command center for lead flow, revenue, activities, and upcoming work." actionLabel="New lead" />
      {overviewQuery.isLoading ? (
        <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>
      ) : (
        <>
          <DashboardWidgets counters={data.counters} />
          <AnalyticsCharts revenueSeries={data.revenueSeries} dealStages={data.dealStages} conversion={data.conversion} />
          <div className="grid gap-4 xl:grid-cols-3">
            <RecentFeed title="Recent leads" items={data.recentLeads || []} emptyLabel="No leads yet" />
            <RecentFeed title="Recent activity" items={data.recentActivities || []} emptyLabel="No activities yet" />
            <RecentFeed title="Notifications" items={data.recentNotifications || []} emptyLabel="Nothing in your inbox" />
          </div>
        </>
      )}
    </div>
  );
}