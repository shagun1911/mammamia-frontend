"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService, IntegrationStatus } from "@/services/admin.service";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Building2, Search } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminIntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery<IntegrationStatus[]>({
    queryKey: ['admin', 'integrations', 'status'],
    queryFn: () => adminService.getIntegrationsStatus(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Sort by latest (most recent update/creation) and filter by search
  const sortedAndFilteredIntegrations = useMemo(() => {
    if (!data) return [];

    let filtered = [...data];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(integration =>
        integration.organization.name.toLowerCase().includes(query) ||
        integration.organization.slug.toLowerCase().includes(query)
      );
    }

    // Sort by latest - organizations with most recent activity first
    filtered.sort((a, b) => {
      // Get most recent timestamp from any integration
      const getLatestTimestamp = (int: IntegrationStatus) => {
        const timestamps = [
          int.google?.lastSyncedAt,
          int.whatsapp?.lastSyncedAt,
          int.instagram?.lastSyncedAt,
          int.facebook?.lastSyncedAt,
          int.ecommerce?.lastSyncedAt
        ].filter(Boolean);

        if (timestamps.length === 0) return 0;
        return Math.max(...timestamps.map(t => new Date(t!).getTime()));
      };

      return getLatestTimestamp(b) - getLatestTimestamp(a);
    });

    return filtered;
  }, [data, searchQuery]);

  // Defensive: Ensure all integration objects exist to avoid undefined errors
  const safeIntegrations = sortedAndFilteredIntegrations.map((integration) => ({
    ...integration,
    google: integration.google || {},
    whatsapp: integration.whatsapp || {},
    instagram: integration.instagram || {},
    facebook: integration.facebook || {},
    ecommerce: integration.ecommerce || {},
    organization: integration.organization || { name: '', slug: '', id: '' },
  }));

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
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-destructive">Failed to load integrations</div>
        {error instanceof Error && (
          <div className="text-xs text-muted-foreground max-w-md text-center">
            {error.message}
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2">Integrations Status</h1>
        <p className="text-muted-foreground mb-6">Monitor integration status across all organizations</p>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Integrations List */}
      {safeIntegrations.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No organizations match your search' : 'No organizations found'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {safeIntegrations.map((integration) => (
            <div
              key={integration.organization.id}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {integration.organization.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{integration.organization.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    (integration.google.connected || integration.whatsapp.connected ||
                      integration.instagram.connected || integration.facebook.connected ||
                      integration.ecommerce?.connected)
                      ? "bg-green-500/10 text-green-500"
                      : "bg-gray-500/10 text-gray-500"
                  )}>
                    {(integration.google.connected || integration.whatsapp.connected ||
                      integration.instagram.connected || integration.facebook.connected ||
                      integration.ecommerce?.connected)
                      ? "Active Integrations"
                      : "No Integrations"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Google */}
                <div className={cn(
                  "border rounded-xl p-4 transition-all hover:shadow-md",
                  integration.google.connected
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border bg-secondary/30"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">Google</span>
                    {integration.google.connected ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  {integration.google.connected ? (
                    <div className="space-y-2 text-xs text-muted-foreground">
                      {integration.google.services && (
                        <div className="space-y-1 bg-background/50 rounded p-2">
                          <div className="flex items-center gap-2">
                            <span className={integration.google.services.gmail ? 'text-green-500' : 'text-gray-400'}>●</span>
                            Gmail
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={integration.google.services.sheets ? 'text-green-500' : 'text-gray-400'}>●</span>
                            Sheets
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={integration.google.services.calendar ? 'text-green-500' : 'text-gray-400'}>●</span>
                            Calendar
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={integration.google.services.drive ? 'text-green-500' : 'text-gray-400'}>●</span>
                            Drive
                          </div>
                        </div>
                      )}
                      {integration.google.tokenExpiry && (
                        <div className="mt-2 text-xs">
                          Expires: {new Date(integration.google.tokenExpiry).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  )}
                </div>

                {/* WhatsApp */}
                <div className={cn(
                  "border rounded-xl p-4 transition-all hover:shadow-md",
                  integration.whatsapp.connected
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border bg-secondary/30"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">WhatsApp</span>
                    {integration.whatsapp.connected ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  {integration.whatsapp.connected ? (
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={integration.whatsapp.webhookVerified ? 'text-green-500' : 'text-orange-500'}>●</span>
                        Webhook: {integration.whatsapp.webhookVerified ? 'Verified' : 'Not Verified'}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  )}
                </div>

                {/* Instagram */}
                <div className={cn(
                  "border rounded-xl p-4 transition-all hover:shadow-md",
                  integration.instagram.connected
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border bg-secondary/30"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">Instagram</span>
                    {integration.instagram.connected ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  {integration.instagram.connected ? (
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={integration.instagram.webhookVerified ? 'text-green-500' : 'text-orange-500'}>●</span>
                        Webhook: {integration.instagram.webhookVerified ? 'Verified' : 'Not Verified'}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  )}
                </div>

                {/* Facebook */}
                <div className={cn(
                  "border rounded-xl p-4 transition-all hover:shadow-md",
                  integration.facebook.connected
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border bg-secondary/30"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">Facebook</span>
                    {integration.facebook.connected ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  {integration.facebook.connected ? (
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={integration.facebook.webhookVerified ? 'text-green-500' : 'text-orange-500'}>●</span>
                        Webhook: {integration.facebook.webhookVerified ? 'Verified' : 'Not Verified'}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  )}
                </div>

                {/* E-commerce */}
                <div className={cn(
                  "border rounded-xl p-4 transition-all hover:shadow-md",
                  integration.ecommerce?.connected
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border bg-secondary/30"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">E-commerce</span>
                    {integration.ecommerce?.connected ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  {integration.ecommerce?.connected ? (
                    <div className="text-xs text-muted-foreground space-y-1 bg-background/50 rounded p-2">
                      <div className="font-medium capitalize">{integration.ecommerce.platform || 'Unknown'}</div>
                      {integration.ecommerce.enabledTriggers !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">●</span>
                          {integration.ecommerce.enabledTriggers} Triggers
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not connected</p>
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
