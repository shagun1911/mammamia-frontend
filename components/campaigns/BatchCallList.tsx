"use client";

import { useState } from "react";
import { Phone, Clock, CheckCircle, XCircle, AlertCircle, X, RefreshCw, ChevronDown, ChevronUp, User, Mail, Calendar, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useBatchCalls, useCancelBatchJob, useResumeBatchJob, useBatchJobDetails } from "@/hooks/useBatchCalling";
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
  const resumeBatchJob = useResumeBatchJob();
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

  const canResume = (status: string) => {
    const lowerStatus = status.toLowerCase();
    return ['cancelled', 'canceled', 'paused'].includes(lowerStatus);
  };

  const handleResume = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await resumeBatchJob.mutateAsync(jobId);
      queryClient.invalidateQueries({ queryKey: ['batchCalls'] });
      queryClient.invalidateQueries({ queryKey: ['batchJobStatus', jobId] });
      queryClient.invalidateQueries({ queryKey: ['batchJobDetails', jobId] });
    } catch (_) {
      // Error handled by mutation
    }
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
                      {canResume(batchCall.status) && (
                        <button
                          onClick={(e) => handleResume(batchCall.batch_call_id, e)}
                          disabled={resumeBatchJob.isPending}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resumeBatchJob.isPending ? 'Resuming...' : 'Resume'}
                        </button>
                      )}
                      {canCancel(batchCall.status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(batchCall.batch_call_id, e);
                          }}
                          disabled={cancelBatchJob.isPending}
                          className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancelBatchJob.isPending ? 'Pausing...' : 'Pause / Cancel'}
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
  const { data: detailsData, isLoading: detailsLoading } = useBatchJobDetails(batchCall.batch_call_id);
  const [selectedContactKey, setSelectedContactKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "transcript" | "metadata">("overview");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const formatDate = (unixTimestamp: number) => {
    return new Date(unixTimestamp * 1000).toLocaleString();
  };

  const getCallStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'finished':
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'busy':
      case 'line_busy':
      case 'user_busy':
        return <AlertCircle className="w-3 h-3 text-amber-500" />;
      case 'voicemail':
        return <Phone className="w-3 h-3 text-purple-500" />;
      case 'no_answer':
      case 'no-answer':
        return <Clock className="w-3 h-3 text-orange-500" />;
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
      case 'busy':
      case 'line_busy':
      case 'user_busy':
        return 'text-amber-600 bg-amber-500/10';
      case 'voicemail':
        return 'text-purple-600 bg-purple-500/10';
      case 'no_answer':
      case 'no-answer':
        return 'text-orange-600 bg-orange-500/10';
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

  const getDisplayFailureReason = (contact: any): string => {
    if (contact?.failed_reason) return contact.failed_reason;
    const status = String(contact?.status || "").toLowerCase();
    if (status === "busy") return "Line busy";
    if (status === "voicemail") return "Reached voicemail";
    if (status === "no_answer" || status === "no-answer") return "No answer";
    if (status === "failed") return "Call failed before completion";
    return "";
  };

  const contacts = detailsData?.contacts || [];
  const totalContacts = contacts.length;
  const totalPages = Math.max(1, Math.ceil(totalContacts / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalContacts);
  const paginatedContacts = contacts.slice(startIndex, endIndex);

  const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const normalizeTranscript = (transcript: any): Array<{ speaker: string; text: string; time?: string }> => {
    if (!transcript) return [];
    const rows: Array<{ speaker: string; text: string; time?: string }> = [];
    const items = Array.isArray(transcript)
      ? transcript
      : (transcript.items || transcript.messages || transcript.turns || []);
    if (Array.isArray(items)) {
      for (const item of items) {
        const text = item?.message || item?.content || item?.text || '';
        if (!String(text).trim()) continue;
        const role = item?.role || item?.speaker || 'unknown';
        rows.push({
          speaker: String(role).toLowerCase().includes('agent') || String(role).toLowerCase().includes('assistant') ? 'Agent' : 'User',
          text: String(text).trim(),
          time: item?.timestamp ? new Date(item.timestamp).toLocaleTimeString() : undefined
        });
      }
      return rows;
    }
    if (typeof transcript === 'string') {
      return transcript
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          if (line.toLowerCase().startsWith('agent:') || line.toLowerCase().startsWith('assistant:')) {
            return { speaker: 'Agent', text: line.replace(/^[^:]+:\s*/, '') };
          }
          if (line.toLowerCase().startsWith('user:') || line.toLowerCase().startsWith('customer:')) {
            return { speaker: 'User', text: line.replace(/^[^:]+:\s*/, '') };
          }
          return { speaker: 'Transcript', text: line };
        });
    }
    return [];
  };

  const selectedContact = (() => {
    if (!contacts.length) return null;
    if (selectedContactKey) {
      const existing = contacts.find((c: any, idx: number) => (c.conversation_id || c.phone_number || `${idx}`) === selectedContactKey);
      if (existing) return existing;
    }
    return contacts[0];
  })();

  const selectedTranscript = normalizeTranscript(selectedContact?.transcript);

  const PaginationBar = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{totalContacts === 0 ? 0 : startIndex + 1}</span>
        {" "}to <span className="font-semibold text-foreground">{endIndex}</span> of{" "}
        <span className="font-semibold text-foreground">{totalContacts}</span> contacts
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={goToPrevPage}
          disabled={safePage <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border rounded-md bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </button>
        <span className="text-xs text-muted-foreground min-w-[76px] text-center">
          Page {safePage} / {totalPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={safePage >= totalPages}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border rounded-md bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

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
          <h5 className="text-sm font-semibold text-foreground mb-1">Call Statistics</h5>
          <p className="text-xs text-muted-foreground mb-3">
            <span className="font-medium text-blue-500">Dispatched</span> = call sent to provider (ringing / connecting).&nbsp;
            <span className="font-medium text-green-500">Finished</span> = call fully ended (answered, no-answer, invalid number, etc.).
            Invalid or unanswered numbers can take up to 60 s each to be marked Finished by the provider.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground mb-1">Total Scheduled</div>
              <div className="text-lg font-semibold text-foreground">{batchCall.total_calls_scheduled}</div>
            </div>
            <div className="bg-background p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground mb-1">Dispatched</div>
              <div className="text-lg font-semibold text-blue-500">{batchCall.total_calls_dispatched}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">sent to provider</div>
            </div>
            <div className="bg-background p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground mb-1">Finished</div>
              <div className="text-lg font-semibold text-green-500">{batchCall.total_calls_finished}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">fully completed</div>
            </div>
            <div className="bg-background p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground mb-1">Remaining</div>
              <div className="text-lg font-semibold text-foreground">
                {Math.max(0, batchCall.total_calls_scheduled - batchCall.total_calls_finished)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">not yet finished</div>
            </div>
          </div>
        </div>

        {/* Individual Contact Results */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contact Details
              {totalContacts > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-xs text-muted-foreground font-normal">
                  {totalContacts} {totalContacts === 1 ? 'contact' : 'contacts'}
                </span>
              )}
            </h5>
            {totalContacts > pageSize && <PaginationBar />}
          </div>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading contact details...</span>
            </div>
          ) : totalContacts > 0 ? (
            <>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="xl:col-span-5 border border-border rounded-xl overflow-hidden bg-background">
                <div className="px-4 py-3 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground grid grid-cols-[1.1fr_1fr_0.7fr] gap-3">
                  <span>Phone / Name</span>
                  <span>Status</span>
                  <span className="text-right">Duration</span>
                </div>
                <div className="max-h-[520px] overflow-y-auto">
                  {paginatedContacts.map((call: any, index: number) => {
                    const rowKey = call.conversation_id || call.phone_number || `${safePage}_${index}`;
                    const isSelected = (selectedContact?.conversation_id || selectedContact?.phone_number) === (call.conversation_id || call.phone_number);
                    return (
                      <button
                        key={rowKey}
                        onClick={() => {
                          setSelectedContactKey(rowKey);
                          setActiveTab("overview");
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 border-b border-border/70 grid grid-cols-[1.1fr_1fr_0.7fr] gap-3 items-center hover:bg-accent/40 transition-colors",
                          isSelected && "bg-blue-500/8 border-l-2 border-l-blue-500"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{call.phone_number || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground truncate">{call.name || "-"}</div>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {getCallStatusIcon(call.status || "pending")}
                          <span className={cn("px-2 py-0.5 rounded text-[11px] font-medium", getCallStatusColor(call.status || "pending"))}>
                            {call.status || "pending"}
                          </span>
                        </div>
                        <div className="text-right text-xs text-muted-foreground font-medium">
                          {(call.duration_seconds || call.duration || 0)}s
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="xl:col-span-7 border border-border rounded-xl bg-background overflow-hidden">
                {selectedContact ? (
                  <>
                    <div className="p-4 border-b border-border bg-muted/20">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h6 className="text-base font-semibold text-foreground">{selectedContact.name || "Unknown contact"}</h6>
                          <p className="text-xs text-muted-foreground">{selectedContact.phone_number || "-"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2 py-1 rounded text-xs font-medium", getCallStatusColor(selectedContact.status || "pending"))}>
                            {selectedContact.status || "pending"}
                          </span>
                        </div>
                      </div>

                      {getDisplayFailureReason(selectedContact) && (
                        <div className="mt-3 rounded-lg border border-red-300/40 bg-red-500/10 px-3 py-2">
                          <div className="text-xs font-semibold text-red-600">Call Failed Reason</div>
                          <div className="text-xs text-red-700 mt-0.5">{getDisplayFailureReason(selectedContact)}</div>
                        </div>
                      )}
                    </div>

                    <div className="px-4 pt-3 border-b border-border flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab("overview")}
                        className={cn("px-3 py-1.5 text-xs rounded-t-md border-b-2", activeTab === "overview" ? "border-blue-500 text-blue-600 font-semibold" : "border-transparent text-muted-foreground")}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setActiveTab("transcript")}
                        className={cn("px-3 py-1.5 text-xs rounded-t-md border-b-2", activeTab === "transcript" ? "border-blue-500 text-blue-600 font-semibold" : "border-transparent text-muted-foreground")}
                      >
                        Transcript
                      </button>
                      <button
                        onClick={() => setActiveTab("metadata")}
                        className={cn("px-3 py-1.5 text-xs rounded-t-md border-b-2", activeTab === "metadata" ? "border-blue-500 text-blue-600 font-semibold" : "border-transparent text-muted-foreground")}
                      >
                        Metadata
                      </button>
                    </div>

                    <div className="p-4 min-h-[360px]">
                      {activeTab === "overview" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg bg-muted/40 p-3">
                              <div className="text-muted-foreground">Email</div>
                              <div className="text-foreground font-medium mt-1 break-all">{selectedContact.email || "-"}</div>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-3">
                              <div className="text-muted-foreground">Duration</div>
                              <div className="text-foreground font-medium mt-1">{selectedContact.duration_seconds || 0}s</div>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-3">
                              <div className="text-muted-foreground">End reason</div>
                              <div className="text-foreground font-medium mt-1">{selectedContact.end_reason || "-"}</div>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-3 col-span-2">
                              <div className="text-muted-foreground">Failure reason</div>
                              <div className="text-foreground font-medium mt-1">{getDisplayFailureReason(selectedContact) || "-"}</div>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-3">
                              <div className="text-muted-foreground">Messages</div>
                              <div className="text-foreground font-medium mt-1">{selectedContact?.conversation?.message_count ?? 0}</div>
                            </div>
                          </div>
                          {selectedContact.summary && (
                            <div className="rounded-lg border border-blue-400/25 bg-blue-500/5 p-3 text-xs">
                              <span className="font-semibold text-foreground">Summary: </span>
                              <span className="text-muted-foreground">{selectedContact.summary}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === "transcript" && (
                        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                          {selectedTranscript.length > 0 ? selectedTranscript.map((row, idx) => (
                            <div
                              key={`${row.speaker}_${idx}`}
                              className={cn(
                                "rounded-xl px-3 py-2 text-xs border max-w-[92%]",
                                row.speaker === "Agent"
                                  ? "bg-blue-500/7 border-blue-500/20"
                                  : "bg-muted/40 border-border ml-auto"
                              )}
                            >
                              <div className="font-semibold text-foreground mb-1">{row.speaker}</div>
                              <div className="text-muted-foreground whitespace-pre-wrap">{row.text}</div>
                              {row.time && <div className="text-[10px] text-muted-foreground mt-1">{row.time}</div>}
                            </div>
                          )) : (
                            <div className="text-xs text-muted-foreground">No transcript available for this contact yet.</div>
                          )}
                        </div>
                      )}

                      {activeTab === "metadata" && (
                        <pre className="text-[11px] whitespace-pre-wrap bg-muted/40 border border-border rounded-lg p-3 max-h-[360px] overflow-y-auto">
{JSON.stringify(selectedContact.metadata || {}, null, 2)}
                        </pre>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-sm text-muted-foreground">Select a contact to view details.</div>
                )}
              </div>
            </div>
            {totalContacts > pageSize && <PaginationBar />}
            </>
          ) : (
            <div className="rounded-lg bg-muted/40 border border-border p-4 text-sm text-muted-foreground space-y-2">
              {batchCall.status === 'in_progress' || batchCall.status === 'running' ? (
                <>
                  <div className="flex items-center gap-2 text-blue-500 font-medium">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Batch call is in progress — {batchCall.total_calls_dispatched} dispatched, {batchCall.total_calls_finished} finished
                  </div>
                  <p className="text-xs">
                    Individual results will appear here once calls finish.
                    <br />
                    <span className="font-medium">Why is "Finished" lower than "Dispatched"?</span>{' '}
                    "Dispatched" means the call was sent to the phone provider (Twilio/etc.) and is ringing or connecting.
                    "Finished" means the call has fully ended — answered &amp; hung up, no-answer timeout (~60 s), invalid number rejected, etc.
                    For fake/random numbers, each one takes up to 60 s to time out before the provider marks it finished.
                  </p>
                </>
              ) : (
                <p>No individual call results available from the provider for this batch.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

