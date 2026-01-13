"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChannelData } from "@/data/mockAnalytics";

interface ChannelChartProps {
  data: ChannelData[];
}

export function ChannelChart({ data }: ChannelChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const chartData = data.map(item => ({
    name: item.channel,
    value: item.count,
    color: item.color,
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-8 h-[450px] shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-foreground">
          Conversations by Channel
        </h3>
      </div>

      <div className="flex items-center gap-8">
        {/* Donut chart */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-3xl font-bold"
              >
                {total.toLocaleString()}
              </text>
              <text
                x="50%"
                y="60%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-sm"
              >
                Total
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Enhanced Legend */}
        <div className="space-y-4">
          {data.map((item) => {
            const percentage = Math.round((item.count / total) * 100);
            return (
              <div key={item.channel} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group">
                <div
                  className="w-4 h-4 rounded-full shadow-sm group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{item.channel}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{percentage}% of total</div>
                </div>
                <div className="text-base font-bold text-foreground">
                  {item.count.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

