"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, CreditCard, Download, Check, User, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { currentPlan, usageStats, invoices, paymentMethod } from "@/data/mockBilling";
import { toast } from "sonner";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { useSidebar } from "@/contexts/SidebarContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

export default function ProfilePage() {
  const { getSidebarWidth } = useSidebar();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"account" | "security">("account");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Load avatar from localStorage on mount and sync form data with user
  useEffect(() => {
    const savedAvatar = localStorage.getItem("userAvatar");
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }
    
    // Update form data when user changes
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  // Generate 2FA QR code when enabled
  useEffect(() => {
    if (twoFactorEnabled && !qrCodeUrl) {
      generateTwoFactorQR();
    }
  }, [twoFactorEnabled]);

  const generateTwoFactorQR = async () => {
    try {
      const newSecret = speakeasy.generateSecret({
        name: `Aistein-It (${formData.email})`,
        issuer: "Aistein-It",
      });
      
      setSecret(newSecret.base32);

      const qrCode = await QRCode.toDataURL(newSecret.otpauth_url || "");
      setQrCodeUrl(qrCode);
    } catch (error) {
      console.error("Failed to generate 2FA QR code:", error);
      toast.error("Failed to generate 2FA QR code");
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarUrl(result);
        // Save to localStorage
        localStorage.setItem("userAvatar", result);
        toast.success("Avatar uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call to save profile
    toast.success("Profile updated successfully!");
  };

  const tabs = [
    { id: "account", label: "Account" },
    { id: "security", label: "Security" },
  ];

  return (
    <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
      {/* Enhanced Professional Navbar */}
      <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              Profile
              <Activity className="w-5 h-5 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your account settings and preferences</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[900px] mx-auto p-8">
          {/* Enhanced Tabs */}
          <div className="border-b border-border mb-8 bg-card/50 rounded-xl p-2">
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 text-sm font-semibold transition-all relative rounded-lg cursor-pointer ${
                    activeTab === tab.id
                      ? "text-foreground bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="bg-card border border-border rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            {/* Avatar upload */}
            <div className="flex flex-col items-center mb-8">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <div className="relative group">
                {avatarUrl ? (
                  <div className="w-[120px] h-[120px] rounded-full overflow-hidden">
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-[120px] h-[120px] rounded-full bg-primary flex items-center justify-center text-white font-bold overflow-hidden"
                    data-no-translate
                  >
                    <span className="text-4xl leading-none select-none" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                      {(() => {
                        if (!user?.name) return "U";
                        const names = user.name.trim().split(" ");
                        if (names.length >= 2) {
                          return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                        }
                        return user.name[0].toUpperCase();
                      })()}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-6 h-6 text-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Click to upload new avatar
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+1 (555) 000-0000"
                  className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl text-sm font-semibold hover:shadow-lg shadow-md transition-all mt-8 cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </div>
        )}

          {/* Billing Tab */}


          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Change Password */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Change Password
              </h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="bg-background border border-border rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Password Requirements:
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• At least 8 characters long</li>
                    <li>• Contains at least one uppercase letter</li>
                    <li>• Contains at least one number</li>
                    <li>• Contains at least one special character</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl text-sm font-semibold hover:shadow-lg shadow-md transition-all cursor-pointer"
                >
                  Update Password
                </button>
              </form>
            </div>

              {/* Two-Factor Authentication */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <button
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all cursor-pointer shadow-sm ${
                    twoFactorEnabled ? "bg-primary" : "bg-border"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {twoFactorEnabled && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex flex-col items-center">
                    {qrCodeUrl ? (
                      <div className="w-48 h-48 bg-white rounded-lg p-4 mb-4">
                        <img
                          src={qrCodeUrl}
                          alt="2FA QR Code"
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-48 bg-white rounded-lg p-4 mb-4 flex items-center justify-center">
                        <div className="text-sm text-muted-foreground">Generating QR Code...</div>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground text-center">
                      Scan this QR code with your authenticator app
                    </p>
                    {secret && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">Manual Entry Key:</p>
                        <code className="text-xs bg-background border border-border px-2 py-1 rounded">
                          {secret}
                        </code>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Backup Codes
                    </label>
                    <div className="bg-background border border-border rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono text-muted-foreground">
                        <div>1234-5678-90AB</div>
                        <div>CDEF-1234-5678</div>
                        <div>90AB-CDEF-1234</div>
                        <div>5678-90AB-CDEF</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Save these codes in a safe place. Each can be used once.
                    </p>
                  </div>
                </div>
              )}
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
