"use client";

import { useState } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import { Bell, Clock, Users, MessageSquare } from "lucide-react";

export default function ConversationsSettingsPage() {
  const { data: settingsData } = useSettings();
  const updateSettings = useUpdateSettings();

  const [autoAssign, setAutoAssign] = useState(settingsData?.autoAssign ?? true);
  const [roundRobinAssignment, setRoundRobinAssignment] = useState(settingsData?.roundRobinAssignment ?? false);
  const [notifyOnNewConversation, setNotifyOnNewConversation] = useState(settingsData?.emailNotifications ?? true);
  const [soundNotification, setSoundNotification] = useState(settingsData?.soundNotifications ?? true);
  const [maxResponseTime, setMaxResponseTime] = useState(settingsData?.maxResponseTime ?? 24);
  const [autoCloseAfterDays, setAutoCloseAfterDays] = useState(settingsData?.autoCloseAfterDays ?? 7);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        autoAssign,
        roundRobinAssignment,
        emailNotifications: notifyOnNewConversation,
        soundNotifications: soundNotification,
        maxResponseTime,
        autoCloseAfterDays,
      });
      toast.success("Conversation settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Small Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Conversations</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage how conversations are assigned and handled</p>
        </div>

        <div className="max-w-3xl">

        <div className="space-y-6">
          {/* Auto Assignment */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Auto Assignment</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-assign conversations</p>
                  <p className="text-xs text-muted-foreground">
                    Automatically assign new conversations to available operators
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoAssign}
                  onChange={(e) => setAutoAssign(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-secondary"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Round-robin assignment</p>
                  <p className="text-xs text-muted-foreground">
                    Distribute conversations evenly among operators
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={roundRobinAssignment}
                  onChange={(e) => setRoundRobinAssignment(e.target.checked)}
                  disabled={!autoAssign}
                  className="w-5 h-5 rounded border-border bg-secondary disabled:opacity-50"
                />
              </label>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Email notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Receive email alerts for new conversations
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnNewConversation}
                  onChange={(e) => setNotifyOnNewConversation(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-secondary"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Sound notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Play sound when new messages arrive
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={soundNotification}
                  onChange={(e) => setSoundNotification(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-secondary"
                />
              </label>
            </div>
          </div>

          {/* Response Time */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Response Time</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Expected response time (hours)
                </label>
                <input
                  type="number"
                  value={maxResponseTime}
                  onChange={(e) => setMaxResponseTime(parseInt(e.target.value) || 24)}
                  min="1"
                  max="168"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Show warning if no response within this time
                </p>
              </div>
            </div>
          </div>

          {/* Auto Close */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Auto Close</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Auto-close after (days)
              </label>
              <input
                type="number"
                value={autoCloseAfterDays}
                onChange={(e) => setAutoCloseAfterDays(parseInt(e.target.value) || 7)}
                min="1"
                max="90"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Automatically close resolved conversations after this many days of inactivity
              </p>
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
