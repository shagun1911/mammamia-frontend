"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, RefreshCw, TrendingUp, Euro, Users, Loader2, ArrowLeft, Clock } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { planService, Plan } from "@/services/plan.service";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AdminBillingPage() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState<string>("just now");

  const { data: billingData, isLoading: loadingBilling, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-billing-overview'],
    queryFn: () => adminService.getBillingOverview(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  const { data: plans, isLoading: loadingPlans } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => planService.getAllPlans(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Update last updated timestamp when data changes
  useEffect(() => {
    if (billingData && !loadingBilling) {
      setLastUpdated(new Date());
    }
  }, [billingData, loadingBilling]);

  // Update time ago display every second
  useEffect(() => {
    const updateTimeAgo = () => {
      const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
      if (seconds < 5) {
        setTimeAgo("just now");
      } else if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  if (loadingBilling || loadingPlans) {
    return (
      <div className="p-8">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-4 w-32 bg-secondary rounded mb-2 animate-pulse" />
          <div className="flex items-center justify-between">
            <div>
              <div className="h-10 w-64 bg-secondary rounded animate-pulse mb-2" />
              <div className="h-4 w-48 bg-secondary rounded animate-pulse" />
            </div>
            <div className="h-10 w-24 bg-secondary rounded animate-pulse" />
          </div>
        </div>

        {/* Revenue Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6">
              <div className="h-4 w-32 bg-secondary rounded animate-pulse mb-4" />
              <div className="h-8 w-24 bg-secondary rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6">
              <div className="h-6 w-40 bg-secondary rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-12 bg-secondary rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="h-6 w-32 bg-secondary rounded animate-pulse mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-secondary rounded animate-pulse" />
            ))}
          </div>
        </div>
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
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground">Revenue & subscription analytics</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Updated {timeAgo}</span>
                {isFetching && !loadingBilling && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className={cn(
              "px-4 py-2 bg-card border border-border rounded-lg hover:bg-secondary flex items-center gap-2 transition-colors",
              isFetching && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/20 rounded-xl p-6 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-muted-foreground">Monthly Revenue</h3>
            <Euro className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-foreground transition-all duration-300">
            €{monthlyRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/20 rounded-xl p-6 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-muted-foreground">Annual Revenue</h3>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-foreground transition-all duration-300">
            €{annualRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-muted-foreground">Total Organizations</h3>
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground transition-all duration-300">
            {overview.totalOrganizations || 0}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-muted-foreground">Paid Plans</h3>
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground transition-all duration-300">
              {Object.entries(overview.planBreakdown || {}).reduce((sum, [slug, count]: [string, any]) => {
              return slug !== 'mileva-pack' ? sum + count : sum;
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
                      <span className="text-xs text-muted-foreground">(€{plan.price}/mo)</span>
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
                        plan.slug === 'mileva-pack' ? "bg-gray-500" :
                          plan.slug === 'nobel-pack' ? "bg-blue-500" :
                            plan.slug === 'aistein-pro-pack' ? "bg-purple-500" :
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
            <Euro className="w-5 h-5 text-primary" />
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
                      {count} org{count !== 1 ? 's' : ''} × €{plan.price}/mo
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      €{revenue}/mo
                    </div>
                    <div className="text-xs text-muted-foreground">
                      €{revenue * 12}/yr
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
                        org.plan === 'mileva-pack' ? "bg-gray-500/20 text-gray-600 dark:text-gray-400" :
                          org.plan === 'nobel-pack' ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" :
                            org.plan === 'aistein-pro-pack' ? "bg-purple-500/20 text-purple-600 dark:text-purple-400" :
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
                      €{orgPlan?.price || 0}
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
