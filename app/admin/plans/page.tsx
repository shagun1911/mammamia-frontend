"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { planService, Plan, CreatePlanInput } from "@/services/plan.service";
import { ArrowLeft, Plus, Edit2, Trash2, Loader2, CreditCard, Check, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminPlansPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<CreatePlanInput>({
    name: "",
    slug: "",
    description: "",
    price: 0,
    currency: "USD",
    features: {
      callMinutes: 0,
      chatConversations: 0,
      automations: 0,
      users: 1,
      customFeatures: []
    },
    displayOrder: 0
  });

  // Fetch plans
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => planService.getAllPlans(),
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: (planData: CreatePlanInput) => planService.createPlan(planData),
    onSuccess: () => {
      toast.success('Plan created successfully!');
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create plan');
    }
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: ({ planId, planData }: { planId: string; planData: Partial<CreatePlanInput> }) =>
      planService.updatePlan(planId, planData),
    onSuccess: () => {
      toast.success('Plan updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update plan');
    }
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => planService.deletePlan(planId),
    onSuccess: () => {
      toast.success('Plan deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete plan');
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: 0,
      currency: "USD",
      features: {
        callMinutes: 0,
        chatConversations: 0,
        automations: 0,
        users: 1,
        customFeatures: []
      },
      displayOrder: 0
    });
    setEditingPlan(null);
    setShowModal(false);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      features: {
        ...plan.features,
        customFeatures: plan.features.customFeatures || []
      },
      displayOrder: plan.displayOrder
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required');
      return;
    }

    if (editingPlan) {
      updatePlanMutation.mutate({
        planId: editingPlan._id,
        planData: formData
      });
    } else {
      createPlanMutation.mutate(formData);
    }
  };

  const handleDelete = (planId: string) => {
    if (confirm('Are you sure you want to delete this plan? Organizations using this plan will not be affected.')) {
      deletePlanMutation.mutate(planId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Plans Management</h1>
          <p className="text-muted-foreground">Create and manage billing plans</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      {!plans || plans.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No plans created yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={cn(
                "bg-card border-2 rounded-xl p-6 transition-all hover:shadow-lg",
                plan.isDefault ? "border-primary" : "border-border"
              )}
            >
              {/* Plan Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>
                {plan.isDefault && (
                  <div className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                    Default
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">${plan.price}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Call Minutes</span>
                  <span className="font-medium text-foreground">
                    {plan.features.callMinutes === -1 ? 'Unlimited' : plan.features.callMinutes}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Chats</span>
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

              {/* Custom Features */}
              {plan.features.customFeatures && plan.features.customFeatures.length > 0 && (
                <div className="mb-6 pt-4 border-t border-border">
                  <ul className="space-y-1">
                    {plan.features.customFeatures.map((feature, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  className="flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Status */}
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className={cn(
                  "text-xs font-medium",
                  plan.isActive ? "text-green-600" : "text-red-600"
                )}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Plan Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. Professional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Slug * (lowercase, no spaces)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. professional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    rows={3}
                    placeholder="Describe this plan..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Price (Monthly)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Display Order</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Features/Limits */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Usage Limits</h3>
                <p className="text-xs text-muted-foreground">Enter -1 for unlimited</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Call Minutes</label>
                    <input
                      type="number"
                      value={formData.features.callMinutes}
                      onChange={(e) => setFormData({
                        ...formData,
                        features: { ...formData.features, callMinutes: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Chat Conversations</label>
                    <input
                      type="number"
                      value={formData.features.chatConversations}
                      onChange={(e) => setFormData({
                        ...formData,
                        features: { ...formData.features, chatConversations: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Automations</label>
                    <input
                      type="number"
                      value={formData.features.automations}
                      onChange={(e) => setFormData({
                        ...formData,
                        features: { ...formData.features, automations: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Users</label>
                    <input
                      type="number"
                      value={formData.features.users}
                      onChange={(e) => setFormData({
                        ...formData,
                        features: { ...formData.features, users: parseInt(e.target.value) || 1 }
                      })}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border p-6 flex items-center justify-end gap-3">
              <button
                onClick={resetForm}
                className="px-6 py-2.5 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
              >
                {(createPlanMutation.isPending || updatePlanMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {editingPlan ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
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
