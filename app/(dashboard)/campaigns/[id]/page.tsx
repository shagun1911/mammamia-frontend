"use client";

import { use } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { useCampaign, usePauseCampaign, useResumeCampaign, useRetryFailedCampaign, useStartCampaign, useCampaignProgress } from "@/hooks/useCampaigns";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { getSidebarWidth } = useSidebar();
  const campaignId = params.id as string;

  const { data: campaign, isLoading } = useCampaign(campaignId);
  const { data: progress } = useCampaignProgress(campaignId, { refetchInterval: campaign?.status === 'running' ? 2000 : undefined });
  
  const pauseCampaign = usePauseCampaign();
  const resumeCampaign = useResumeCampaign();
  const retryFailed = useRetryFailedCampaign();
  const startCampaign = useStartCampaign();

  const campaignData = progress || campaign;
  const stats = campaignData?.stats || {
    total: campaignData?.totalRecipients || 0,
    sent: campaignData?.sentCount || 0,
    delivered: campaignData?.deliveredCount || 0,
    failed: campaignData?.failedCount || 0,
    pending: campaignData?.pendingCount || 0,
    progress: 0
  };

  const progressPercent = stats.progress || (stats.total > 0 
    ? Math.round(((stats.sent + stats.failed) / stats.total) * 100) 
    : 0);

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'retry') => {
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
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} campaign`);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ left: `${getSidebarWidth()}px` }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ left: `${getSidebarWidth()}px` }}>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Campaign not found</p>
          <button
            onClick={() => router.push('/campaigns')}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-gray-500 text-white",
      scheduled: "bg-blue-500 text-white",
      running: "bg-green-500 text-white animate-pulse",
      paused: "bg-yellow-500 text-white",
      completed: "bg-green-600 text-white",
      failed: "bg-red-500 text-white",
    };
    return (
      <span className={cn("px-3 py-1 rounded-lg text-sm font-medium", styles[status as keyof typeof styles] || styles.draft)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-auto" style={{ left: `${getSidebarWidth()}px` }}>
      {/* Header */}
      <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/campaigns')}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground">
              {campaign.createdAt && new Date(campaign.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(campaign.status)}
          {campaign.status === 'draft' && (
            <button
              onClick={() => handleAction('start')}
              disabled={startCampaign.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {startCampaign.isPending ? 'Starting...' : 'Start'}
            </button>
          )}
          {campaign.status === 'running' && (
            <button
              onClick={() => handleAction('pause')}
              disabled={pauseCampaign.isPending}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              {pauseCampaign.isPending ? 'Pausing...' : 'Pause'}
            </button>
          )}
          {campaign.status === 'paused' && (
            <button
              onClick={() => handleAction('resume')}
              disabled={resumeCampaign.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {resumeCampaign.isPending ? 'Resuming...' : 'Resume'}
            </button>
          )}
          {stats.failed > 0 && (campaign.status === 'completed' || campaign.status === 'failed') && (
            <button
              onClick={() => handleAction('retry')}
              disabled={retryFailed.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {retryFailed.isPending ? 'Retrying...' : `Retry Failed (${stats.failed})`}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        {/* Progress Section */}
        {stats.total > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Progress</h2>
              <span className="text-2xl font-bold text-foreground">{progressPercent}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-4 mb-4 overflow-hidden">
              <div
                className={cn(
                  "h-4 rounded-full transition-all duration-300",
                  campaign.status === 'running' && "bg-green-500",
                  campaign.status === 'paused' && "bg-yellow-500",
                  campaign.status === 'completed' && "bg-green-600",
                  campaign.status === 'failed' && "bg-red-500"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
                <div className="text-sm text-muted-foreground">Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.delivered}</div>
                <div className="text-sm text-muted-foreground">Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Info */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Campaign Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="text-lg font-medium text-foreground">{getStatusBadge(campaign.status)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Contact List</div>
              <div className="text-lg font-medium text-foreground">
                {(campaign as any).listId?.name || campaign.contactList || 'Unknown'}
              </div>
            </div>
            {campaign.scheduledAt && (
              <div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
                <div className="text-lg font-medium text-foreground">
                  {new Date(campaign.scheduledAt).toLocaleString()}
                </div>
              </div>
            )}
            {campaign.createdAt && (
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="text-lg font-medium text-foreground">
                  {new Date(campaign.createdAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logs Section */}
        {campaign.logs && campaign.logs.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Execution Logs</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {campaign.logs.map((log: any, index: number) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <span className={cn(
                    "mt-0.5",
                    log.type === 'success' && "text-green-500",
                    log.type === 'error' && "text-red-500",
                    log.type === 'warning' && "text-yellow-500",
                    log.type === 'info' && "text-blue-500"
                  )}>
                    {log.type === 'success' && '✔'}
                    {log.type === 'error' && '✖'}
                    {log.type === 'warning' && '⚠'}
                    {log.type === 'info' && 'ℹ'}
                  </span>
                  <div className="flex-1">
                    <div className="text-foreground">{log.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {log.timestamp && new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
