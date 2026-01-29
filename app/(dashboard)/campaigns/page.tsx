"use client";

import { useState } from "react";
import { Plus, Megaphone, Activity } from "lucide-react";
import { CampaignList } from "@/components/campaigns/CampaignList";
import { CampaignBuilder } from "@/components/campaigns/CampaignBuilder";
import { BatchCallBuilder } from "@/components/campaigns/BatchCallBuilder";
import { useCampaigns, useCreateCampaign } from "@/hooks/useCampaigns";
import { campaignService } from "@/services/campaign.service";
import { toast } from "sonner";
import { useSidebar } from "@/contexts/SidebarContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { LoadingLogo } from "@/components/LoadingLogo";

export default function CampaignsPage() {
  const { getSidebarWidth } = useSidebar();
  const [showBuilder, setShowBuilder] = useState(false);
  const [showBatchCallBuilder, setShowBatchCallBuilder] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Fetch campaigns from API
  const { data: campaigns = [], isLoading } = useCampaigns();
  const createCampaign = useCreateCampaign();

  const handleCreateCampaign = async (data: any) => {
    try {
      setIsSending(true);

      // Save campaign first to get ID
      const campaign = await createCampaign.mutateAsync({
        ...data,
        status: 'draft',
      });

      // Start campaign immediately via backend (which calls bulk communication API)
      const campaignId = campaign._id || campaign.id;
      const startResult = await campaignService.start(campaignId);

      toast.success(`Campaign sent successfully!`);
      setShowBuilder(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send campaign");
    } finally {
      setIsSending(false);
    }
  };

  const handleEditCampaign = (campaign: any) => {
    setEditingCampaign(campaign);
    setShowBuilder(true);
  };

  const handleDeleteCampaign = async (id: string) => {
    // TODO: Implement delete campaign API call
    console.log("Deleting campaign:", id);
  };

  if (showBatchCallBuilder) {
    return (
      <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
        {/* Navbar */}
        <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                Campaigns
                <Activity className="w-5 h-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Create and manage marketing campaigns</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <BatchCallBuilder
            onClose={() => setShowBatchCallBuilder(false)}
            onSuccess={() => {
              setShowBatchCallBuilder(false);
            }}
          />
        </div>
      </div>
    );
  }

  if (showBuilder) {
    return (
      <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
        {/* Navbar */}
        <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                Campaigns
                <Activity className="w-5 h-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Create and manage marketing campaigns</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {isSending ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-lg text-foreground font-medium">Sending campaign...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a few minutes depending on the number of contacts
                </p>
              </div>
            </div>
          ) : (
            <CampaignBuilder
              onClose={() => {
                setShowBuilder(false);
                setEditingCampaign(null);
              }}
              onSave={handleCreateCampaign}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
      {/* Premium Professional Navbar */}
      <div className="h-20 px-8 flex items-center justify-between border-b border-border/60 bg-gradient-to-br from-background via-background to-primary/[0.02] backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] flex-shrink-0 z-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-[0_8px_24px_rgba(99,102,241,0.25)] ring-1 ring-primary/20">
              <Megaphone className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              Campaigns
              <Activity className="w-5 h-5 text-primary/80" />
            </h1>
            <p className="text-sm text-muted-foreground/80 mt-1 font-medium">Create and manage marketing campaigns across all channels</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBatchCallBuilder(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Batch Call</span>
          </button>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl text-sm font-bold hover:from-primary/90 hover:to-primary/80 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Premium Content */}
      <div className="flex-1 overflow-auto p-8 bg-gradient-to-br from-background via-background to-primary/[0.01]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <LoadingLogo size="md" text="Loading campaigns..." />
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="rounded-3xl bg-gradient-to-br from-secondary/40 to-secondary/20 p-8 mb-6 shadow-inner">
              <svg
                className="w-20 h-20 text-muted-foreground/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">
              No campaigns yet
            </h3>
            <p className="text-sm text-muted-foreground/80 mb-8 font-medium">
              Create your first campaign to get started
            </p>
            <button
              onClick={() => setShowBuilder(true)}
              className="px-8 py-4 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl text-sm font-bold hover:from-primary/90 hover:to-primary/80 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              <span>Create Campaign</span>
            </button>
          </div>
        ) : (
          <CampaignList
            campaigns={campaigns}
            onEdit={handleEditCampaign}
            onDelete={handleDeleteCampaign}
          />
        )}
      </div>
    </div>
  );
}
