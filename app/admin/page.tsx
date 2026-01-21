"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService, DashboardMetrics } from "@/services/admin.service";
import { Building2, Users, Zap, CheckCircle2, XCircle, Activity, Loader2, Phone, MessageSquare, ShoppingCart } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: metrics, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['admin', 'dashboard', 'metrics'],
    queryFn: () => adminService.getDashboardMetrics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    toast.error('Failed to load dashboard metrics');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">Failed to load dashboard</div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Organizations",
      value: metrics?.totalOrganizations || 0,
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Users",
      value: metrics?.totalUsers || 0,
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Automations",
      value: metrics?.totalAutomations || 0,
      icon: Zap,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Active Automations",
      value: metrics?.activeAutomations || 0,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Total Executions",
      value: metrics?.totalExecutions || 0,
      icon: Activity,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Failed Executions",
      value: metrics?.failedExecutions || 0,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Google Integrations",
      value: metrics?.googleIntegrations || 0,
      icon: Building2,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      title: "WhatsApp Integrations",
      value: metrics?.whatsappIntegrations || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-600/10",
    },
    {
      title: "Instagram Integrations",
      value: metrics?.instagramIntegrations || 0,
      icon: CheckCircle2,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      title: "Facebook Integrations",
      value: metrics?.facebookIntegrations || 0,
      icon: CheckCircle2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "E-commerce Integrations",
      value: metrics?.ecommerceIntegrations || 0,
      icon: ShoppingCart,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Total Call Minutes",
      value: metrics?.totalCallMinutes || 0,
      icon: Phone,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10",
    },
    {
      title: "Total Chat Conversations",
      value: metrics?.totalChatConversations || 0,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-600/10",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of platform metrics and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isClickable = ['Facebook Integrations', 'Instagram Integrations', 'WhatsApp Integrations', 'Google Integrations', 'E-commerce Integrations'].includes(stat.title);
          
          const card = (
            <div
              className={cn(
                "bg-card border border-border rounded-xl p-6 shadow-sm transition-all",
                isClickable && stat.value > 0 ? "hover:shadow-lg hover:border-primary cursor-pointer" : "hover:shadow-md"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-lg", stat.bgColor)}>
                  <Icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          );
          
          if (isClickable && stat.value > 0) {
            let filterParam = '';
            if (stat.title === 'Facebook Integrations') filterParam = 'facebook';
            else if (stat.title === 'Instagram Integrations') filterParam = 'instagram';
            else if (stat.title === 'WhatsApp Integrations') filterParam = 'whatsapp';
            else if (stat.title === 'Google Integrations') filterParam = 'google';
            else if (stat.title === 'E-commerce Integrations') filterParam = 'ecommerce';
            
            return (
              <Link key={index} href={`/admin/organizations?integration=${filterParam}`}>
                {card}
              </Link>
            );
          }
          
          return <div key={index}>{card}</div>;
        })}
      </div>
    </div>
  );
}
