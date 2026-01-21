"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, RefreshCw } from "lucide-react";
import { adminService } from "@/services/admin.service";

export default function AdminBillingPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-billing-overview'],
    queryFn: () => adminService.getBillingOverview()
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading billing overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load billing overview</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const overview = data?.data || data || {};

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-primary" />
            Billing Overview
          </h1>
          <p className="text-muted-foreground mt-2">Revenue & subscriptions</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground mb-2">Total Organizations</h3>
          <p className="text-3xl font-bold text-foreground">
            {overview.totalOrganizations || 0}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground mb-2">Active Subscriptions</h3>
          <p className="text-3xl font-bold text-foreground">
            {overview.activeSubscriptions || 0}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground mb-2">Free Plan</h3>
          <p className="text-3xl font-bold text-foreground">
            {overview.planBreakdown?.free || 0}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground mb-2">Paid Plans</h3>
          <p className="text-3xl font-bold text-foreground">
            {(overview.planBreakdown?.starter || 0) + (overview.planBreakdown?.professional || 0) + (overview.planBreakdown?.enterprise || 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Plan Breakdown</h2>
          <div className="space-y-3">
            {overview.planBreakdown && Object.entries(overview.planBreakdown).map(([plan, count]: [string, any]) => (
              <div key={plan} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="font-medium capitalize">{plan}</span>
                <span className="text-lg font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Breakdown</h2>
          <div className="space-y-3">
            {overview.profileBreakdown && Object.entries(overview.profileBreakdown).map(([profile, count]: [string, any]) => (
              <div key={profile} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="font-medium capitalize">{profile}</span>
                <span className="text-lg font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Organizations with Billing Info</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3">Organization</th>
                <th className="text-left p-3">Plan</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Package</th>
                <th className="text-left p-3">Billing Active</th>
              </tr>
            </thead>
            <tbody>
              {overview.organizationsWithBilling?.map((org: any) => (
                <tr key={org._id} className="border-b border-border">
                  <td className="p-3 font-medium">{org.name}</td>
                  <td className="p-3 capitalize">{org.plan}</td>
                  <td className="p-3 capitalize">{org.status}</td>
                  <td className="p-3 capitalize">{org.ownerProfile?.profileType || 'N/A'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${org.ownerProfile?.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {org.ownerProfile?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
