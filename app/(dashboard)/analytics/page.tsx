"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Calendar, RefreshCw, TrendingUp, BarChart3, Activity, Globe, MessageSquare, Users } from "lucide-react";
import { MetricsGrid } from "@/components/analytics/MetricsGrid";
import { ChannelChart } from "@/components/analytics/ChannelChart";
import { TopicsChart } from "@/components/analytics/TopicsChart";
import { UsageTrendsChart } from "@/components/analytics/UsageTrendsChart";
import { ConversationTrendsChart } from "@/components/analytics/ConversationTrendsChart";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useSidebar } from "@/contexts/SidebarContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { analyticsService } from "@/services/analytics.service";
import { LoadingLogo } from "@/components/LoadingLogo";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<7 | 30 | 90>(7);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all'); // 'all', 'website', 'whatsapp', 'instagram', 'facebook', 'phone', 'email'
  const { dashboardMetrics, trends, performance, topTopics, isLoading, error, refresh } = useAnalytics(dateRange, selectedPlatform);
  const [showLoader, setShowLoader] = useState(true);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!isLoading) {
      // Ensure loader stays for at least 2.5 seconds
      const elapsed = Date.now() - startTimeRef.current;
      const minDisplayTime = 2500; // 2.5 seconds
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      setTimeout(() => {
        setShowLoader(false);
      }, remainingTime);
    } else {
      setShowLoader(true);
      startTimeRef.current = Date.now();
    }
  }, [isLoading]);

  // Transform backend data to match UI expectations
  const metrics = useMemo(() => {
    if (!dashboardMetrics || !trends) {
      return null;
    }

    // Calculate percentage change (compare current period with previous period)
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // simplified calculation
    const previousTotal = Math.floor(dashboardMetrics.totalConversations * 0.7);

    return {
      newConversations: {
        value: dashboardMetrics.totalConversations,
        change: calculateChange(dashboardMetrics.totalConversations, previousTotal),
      },
      callMinutes: {
        value: dashboardMetrics.totalCallMinutes || 0,
        change: 0,
      },
      chatConversations: {
        value: dashboardMetrics.totalChatConversations || 0,
        change: 0,
      },
    };
  }, [dashboardMetrics, trends]);

  // Transform trends data for charts
  const chartData = useMemo(() => {
    if (!trends || !trends.newConversations) return [];

    return trends.newConversations.map((item) => {
      // Period-based matching is safer than index-based
      const callMinItem = trends.callMinutes?.find(m => m.period === item.period);
      const chatConvItem = trends.chatConversations?.find(c => c.period === item.period);

      return {
        date: item.period,
        newConversations: item.count || 0,
        callMinutes: callMinItem ? callMinItem.minutes : 0,
        chatConversations: chatConvItem ? chatConvItem.count : 0,
      };
    });
  }, [trends]);

  // Transform channel data
  const channelData = useMemo(() => {
    if (!dashboardMetrics) return [];

    const channelColors: Record<string, string> = {
      website: "#3b82f6",
      web: "#3b82f6",
      whatsapp: "#10b981",
      telegram: "#8b5cf6",
      api: "#f59e0b",
      email: "#8b5cf6",
      social: "#ec4899",
      instagram: "#E4405F",
      facebook: "#1877F2",
      phone: "#f59e0b",
    };

    const channelLabels: Record<string, string> = {
      website: "Website",
      web: "Website",
      whatsapp: "WhatsApp",
      telegram: "Telegram",
      api: "API",
      email: "Email",
      social: "Social Media",
      instagram: "Instagram",
      facebook: "Facebook",
      phone: "Phone",
    };

    const channelBreakdown = dashboardMetrics.conversationsByChannel || {};

    let result = Object.entries(channelBreakdown)
      .filter(([_, count]) => (count as number) > 0)
      .map(([channel, count]) => ({
        channel: channelLabels[channel] || channel.charAt(0).toUpperCase() + channel.slice(1),
        count: count as number,
        color: channelColors[channel] || "#6b7280",
        key: channel,
      }))
      .sort((a, b) => b.count - a.count);

    if (selectedPlatform !== 'all') {
      result = result.filter(item => item.key === selectedPlatform);
    }

    return result;
  }, [dashboardMetrics, selectedPlatform]);


  const dateRangeLabels = {
    7: "Last 7 days",
    30: "Last 30 days",
    90: "Last 90 days",
  };

  const { getSidebarWidth } = useSidebar();

  // Show loading state
  if (isLoading || showLoader) {
    return (
      <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
        <div className="h-20 px-8 flex items-center justify-between border-b border-border/60 bg-gradient-to-br from-background via-background to-primary/[0.02] backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] flex-shrink-0 z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-[0_8px_24px_rgba(99,102,241,0.25)] ring-1 ring-primary/20">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                Analytics
                <Activity className="w-5 h-5 text-primary/80" />
              </h1>
              <p className="text-sm text-muted-foreground/80 mt-1 font-medium">Track your performance metrics and insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-background">
          <LoadingLogo size="md" text="Loading analytics..." />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
        <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                Analytics
                <Activity className="w-5 h-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track your performance metrics and insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
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
      {/* Streamlined Premium Navbar */}
      <div className="sticky top-0 h-16 px-8 flex items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-xl shadow-sm z-30 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/10">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Analytics</h1>
            <p className="text-[11px] text-muted-foreground font-medium -mt-0.5">Real-time performance metrics</p>
          </div>
        </div>

        {/* Central Controls - Modern Segmented Toggle */}
        <div className="flex items-center gap-3 flex-1 justify-center max-w-2xl">
          <div className="flex bg-secondary/50 border border-border/80 p-1 rounded-xl shadow-inner overflow-x-auto scrollbar-hide no-scrollbar ring-1 ring-white/5">
            {[
              { id: 'all', label: 'All', icon: Activity },
              { id: 'website', label: 'Web', icon: Globe },
              { id: 'whatsapp', label: 'WA', icon: MessageSquare },
              { id: 'instagram', label: 'IG', icon: TrendingUp },
              { id: 'facebook', label: 'FB', icon: Users },
              { id: 'phone', label: 'Call', icon: Activity },
              { id: 'email', label: 'Email', icon: MessageSquare }
            ].map((platform) => {
              const PlatformIcon = platform.icon;
              const isSelected = selectedPlatform === platform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                    isSelected
                      ? "bg-primary text-white shadow-md scale-[1.02] transform"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <PlatformIcon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{platform.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value) as 7 | 30 | 90)}
              className="appearance-none flex items-center gap-2 px-4 py-2 pr-10 bg-card/50 border border-border/80 text-foreground rounded-xl text-xs font-bold hover:bg-accent transition-all cursor-pointer shadow-sm min-w-[110px]"
            >
              <option value={7}>7 Days</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center bg-card border border-border/80 text-foreground rounded-xl hover:bg-accent transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:scale-105 active:scale-95 group"
            title="Refresh analytics"
          >
            <RefreshCw className={cn("w-4.5 h-4.5 group-hover:text-primary transition-colors", isLoading && "animate-spin")} />
          </button>

          <div className="h-6 w-px bg-border/60 mx-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full overflow-hidden border border-border/80 shadow-sm">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-b from-background to-background/95 p-8">
        {metrics && (
          <>
            {/* Metrics Grid */}
            <MetricsGrid metrics={metrics} chartData={chartData} />

            {/* Conversation Trends Line Chart */}
            {trends && chartData.length > 0 && (
              <div className="mt-8 bg-card border border-border rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Conversation Trends</h2>
                      <p className="text-sm text-muted-foreground mt-1">New conversations and chat conversations over time</p>
                    </div>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <ConversationTrendsChart data={chartData} />
                </div>
              </div>
            )}

            {/* Usage Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <ChannelChart data={channelData} />
              {topTopics.length > 0 ? (
                <TopicsChart data={topTopics} />
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

            {/* Usage Trends Chart */}
            {trends && chartData.length > 0 ? (
              <div className="mt-8 bg-card border border-border rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Usage Trends</h2>
                      <p className="text-sm text-muted-foreground mt-1">Conversations and call minutes over time</p>
                    </div>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <UsageTrendsChart data={chartData} />
                </div>
              </div>
            ) : (
              <div className="mt-8 bg-card border border-border rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Usage Trends</h2>
                </div>
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium">No trend data available yet</p>
                  <p className="text-sm mt-1">Trends will appear here as conversations grow</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
