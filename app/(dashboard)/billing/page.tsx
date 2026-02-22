"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { Loader2, CreditCard, TrendingUp, Check, Phone, MessageSquare, Zap, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  features: {
    callMinutes: number;
    chatConversations: number;
    automations: number;
    users: number;
    customFeatures: string[];
  };
}

interface OrganizationUsage {
  callMinutes: number;
  chatMessages: number;
  conversations: number;
  automations: number;
  campaignSends: number;
}

interface BillingData {
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    selectedProfile: string;
  };
  plan?: Plan;
  profile?: {
    profileType: string;
    chatConversationsLimit: number;
    voiceMinutesLimit: number;
    chatConversationsUsed: number;
    voiceMinutesUsed: number;
    automationsUsed: number;
    automationsLimit: number;
  };
  usage: OrganizationUsage;
}

export default function BillingPage() {
  const { user } = useAuth();

  const { data: billingData, isLoading } = useQuery<BillingData>({
    queryKey: ['user-billing', user?.id],
    queryFn: async () => {
      const response = await apiClient.get('/profile/billing');
      return response;
    },
    enabled: !!user?.id,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time data
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const plan = billingData?.plan;
  const usage = billingData?.usage;
  const profile = billingData?.profile;
  const currentUser = billingData?.user;

  const getPercentage = (used: number, limit: number): number => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Billing & Usage</h1>
        <p className="text-muted-foreground">View your current plan and usage details</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-linear-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Current Plan</h2>
            </div>
            <p className="text-muted-foreground">
              {currentUser?.firstName} {currentUser?.lastName} ({currentUser?.email})
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary capitalize">
              {plan?.name || currentUser?.selectedProfile || 'Free'}
            </div>
            <div className="text-sm text-muted-foreground">
              €{plan?.price ?? 0}/month
            </div>
          </div>
        </div>

        {plan?.description && (
          <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
        )}

        {/* Plan Features */}
        {plan?.features && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-card/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Call Minutes</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {plan.features.callMinutes === -1 ? 'Unlimited' : (profile?.voiceMinutesLimit || plan.features.callMinutes)}
              </div>
            </div>
            <div className="bg-card/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Chats</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {plan.features.chatConversations === -1 ? 'Unlimited' : (profile?.chatConversationsLimit || plan.features.chatConversations)}
              </div>
            </div>
            <div className="bg-card/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Automations</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {plan.features.automations === -1 ? 'Unlimited' : (profile?.automationsLimit || plan.features.automations)}
              </div>
            </div>
            <div className="bg-card/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Users</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {plan.features.users === -1 ? 'Unlimited' : plan.features.users}
              </div>
            </div>
          </div>
        )}

        {plan?.features?.customFeatures && plan.features.customFeatures.length > 0 && (
          <div className="mt-4 pt-4 border-t border-primary/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {plan.features.customFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Usage Overview */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Usage Overview</h2>
        </div>

        <div className="space-y-6">
          {/* Call Minutes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Call Minutes</span>
              </div>
              <div className="text-sm font-medium text-foreground">
                {profile?.voiceMinutesUsed || usage?.callMinutes || 0} / {plan?.features.callMinutes === -1 ? '∞' : (profile?.voiceMinutesLimit || plan?.features.callMinutes || 0)}
                {plan?.features.callMinutes !== -1 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({Math.max(0, (profile?.voiceMinutesLimit || plan?.features.callMinutes || 0) - (profile?.voiceMinutesUsed || usage?.callMinutes || 0))} left)
                  </span>
                )}
              </div>
            </div>
            {plan?.features.callMinutes !== -1 && (
              <>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      getProgressColor(getPercentage(usage?.callMinutes || 0, plan?.features.callMinutes || 0))
                    )}
                    style={{ width: `${getPercentage(usage?.callMinutes || 0, plan?.features.callMinutes || 0)}%` }}
                  />
                </div>
                {getPercentage(usage?.callMinutes || 0, plan?.features.callMinutes || 100) >= 90 && (
                  <div className="flex items-start gap-2 mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">
                      You're approaching your call minutes limit. Consider upgrading your plan.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chat Conversations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Chat Messages</span>
              </div>
              <div className="text-sm font-medium text-foreground">
                {profile?.chatConversationsUsed || usage?.chatMessages || 0} / {plan?.features.chatConversations === -1 ? '∞' : (profile?.chatConversationsLimit || plan?.features.chatConversations || 0)}
                {plan?.features.chatConversations !== -1 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({Math.max(0, (profile?.chatConversationsLimit || plan?.features.chatConversations || 0) - (profile?.chatConversationsUsed || usage?.chatMessages || 0))} left)
                  </span>
                )}
              </div>
            </div>
            {plan?.features.chatConversations !== -1 && (
              <>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      getProgressColor(getPercentage(usage?.chatMessages || 0, plan?.features.chatConversations || 0))
                    )}
                    style={{ width: `${getPercentage(usage?.chatMessages || 0, plan?.features.chatConversations || 0)}%` }}
                  />
                </div>
                {getPercentage(usage?.chatMessages || 0, plan?.features.chatConversations || 100) >= 90 && (
                  <div className="flex items-start gap-2 mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">
                      You're approaching your chat conversations limit. Consider upgrading your plan.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Automations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Active Automations</span>
              </div>
              <div className="text-sm font-medium text-foreground">
                {(profile?.automationsUsed || usage?.automations || 0)} / {plan?.features.automations === -1 ? '∞' : (profile?.automationsLimit || plan?.features.automations || 0)}
                {plan?.features.automations !== -1 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({Math.max(0, (profile?.automationsLimit || plan?.features.automations || 0) - (profile?.automationsUsed || usage?.automations || 0))} left)
                  </span>
                )}
              </div>
            </div>
            {plan?.features.automations !== -1 && (
              <>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      getProgressColor(getPercentage((profile?.automationsUsed || usage?.automations || 0), (profile?.automationsLimit || plan?.features.automations || 0)))
                    )}
                    style={{ width: `${getPercentage((profile?.automationsUsed || usage?.automations || 0), (profile?.automationsLimit || plan?.features.automations || 0))}%` }}
                  />
                </div>
                {getPercentage((profile?.automationsUsed || usage?.automations || 0), (profile?.automationsLimit || plan?.features.automations || 5)) >= 90 && (
                  <div className="flex items-start gap-2 mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">
                      You're approaching your automations limit. Consider upgrading your plan.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Plan Section */}
      <div className="bg-linear-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Need More Resources?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upgrade your plan to unlock more features, increase limits, and grow your business.
        </p>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Contact your administrator to upgrade your plan
          </div>
          <a
            href="mailto:support@aistein.ai?subject=Plan%20Upgrade%20Request"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
          >
            <CreditCard className="w-4 h-4" />
            Request Upgrade
          </a>
        </div>
      </div>
    </div>
  );
}
