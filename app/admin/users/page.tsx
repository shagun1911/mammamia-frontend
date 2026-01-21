"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService, UserWithProfile } from "@/services/admin.service";
import { ArrowLeft, Search, User, Loader2, ArrowUpCircle, Package, Phone, MessageSquare, TrendingUp } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PROFILE_INFO = {
  mileva: {
    name: "Mileva Package",
    chatLimit: 500,
    voiceLimit: 250,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  nobel: {
    name: "Nobel Package",
    chatLimit: 1000,
    voiceLimit: 1000,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  aistein: {
    name: "AIstein Package",
    chatLimit: 2000,
    voiceLimit: 2000,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10"
  }
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedProfileType, setSelectedProfileType] = useState<'mileva' | 'nobel' | 'aistein'>('nobel');
  const [selectedOrgPlan, setSelectedOrgPlan] = useState<string>('');

  const { data: users, isLoading } = useQuery<UserWithProfile[]>({
    queryKey: ['admin', 'users', search, roleFilter, statusFilter],
    queryFn: () => adminService.getAllUsers({
      search: search || undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  });

  const upgradeMutation = useMutation({
    mutationFn: ({ userId, profileType, orgPlan }: { userId: string; profileType: 'mileva' | 'nobel' | 'aistein'; orgPlan?: string }) =>
      adminService.upgradeUserPlan(userId, profileType, orgPlan),
    onSuccess: () => {
      toast.success('User plan upgraded successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      setShowUpgradeModal(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upgrade user plan');
    }
  });

  const handleUpgrade = () => {
    if (!selectedUser) return;
    upgradeMutation.mutate({
      userId: selectedUser._id,
      profileType: selectedProfileType,
      orgPlan: selectedOrgPlan || undefined
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredUsers = users || [];

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
        <h1 className="text-3xl font-bold text-foreground">Users & Billing</h1>
        <p className="text-muted-foreground">Manage user accounts and upgrade billing plans</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="operator">Operator</option>
          <option value="viewer">Viewer</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Current Package</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  const profileInfo = user.profile?.profileType ? PROFILE_INFO[user.profile.profileType as keyof typeof PROFILE_INFO] : null;
                  return (
                    <tr key={user._id} className="hover:bg-secondary/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {user.role} • {user.status}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {profileInfo ? (
                          <div className={cn("px-3 py-1 rounded-full text-xs font-medium inline-block", profileInfo.bgColor, profileInfo.color)}>
                            {profileInfo.name}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No package</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.profile ? (
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Chat</span>
                                <span className="text-foreground">
                                  {user.profile.chatConversationsUsed} / {user.profile.chatConversationsLimit}
                                </span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-1.5">
                                <div
                                  className={cn(
                                    "h-1.5 rounded-full",
                                    (user.profile.usagePercentage?.chat || 0) >= 90 ? "bg-red-500" :
                                    (user.profile.usagePercentage?.chat || 0) >= 70 ? "bg-yellow-500" : "bg-green-500"
                                  )}
                                  style={{ width: `${Math.min(user.profile.usagePercentage?.chat || 0, 100)}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Voice</span>
                                <span className="text-foreground">
                                  {user.profile.voiceMinutesUsed} / {user.profile.voiceMinutesLimit}
                                </span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-1.5">
                                <div
                                  className={cn(
                                    "h-1.5 rounded-full",
                                    (user.profile.usagePercentage?.voice || 0) >= 90 ? "bg-red-500" :
                                    (user.profile.usagePercentage?.voice || 0) >= 70 ? "bg-yellow-500" : "bg-green-500"
                                  )}
                                  style={{ width: `${Math.min(user.profile.usagePercentage?.voice || 0, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No usage data</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.organization ? (
                          <div>
                            <div className="text-sm font-medium text-foreground">{user.organization.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">{user.organization.plan} • {user.organization.status}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No organization</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setSelectedProfileType((user.profile?.profileType as any) || 'nobel');
                            setSelectedOrgPlan(user.organization?.plan || '');
                            setShowUpgradeModal(true);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <ArrowUpCircle className="w-4 h-4" />
                          Upgrade Plan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Package className="w-6 h-6" />
                Upgrade Billing Plan
              </h2>
              <p className="text-muted-foreground mt-1">Upgrade plan for {selectedUser.email}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Plan */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Current Plan</h3>
                <div className="bg-secondary rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">
                        {selectedUser.profile?.profileType ? PROFILE_INFO[selectedUser.profile.profileType as keyof typeof PROFILE_INFO].name : 'No Package'}
                      </div>
                      {selectedUser.profile && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {selectedUser.profile.chatConversationsLimit} chats • {selectedUser.profile.voiceMinutesLimit} voice minutes
                        </div>
                      )}
                    </div>
                    {selectedUser.organization && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground capitalize">{selectedUser.organization.plan}</div>
                        <div className="text-xs text-muted-foreground">Organization Plan</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Select New Package */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Select New Package</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['mileva', 'nobel', 'aistein'] as const).map((profileType) => {
                    const info = PROFILE_INFO[profileType];
                    const isSelected = selectedProfileType === profileType;
                    return (
                      <button
                        key={profileType}
                        onClick={() => setSelectedProfileType(profileType)}
                        className={cn(
                          "p-4 border-2 rounded-lg text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn("font-semibold", info.color)}>{info.name}</span>
                          {isSelected && <TrendingUp className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {info.chatLimit} chat conversations
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {info.voiceLimit} voice minutes
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Organization Plan (Optional) */}
              {selectedUser.organization && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Organization Plan (Optional)</h3>
                  <select
                    value={selectedOrgPlan}
                    onChange={(e) => setSelectedOrgPlan(e.target.value)}
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Keep current ({selectedUser.organization.plan})</option>
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              )}

              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  <strong>Note:</strong> Upgrading the plan will immediately update limits. If downgrading, usage will be capped to the new limits.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgrade}
                disabled={upgradeMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {upgradeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="w-4 h-4" />
                    Upgrade Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
