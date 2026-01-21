"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService, AutomationListItem } from "@/services/admin.service";
import { ArrowLeft, Search, Eye, Play, Pause, Loader2, Zap, X, GitBranch, Workflow } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminAutomationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationListItem | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'automations', page, search, statusFilter],
    queryFn: () => adminService.getAllAutomations({
      page,
      limit,
      search: search || undefined,
      status: statusFilter === 'enabled' ? 'active' : statusFilter === 'disabled' ? 'inactive' : undefined,
    }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.toggleAutomation(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'automations'] });
      toast.success('Automation status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update automation');
    },
  });

  const automations = data?.items || data?.data?.items || [];
  const pagination = data?.pagination || data?.data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Automations</h1>
          <p className="text-muted-foreground">Manage all automations across organizations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search automations..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
        >
          <option value="all">All Status</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : automations.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No automations found</p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Nodes</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Executions</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Last Executed</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {automations.map((automation: AutomationListItem) => (
                    <tr key={automation._id} className="hover:bg-secondary/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{automation.name}</div>
                        {automation.description && (
                          <div className="text-sm text-muted-foreground mt-1">{automation.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {automation.organizationId?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            automation.isActive
                              ? "bg-green-500/10 text-green-500"
                              : "bg-gray-500/10 text-gray-500"
                          )}
                        >
                          {automation.isActive ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{automation.nodeCount}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{automation.executionCount}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {automation.lastExecutedAt
                          ? new Date(automation.lastExecutedAt).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              toggleMutation.mutate({
                                id: automation._id,
                                isActive: !automation.isActive,
                              })
                            }
                            disabled={toggleMutation.isPending}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              automation.isActive
                                ? "text-orange-500 hover:bg-orange-500/10"
                                : "text-green-500 hover:bg-green-500/10",
                              toggleMutation.isPending && "opacity-50 cursor-not-allowed"
                            )}
                            title={automation.isActive ? "Disable" : "Enable"}
                          >
                            {automation.isActive ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedAutomation(automation)}
                            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="View Automation Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} automations
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
        </>
      )}

      {/* Automation Details Modal */}
      {selectedAutomation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Workflow className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedAutomation.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedAutomation.organizationId?.name || 'Unknown Organization'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAutomation(null)}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 rounded-lg p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Status</div>
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
                    selectedAutomation.isActive
                      ? "bg-green-500/10 text-green-500"
                      : "bg-gray-500/10 text-gray-500"
                  )}>
                    {selectedAutomation.isActive ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Nodes</div>
                  <div className="text-2xl font-bold text-foreground">{selectedAutomation.nodeCount}</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Executions</div>
                  <div className="text-2xl font-bold text-foreground">{selectedAutomation.executionCount}</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Last Executed</div>
                  <div className="text-sm text-foreground">
                    {selectedAutomation.lastExecutedAt
                      ? new Date(selectedAutomation.lastExecutedAt).toLocaleString()
                      : 'Never'}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedAutomation.description && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Description</h3>
                  <p className="text-foreground bg-secondary/30 rounded-lg p-4">{selectedAutomation.description}</p>
                </div>
              )}

              {/* Automation Structure */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Automation Workflow
                </h3>
                <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                  {(selectedAutomation as any).nodes && (selectedAutomation as any).nodes.length > 0 ? (
                    <>
                      {/* Trigger Node */}
                      {(selectedAutomation as any).nodes
                        .filter((node: any) => node.type === 'trigger')
                        .map((node: any, index: number) => (
                          <div key={node.id} className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Zap className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-blue-400 uppercase mb-1">Trigger</div>
                              <div className="font-medium text-foreground">{node.serviceId || node.label || 'Unnamed Trigger'}</div>
                              {node.config && Object.keys(node.config).length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <details className="cursor-pointer">
                                    <summary className="hover:text-foreground">View Configuration</summary>
                                    <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-x-auto">
                                      {JSON.stringify(node.config, null, 2)}
                                    </pre>
                                  </details>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                      {/* Action Nodes */}
                      {(selectedAutomation as any).nodes
                        .filter((node: any) => node.type === 'action')
                        .map((node: any, index: number) => (
                          <div key={node.id} className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <div className="w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-green-400 uppercase mb-1">Action {index + 1}</div>
                              <div className="font-medium text-foreground">{node.serviceId || node.label || 'Unnamed Action'}</div>
                              {node.config && Object.keys(node.config).length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <details className="cursor-pointer">
                                    <summary className="hover:text-foreground">View Configuration</summary>
                                    <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-x-auto">
                                      {JSON.stringify(node.config, null, 2)}
                                    </pre>
                                  </details>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No workflow nodes found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  <span className="text-foreground">{new Date(selectedAutomation.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Updated: </span>
                  <span className="text-foreground">{new Date(selectedAutomation.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-secondary/50">
              <button
                onClick={() => setSelectedAutomation(null)}
                className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
