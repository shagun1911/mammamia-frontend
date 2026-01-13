"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, UsersRound } from "lucide-react";
import { mockOperators, Operator, availablePermissions } from "@/data/mockOperators";
import { cn } from "@/lib/utils";
import { useOperators, useCreateOperator, useDeleteOperator, useUpdateOperator } from "@/hooks/useSettings";
import { toast } from "sonner";

// Avatar Image Component with proper error handling
// NEVER renders URLs as text - only uses them as image src
function AvatarImage({ 
  src, 
  alt, 
  fallbackInitials, 
  fallbackColor 
}: { 
  src: string; 
  alt: string; 
  fallbackInitials: string; 
  fallbackColor: string;
}) {
  const [imageError, setImageError] = useState(false);

  // Always fallback to initials if image fails - never show URL as text
  if (imageError || !src) {
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
        style={{ backgroundColor: fallbackColor }}
      >
        {fallbackInitials}
      </div>
    );
  }

  // Only render image if src is valid - URL is only used in img src attribute, never as text
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border bg-secondary">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
}

export default function TeamSettingsPage() {
  const { data: operators = [], isLoading } = useOperators();
  const createOperator = useCreateOperator();
  const deleteOperator = useDeleteOperator();
  const updateOperator = useUpdateOperator();

  const [showModal, setShowModal] = useState(false);
  const [editingOperator, setEditingOperator] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdOperator, setCreatedOperator] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "operator" as "admin" | "operator" | "viewer",
    permissions: [] as string[],
  });

  const [savedPassword, setSavedPassword] = useState("");

  const getRoleBadge = (role: string) => {
    const styles: any = {
      admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      operator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      viewer: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };

    return (
      <span className={cn("px-2.5 py-1 rounded-xl text-xs font-medium border", styles[role] || "bg-gray-500/20 text-gray-400 border-gray-500/30")}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const handleOpenModal = (operator?: any) => {
    if (operator) {
      setEditingOperator(operator);
      setFormData({
        email: operator.email || "",
        firstName: operator.firstName || operator.name?.split(" ")[0] || "",
        lastName: operator.lastName || operator.name?.split(" ")[1] || "",
        password: "",
        role: operator.role || "operator",
        permissions: operator.permissions || [],
      });
    } else {
      setEditingOperator(null);
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        role: "operator",
        permissions: [],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOperator(null);
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      role: "operator",
      permissions: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.firstName) {
      toast.error("Email and first name are required");
      return;
    }

    if (!editingOperator && !formData.password) {
      toast.error("Password is required for new operators");
      return;
    }

    try {
      if (editingOperator) {
        // Update existing operator
        await updateOperator.mutateAsync({
          id: editingOperator._id || editingOperator.id,
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            role: formData.role,
            ...(formData.password && { password: formData.password }),
          },
        });
        handleCloseModal();
      } else {
        // Create new operator
        const newOperator = await createOperator.mutateAsync({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          permissions: formData.permissions,
        });
        
        // Store credentials for display
        setSavedPassword(formData.password);
        setCreatedOperator(newOperator);
        
        // Close form modal and show credentials modal
        handleCloseModal();
        setShowCredentialsModal(true);
      }
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this operator?")) {
      try {
        await deleteOperator.mutateAsync(id);
      } catch (error) {
        // Error already handled by mutation
      }
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your team members and their permissions
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Operator</span>
          </button>
        </div>

        {/* Operators table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary border-b border-border">
                  <th className="px-6 py-3 text-left">
                    <span className="text-[13px] font-semibold text-muted-foreground uppercase">Avatar</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-[13px] font-semibold text-muted-foreground uppercase">Name</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-[13px] font-semibold text-muted-foreground uppercase">Email</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-[13px] font-semibold text-muted-foreground uppercase">Password</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-[13px] font-semibold text-muted-foreground uppercase">Role</span>
                  </th>
                  <th className="px-6 py-3 text-right">
                    <span className="text-[13px] font-semibold text-muted-foreground uppercase">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading operators...</span>
                      </div>
                    </td>
                  </tr>
                ) : operators.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <UsersRound className="w-12 h-12 text-muted-foreground/50" />
                        <span>No operators yet. Add one to get started.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  operators.map((operator: any) => {
                    // Extract and sanitize avatar URL - only use it for image src, never display as text
                    // Check multiple possible fields for avatar URL
                    const rawAvatarUrl = operator.avatar || operator.photo || operator.picture || operator.photoUrl || null;
                    
                    // Only use URL if it's a valid HTTP/HTTPS URL string
                    const avatarUrl = rawAvatarUrl && 
                      typeof rawAvatarUrl === 'string' && 
                      (rawAvatarUrl.startsWith('http://') || rawAvatarUrl.startsWith('https://'))
                      ? rawAvatarUrl 
                      : null;
                    
                    // Generate avatar initials as fallback (never use URL for initials)
                    let avatarInitials = "?";
                    if (operator.firstName && operator.lastName) {
                      avatarInitials = `${operator.firstName[0]}${operator.lastName[0]}`.toUpperCase();
                    } else if (operator.firstName) {
                      avatarInitials = operator.firstName[0].toUpperCase();
                    } else if (operator.name) {
                      const nameParts = operator.name.trim().split(" ");
                      if (nameParts.length >= 2) {
                        avatarInitials = `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
                      } else {
                        avatarInitials = operator.name[0].toUpperCase();
                      }
                    }
                    
                    const color = operator.color || "#6366f1";
                    const displayName = operator.firstName && operator.lastName 
                      ? `${operator.firstName} ${operator.lastName}` 
                      : operator.name || "Unknown";

                    return (
                      <tr
                        key={operator._id || operator.id}
                        className="border-b border-border hover:bg-secondary/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          {avatarUrl ? (
                            <AvatarImage
                              src={avatarUrl}
                              alt={displayName}
                              fallbackInitials={avatarInitials}
                              fallbackColor={color}
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                              style={{ backgroundColor: color }}
                            >
                              {avatarInitials}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-foreground">
                            {displayName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground break-all">{operator.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-muted-foreground">
                            {/* Always mask passwords in table view for security */}
                            {"••••••••"}
                          </span>
                        </td>
                        <td className="px-6 py-4">{getRoleBadge(operator.role)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpenModal(operator)}
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-secondary"
                              title="Edit operator"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(operator._id || operator.id)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded hover:bg-red-500/10"
                              title="Delete operator"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Operator Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div 
            className="w-full max-w-[560px] bg-card border border-border rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {editingOperator ? "Edit Operator" : "Add Operator"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">First Name *</label>
                  <input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    required
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                  <input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password {!editingOperator && "*"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingOperator ? "Leave blank to keep current" : "Enter password"}
                    required={!editingOperator}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Password will be stored in plain text as requested
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="viewer">Viewer</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOperator.isPending || updateOperator.isPending}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createOperator.isPending || updateOperator.isPending
                    ? "Saving..."
                    : editingOperator
                    ? "Update Operator"
                    : "Add Operator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Display Modal */}
      {showCredentialsModal && createdOperator && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCredentialsModal(false);
              setCreatedOperator(null);
              setSavedPassword("");
            }
          }}
        >
          <div 
            className="w-full max-w-[560px] bg-card border border-border rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-foreground">
                Operator Created Successfully! 🎉
              </h2>
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCreatedOperator(null);
                  setSavedPassword("");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Save these credentials. You can use them to login.
            </p>

            <div className="space-y-4">
              <div className="bg-secondary border border-border rounded-lg p-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono text-foreground">{createdOperator.email}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdOperator.email);
                      toast.success("Email copied!");
                    }}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-secondary border border-border rounded-lg p-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Password</label>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono text-foreground">{savedPassword}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(savedPassword);
                      toast.success("Password copied!");
                    }}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-xs text-yellow-600 dark:text-yellow-500">
                  ⚠️ Important: These credentials are stored in plain text for your convenience. Make sure to save them securely.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCreatedOperator(null);
                  setSavedPassword("");
                }}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

