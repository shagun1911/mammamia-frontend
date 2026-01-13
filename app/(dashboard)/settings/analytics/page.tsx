"use client";

import { useState } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import { BarChart3, Database, Calendar, Eye } from "lucide-react";

export default function AnalyticsSettingsPage() {
  const { data: settingsData } = useSettings();
  const updateSettings = useUpdateSettings();

  const [enableTracking, setEnableTracking] = useState(settingsData?.enableAnalytics ?? true);
  const [trackCustomerBehavior, setTrackCustomerBehavior] = useState(settingsData?.trackCustomerBehavior ?? true);
  const [dataRetentionDays, setDataRetentionDays] = useState(settingsData?.dataRetentionDays ?? 365);
  const [reportFrequency, setReportFrequency] = useState(settingsData?.reportFrequency ?? "weekly");

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        enableAnalytics: enableTracking,
        trackCustomerBehavior,
        dataRetentionDays,
        reportFrequency,
      });
      toast.success("Analytics settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Small Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure analytics tracking and reporting preferences</p>
        </div>

        <div className="max-w-3xl">

        <div className="space-y-6">
          {/* Tracking */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Tracking</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Enable analytics tracking</p>
                  <p className="text-xs text-muted-foreground">
                    Collect analytics data for conversations and interactions
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableTracking}
                  onChange={(e) => setEnableTracking(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-secondary"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Track customer behavior</p>
                  <p className="text-xs text-muted-foreground">
                    Monitor customer actions and engagement patterns
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={trackCustomerBehavior}
                  onChange={(e) => setTrackCustomerBehavior(e.target.checked)}
                  disabled={!enableTracking}
                  className="w-5 h-5 rounded border-border bg-secondary disabled:opacity-50"
                />
              </label>
            </div>
          </div>

          {/* Data Retention */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Data Retention</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Keep analytics data for (days)
              </label>
              <select
                value={dataRetentionDays}
                onChange={(e) => setDataRetentionDays(parseInt(e.target.value))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="90">90 days (3 months)</option>
                <option value="180">180 days (6 months)</option>
                <option value="365">365 days (1 year)</option>
                <option value="730">730 days (2 years)</option>
                <option value="-1">Forever</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Older analytics data will be automatically deleted
              </p>
            </div>
          </div>

          {/* Reports */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Reports</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email report frequency
              </label>
              <select
                value={reportFrequency}
                onChange={(e) => setReportFrequency(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Receive summary reports via email
              </p>
            </div>
          </div>

          {/* Metrics Configuration */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Metrics</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-lg p-4 border border-border">
                <p className="text-2xl font-bold text-primary">847</p>
                <p className="text-xs text-muted-foreground">Total Conversations</p>
              </div>
              <div className="bg-secondary rounded-lg p-4 border border-border">
                <p className="text-2xl font-bold text-primary">2.4h</p>
                <p className="text-xs text-muted-foreground">Avg Response Time</p>
              </div>
              <div className="bg-secondary rounded-lg p-4 border border-border">
                <p className="text-2xl font-bold text-primary">94%</p>
                <p className="text-xs text-muted-foreground">Customer Satisfaction</p>
              </div>
              <div className="bg-secondary rounded-lg p-4 border border-border">
                <p className="text-2xl font-bold text-primary">1,234</p>
                <p className="text-xs text-muted-foreground">Active Contacts</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
