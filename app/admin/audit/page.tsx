"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, RefreshCw, Calendar } from "lucide-react";
import { adminService } from "@/services/admin.service";

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    dateFrom: '',
    dateTo: ''
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-audit-logs', page, filters],
    queryFn: () => adminService.getAuditLogs({
      ...filters,
      page,
      limit: 50
    })
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load audit logs</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const logsData = data?.data || data || {};
  const logs = logsData.items || logsData.logs || [];
  const pagination = logsData.pagination || {};

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-2">System activity logs</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Action"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-4 py-2 bg-background border border-border rounded-lg"
          />
          <input
            type="text"
            placeholder="User ID"
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            className="px-4 py-2 bg-background border border-border rounded-lg"
          />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="px-4 py-2 bg-background border border-border rounded-lg"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="px-4 py-2 bg-background border border-border rounded-lg"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Activity Logs</h2>
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No audit logs available</p>
            <p className="text-sm text-muted-foreground mt-2">Audit logging will be available in a future update</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3">Timestamp</th>
                  <th className="text-left p-3">Action</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any, index: number) => (
                  <tr key={index} className="border-b border-border">
                    <td className="p-3">{new Date(log.timestamp || log.createdAt).toLocaleString()}</td>
                    <td className="p-3 capitalize">{log.action || 'N/A'}</td>
                    <td className="p-3">{log.userId || 'System'}</td>
                    <td className="p-3">{JSON.stringify(log.details || {})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
