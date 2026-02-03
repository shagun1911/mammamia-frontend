"use client";

import { Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePhoneSettings } from "@/hooks/usePhoneSettings";
import { usePhoneNumbersList } from "@/hooks/usePhoneNumber";

export default function PhoneConfigurationPage() {
  const router = useRouter();
  const { settings, isLoading } = usePhoneSettings();
  const { data: phoneNumbersList } = usePhoneNumbersList();

  const handleConfigure = () => {
    router.push("/configuration/phone/settings");
  };

  // Check for inbound and outbound connectivity
  const hasOutbound = phoneNumbersList?.some(pn => pn.supports_outbound) || settings?.isConfigured;
  const hasInbound = phoneNumbersList?.some(pn => pn.supports_inbound);
  
  const outboundNumbers = phoneNumbersList?.filter(pn => pn.supports_outbound) || [];
  const inboundNumbers = phoneNumbersList?.filter(pn => pn.supports_inbound) || [];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Small Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Phone Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure AI-powered voice conversations with SIP providers and LiveKit</p>
        </div>

        <div className="max-w-md">
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                {!isLoading && (
                  <div className="flex flex-col gap-2">
                    {hasOutbound && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        ✓ Outbound Connected
                      </span>
                    )}
                    {hasInbound && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                        ✓ Inbound Connected
                      </span>
                    )}
                    {!hasOutbound && !hasInbound && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-500/20 text-muted-foreground">
                        Not Connected
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Phone (Voice)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                AI-powered voice conversations with SIP providers and LiveKit
              </p>

              {/* Connected Numbers Display */}
              {(outboundNumbers.length > 0 || inboundNumbers.length > 0) && (
                <div className="space-y-3 mt-4">
                  {outboundNumbers.length > 0 && (
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">Outbound Numbers</p>
                      </div>
                      <div className="space-y-1">
                        {outboundNumbers.map((pn, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <p className="text-sm font-mono text-foreground font-semibold">{pn.phone_number}</p>
                            {pn.label && <p className="text-xs text-muted-foreground">{pn.label}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {inboundNumbers.length > 0 && (
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <p className="text-xs font-bold text-green-400 uppercase tracking-wide">Inbound Numbers</p>
                      </div>
                      <div className="space-y-1">
                        {inboundNumbers.map((pn, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <p className="text-sm font-mono text-foreground font-semibold">{pn.phone_number}</p>
                            {pn.label && <p className="text-xs text-muted-foreground">{pn.label}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="p-6 pt-0">
              <button
                onClick={handleConfigure}
                className="w-full px-4 py-2.5 bg-primary cursor-pointer text-primary-foreground rounded-lg text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 border border-primary/20 flex items-center justify-center gap-2"
              >
                <span>Configure Settings</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
