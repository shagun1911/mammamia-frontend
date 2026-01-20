"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Execution {
  _id: string;
  automationId: string;
  status: 'success' | 'failed' | 'pending';
  triggerData?: any;
  actionData?: any;
  errorMessage?: string;
  executedAt: string;
}

interface ExecutionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  automationId: string | null;
  automationName?: string;
}

export function ExecutionsModal({ isOpen, onClose, automationId, automationName }: ExecutionsModalProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (isOpen && automationId) {
      loadExecutions();
    }
  }, [isOpen, automationId, page]);

  const loadExecutions = async () => {
    if (!automationId) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get(`/automations/${automationId}/logs`, {
        params: { page, limit },
      });
      
      const data = response.data?.data || response.data;
      const items = data?.items || [];
      const pagination = data?.pagination || {};
      
      setExecutions(items);
      setTotal(pagination.total || 0);
    } catch (error: any) {
      console.error('Error loading executions:', error);
      setExecutions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      success: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      failed: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    };
    
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border",
        styles[status as keyof typeof styles] || styles.pending
      )}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Execution Logs</h2>
            {automationName && (
              <p className="text-sm text-muted-foreground mt-1">{automationName}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadExecutions}
              disabled={loading}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && executions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading executions...</p>
              </div>
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-foreground mb-2">No executions yet</p>
              <p className="text-sm text-muted-foreground">Executions will appear here when the automation runs</p>
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution) => (
                <div
                  key={execution._id}
                  className="bg-secondary/50 border border-border rounded-lg p-4 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(execution.status)}
                      <span className="text-sm text-muted-foreground">
                        {formatDate(execution.executedAt)}
                      </span>
                    </div>
                  </div>
                  
                  {execution.errorMessage && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Error</p>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80">{execution.errorMessage}</p>
                    </div>
                  )}
                  
                  {(execution.triggerData || execution.actionData) && (
                    <details className="mt-3">
                      <summary className="text-sm font-medium text-foreground cursor-pointer hover:text-primary">
                        View Details
                      </summary>
                      <div className="mt-2 p-3 bg-background rounded-lg border border-border">
                        {execution.triggerData && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Trigger Data:</p>
                            <pre className="text-xs text-foreground overflow-x-auto">
                              {JSON.stringify(execution.triggerData, null, 2)}
                            </pre>
                          </div>
                        )}
                        {execution.actionData && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Action Data:</p>
                            <pre className="text-xs text-foreground overflow-x-auto">
                              {JSON.stringify(execution.actionData, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between p-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
