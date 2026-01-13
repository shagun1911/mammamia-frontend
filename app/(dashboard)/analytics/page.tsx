"use client";

import { useState, useMemo } from "react";
import { Calendar, RefreshCw, TrendingUp, BarChart3, Activity } from "lucide-react";
import { MetricsGrid } from "@/components/analytics/MetricsGrid";
import { ChannelChart } from "@/components/analytics/ChannelChart";
import { TopicsChart } from "@/components/analytics/TopicsChart";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useSidebar } from "@/contexts/SidebarContext";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<7 | 30 | 90>(7);
  const { dashboardMetrics, trends, performance, isLoading, error, refresh } = useAnalytics(dateRange);

  // Transform backend data to match UI expectations
  const metrics = useMemo(() => {
    if (!dashboardMetrics || !trends) return null;

    // Calculate percentage change (using ratio of active to total for demo)
    const calculateChange = (current: number, total: number) => {
      if (total === 0) return 0;
      return Math.round((current / total) * 100) - 50; // Simplified change calculation
    };

    return {
      newConversations: {
        value: dashboardMetrics.totalConversations,
        change: calculateChange(dashboardMetrics.activeConversations, dashboardMetrics.totalConversations),
      },
      closedConversations: {
        value: dashboardMetrics.closedConversations,
        change: calculateChange(dashboardMetrics.closedConversations, dashboardMetrics.totalConversations),
      },
      reopenedConversations: {
        value: 0, // Not tracked in backend yet
        change: 0,
      },
      wrongAnswers: {
        value: 0, // Not tracked in backend yet
        change: 0,
      },
      linksClicked: {
        value: 0, // Not tracked in backend yet
        change: 0,
      },
      closedByOperators: {
        value: dashboardMetrics.humanManaged,
        change: calculateChange(dashboardMetrics.humanManaged, dashboardMetrics.totalConversations),
      },
    };
  }, [dashboardMetrics, trends]);

  // Transform trends data for charts
  const chartData = useMemo(() => {
    if (!trends) return [];

    return trends.newConversations.map((item, index) => ({
      date: item.period,
      newConversations: item.count,
      closedConversations: trends.resolutionRates[index]?.resolutionRate || 0,
      reopenedConversations: 0,
      wrongAnswers: 0,
      linksClicked: 0,
      closedByOperators: 0,
    }));
  }, [trends]);

  // Transform channel data
  const channelData = useMemo(() => {
    if (!dashboardMetrics) return [];

    const channelColors: Record<string, string> = {
      web: "#3b82f6",
      whatsapp: "#10b981",
      telegram: "#8b5cf6",
      api: "#f59e0b",
    };

    return Object.entries(dashboardMetrics.conversationsByChannel).map(([channel, count]) => ({
      channel: channel.charAt(0).toUpperCase() + channel.slice(1),
      count,
      color: channelColors[channel] || "#6b7280",
    }));
  }, [dashboardMetrics]);

  // For now, use empty topics array (would need to fetch from topics endpoint)
  const topicData: { topic: string; count: number }[] = [];

  const dateRangeLabels = {
    7: "Last 7 days",
    30: "Last 30 days",
    90: "Last 90 days",
  };

  const { getSidebarWidth } = useSidebar();

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
        <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
              <p className="text-sm text-muted-foreground">Track your performance metrics</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
        <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
              <p className="text-sm text-muted-foreground">Track your performance metrics</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Failed to Load Analytics</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={refresh}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all shadow-lg shadow-primary/20 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
      {/* Enhanced Header */}
      <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              Analytics Dashboard
              <Activity className="w-5 h-5 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track your performance metrics and insights</p>
          </div>
        </div>
        
        {/* Enhanced Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-accent hover:border-primary/20 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {/* Enhanced Date range selector */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value) as 7 | 30 | 90)}
              className="appearance-none flex items-center gap-2 px-4 py-2.5 pr-10 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-accent hover:border-primary/20 transition-all cursor-pointer shadow-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-b from-background to-background/95 p-8">
        {metrics && (
          <>
            {/* Metrics Grid */}
            <MetricsGrid metrics={metrics} chartData={chartData} />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <ChannelChart data={channelData} />
              {topicData.length > 0 ? (
                <TopicsChart data={topicData} />
              ) : (
                <div className="bg-card border border-border rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Top Topics</h2>
                  </div>
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                      <BarChart3 className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="font-medium">No topic data available yet</p>
                    <p className="text-sm mt-1">Topics will appear here as conversations grow</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
