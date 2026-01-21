"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService, IntegrationStatus } from "@/services/admin.service";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Building2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminIntegrationsPage() {
  const { data, isLoading, error } = useQuery<IntegrationStatus[]>({
    queryKey: ['admin', 'integrations', 'status'],
    queryFn: () => adminService.getIntegrationsStatus(),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    toast.error('Failed to load integrations status');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">Failed to load integrations</div>
      </div>
    );
  }

  const integrations = data || [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Integrations Status</h1>
        <p className="text-muted-foreground">View integration status across all organizations</p>
      </div>

      {/* Integrations List */}
      {integrations.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No organizations found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.organization.id}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {integration.organization.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{integration.organization.slug}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Google */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Google</span>
                    {integration.google.connected ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  {integration.google.connected && (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {integration.google.services && (
                        <div>
                          <div>Gmail: {integration.google.services.gmail ? '✓' : '✗'}</div>
                          <div>Sheets: {integration.google.services.sheets ? '✓' : '✗'}</div>
                          <div>Calendar: {integration.google.services.calendar ? '✓' : '✗'}</div>
                          <div>Drive: {integration.google.services.drive ? '✓' : '✗'}</div>
                        </div>
                      )}
                      {integration.google.tokenExpiry && (
                        <div className="mt-2">
                          Expires: {new Date(integration.google.tokenExpiry).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">WhatsApp</span>
                    {integration.whatsapp.connected ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  {integration.whatsapp.connected && (
                    <div className="text-xs text-muted-foreground">
                      Webhook: {integration.whatsapp.webhookVerified ? 'Verified' : 'Not Verified'}
                    </div>
                  )}
                </div>

                {/* Instagram */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Instagram</span>
                    {integration.instagram.connected ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  {integration.instagram.connected && (
                    <div className="text-xs text-muted-foreground">
                      Webhook: {integration.instagram.webhookVerified ? 'Verified' : 'Not Verified'}
                    </div>
                  )}
                </div>

                {/* Facebook */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Facebook</span>
                    {integration.facebook.connected ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  {integration.facebook.connected && (
                    <div className="text-xs text-muted-foreground">
                      Webhook: {integration.facebook.webhookVerified ? 'Verified' : 'Not Verified'}
                    </div>
                  )}
                </div>

                {/* E-commerce */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">E-commerce</span>
                    {integration.ecommerce?.connected ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  {integration.ecommerce?.connected && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Platform: {integration.ecommerce.platform || 'Unknown'}</div>
                      {integration.ecommerce.enabledTriggers !== undefined && (
                        <div>Triggers: {integration.ecommerce.enabledTriggers}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
