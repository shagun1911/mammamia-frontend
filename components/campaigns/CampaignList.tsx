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
      draft: "bg-gray-500 text-white",
      scheduled: "bg-blue-500 text-white",
      running: "bg-green-500 text-white animate-pulse",
      paused: "bg-yellow-500 text-white",
      completed: "bg-green-600 text-white",
      failed: "bg-red-500 text-white",
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
          "px-2.5 py-1 rounded-xl text-xs font-medium",
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
            className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all"
          >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{campaign.name}</h3>
                  {getStatusBadge(normalizedStatus as Campaign["status"])}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{campaign.contactList || (campaign.listId?.name || 'Unknown List')}</span>
                  {campaign.scheduledAt && (
                    <span>Scheduled: {formatDate(campaign.scheduledAt)}</span>
                  )}
                  {campaign.createdAt && (
                    <span>Created: {formatDate(campaign.createdAt)}</span>
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
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {normalizedStatus === 'draft' && (
                  <button
                    onClick={() => onEdit(campaign)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {normalizedStatus === 'draft' && (
                  <button
                    onClick={() => onDelete(campaignId, normalizedStatus)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar for Running/Paused/Completed Campaigns */}
            {(isRunning || isPaused || normalizedStatus === 'completed' || normalizedStatus === 'failed') && stats.total > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Progress</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-300",
                      isRunning && "bg-green-500",
                      isPaused && "bg-yellow-500",
                      normalizedStatus === 'completed' && "bg-green-600",
                      normalizedStatus === 'failed' && "bg-red-500"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Total: {stats.total}</span>
                  <span>Sent: {stats.sent}</span>
                  <span>Delivered: {stats.delivered}</span>
                  <span className={cn(stats.failed > 0 && "text-red-500")}>Failed: {stats.failed}</span>
                  <span>Pending: {stats.pending}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {normalizedStatus === 'draft' && (
                <button
                  onClick={() => handleAction('start', campaignId)}
                  disabled={startCampaign.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {startCampaign.isPending ? 'Starting...' : 'Start'}
                </button>
              )}
              {isRunning && (
                <button
                  onClick={() => handleAction('pause', campaignId)}
                  disabled={pauseCampaign.isPending}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  {pauseCampaign.isPending ? 'Pausing...' : 'Pause'}
                </button>
              )}
              {isPaused && (
                <>
                  <button
                    onClick={() => handleAction('resume', campaignId)}
                    disabled={resumeCampaign.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {resumeCampaign.isPending ? 'Resuming...' : 'Resume'}
                  </button>
                </>
              )}
              {hasFailed && (
                <button
                  onClick={() => handleAction('retry', campaignId)}
                  disabled={retryFailed.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
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
