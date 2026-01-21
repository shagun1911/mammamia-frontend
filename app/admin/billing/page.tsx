"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, RefreshCw, TrendingUp, DollarSign, Users, Loader2, ArrowLeft } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { planService, Plan } from "@/services/plan.service";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminBillingPage() {
  const { data: billingData, isLoading: loadingBilling, error, refetch } = useQuery({
    queryKey: ['admin-billing-overview'],
    queryFn: () => adminService.getBillingOverview()
  });

  const { data: plans, isLoading: loadingPlans } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => planService.getAllPlans(),
  });

  if (loadingBilling || loadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load billing overview</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const overview = billingData?.data || billingData || {};

  // Calculate revenue
  const calculateMonthlyRevenue = () => {
    if (!overview.planBreakdown || !plans) return 0;
    
    let total = 0;
    Object.entries(overview.planBreakdown).forEach(([planSlug, count]: [string, any]) => {
      const plan = plans.find(p => p.slug === planSlug);
      if (plan) {
        total += plan.price * count;
      }
    });
    return total;
  };

  const monthlyRevenue = calculateMonthlyRevenue();
  const annualRevenue = monthlyRevenue * 12;

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-8 h-8 text-primary" />
              Billing Overview
            </h1>
            <p className="text-muted-foreground mt-1">Revenue & subscription analytics</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-secondary flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-muted-foreground">Monthly Revenue</h3>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${monthlyRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-muted-foreground">Annual Revenue</h3>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${annualRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-muted-foreground">Total Organizations</h3>
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            {overview.totalOrganizations || 0}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-muted-foreground">Paid Plans</h3>
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            {Object.entries(overview.planBreakdown || {}).reduce((sum, [slug, count]: [string, any]) => {
              return slug !== 'free' ? sum + count : sum;
            }, 0)}
          </p>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Plan Distribution
          </h2>
          <div className="space-y-3">
            {plans && plans.map((plan) => {
              const count = overview.planBreakdown?.[plan.slug] || 0;
              const percentage = overview.totalOrganizations > 0 
                ? ((count / overview.totalOrganizations) * 100).toFixed(1)
                : 0;

              return (
                <div key={plan.slug} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-xs text-muted-foreground">(${plan.price}/mo)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        plan.slug === 'free' ? "bg-gray-500" :
                        plan.slug === 'starter' ? "bg-blue-500" :
                        plan.slug === 'professional' ? "bg-purple-500" :
                        "bg-green-500"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Revenue by Plan
          </h2>
          <div className="space-y-3">
            {plans && plans.map((plan) => {
              const count = overview.planBreakdown?.[plan.slug] || 0;
              const revenue = plan.price * count;

              return (
                <div key={plan.slug} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <div className="font-medium">{plan.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {count} org{count !== 1 ? 's' : ''} × ${plan.price}/mo
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${revenue}/mo
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${revenue * 12}/yr
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Organizations
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-foreground uppercase">Organization</th>
                <th className="text-left p-3 text-xs font-semibold text-foreground uppercase">Plan</th>
                <th className="text-left p-3 text-xs font-semibold text-foreground uppercase">Status</th>
                <th className="text-right p-3 text-xs font-semibold text-foreground uppercase">MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {overview.organizationsWithBilling?.map((org: any) => {
                const orgPlan = plans?.find(p => p.slug === org.plan);
                return (
                  <tr key={org._id} className="hover:bg-secondary/50">
                    <td className="p-3 font-medium text-foreground">{org.name}</td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        org.plan === 'free' ? "bg-gray-500/20 text-gray-600 dark:text-gray-400" :
                        org.plan === 'starter' ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" :
                        org.plan === 'professional' ? "bg-purple-500/20 text-purple-600 dark:text-purple-400" :
                        "bg-green-500/20 text-green-600 dark:text-green-400"
                      )}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium capitalize",
                        org.status === 'active' ? "bg-green-500/20 text-green-600 dark:text-green-400" :
                        org.status === 'trial' ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                        "bg-red-500/20 text-red-600 dark:text-red-400"
                      )}>
                        {org.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold text-foreground">
                      ${orgPlan?.price || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
