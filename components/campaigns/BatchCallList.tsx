"use client";

import { useState } from "react";
import { Phone, Clock, CheckCircle, XCircle, AlertCircle, X, RefreshCw } from "lucide-react";
import { useBatchCalls, useCancelBatchJob } from "@/hooks/useBatchCalling";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface BatchCall {
  _id?: string;
  batch_call_id: string;
  name: string;
  agent_id: string;
  status: string;
  phone_number_id: string;
  phone_provider: string;
  created_at_unix: number;
  scheduled_time_unix: number;
  timezone: string;
  total_calls_dispatched: number;
  total_calls_scheduled: number;
  total_calls_finished: number;
  last_updated_at_unix: number;
  retry_count: number;
  agent_name: string;
  call_name: string;
  recipients_count: number;
  sender_email?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BatchCallListProps {
  onClose?: () => void;
}

export function BatchCallList({ onClose }: BatchCallListProps) {
  const { data: batchCalls = [], isLoading, refetch } = useBatchCalls();
  const cancelBatchJob = useCancelBatchJob();
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const handleCancel = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to cancel this batch job? This action cannot be undone.')) {
      return;
    }

    try {
      await cancelBatchJob.mutateAsync(jobId);
      // Invalidate and refetch batch calls
      queryClient.invalidateQueries({ queryKey: ['batchCalls'] });
      queryClient.invalidateQueries({ queryKey: ['batchJobStatus', jobId] });
    } catch (error: any) {
      // Error is already handled by the mutation
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'finished':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
      case 'canceled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
      case 'scheduled':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'finished':
        return 'text-green-500 bg-green-500/10';
      case 'cancelled':
      case 'canceled':
        return 'text-gray-500 bg-gray-500/10';
      case 'failed':
      case 'error':
        return 'text-red-500 bg-red-500/10';
      case 'running':
      case 'in_progress':
        return 'text-blue-500 bg-blue-500/10';
      case 'pending':
      case 'scheduled':
        return 'text-yellow-500 bg-yellow-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const canCancel = (status: string) => {
    const lowerStatus = status.toLowerCase();
    return ['pending', 'scheduled', 'running', 'in_progress'].includes(lowerStatus);
  };

  const formatDate = (unixTimestamp: number) => {
    return new Date(unixTimestamp * 1000).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading batch calls...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Batch Calls</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {batchCalls.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No batch calls found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batchCalls.map((batchCall: BatchCall) => (
            <div
              key={batchCall.batch_call_id}
              className={cn(
                "bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors",
                selectedJobId === batchCall.batch_call_id && "border-primary"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-foreground">{batchCall.name}</h4>
                    <span className={cn("px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1", getStatusColor(batchCall.status))}>
                      {getStatusIcon(batchCall.status)}
                      {batchCall.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Agent:</span> {batchCall.agent_name}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Scheduled:</span> {batchCall.total_calls_scheduled}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Dispatched:</span> {batchCall.total_calls_dispatched}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Finished:</span> {batchCall.total_calls_finished}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    <div>Created: {formatDate(batchCall.created_at_unix)}</div>
                    {batchCall.scheduled_time_unix && (
                      <div>Scheduled: {formatDate(batchCall.scheduled_time_unix)}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {canCancel(batchCall.status) && (
                    <button
                      onClick={(e) => handleCancel(batchCall.batch_call_id, e)}
                      disabled={cancelBatchJob.isPending}
                      className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelBatchJob.isPending ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

