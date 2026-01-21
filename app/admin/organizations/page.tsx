"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService, OrganizationWithUsage } from "@/services/admin.service";
import { ArrowLeft, Search, Building2, Phone, MessageSquare, Zap, Loader2, Filter } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminOrganizationsPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery<OrganizationWithUsage[]>({
    queryKey: ['admin', 'organizations', planFilter, statusFilter],
    queryFn: () => adminService.getOrganizations({
      plan: planFilter !== 'all' ? planFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    toast.error('Failed to load organizations');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">Failed to load organizations</div>
      </div>
    );
  }

  const organizations = data || [];
  const filteredOrganizations = search
    ? organizations.filter(org =>
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.slug.toLowerCase().includes(search.toLowerCase())
      )
    : organizations;

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
        <h1 className="text-3xl font-bold text-foreground">Organizations</h1>
        <p className="text-muted-foreground">View usage analytics and plan information</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Organizations Table */}
      {filteredOrganizations.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No organizations found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Call Minutes</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Chat Conversations</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Automations</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Integrations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrganizations.map((org) => (
                  <tr key={org._id} className="hover:bg-secondary/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{org.name}</div>
                      <div className="text-sm text-muted-foreground">{org.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                        {org.planDetails?.name || org.plan || 'Not available'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium capitalize",
                          org.planDetails?.status === 'active' || org.status === 'active'
                            ? "bg-green-500/10 text-green-500"
                            : org.planDetails?.status === 'trial' || org.status === 'trial'
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-gray-500/10 text-gray-500"
                        )}
                      >
                        {org.planDetails?.status || org.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {org.planDetails?.package ? (
                        <span className="capitalize">{org.planDetails.package}</span>
                      ) : (
                        <span className="text-muted-foreground">Not available</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{org.usage.callMinutes.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{org.usage.chatConversations.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{org.usage.automations}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {org.integrations.google && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" title="Google" />
                        )}
                        {org.integrations.whatsapp && (
                          <div className="w-2 h-2 rounded-full bg-green-500" title="WhatsApp" />
                        )}
                        {org.integrations.ecommerce.connected && (
                          <div className="w-2 h-2 rounded-full bg-amber-500" title={`E-commerce: ${org.integrations.ecommerce.platform}`} />
                        )}
                        {!org.integrations.google && !org.integrations.whatsapp && !org.integrations.ecommerce.connected && (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
