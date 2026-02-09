"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Sparkles, TrendingUp, Calendar, AlertCircle, CheckCircle, Trash2, Phone, MessageSquare, Users, Loader2, User } from "lucide-react";
import { planService, Plan } from "@/services/plan.service";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { redirectToWooCheckout } from "@/lib/woocommerceCheckout";

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
  metrics?: {
    chatMessages: number;
    callMinutes: number;
    conversations: number;
    automations: number;
    campaignSends: number;
  };
  chatConversationsUsed?: number;
  chatConversationsLimit?: number;
  voiceMinutesUsed?: number;
  voiceMinutesLimit?: number;
  automationsUsed?: number;
  automationsLimit?: number;
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
  // Suffix versions from new backend
  chatConversationsStats?: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  voiceMinutesStats?: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  automationsStats?: {
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Payment activation state
  const [paymentState, setPaymentState] = useState<'idle' | 'success' | 'failed'>('idle');
  const [accountFormData, setAccountFormData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    companyWebsite: "",
    vat: "",
    street: "",
    city: "",
    state: "",
    country: "",
  });

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

  // Force activate plan immediately on redirect
  useEffect(() => {
    const status = searchParams.get('status');
    const intent = searchParams.get('intent');
    const plan = searchParams.get('plan');

    if (status === 'success' && intent && plan) {
      forceActivate(intent, plan);
    }
  }, [searchParams]);

  const forceActivate = async (intent: string, plan: string) => {
    try {
      // Payment routes are at /api/payment, not /api/v1/payment
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const baseUrl = apiBaseUrl.replace(/\/api\/v1$/, '');
      const token = localStorage.getItem('accessToken');
      
      await fetch(`${baseUrl}/api/payment/force-activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ intent, plan })
      });

      await refreshUser();
      await fetchBillingInfo();

      setPaymentState('success');
      router.replace('/settings/profile', { scroll: false });
    } catch (e: any) {
      console.error('FORCE ACTIVATE FAILED', e);
      setPaymentState('failed');
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

  // Initialize account form data from user
  useEffect(() => {
    if (user) {
      setAccountFormData({
        name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email || "",
        phone: user.phone || "",
        companyName: user.companyName || "",
        companyWebsite: user.companyWebsite || "",
        vat: user.vat || "",
        street: user.street || "",
        city: user.city || "",
        state: user.state || "",
        country: user.country || "",
      });
    }
  }, [user]);

  const handleSaveAccountInfo = async () => {
    setIsSavingAccount(true);
    try {
      const response = await apiClient.post("/auth/onboarding", accountFormData);

      // apiClient.post returns response.data directly
      if (response?.success) {
        toast.success("Account information updated successfully!");
        await refreshUser();
      } else {
        throw new Error(response?.error?.message || "Failed to update account information");
      }
    } catch (error: any) {
      console.error("Account update error:", error);
      // Handle both axios error format and our custom error format
      const errorMessage = error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update account information";
      toast.error(errorMessage);
    } finally {
      setIsSavingAccount(false);
    }
  };

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
    try {
      // Get user's MongoDB _id (prefer _id, fallback to id)
      // The backend sends _id, but frontend might have it as id
      const userId = (user as any)?._id || user?.id;

      if (!userId) {
        toast.error("Unable to identify user. Please log in again.");
        return;
      }

      // Redirect to WooCommerce checkout with plan upgrade
      // This adds product to cart and redirects directly to checkout
      // Query params (uid, plan, intent) are preserved for webhook processing
      redirectToWooCheckout(plan.slug, userId);
    } catch (error: any) {
      console.error("Failed to redirect to checkout:", error);
      toast.error(error.message || "Failed to start checkout process");
    }
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
        {/* Payment Status Banner */}
        {paymentState === 'success' && (
          <Card className="p-4 bg-green-500/10 border-green-500/30">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  🎉 Plan activated successfully!
                </p>
                <p className="text-xs text-green-500/80 mt-1">
                  Your subscription has been updated. You can now enjoy your new plan features.
                </p>
              </div>
            </div>
          </Card>
        )}

        {paymentState === 'failed' && (
          <Card className="p-4 bg-red-500/10 border-red-500/30">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  ❌ Payment failed
                </p>
                <p className="text-xs text-red-500/80 mt-1">
                  We couldn't process your payment. Please try again or contact support if the issue persists.
                </p>
              </div>
            </div>
          </Card>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
        {/* Small Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Profile & Subscription</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your account information and subscription</p>
        </div>

        {/* Account Information Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Account Information</h3>
              <p className="text-sm text-muted-foreground">Update your personal and company details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={accountFormData.name}
                onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter your full name"
                disabled={isSavingAccount}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                value={accountFormData.email}
                onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter your email address"
                disabled={isSavingAccount}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                value={accountFormData.phone}
                onChange={(e) => setAccountFormData({ ...accountFormData, phone: e.target.value })}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter your phone number"
                disabled={isSavingAccount}
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Company Name <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={accountFormData.companyName}
                onChange={(e) => setAccountFormData({ ...accountFormData, companyName: e.target.value })}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter your company name"
                disabled={isSavingAccount}
              />
            </div>

            {/* Company Website */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Company Website <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
              <input
                type="url"
                value={accountFormData.companyWebsite}
                onChange={(e) => setAccountFormData({ ...accountFormData, companyWebsite: e.target.value })}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="https://example.com"
                disabled={isSavingAccount}
              />
            </div>

            {/* VAT */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                VAT <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={accountFormData.vat}
                onChange={(e) => setAccountFormData({ ...accountFormData, vat: e.target.value })}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter your VAT number"
                disabled={isSavingAccount}
              />
            </div>

            {/* Street Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Street Address <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={accountFormData.street}
                onChange={(e) => setAccountFormData({ ...accountFormData, street: e.target.value })}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter street address"
                disabled={isSavingAccount}
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                City <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={accountFormData.city}
                onChange={(e) => setAccountFormData({ ...accountFormData, city: e.target.value })}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter city"
                disabled={isSavingAccount}
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                State <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={accountFormData.state}
                onChange={(e) => setAccountFormData({ ...accountFormData, state: e.target.value })}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter state"
                disabled={isSavingAccount}
              />
            </div>

            {/* Country */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Country <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={accountFormData.country}
                onChange={(e) => setAccountFormData({ ...accountFormData, country: e.target.value })}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter country"
                disabled={isSavingAccount}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveAccountInfo}
              disabled={isSavingAccount}
              className="px-6"
            >
              {isSavingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Account Information"
              )}
            </Button>
          </div>
        </Card>

        {/* Subscription Usage Stats */}
        {user?.subscription && (
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Current Plan: {user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Track your usage and manage your subscription
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Conversations Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Conversations
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {user.subscription.usage.conversations} / {user.subscription.limits.conversations}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (user.subscription.usage.conversations / user.subscription.limits.conversations) * 100)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.max(0, user.subscription.limits.conversations - user.subscription.usage.conversations)} remaining
                </p>
              </div>

              {/* Voice Minutes Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Voice Minutes
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {user.subscription.usage.minutes} / {user.subscription.limits.minutes}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (user.subscription.usage.minutes / user.subscription.limits.minutes) * 100)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.max(0, user.subscription.limits.minutes - user.subscription.usage.minutes)} remaining
                </p>
              </div>

              {/* Automations Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Automations
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {user.subscription.usage.automations} / {user.subscription.limits.automations}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (user.subscription.usage.automations / user.subscription.limits.automations) * 100)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.max(0, user.subscription.limits.automations - user.subscription.usage.automations)} remaining
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Current Usage Stats (Legacy - shown if subscription not available) */}
        {usage && !user?.subscription && (
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
                    {(usage.chatConversationsStats?.used ?? usage.metrics?.chatMessages ?? usage.chatConversationsUsed ?? 0)} /
                    {(usage.chatConversationsStats?.limit ?? usage.chatConversationsLimit ?? 0) === -1 ? '∞' : (usage.chatConversationsStats?.limit ?? usage.chatConversationsLimit ?? 0)}
                  </span>
                </div>
                {(usage.chatConversationsStats?.limit ?? usage.chatConversationsLimit ?? 0) !== -1 && (
                  <>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(usage.chatConversationsStats?.percentage ?? 0)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(usage.chatConversationsStats?.remaining ?? 0)} conversations remaining
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
                    {(usage.voiceMinutesStats?.used ?? usage.metrics?.callMinutes ?? usage.voiceMinutesUsed ?? 0)} /
                    {(usage.voiceMinutesStats?.limit ?? usage.voiceMinutesLimit ?? 0) === -1 ? '∞' : (usage.voiceMinutesStats?.limit ?? usage.voiceMinutesLimit ?? 0)}
                  </span>
                </div>
                {(usage.voiceMinutesStats?.limit ?? usage.voiceMinutesLimit ?? 0) !== -1 && (
                  <>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(usage.voiceMinutesStats?.percentage ?? 0)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(usage.voiceMinutesStats?.remaining ?? 0)} minutes remaining
                    </p>
                  </>
                )}
              </div>

              {/* Automations */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Automations
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {(usage.automationsStats?.used ?? usage.metrics?.automations ?? usage.automationsUsed ?? 0)} /
                    {(usage.automationsStats?.limit ?? usage.automationsLimit ?? 5) === -1 ? '∞' : (usage.automationsStats?.limit ?? usage.automationsLimit ?? 5)}
                  </span>
                </div>
                {(usage.automationsStats?.limit ?? usage.automationsLimit ?? 5) !== -1 && (
                  <>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(usage.automationsStats?.percentage ?? 0)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(usage.automationsStats?.remaining ?? 0)} automations remaining
                    </p>
                  </>
                )}
              </div>
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

