"use client";

import { useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";

interface UsageTrendsChartProps {
  data: Array<{
    date: string;
    newConversations: number;
    callMinutes: number;
    chatConversations?: number;
  }>;
}

export function UsageTrendsChart({ data }: UsageTrendsChartProps) {

  const formattedData = useMemo(() => {
    if (!data) return [];
    return data.map(item => {
      try {
        const date = new Date(item.date);
        return {
          ...item,
          dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      } catch {
        return {
          ...item,
          dateLabel: item.date
        };
      }
    });
  }, [data]);

  if (formattedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <Activity className="w-8 h-8 opacity-20" />
        <p className="text-sm">No activity recorded for this period</p>
      </div>
    );
  }

  console.log('[UsageTrendsChart] Rendering chart with data:', formattedData.length, 'items');

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="dateLabel"
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
          label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            padding: '12px'
          }}
          formatter={(value: any) => [value.toLocaleString(), '']}
        />
        <Legend />
        <Bar
          dataKey="newConversations"
          fill="#3b82f6"
          name="Conversations"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="callMinutes"
          fill="#14b8a6"
          name="Call Minutes"
          radius={[4, 4, 0, 0]}
        />
        {data.some(item => item.chatConversations !== undefined) && (
          <Bar
            dataKey="chatConversations"
            fill="#8b5cf6"
            name="Chat Conversations"
            radius={[4, 4, 0, 0]}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
