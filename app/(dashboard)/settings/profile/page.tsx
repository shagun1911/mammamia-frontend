"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Sparkles, TrendingUp, Calendar, AlertCircle, CheckCircle, Trash2, Phone, MessageSquare, Users } from "lucide-react";
import { planService, Plan } from "@/services/plan.service";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileType {
  type: string;
  name: string;
  duration: string;
  chatConversations: number;
  voiceMinutes: number;
  description: string;
}

interface UsageStats {
  hasProfile: boolean;
  selectedProfile: string | null;
  profileType?: string;
  chatConversations: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  voiceMinutes: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  automations?: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  billingCycle?: {
    start: string;
    end: string;
    daysRemaining: number;
  };
}

export default function ProfilePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const getProfileIcon = (slug: string) => {
    switch (slug) {
      case 'aistein-pro-pack':
        return <Crown className="w-8 h-8" />;
      case 'mileva-pack':
        return <Zap className="w-8 h-8" />;
      case 'nobel-pack':
        return <Sparkles className="w-8 h-8" />;
      case 'set-up':
        return <TrendingUp className="w-8 h-8" />;
      default:
        return <TrendingUp className="w-8 h-8" />;
    }
  };

  const getProfileColor = (slug: string) => {
    switch (slug) {
      case 'aistein-pro-pack':
        return 'from-cyan-400 to-blue-500'; // Blue
      case 'mileva-pack':
        return 'from-green-400 to-emerald-500'; // Green
      case 'nobel-pack':
        return 'from-orange-400 to-amber-500'; // Orange
      case 'set-up':
        return 'from-purple-500 to-violet-600'; // Purple
      default:
        return 'from-primary/80 to-primary';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Use Promise.allSettled to ensure both complete even if one fails
        await Promise.allSettled([
          fetchPlans(),
          fetchBillingInfo()
        ]);
      } catch (error) {
        console.error("Failed to load profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await planService.getAllPlans();
      // Sort plans by price
      setPlans(data.sort((a: Plan, b: Plan) => a.price - b.price));
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      toast.error("Failed to load available plans");
    }
  };

  const fetchBillingInfo = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.warn("No access token found");
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/usage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data.data?.usage || data.data);
        if (data.data?.usage?.selectedProfile || data.data?.selectedProfile) {
          setCurrentPlanId(data.data.usage?.selectedProfile || data.data.selectedProfile);
        }
      } else {
        console.warn("Failed to fetch usage:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
      // Don't block rendering if usage fetch fails
    }
  };

  const handleSelectProfile = async (profileType: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/select`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profileType }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPlanId(profileType);
        setUsage(data.data.usage);
        setNotification({
          type: 'success',
          message: `Successfully switched to ${profileType.charAt(0).toUpperCase() + profileType.slice(1)} package`
        });
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to select profile'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error("Failed to select profile:", error);
      setNotification({
        type: 'error',
        message: 'Failed to select profile'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    // For now, redirect to email for upgrade as per Billing page
    // In future, implement direct plan switching or Stripe integration
    window.location.href = `mailto:support@aistein.ai?subject=Upgrade%20to%20${plan.name}%20Plan&body=I%20would%20like%20to%20upgrade%20my%20subscription%20to%20the%20${plan.name}%20plan.`;
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type 'DELETE' to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      await authService.deleteAccount();
      toast.success("Your account has been deleted successfully");
      // The service will handle redirect
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      toast.error(error.message || "Failed to delete account");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
        {/* Small Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Profile & Subscription</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose the perfect plan for your AI communication needs</p>
        </div>

        {/* Current Usage Stats */}
        {usage && (
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Current Plan: {usage.profileType}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Track your usage and manage your subscription
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Chat Conversations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Chat Conversations
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {usage.chatConversations.used} / {usage.chatConversations.limit === -1 ? '∞' : usage.chatConversations.limit}
                  </span>
                </div>
                {usage.chatConversations.limit !== -1 && (
                  <>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${usage.chatConversations.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {usage.chatConversations.remaining} conversations remaining
                    </p>
                  </>
                )}
              </div>

              {/* Voice Minutes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Voice Minutes
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {usage.voiceMinutes.used} / {usage.voiceMinutes.limit === -1 ? '∞' : usage.voiceMinutes.limit}
                  </span>
                </div>
                {usage.voiceMinutes.limit !== -1 && (
                  <>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${usage.voiceMinutes.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {usage.voiceMinutes.remaining} minutes remaining
                    </p>
                  </>
                )}
              </div>

              {/* Automations */}
              {usage.automations && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Automations
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {usage.automations.used} / {usage.automations.limit === -1 ? '∞' : usage.automations.limit}
                    </span>
                  </div>
                  {usage.automations.limit !== -1 && (
                    <>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${usage.automations.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {usage.automations.remaining} automations remaining
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Available Plans */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Available Packages
          </h2>
          {loading && plans.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {plans.map((plan) => {
              const isCurrentPlan = currentPlanId === plan._id || currentPlanId === plan.slug;

              return (
                <Card
                  key={plan._id}
                  className={cn(
                    "relative overflow-hidden transition-all hover:shadow-lg flex flex-col h-full",
                    isCurrentPlan ? "border-primary border-2 shadow-xl" : "border-border"
                  )}
                >
                  {/* Gradient Header */}
                  <div className={`bg-gradient-to-r ${getProfileColor(plan.slug)} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-4">
                      {getProfileIcon(plan.slug)}
                      {isCurrentPlan && (
                        <div className="bg-white text-primary rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-sm opacity-90">/month</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="p-6 space-y-4 flex flex-col flex-1">
                    <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                      {plan.description}
                    </p>

                    <div className="space-y-3 flex-1">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {plan.features.chatConversations === -1 ? 'Unlimited' : plan.features.chatConversations.toLocaleString()} Chats
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {plan.features.callMinutes === -1 ? 'Unlimited' : plan.features.callMinutes.toLocaleString()} Voice Minutes
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {plan.features.automations === -1 ? 'Unlimited' : plan.features.automations.toLocaleString()} Automations
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Users className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {plan.features.users === -1 ? 'Unlimited' : plan.features.users.toLocaleString()} Users
                          </p>
                        </div>
                      </div>

                      {plan.features.customFeatures && plan.features.customFeatures.length > 0 && (
                        <div className="pt-2 border-t border-border mt-2">
                          {plan.features.customFeatures.slice(0, 3).map((feature: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground mt-1">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                              <span className="truncate">{feature}</span>
                            </div>
                          ))}
                          {plan.features.customFeatures.length > 3 && (
                            <p className="text-xs text-muted-foreground mt-1 pl-5">
                              + {plan.features.customFeatures.length - 3} more...
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isCurrentPlan}
                      className="w-full mt-auto cursor-pointer"
                      variant={isCurrentPlan ? "outline" : "default"}
                    >
                      {isCurrentPlan ? "Current Plan" : "Upgrade"}
                    </Button>
                  </div>
                </Card>
              );
            })}
            </div>
          )}
        </div>

        {/* Info Box */}
        <Card className="p-6 bg-secondary/50">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            How Credits Work
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Credits reset monthly on your billing cycle date</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Each new conversation counts as 1 chat credit</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Voice minutes are calculated per call (rounded up to the nearest minute)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Unused credits do not roll over to the next billing cycle</span>
            </li>
          </ul>
        </Card>

        {/* Delete Account Section */}
        <Card className="p-6 border-destructive/50 bg-destructive/5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-destructive mb-2 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Delete Account
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. This will permanently delete your account and all associated data including:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mb-4 ml-4">
                <li>• Your profile and settings</li>
                <li>• All conversations and messages</li>
                <li>• All contacts and campaigns</li>
                <li>• All integrations and configurations</li>
                <li>• All knowledge bases and files</li>
                <li>• All automations and tools</li>
                <li>• Your organization (if you own one)</li>
              </ul>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-2"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete My Account
              </Button>
            </div>
          </div>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md p-6 m-4">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-destructive mb-2">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. This will permanently delete your account and all associated data.
                </p>
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Type <span className="font-bold text-destructive">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="DELETE"
                  disabled={isDeleting}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== "DELETE"}
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

