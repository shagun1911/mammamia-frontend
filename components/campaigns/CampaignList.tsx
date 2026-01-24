"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Play, Pause, RotateCcw, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePauseCampaign, useResumeCampaign, useRetryFailedCampaign, useStartCampaign } from "@/hooks/useCampaigns";
import { useRouter } from "next/navigation";

interface Campaign {
  _id?: string;
  id?: string;
  name: string;
  contactList?: string;
  listId?: any;
  status: "draft" | "scheduled" | "running" | "paused" | "completed" | "failed";
  scheduledDate?: string;
  scheduledAt?: string;
  sentCount?: number;
  totalRecipients?: number;
  failedCount?: number;
  pendingCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  createdAt?: string;
  stats?: {
    total?: number;
    sent?: number;
    delivered?: number;
    failed?: number;
    pending?: number;
    progress?: number;
  };
}

interface CampaignListProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string, status?: string) => void;
}

export function CampaignList({ campaigns, onEdit, onDelete }: CampaignListProps) {
  const router = useRouter();
  const pauseCampaign = usePauseCampaign();
  const resumeCampaign = useResumeCampaign();
  const retryFailed = useRetryFailedCampaign();
  const startCampaign = useStartCampaign();

  const getStatusBadge = (status: Campaign["status"]) => {
    const styles = {
      draft: "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm",
      scheduled: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm",
      running: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 animate-pulse",
      paused: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-sm",
      completed: "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm",
      failed: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm",
    };

    const labels = {
      draft: "Draft",
      scheduled: "Scheduled",
      running: "Running",
      paused: "Paused",
      completed: "Completed",
      failed: "Failed",
    };

    return (
      <span
        className={cn(
          "px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide uppercase",
          styles[status] || styles.draft
        )}
      >
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateProgress = (campaign: Campaign): number => {
    if (campaign.stats?.progress !== undefined) {
      return campaign.stats.progress;
    }
    const total = campaign.totalRecipients || campaign.stats?.total || 0;
    if (total === 0) return 0;
    const sent = campaign.sentCount || campaign.stats?.sent || 0;
    const failed = campaign.failedCount || campaign.stats?.failed || 0;
    return Math.round(((sent + failed) / total) * 100);
  };

  const getProgressStats = (campaign: Campaign) => {
    const total = campaign.totalRecipients || campaign.stats?.total || 0;
    const sent = campaign.sentCount || campaign.stats?.sent || 0;
    const failed = campaign.failedCount || campaign.stats?.failed || 0;
    const pending = campaign.pendingCount || campaign.stats?.pending || 0;
    const delivered = campaign.deliveredCount || campaign.stats?.delivered || 0;
    
    return { total, sent, failed, pending, delivered };
  };

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'retry', campaignId: string) => {
    try {
      switch (action) {
        case 'start':
          await startCampaign.mutateAsync(campaignId);
          break;
        case 'pause':
          await pauseCampaign.mutateAsync(campaignId);
          break;
        case 'resume':
          await resumeCampaign.mutateAsync(campaignId);
          break;
        case 'retry':
          await retryFailed.mutateAsync(campaignId);
          break;
      }
    } catch (error) {
      // Error is handled by the mutation hooks
    }
  };

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => {
        const campaignId = (campaign as any)._id?.toString() || campaign.id?.toString();
        if (!campaignId) {
          console.warn('Campaign missing ID:', campaign);
          return null;
        }
        
        // Normalize status - handle old statuses
        let normalizedStatus: Campaign["status"] = campaign.status;
        const statusStr = campaign.status as string;
        if (statusStr === 'sent' || statusStr === 'sending') {
          normalizedStatus = 'completed';
        }
        
        const stats = getProgressStats(campaign);
        const progress = calculateProgress(campaign);
        const isRunning = normalizedStatus === 'running';
        const isPaused = normalizedStatus === 'paused';
        const hasFailed = stats.failed > 0 && (normalizedStatus === 'completed' || normalizedStatus === 'failed');

        return (
          <div
            key={campaignId}
            className="group bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-7 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5"
          >
            {/* Premium Header Row */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold text-foreground tracking-tight">{campaign.name}</h3>
                  {getStatusBadge(normalizedStatus as Campaign["status"])}
                </div>
                <div className="flex items-center gap-5 text-sm text-muted-foreground/80 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                    {campaign.contactList || (campaign.listId?.name || 'Unknown List')}
                  </span>
                  {campaign.scheduledAt && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40"></span>
                      Scheduled: {formatDate(campaign.scheduledAt)}
                    </span>
                  )}
                  {campaign.createdAt && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></span>
                      Created: {formatDate(campaign.createdAt)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = campaignId || '';
                    if (id) {
                      router.push(`/campaigns/${id}`);
                    }
                  }}
                  className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 hover:shadow-sm"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {normalizedStatus === 'draft' && (
                  <button
                    onClick={() => onEdit(campaign)}
                    className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 hover:shadow-sm"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {normalizedStatus === 'draft' && (
                  <button
                    onClick={() => onDelete(campaignId, normalizedStatus)}
                    className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 hover:shadow-sm"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Premium Progress Bar for Running/Paused/Completed Campaigns */}
            {(isRunning || isPaused || normalizedStatus === 'completed' || normalizedStatus === 'failed') && stats.total > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-xl border border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-foreground tracking-tight">Progress</span>
                  <span className="text-sm font-bold text-primary">{progress}%</span>
                </div>
                <div className="w-full bg-secondary/60 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className={cn(
                      "h-3 rounded-full transition-all duration-500 shadow-sm",
                      isRunning && "bg-gradient-to-r from-green-500 to-green-600",
                      isPaused && "bg-gradient-to-r from-yellow-500 to-yellow-600",
                      normalizedStatus === 'completed' && "bg-gradient-to-r from-green-600 to-green-700",
                      normalizedStatus === 'failed' && "bg-gradient-to-r from-red-500 to-red-600"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-4 text-xs font-semibold text-muted-foreground/80">
                  <span className="px-2 py-1 rounded-lg bg-background/50">Total: {stats.total}</span>
                  <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-600">Sent: {stats.sent}</span>
                  <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600">Delivered: {stats.delivered}</span>
                  <span className={cn("px-2 py-1 rounded-lg", stats.failed > 0 ? "bg-red-500/10 text-red-600" : "bg-background/50")}>Failed: {stats.failed}</span>
                  <span className="px-2 py-1 rounded-lg bg-background/50">Pending: {stats.pending}</span>
                </div>
              </div>
            )}

            {/* Premium Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {normalizedStatus === 'draft' && (
                <button
                  onClick={() => handleAction('start', campaignId)}
                  disabled={startCampaign.isPending}
                  className="px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-bold hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-green-500/20"
                >
                  <Play className="w-4 h-4" />
                  {startCampaign.isPending ? 'Starting...' : 'Start Campaign'}
                </button>
              )}
              {isRunning && (
                <button
                  onClick={() => handleAction('pause', campaignId)}
                  disabled={pauseCampaign.isPending}
                  className="px-5 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-xl text-sm font-bold hover:from-yellow-700 hover:to-yellow-800 hover:shadow-xl hover:shadow-yellow-500/30 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                  <Pause className="w-4 h-4" />
                  {pauseCampaign.isPending ? 'Pausing...' : 'Pause Campaign'}
                </button>
              )}
              {isPaused && (
                <>
                  <button
                    onClick={() => handleAction('resume', campaignId)}
                    disabled={resumeCampaign.isPending}
                    className="px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-bold hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-green-500/20"
                  >
                    <Play className="w-4 h-4" />
                    {resumeCampaign.isPending ? 'Resuming...' : 'Resume Campaign'}
                  </button>
                </>
              )}
              {hasFailed && (
                <button
                  onClick={() => handleAction('retry', campaignId)}
                  disabled={retryFailed.isPending}
                  className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  {retryFailed.isPending ? 'Retrying...' : `Retry Failed (${stats.failed})`}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
