"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService, UserWithProfile } from "@/services/admin.service";
import { planService, Plan } from "@/services/plan.service";
import { ArrowLeft, Search, User, Loader2, CreditCard, Check, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Fetch users
  const { data: users, isLoading: loadingUsers } = useQuery<UserWithProfile[]>({
    queryKey: ['admin', 'users', search, roleFilter, statusFilter],
    queryFn: () => adminService.getAllUsers({
      search: search || undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  });

  // Fetch plans
  const { data: plans, isLoading: loadingPlans, error: plansError } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      try {
        const result = await planService.getAllPlans();
        console.log('✅ Fetched plans:', result);
        return result;
      } catch (error) {
        console.error('❌ Error fetching plans:', error);
        throw error;
      }
    },
  });

  // Assign plan mutation
  const assignPlanMutation = useMutation({
    mutationFn: ({ organizationId, planId }: { organizationId: string; planId: string }) => {
      console.log('✅ Assigning plan to user:', { userId: organizationId, planId });
      return planService.assignPlanToOrganization(organizationId, planId);
    },
    onSuccess: (data) => {
      console.log('✅ Plan assigned successfully:', data);
      toast.success('✅ Plan updated for this user only!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowUpgradeModal(false);
      setSelectedUser(null);
      setSelectedPlanId("");
    },
    onError: (error: any) => {
      console.error('Plan assignment error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error details:', error.response?.data?.error?.details);

      const errorData = error.response?.data?.error;
      let errorMessage = error.response?.data?.message || error.message || 'Failed to assign plan';

      // If there are validation details, show them
      if (errorData?.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
        const detailMessages = errorData.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
        errorMessage = `Validation failed: ${detailMessages}`;
      }

      toast.error(errorMessage);
    }
  });

  const handleAssignPlan = () => {
    if (!selectedUser) {
      toast.error('No user selected');
      return;
    }

    if (!selectedPlanId) {
      toast.error('Please select a plan first');
      return;
    }

    // Use user ID directly (user-based system)
    console.log('✅ Assigning plan:', {
      userId: selectedUser._id,
      userEmail: selectedUser.email,
      planId: selectedPlanId
    });

    assignPlanMutation.mutate({
      organizationId: selectedUser._id, // Backend expects this param name
      planId: selectedPlanId
    });
  };

  if (loadingUsers || loadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error if plans failed to load
  if (plansError) {
    console.error('Plans error:', plansError);
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
        <p className="text-muted-foreground">Manage user accounts and assign billing plans</p>
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Current Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  return (
                    <tr key={user._id} className="hover:bg-secondary/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            {user.phone && (
                              <div className="text-xs text-muted-foreground mt-1">📞 {user.phone}</div>
                            )}
                            {user.companyName && (
                              <div className="text-xs text-muted-foreground mt-1">🏢 {user.companyName}</div>
                            )}
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded capitalize">{user.role}</span>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded capitalize",
                                user.status === 'active' ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-gray-500/10 text-gray-600 dark:text-gray-400"
                              )}>{user.status}</span>
                              {user.onboardingCompleted ? (
                                <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded">Onboarded</span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded">Pending</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.selectedProfile ? (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg shadow-sm">
                            <CreditCard className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-primary capitalize">{user.selectedProfile}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                            <CreditCard className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Free</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setSelectedPlanId("");
                            setShowUpgradeModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-lg transition-all shadow-md hover:shadow-lg"
                        >
                          <CreditCard className="w-4 h-4" />
                          {user.selectedProfile ? 'Change Plan' : 'Assign Plan'}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-primary" />
                    {selectedUser.selectedProfile ? 'Change Plan' : 'Assign Plan'}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Update billing plan for <span className="font-medium text-foreground">{selectedUser.firstName} {selectedUser.lastName}</span> ({selectedUser.email})
                  </p>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Details */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">User Details</h3>
                <div className="bg-gradient-to-r from-secondary/50 to-secondary/30 rounded-lg p-5 border border-border shadow-sm space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Name</div>
                      <div className="text-sm font-medium text-foreground">{selectedUser.firstName} {selectedUser.lastName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email</div>
                      <div className="text-sm font-medium text-foreground">{selectedUser.email}</div>
                    </div>
                    {selectedUser.phone && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Phone</div>
                        <div className="text-sm font-medium text-foreground">{selectedUser.phone}</div>
                      </div>
                    )}
                    {selectedUser.companyName && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Company</div>
                        <div className="text-sm font-medium text-foreground">{selectedUser.companyName}</div>
                      </div>
                    )}
                    {selectedUser.companyUrl && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Company URL</div>
                        <div className="text-sm font-medium text-foreground">
                          <a href={selectedUser.companyUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {selectedUser.companyUrl}
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedUser.vat && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">VAT</div>
                        <div className="text-sm font-medium text-foreground">{selectedUser.vat}</div>
                      </div>
                    )}
                    {selectedUser.address && (
                      <div className="col-span-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Address</div>
                        <div className="text-sm font-medium text-foreground">{selectedUser.address}</div>
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Onboarding Status:</span>
                      {selectedUser.onboardingCompleted ? (
                        <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded">Completed</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Plan */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Current Plan</h3>
                <div className="bg-gradient-to-r from-secondary/50 to-secondary/30 rounded-lg p-5 border border-border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xl font-bold text-foreground capitalize">
                        {selectedUser.selectedProfile || 'Free'}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        User: {selectedUser.firstName} {selectedUser.lastName}
                      </div>
                    </div>
                    {!selectedUser.selectedProfile && (
                      <div className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                          No plan assigned
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Available Plans */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
                  Select New Plan {plans && `(${plans.length} available)`}
                </h3>
                {(!plans || plans.length === 0) && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center mb-4">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      No plans available. Please create plans in Plans Management first.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {plans?.map((plan) => {
                    const isSelected = selectedPlanId === plan._id;
                    const isCurrentPlan = selectedUser.selectedProfile === plan.slug;

                    return (
                      <button
                        key={plan._id}
                        onClick={() => setSelectedPlanId(plan._id)}
                        disabled={!plan.isActive || isCurrentPlan}
                        className={cn(
                          "p-5 border-2 rounded-xl text-left transition-all relative overflow-hidden",
                          isSelected && "border-primary bg-primary/5 shadow-lg",
                          !isSelected && !isCurrentPlan && plan.isActive && "border-border hover:border-primary/50 hover:shadow-md",
                          isCurrentPlan && "border-green-500/30 bg-green-500/5 cursor-not-allowed",
                          !plan.isActive && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {isCurrentPlan && (
                          <div className="absolute top-3 right-3">
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
                              <Check className="w-3 h-3" />
                              Current
                            </div>
                          </div>
                        )}

                        <div className="mb-3">
                          <h4 className="text-xl font-bold text-foreground">{plan.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-primary">${plan.price}</span>
                            <span className="text-sm text-muted-foreground">/month</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Call Minutes</span>
                            <span className="font-medium text-foreground">
                              {plan.features.callMinutes === -1 ? 'Unlimited' : plan.features.callMinutes}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Chat Conversations</span>
                            <span className="font-medium text-foreground">
                              {plan.features.chatConversations === -1 ? 'Unlimited' : plan.features.chatConversations}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Automations</span>
                            <span className="font-medium text-foreground">
                              {plan.features.automations === -1 ? 'Unlimited' : plan.features.automations}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Users</span>
                            <span className="font-medium text-foreground">
                              {plan.features.users === -1 ? 'Unlimited' : plan.features.users}
                            </span>
                          </div>
                        </div>

                        {plan.features.customFeatures && plan.features.customFeatures.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <ul className="space-y-1">
                              {plan.features.customFeatures.slice(0, 3).map((feature, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info Messages */}
              {!plans || plans.length === 0 ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <strong>Error:</strong> No plans available. Please create plans first in Plans Management.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    <strong>✓ Note:</strong> Changing the plan will update THIS USER ONLY and apply new usage limits immediately.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border p-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-6 py-2.5 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPlan}
                disabled={!selectedPlanId || assignPlanMutation.isPending}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                title={!selectedPlanId ? "Please select a plan first" : "Assign selected plan"}
              >
                {assignPlanMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Assign Plan {selectedPlanId ? '✓' : ''}
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
