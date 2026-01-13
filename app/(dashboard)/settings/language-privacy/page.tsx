"use client";

import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import { Globe, Shield, Lock, Eye } from "lucide-react";
import { useLanguage, languageNames, Language } from "@/contexts/LanguageContext";
import { useTranslate } from "@/components/ui/TranslatedText";

export default function LanguagePrivacySettingsPage() {
  const { data: settingsData } = useSettings();
  const updateSettings = useUpdateSettings();
  const { language: currentLanguage, setLanguage: setGlobalLanguage } = useLanguage();
  const { t } = useTranslate();

  const [language, setLanguageLocal] = useState<Language>(currentLanguage);
  const [timezone, setTimezone] = useState(settingsData?.timezone ?? "UTC");
  const [dataCollection, setDataCollection] = useState(settingsData?.dataCollection ?? true);
  const [shareAnalytics, setShareAnalytics] = useState(settingsData?.shareAnalytics ?? false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(settingsData?.twoFactorEnabled ?? false);

  useEffect(() => {
    setLanguageLocal(currentLanguage);
  }, [currentLanguage]);

  const handleSave = async () => {
    try {
      // Update global language context
      setGlobalLanguage(language);
      
      // Save to backend
      await updateSettings.mutateAsync({
        language,
        timezone,
        dataCollection,
        shareAnalytics,
        twoFactorEnabled,
      });
      toast.success(t("Language & Privacy settings saved successfully!"));
    } catch (error: any) {
      toast.error(error.message || t("Failed to save settings"));
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Small Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">{t("Language & Privacy")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("Configure language preferences and privacy options")}</p>
        </div>

        <div className="max-w-3xl">
          <div className="space-y-6">
          {/* Language Settings */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t("Language")}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("Interface Language")}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguageLocal(e.target.value as Language)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="en">English</option>
                  <option value="it">Italiano (Italian)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="tr">Türkçe (Turkish)</option>
                  <option value="ar">العربية (Arabic)</option>
                </select>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("The interface will be translated automatically using Google Cloud Translation API")}
                </p>
                <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500">
                  💡 {t("If you see a Google Translate popup, please disable the browser extension for this site")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("Timezone")}
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="America/Chicago">Central Time (US & Canada)</option>
                  <option value="America/Denver">Mountain Time (US & Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Shanghai">Shanghai (CST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t("Privacy")}</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("Allow data collection")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("Help us improve by collecting usage data")}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={dataCollection}
                  onChange={(e) => setDataCollection(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-secondary"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("Share anonymous analytics")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("Share anonymous usage statistics to improve the platform")}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={shareAnalytics}
                  onChange={(e) => setShareAnalytics(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-secondary"
                />
              </label>
            </div>
          </div>

          {/* Security */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t("Security")}</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("Two-factor authentication")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("Add an extra layer of security to your account")}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-secondary"
                />
              </label>

              <button className="w-full px-4 py-2 bg-secondary hover:bg-accent border border-border rounded-lg text-sm font-medium text-foreground transition-colors">
                {t("Change Password")}
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t("Data Management")}</h2>
            </div>

            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-secondary hover:bg-accent border border-border rounded-lg text-sm font-medium text-foreground transition-colors text-left">
                {t("Download My Data")}
              </button>
              <button className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded-lg text-sm font-medium text-red-500 transition-colors text-left">
                {t("Delete My Account")}
              </button>
              <p className="text-xs text-muted-foreground">
                {t("Deleting your account will permanently remove all your data and cannot be undone.")}
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateSettings.isPending ? t("Saving...") : t("Save Settings")}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
