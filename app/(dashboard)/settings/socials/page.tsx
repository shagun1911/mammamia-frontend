'use client';

import SocialIntegrations from '@/components/settings/SocialIntegrations';

export default function SocialsSettingsPage() {
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Small Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Social Integrations</h2>
          <p className="text-sm text-muted-foreground mt-1">Connect your WhatsApp, Instagram, and Facebook accounts to manage all conversations in one place using 360dialog.</p>
        </div>
        <SocialIntegrations />
      </div>
    </div>
  );
}

