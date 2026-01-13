"use client";

import { useState } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import { UserPlus, Database, Shield, Upload } from "lucide-react";

export default function ContactsSettingsPage() {
  const { data: settingsData } = useSettings();
  const updateSettings = useUpdateSettings();

  const [allowDuplicates, setAllowDuplicates] = useState(settingsData?.allowDuplicateContacts ?? false);
  const [autoMergeContacts, setAutoMergeContacts] = useState(settingsData?.autoMergeContacts ?? true);
  const [requireEmail, setRequireEmail] = useState(settingsData?.requireEmail ?? false);
  const [requirePhone, setRequirePhone] = useState(settingsData?.requirePhone ?? false);
  const [enableCustomFields, setEnableCustomFields] = useState(settingsData?.enableCustomFields ?? true);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        allowDuplicateContacts: allowDuplicates,
        autoMergeContacts: autoMergeContacts,
        requireEmail,
        requirePhone,
        enableCustomFields,
      });
      toast.success("Contact settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Small Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Contacts</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure how contacts are managed and stored</p>
        </div>

        <div className="max-w-3xl">
          <div className="space-y-6">
          {/* Contact Management */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Contact Management</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Allow duplicate contacts</p>
                  <p className="text-xs text-muted-foreground">
                    Permit multiple contacts with the same email or phone
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowDuplicates}
                  onChange={(e) => setAllowDuplicates(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-secondary"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-merge duplicates</p>
                  <p className="text-xs text-muted-foreground">
                    Automatically merge contacts with matching email or phone
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoMergeContacts}
                  onChange={(e) => setAutoMergeContacts(e.target.checked)}
                  disabled={allowDuplicates}
                  className="w-5 h-5 rounded border-border bg-secondary disabled:opacity-50"
                />
              </label>
            </div>
          </div>

          {/* Required Fields */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Required Fields</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Require email address</p>
                  <p className="text-xs text-muted-foreground">
                    Make email mandatory when creating contacts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requireEmail}
                  onChange={(e) => setRequireEmail(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-secondary"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Require phone number</p>
                  <p className="text-xs text-muted-foreground">
                    Make phone mandatory when creating contacts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requirePhone}
                  onChange={(e) => setRequirePhone(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-secondary"
                />
              </label>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Custom Fields</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Enable custom fields</p>
                  <p className="text-xs text-muted-foreground">
                    Allow adding custom properties to contacts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableCustomFields}
                  onChange={(e) => setEnableCustomFields(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-secondary"
                />
              </label>
            </div>
          </div>

          {/* Import/Export */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Import & Export</h2>
            </div>

            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-secondary hover:bg-accent border border-border rounded-lg text-sm font-medium text-foreground transition-colors">
                Import Contacts from CSV
              </button>
              <button className="w-full px-4 py-2 bg-secondary hover:bg-accent border border-border rounded-lg text-sm font-medium text-foreground transition-colors">
                Export All Contacts
              </button>
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
