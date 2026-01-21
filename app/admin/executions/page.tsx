"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService, ExecutionLog } from "@/services/admin.service";
import { ArrowLeft, Search, RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Activity } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminExecutionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'executions', page, statusFilter],
    queryFn: () => adminService.getExecutionLogs({
      page,
      limit,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  });

  const { data: executionDetail } = useQuery({
    queryKey: ['admin', 'execution', selectedExecution],
    queryFn: async () => {
      try {
        const result = await adminService.getExecutionById(selectedExecution!);
        const data = result.data || result;
        // Ensure automationId structure matches frontend expectations
        if (data && data.automationId && typeof data.automationId === 'object' && !data.automationId.name) {
          // If automationId is populated but doesn't have name, try to get it from automation
          if (data.automation && data.automation.name) {
            data.automationId = {
              _id: data.automation._id || data.automationId._id,
              name: data.automation.name
            };
          }
        }
        return data;
      } catch (error) {
        console.error('Error fetching execution detail:', error);
        return null;
      }
    },
    enabled: !!selectedExecution,
  });

  const rerunMutation = useMutation({
    mutationFn: (executionId: string) => adminService.rerunExecution(executionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'executions'] });
      toast.success('Execution queued for retry');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to rerun execution');
    },
  });

  const executions = data?.items || data?.data?.items || [];
  const pagination = data?.pagination || data?.data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Execution Logs</h1>
        <p className="text-muted-foreground">Monitor automation executions and debug issues</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Executions List */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No executions found</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Automation</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Executed At</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {executions.map((execution: any) => {
                      const automationName = execution.automation?.name || execution.automationId?.name || 'N/A';
                      const executionDate = execution.executedAt || execution.createdAt;
                      const status = execution.status || 'pending';
                      
                      return (
                        <tr
                          key={execution._id}
                          className={cn(
                            "hover:bg-secondary/50 cursor-pointer",
                            selectedExecution === execution._id && "bg-primary/5"
                          )}
                          onClick={() => setSelectedExecution(execution._id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(status)}
                              <span className={cn(
                                "text-xs font-medium",
                                status === 'success' && "text-green-500",
                                status === 'failed' && "text-red-500",
                                status === 'pending' && "text-yellow-500"
                              )}>
                                {status}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {automationName}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {executionDate ? new Date(executionDate).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                rerunMutation.mutate(execution._id);
                              }}
                              disabled={rerunMutation.isPending}
                              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                              title="Re-run execution"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} executions
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Execution Detail */}
        <div className="lg:col-span-1">
          {selectedExecution && executionDetail ? (
            <div className="bg-card border border-border rounded-lg p-6 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <h3 className="text-lg font-semibold text-foreground mb-4">Execution Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusIcon(executionDetail.status || 'pending')}
                    <span className="text-sm text-foreground">{executionDetail.status || 'pending'}</span>
                  </div>
                </div>
                {(executionDetail.errorMessage || executionDetail.error) && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Error</label>
                    <div className="mt-1 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg break-words">
                      {executionDetail.errorMessage || executionDetail.error || 'Unknown error'}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Trigger Data</label>
                  <pre className="mt-1 text-xs bg-secondary p-3 rounded-lg overflow-auto max-h-40">
                    {JSON.stringify(executionDetail.triggerData || {}, null, 2)}
                  </pre>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Action Data</label>
                  <pre className="mt-1 text-xs bg-secondary p-3 rounded-lg overflow-auto max-h-40">
                    {JSON.stringify(executionDetail.actionData || executionDetail.actionResults || [], null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 text-center text-muted-foreground">
              Select an execution to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
