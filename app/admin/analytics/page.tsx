"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, RefreshCw, Calendar } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { toast } from "@/lib/toast";

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<7 | 30 | 90 | 'all'>('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-usage-reports', dateRange],
    queryFn: async () => {
      if (dateRange === 'all') {
        // Show all-time data (same as dashboard)
        return await adminService.getUsageReports();
      } else {
        const dateTo = new Date();
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - dateRange);
        
        return await adminService.getUsageReports({
          dateFrom: dateFrom.toISOString(),
          dateTo: dateTo.toISOString()
        });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading usage reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load usage reports</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const reports = data?.data || data || {};

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            Usage Reports
          </h1>
          <p className="text-muted-foreground mt-2">Platform usage analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value === 'all' ? 'all' : Number(e.target.value) as 7 | 30 | 90)}
            className="px-4 py-2 bg-card border border-border rounded-lg"
          >
            <option value="all">All Time</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground mb-2">Total Call Minutes</h3>
          <p className="text-3xl font-bold text-foreground">
            {reports.totalCallMinutes?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground mb-2">Chat Conversations</h3>
          <p className="text-3xl font-bold text-foreground">
            {reports.totalChatConversations?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground mb-2">Organizations</h3>
          <p className="text-3xl font-bold text-foreground">
            {reports.usageByOrganization?.length || 0}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Conversations by Channel</h2>
        <div className="space-y-3">
          {reports.conversationsByChannel && Object.entries(reports.conversationsByChannel).map(([channel, count]: [string, any]) => (
            <div key={channel} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="font-medium capitalize">{channel}</span>
              <span className="text-lg font-bold">{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Usage by Organization</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3">Organization</th>
                <th className="text-right p-3">Call Minutes</th>
                <th className="text-right p-3">Chat Conversations</th>
                <th className="text-right p-3">Users</th>
              </tr>
            </thead>
            <tbody>
              {reports.usageByOrganization?.map((org: any) => (
                <tr key={org._id || org.name} className="border-b border-border">
                  <td className="p-3 font-medium">{org.name}</td>
                  <td className="text-right p-3">{org.totalCallMinutes?.toLocaleString() || 0}</td>
                  <td className="text-right p-3">{org.totalChatConversations?.toLocaleString() || 0}</td>
                  <td className="text-right p-3">{org.userCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
