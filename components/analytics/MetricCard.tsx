"use client";

import { HelpCircle, TrendingUp, TrendingDown, MessageSquare, CheckCircle, RotateCcw, XCircle, Link2, UserCheck, Activity } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Area, AreaChart } from "recharts";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  name: string;
  value: number;
  change: number;
  data: any[];
  isNegativeGood?: boolean;
}

const metricIcons: Record<string, React.ElementType> = {
  "New Conversations": MessageSquare,
  "Closed Conversations": CheckCircle,
  "Conversations Reopened": RotateCcw,
  "Wrong Answers": XCircle,
  "Links Clicked": Link2,
  "Conversations Closed by Operators": UserCheck,
  "Call Minutes Used": Activity,
  "Chat Conversations Done": MessageSquare,
};

const metricColors: Record<string, { gradient: string; stroke: string; bg: string; iconColor: string }> = {
  "New Conversations": {
    gradient: "from-blue-500 to-cyan-500",
    stroke: "#3b82f6",
    bg: "from-blue-500/10 to-cyan-500/5",
    iconColor: "#3b82f6",
  },
  "Closed Conversations": {
    gradient: "from-green-500 to-emerald-500",
    stroke: "#10b981",
    bg: "from-green-500/10 to-emerald-500/5",
    iconColor: "#10b981",
  },
  "Conversations Reopened": {
    gradient: "from-orange-500 to-amber-500",
    stroke: "#f59e0b",
    bg: "from-orange-500/10 to-amber-500/5",
    iconColor: "#f59e0b",
  },
  "Wrong Answers": {
    gradient: "from-red-500 to-rose-500",
    stroke: "#ef4444",
    bg: "from-red-500/10 to-rose-500/5",
    iconColor: "#ef4444",
  },
  "Links Clicked": {
    gradient: "from-purple-500 to-pink-500",
    stroke: "#a855f7",
    bg: "from-purple-500/10 to-pink-500/5",
    iconColor: "#a855f7",
  },
  "Conversations Closed by Operators": {
    gradient: "from-indigo-500 to-violet-500",
    stroke: "#6366f1",
    bg: "from-indigo-500/10 to-violet-500/5",
    iconColor: "#6366f1",
  },
  "Call Minutes Used": {
    gradient: "from-teal-500 to-cyan-500",
    stroke: "#14b8a6",
    bg: "from-teal-500/10 to-cyan-500/5",
    iconColor: "#14b8a6",
  },
  "Chat Conversations Done": {
    gradient: "from-blue-500 to-indigo-500",
    stroke: "#3b82f6",
    bg: "from-blue-500/10 to-indigo-500/5",
    iconColor: "#3b82f6",
  },
};

export function MetricCard({ name, value, change, data, isNegativeGood = false }: MetricCardProps) {
  const isPositive = isNegativeGood ? change < 0 : change > 0;
  const changeColor = isPositive ? "text-green-500" : "text-red-500";
  const changeBg = isPositive ? "bg-green-500/10" : "bg-red-500/10";
  const Icon = metricIcons[name] || MessageSquare;
  const colors = metricColors[name] || metricColors["New Conversations"];

  return (
    <div className="bg-card border border-border rounded-xl p-6 h-[220px] flex flex-col hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center", colors.bg)}>
            <Icon className="w-4 h-4" style={{ color: colors.iconColor }} />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{name}</span>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-[36px] font-bold text-foreground">
          {value.toLocaleString()}
        </span>
        <div className={cn("flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md", changeColor, changeBg)}>
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>

      {/* Enhanced Mini chart */}
      {data && data.length > 0 ? (
        <div className="flex-1 mt-auto -mx-2 -mb-2">
          <ResponsiveContainer width="100%" height={70}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${name.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={colors.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors.stroke}
                strokeWidth={2.5}
                fill={`url(#gradient-${name.replace(/\s+/g, '-')})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 mt-auto -mx-2 -mb-2 h-[70px] flex items-center justify-center">
          <div className="w-full h-full bg-secondary/30 rounded-lg flex items-center justify-center">
            <span className="text-xs text-muted-foreground">No data</span>
          </div>
        </div>
      )}
    </div>
  );
}

