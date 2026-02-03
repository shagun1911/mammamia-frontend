"use client";

import { useState } from "react";
import { Phone, Clock, CheckCircle, XCircle, AlertCircle, X, RefreshCw, ChevronDown, ChevronUp, User, Mail, Calendar } from "lucide-react";
import { useBatchCalls, useCancelBatchJob, useBatchJobCalls } from "@/hooks/useBatchCalling";
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
  onCreateNew?: () => void;
}

export function BatchCallList({ onClose, onCreateNew }: BatchCallListProps) {
  const { data: batchCalls = [], isLoading, refetch } = useBatchCalls();
  const cancelBatchJob = useCancelBatchJob();
  const queryClient = useQueryClient();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

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

  const toggleExpand = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
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
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-600 hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>Create Batch Call</span>
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {batchCalls.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No batch calls found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batchCalls.map((batchCall: BatchCall) => {
            const isExpanded = expandedJobId === batchCall.batch_call_id;
            return (
              <div
                key={batchCall.batch_call_id}
                className={cn(
                  "bg-card border border-border rounded-lg transition-all",
                  isExpanded && "border-primary shadow-lg"
                )}
              >
                {/* Card Header - Clickable */}
                <div
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleExpand(batchCall.batch_call_id)}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(batchCall.batch_call_id, e);
                          }}
                          disabled={cancelBatchJob.isPending}
                          className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancelBatchJob.isPending ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <BatchCallDetails batchCall={batchCall} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface BatchCallDetailsProps {
  batchCall: BatchCall;
}

function BatchCallDetails({ batchCall }: BatchCallDetailsProps) {
  const { data: callsData, isLoading: callsLoading } = useBatchJobCalls(batchCall.batch_call_id);

  const formatDate = (unixTimestamp: number) => {
    return new Date(unixTimestamp * 1000).toLocaleString();
  };

  const getCallStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'finished':
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'ringing':
      case 'in_progress':
      case 'active':
        return <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-3 h-3 text-yellow-500" />;
    }
  };

  const getCallStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'finished':
      case 'success':
        return 'text-green-500 bg-green-500/10';
      case 'failed':
      case 'error':
        return 'text-red-500 bg-red-500/10';
      case 'ringing':
      case 'in_progress':
      case 'active':
        return 'text-blue-500 bg-blue-500/10';
      default:
        return 'text-yellow-500 bg-yellow-500/10';
    }
  };

  return (
    <div className="border-t border-border bg-muted/30">
      <div className="p-4 space-y-6">
        {/* Batch Call Information */}
        <div>
          <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Batch Call Information
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="font-medium">Agent:</span>
                <span className="text-foreground">{batchCall.agent_name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span className="font-medium">Phone Provider:</span>
                <span className="text-foreground">{batchCall.phone_provider}</span>
              </div>
              {batchCall.sender_email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">Sender Email:</span>
                  <span className="text-foreground">{batchCall.sender_email}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Call Name:</span>
                <span className="text-foreground">{batchCall.call_name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">Recipients:</span>
                <span className="text-foreground">{batchCall.recipients_count}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">Retry Count:</span>
                <span className="text-foreground">{batchCall.retry_count || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Call Statistics */}
        <div>
          <h5 className="text-sm font-semibold text-foreground mb-3">Call Statistics</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground mb-1">Total Scheduled</div>
              <div className="text-lg font-semibold text-foreground">{batchCall.total_calls_scheduled}</div>
            </div>
            <div className="bg-background p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground mb-1">Dispatched</div>
              <div className="text-lg font-semibold text-blue-500">{batchCall.total_calls_dispatched}</div>
            </div>
            <div className="bg-background p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground mb-1">Finished</div>
              <div className="text-lg font-semibold text-green-500">{batchCall.total_calls_finished}</div>
            </div>
            <div className="bg-background p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground mb-1">Remaining</div>
              <div className="text-lg font-semibold text-foreground">
                {batchCall.total_calls_scheduled - batchCall.total_calls_finished}
              </div>
            </div>
          </div>
        </div>

        {/* Individual Call Results */}
        <div>
          <h5 className="text-sm font-semibold text-foreground mb-3">
            Individual Call Results
            {callsData?.calls && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({callsData.calls.length} {callsData.calls.length === 1 ? 'call' : 'calls'})
              </span>
            )}
          </h5>
          
          {callsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading call results...</span>
            </div>
          ) : callsData?.calls && callsData.calls.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {callsData.calls.map((call: any, index: number) => (
                <div
                  key={call.id || call.call_id || index}
                  className="bg-background border border-border rounded-lg p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getCallStatusIcon(call.status || call.call_status || 'pending')}
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          getCallStatusColor(call.status || call.call_status || 'pending')
                        )}>
                          {call.status || call.call_status || 'pending'}
                        </span>
                        {call.phone_number && (
                          <span className="text-sm text-foreground font-medium">
                            {call.phone_number}
                          </span>
                        )}
                      </div>
                      
                      {call.name && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Name:</span> {call.name}
                        </div>
                      )}
                      
                      {call.email && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Email:</span> {call.email}
                        </div>
                      )}

                      {call.duration && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Duration:</span> {call.duration}s
                        </div>
                      )}

                      {call.created_at && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Called:</span> {formatDate(call.created_at)}
                        </div>
                      )}

                      {call.error && (
                        <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded mt-2">
                          <span className="font-medium">Error:</span> {call.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No individual call results available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

