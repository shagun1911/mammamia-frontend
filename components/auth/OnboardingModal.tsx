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
    companyWebsite: "",
    vat: "",
    street: "",
    city: "",
    state: "",
    country: "",
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
        companyWebsite: user.companyWebsite || "",
        vat: user.vat || "",
        street: user.street || "",
        city: user.city || "",
        state: user.state || "",
        country: user.country || "",
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

    if (!formData.street.trim()) {
      newErrors.street = "Street address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
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

            {/* Company Website */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Company Website <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
              <input
                type="url"
                value={formData.companyWebsite}
                onChange={(e) => handleChange("companyWebsite", e.target.value)}
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

            {/* Address Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Street Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  className={`w-full h-11 bg-secondary border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors ${
                    errors.street ? "border-destructive" : "border-border"
                  }`}
                  placeholder="Enter street address"
                  disabled={isSubmitting}
                />
                {errors.street && (
                  <p className="text-xs text-destructive mt-1">{errors.street}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    City <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className={`w-full h-11 bg-secondary border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors ${
                      errors.city ? "border-destructive" : "border-border"
                    }`}
                    placeholder="Enter city"
                    disabled={isSubmitting}
                  />
                  {errors.city && (
                    <p className="text-xs text-destructive mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    State <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className={`w-full h-11 bg-secondary border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors ${
                      errors.state ? "border-destructive" : "border-border"
                    }`}
                    placeholder="Enter state"
                    disabled={isSubmitting}
                  />
                  {errors.state && (
                    <p className="text-xs text-destructive mt-1">{errors.state}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Country <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  className={`w-full h-11 bg-secondary border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors ${
                    errors.country ? "border-destructive" : "border-border"
                  }`}
                  placeholder="Enter country"
                  disabled={isSubmitting}
                />
                {errors.country && (
                  <p className="text-xs text-destructive mt-1">{errors.country}</p>
                )}
              </div>
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

