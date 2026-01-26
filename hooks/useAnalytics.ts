import { useState, useEffect, useCallback } from 'react';
import { analyticsService, AnalyticsFilters, DashboardMetrics, TrendsData, PerformanceMetrics } from '@/services/analytics.service';

export function useAnalytics(days: number = 7, platform: string = 'all') {
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [topTopics, setTopTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date range based on days
  const getDateRange = useCallback((days: number) => {
    const dateTo = new Date();
    dateTo.setHours(23, 59, 59, 999);

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - (days - 1));
    dateFrom.setHours(0, 0, 0, 0);

    return {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      groupBy: 'day' as const,
    };
  }, []);

  // Fetch all analytics data
  const fetchAnalytics = useCallback(async (days: number, platform: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: AnalyticsFilters = {
        ...getDateRange(days),
        channel: platform !== 'all' ? platform : undefined
      };

      // Fetch all data in parallel
      const [dashboardData, trendsData, performanceData, topicsData] = await Promise.all([
        analyticsService.getDashboardMetrics(filters),
        analyticsService.getConversationTrends(filters),
        analyticsService.getPerformanceMetrics(filters),
        analyticsService.getTopTopics(filters),
      ]);

      setDashboardMetrics(dashboardData);
      setTrends(trendsData);
      setPerformance(performanceData);
      setTopTopics(topicsData.data || []);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange]);

  // Fetch on mount and when days/platform change
  useEffect(() => {
    fetchAnalytics(days, platform);
  }, [days, platform, fetchAnalytics]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchAnalytics(days, platform);
  }, [days, platform, fetchAnalytics]);

  return {
    dashboardMetrics,
    trends,
    performance,
    topTopics,
    isLoading,
    error,
    refresh,
  };
}
