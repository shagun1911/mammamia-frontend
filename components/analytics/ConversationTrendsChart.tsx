"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ConversationTrendsChartProps {
  data: Array<{
    date: string;
    newConversations: number;
    closedConversations: number;
  }>;
}

export function ConversationTrendsChart({ data }: ConversationTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No data available</p>
      </div>
    );
  }

  // Format date for display
  const formattedData = data.map(item => {
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

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
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
        <Line 
          type="monotone" 
          dataKey="newConversations" 
          stroke="#3b82f6" 
          strokeWidth={3}
          name="New Conversations"
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="closedConversations" 
          stroke="#10b981" 
          strokeWidth={3}
          name="Closed Conversations"
          dot={{ fill: '#10b981', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
