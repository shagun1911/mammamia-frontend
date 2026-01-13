"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Sparkles, TrendingUp, Calendar, AlertCircle, CheckCircle } from "lucide-react";

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
  billingCycle?: {
    start: string;
    end: string;
    daysRemaining: number;
  };
}

export default function ProfilePage() {
  const [profiles, setProfiles] = useState<ProfileType[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getProfileIcon = (type: string) => {
    switch (type) {
      case 'mileva':
        return <Zap className="w-8 h-8" />;
      case 'nobel':
        return <Crown className="w-8 h-8" />;
      case 'aistein':
        return <Sparkles className="w-8 h-8" />;
      default:
        return <TrendingUp className="w-8 h-8" />;
    }
  };

  const getProfileColor = (type: string) => {
    switch (type) {
      case 'mileva':
        return 'from-blue-500 to-cyan-500';
      case 'nobel':
        return 'from-purple-500 to-pink-500';
      case 'aistein':
        return 'from-amber-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchUsage();
  }, []);

  const fetchProfiles = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/available`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfiles(data.data.profiles);
      }
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    }
  };

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/usage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data.data.usage);
        setSelectedProfile(data.data.usage.selectedProfile);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setLoading(false);
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
        setSelectedProfile(profileType);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2 ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Small Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Profile & Subscription</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose the perfect plan for your AI communication needs</p>
        </div>

        {/* Current Usage Stats */}
        {usage && usage.hasProfile && (
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Current Plan: {usage.profileType ? (usage.profileType.charAt(0).toUpperCase() + usage.profileType.slice(1)) : 'No Plan'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Track your usage and manage your subscription
                </p>
              </div>
              {usage.billingCycle && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{usage.billingCycle.daysRemaining} days remaining</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chat Conversations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Chat Conversations
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {usage.chatConversations.used} / {usage.chatConversations.limit}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(usage.chatConversations.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {usage.chatConversations.remaining} conversations remaining
                </p>
              </div>

              {/* Voice Minutes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Voice Minutes
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {usage.voiceMinutes.used} / {usage.voiceMinutes.limit}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(usage.voiceMinutes.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {usage.voiceMinutes.remaining} minutes remaining
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Available Profiles */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Available Packages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <Card
                key={profile.type}
                className={`relative overflow-hidden transition-all hover:shadow-lg flex flex-col h-full ${
                  selectedProfile === profile.type
                    ? "border-primary border-2 shadow-xl"
                    : "border-border"
                }`}
              >
                {/* Gradient Header */}
                <div className={`bg-gradient-to-r ${getProfileColor(profile.type)} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    {getProfileIcon(profile.type)}
                    {selectedProfile === profile.type && (
                      <div className="bg-white text-primary rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{profile.name}</h3>
                  <p className="text-sm opacity-90">{profile.duration}</p>
                </div>

                {/* Features */}
                <div className="p-6 space-y-4 flex flex-col flex-1">
                  <p className="text-sm text-muted-foreground mb-4">
                    {profile.description}
                  </p>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">
                          {profile.chatConversations.toLocaleString()} Chat Conversations
                        </p>
                        <p className="text-xs text-muted-foreground">
                          AI-powered chat interactions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">
                          {profile.voiceMinutes.toLocaleString()} Voice Minutes
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Incoming or outgoing calls
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSelectProfile(profile.type)}
                    disabled={selectedProfile === profile.type}
                    className="w-full mt-auto cursor-pointer"
                    variant={selectedProfile === profile.type ? "outline" : "default"}
                  >
                    {selectedProfile === profile.type ? "Current Plan" : "Select Plan"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
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
      </div>
    </div>
  );
}

