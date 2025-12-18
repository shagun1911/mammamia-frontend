"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, CreditCard, Download, Check } from "lucide-react";
import { mockUser } from "@/data/mockUser";
import { currentPlan, usageStats, invoices, paymentMethod } from "@/data/mockBilling";
import { toast } from "sonner";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"account" | "billing" | "security">("account");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: mockUser.name || "",
    email: mockUser.email,
    phone: mockUser.phone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Load avatar from localStorage on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem("userAvatar");
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }
  }, []);

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
    { id: "billing", label: "Billing" },
    { id: "security", label: "Security" },
  ];

  return (
    <div className="p-8">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-8">Profile Settings</h1>

        {/* Tabs */}
        <div className="border-b border-border mb-8">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="bg-card border border-border rounded-xl p-8">
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
                  <div className="w-[120px] h-[120px] rounded-full bg-primary flex items-center justify-center text-foreground text-4xl font-bold">
                    {mockUser.avatar}
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
                className="w-full h-12 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all mt-8"
              >
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-xl p-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {currentPlan.name}
              </h2>
              <p className="text-3xl font-bold text-foreground mb-6">
                ${currentPlan.price}
                <span className="text-lg font-normal text-indigo-100">
                  /{currentPlan.interval}
                </span>
              </p>
              <ul className="space-y-2">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-3 gap-4">
              {usageStats.map((stat, index) => {
                const percentage = (stat.value / stat.limit) * 100;
                return (
                  <div
                    key={index}
                    className="bg-card border border-border rounded-xl p-5"
                  >
                    <p className="text-[13px] text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground mb-3">
                      {stat.value.toLocaleString()}
                    </p>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      of {stat.limit.toLocaleString()} {stat.unit}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Payment Method */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Payment Method
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {paymentMethod.brand} •••• {paymentMethod.last4}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-secondary hover:bg-accent text-foreground rounded-lg text-sm font-medium transition-colors">
                  Update
                </button>
              </div>
            </div>

            {/* Invoice History */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">
                  Invoice History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="px-6 py-3 text-left text-[13px] font-semibold text-muted-foreground uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-[13px] font-semibold text-muted-foreground uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-[13px] font-semibold text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-[13px] font-semibold text-muted-foreground uppercase">
                        Invoice
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-border hover:bg-secondary transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-foreground">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          ${invoice.amount}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-medium ${
                              invoice.status === "paid"
                                ? "bg-green-500/20 text-green-400"
                                : invoice.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {invoice.status.charAt(0).toUpperCase() +
                              invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-primary hover:text-primary/80 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-card border border-border rounded-xl p-6">
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
                  className="w-full h-12 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all"
                >
                  Update Password
                </button>
              </form>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-card border border-border rounded-xl p-6">
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
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
  );
}
