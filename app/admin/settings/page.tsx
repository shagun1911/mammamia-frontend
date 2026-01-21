"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, RefreshCw } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { toast } from "@/lib/toast";

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<any>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: () => adminService.getSystemSettings()
  });

  useEffect(() => {
    if (data) {
      const settingsData = data?.data || data || {};
      setSettings(settingsData);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (newSettings: any) => adminService.updateSystemSettings(newSettings),
    onSuccess: () => {
      toast.success('System settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings');
    }
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading system settings...</p>
        </div>
      </div>
    );
  }

  const systemSettings = data?.data || data || {};

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary" />
            System Settings
          </h1>
          <p className="text-muted-foreground mt-2">Platform configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 flex items-center gap-2 disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Platform Information</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Platform Name</label>
            <input
              type="text"
              value={settings.platformName || systemSettings.platformName || ''}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              className="w-full mt-1 px-4 py-2 bg-background border border-border rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Version</label>
            <input
              type="text"
              value={settings.version || systemSettings.version || ''}
              onChange={(e) => setSettings({ ...settings, version: e.target.value })}
              className="w-full mt-1 px-4 py-2 bg-background border border-border rounded-lg"
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.maintenanceMode ?? systemSettings.maintenanceMode ?? false}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-muted-foreground">Maintenance Mode</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Feature Flags</h2>
        <div className="space-y-3">
          {systemSettings.features && Object.entries(systemSettings.features).map(([feature, enabled]: [string, any]) => (
            <label key={feature} className="flex items-center gap-2 p-3 bg-secondary rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={settings.features?.[feature] ?? enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  features: {
                    ...settings.features,
                    [feature]: e.target.checked
                  }
                })}
                className="w-4 h-4"
              />
              <span className="font-medium capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
