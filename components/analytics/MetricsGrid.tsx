"use client";

import { MetricCard } from "./MetricCard";

interface MetricsGridProps {
  metrics: {
    newConversations: { value: number; change: number };
    callMinutes?: { value: number; change: number };
    chatConversations?: { value: number; change: number };
  };
  chartData: any[];
}

export function MetricsGrid({ metrics, chartData }: MetricsGridProps) {
  const getChartData = (key: string) =>
    chartData.map((item) => ({ value: item[key] || 0 }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <MetricCard
        name="New Conversations"
        value={metrics.newConversations.value}
        change={metrics.newConversations.change}
        data={getChartData("newConversations")}
      />
      {metrics.callMinutes && (
        <MetricCard
          name="Call Minutes Used"
          value={metrics.callMinutes.value}
          change={metrics.callMinutes.change}
          data={getChartData("callMinutes")}
        />
      )}
      {metrics.chatConversations && (
        <MetricCard
          name="Chat Conversations Done"
          value={metrics.chatConversations.value}
          change={metrics.chatConversations.change}
          data={getChartData("chatConversations")}
        />
      )}
    </div>
  );
}

