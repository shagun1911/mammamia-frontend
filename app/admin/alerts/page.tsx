"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { adminService } from "@/services/admin.service";

export default function AdminAlertsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-system-alerts'],
    queryFn: () => adminService.getSystemAlerts(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading system alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load system alerts</p>
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

  const alertsData = data?.data || data || {};
  const alerts = alertsData.alerts || [];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-500/50 bg-red-500/10';
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'low':
        return 'border-blue-500/50 bg-blue-500/10';
      default:
        return 'border-border bg-card';
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="w-8 h-8 text-primary" />
            Alerts & Notifications
          </h1>
          <p className="text-muted-foreground mt-2">System alerts</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Active Alerts</h2>
          <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
            {alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'}
          </span>
        </div>
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500/50 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">All systems operational</p>
            <p className="text-sm text-muted-foreground mt-2">No active alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity || 'low')}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity || 'low')}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground">{alert.title}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
