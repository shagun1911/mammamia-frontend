"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { toast } from "@/lib/toast";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    companyUrl: "",
    vat: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email || "",
        phone: user.phone || "",
        companyName: user.companyName || "",
        companyUrl: user.companyUrl || "",
        vat: user.vat || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/auth/onboarding", formData);
      
      // apiClient.post returns response.data directly
      if (response?.success) {
        toast.success("Onboarding completed successfully!");
        await refreshUser();
        onComplete();
      } else {
        throw new Error(response?.error?.message || "Failed to complete onboarding");
      }
    } catch (error: any) {
      console.error("Onboarding error:", error);
      // Handle both axios error format and our custom error format
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.response?.data?.message || 
                          error?.message || 
                          "Failed to complete onboarding";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome! Let's get started</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Please complete your profile to continue
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={`w-full h-11 bg-secondary border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors ${
                  errors.name ? "border-destructive" : "border-border"
                }`}
                placeholder="Enter your full name"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`w-full h-11 bg-secondary border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors ${
                  errors.email ? "border-destructive" : "border-border"
                }`}
                placeholder="Enter your email address"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className={`w-full h-11 bg-secondary border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors ${
                  errors.phone ? "border-destructive" : "border-border"
                }`}
                placeholder="Enter your phone number"
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="text-xs text-destructive mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Company Name <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter your company name"
                disabled={isSubmitting}
              />
            </div>

            {/* Company URL */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Company URL <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
              <input
                type="url"
                value={formData.companyUrl}
                onChange={(e) => handleChange("companyUrl", e.target.value)}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="https://example.com"
                disabled={isSubmitting}
              />
            </div>

            {/* VAT */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                VAT <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.vat}
                onChange={(e) => handleChange("vat", e.target.value)}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter your VAT number"
                disabled={isSubmitting}
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Address <span className="text-destructive">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className={`w-full min-h-[100px] bg-secondary border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none ${
                  errors.address ? "border-destructive" : "border-border"
                }`}
                placeholder="Enter your address"
                disabled={isSubmitting}
              />
              {errors.address && (
                <p className="text-xs text-destructive mt-1">{errors.address}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Complete Onboarding"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

