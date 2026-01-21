"use client";

import { MetricCard } from "./MetricCard";

interface MetricsGridProps {
  metrics: {
    newConversations: { value: number; change: number };
    closedConversations: { value: number; change: number };
    reopenedConversations: { value: number; change: number };
    wrongAnswers: { value: number; change: number };
    linksClicked: { value: number; change: number };
    closedByOperators: { value: number; change: number };
    callMinutes?: { value: number; change: number };
    chatConversations?: { value: number; change: number };
  };
  chartData: any[];
}

export function MetricsGrid({ metrics, chartData }: MetricsGridProps) {
  const getChartData = (key: string) =>
    chartData.map((item) => ({ value: item[key] || 0 }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <MetricCard
        name="New Conversations"
        value={metrics.newConversations.value}
        change={metrics.newConversations.change}
        data={getChartData("newConversations")}
      />
      <MetricCard
        name="Closed Conversations"
        value={metrics.closedConversations.value}
        change={metrics.closedConversations.change}
        data={getChartData("closedConversations")}
      />
      <MetricCard
        name="Conversations Reopened"
        value={metrics.reopenedConversations.value}
        change={metrics.reopenedConversations.change}
        data={getChartData("reopenedConversations")}
      />
      <MetricCard
        name="Wrong Answers"
        value={metrics.wrongAnswers.value}
        change={metrics.wrongAnswers.change}
        data={getChartData("wrongAnswers")}
        isNegativeGood
      />
      <MetricCard
        name="Links Clicked"
        value={metrics.linksClicked.value}
        change={metrics.linksClicked.change}
        data={getChartData("linksClicked")}
      />
      <MetricCard
        name="Conversations Closed by Operators"
        value={metrics.closedByOperators.value}
        change={metrics.closedByOperators.change}
        data={getChartData("closedByOperators")}
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
          data={getChartData("newConversations")}
        />
      )}
    </div>
  );
}

