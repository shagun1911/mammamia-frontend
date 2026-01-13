"use client";

import { Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePhoneSettings } from "@/hooks/usePhoneSettings";

export default function PhoneConfigurationPage() {
  const router = useRouter();
  const { settings, isLoading } = usePhoneSettings();

  const handleConfigure = () => {
    router.push("/configuration/phone/settings");
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Phone Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure AI-powered voice conversations with SIP providers and LiveKit
          </p>
        </div>

        <div className="max-w-md">
          <div className="bg-card border border-border rounded-xl p-6 h-[200px] flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              {!isLoading && (
                <span
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium ${
                    settings?.isConfigured
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-muted-foreground"
                  }`}
                >
                  {settings?.isConfigured ? "Connected" : "Not Connected"}
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2">Phone (Voice)</h3>
            <p className="text-sm text-muted-foreground mb-auto">
              AI-powered voice conversations with SIP providers and LiveKit
            </p>

            {settings?.isConfigured && settings.twilioPhoneNumber && (
              <div className="mb-3 text-xs text-muted-foreground">
                Number: <span className="text-foreground font-mono">{settings.twilioPhoneNumber}</span>
              </div>
            )}

            <button
              onClick={handleConfigure}
              className="w-full mt-3 px-3 py-2 bg-primary cursor-pointer text-primary-foreground rounded-lg text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 border border-primary/20"
            >
              Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
