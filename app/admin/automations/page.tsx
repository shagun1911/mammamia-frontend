"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService, AutomationListItem } from "@/services/admin.service";
import { ArrowLeft, Search, Eye, Play, Pause, Loader2, Zap } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminAutomationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'automations', page, search, statusFilter],
    queryFn: () => adminService.getAllAutomations({
      page,
      limit,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
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
                            onClick={() => {
                              // View JSON modal would go here
                              const json = JSON.stringify(automation, null, 2);
                              const blob = new Blob([json], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `automation-${automation._id}.json`;
                              a.click();
                            }}
                            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="View JSON"
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
    </div>
  );
}
