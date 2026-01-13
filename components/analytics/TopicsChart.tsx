"use client";

import { MoreVertical } from "lucide-react";
import { TopicData } from "@/data/mockAnalytics";

interface TopicsChartProps {
  data: TopicData[];
}

export function TopicsChart({ data }: TopicsChartProps) {
  const maxCount = Math.max(...data.map((item) => item.count));

  return (
    <div className="bg-card border border-border rounded-xl p-8 h-[450px] flex flex-col shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Most Discussed Topics
          </h3>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1.5 hover:bg-secondary rounded-lg">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {data.map((item, index) => {
          const percentage = (item.count / maxCount) * 100;
          
          return (
            <div key={item.topic} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-6">#{index + 1}</span>
                  <span className="text-sm font-semibold text-foreground">{item.topic}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{item.count.toLocaleString()}</span>
              </div>
              <div className="relative h-10 bg-secondary rounded-lg overflow-hidden shadow-inner">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-lg transition-all duration-500 group-hover:from-primary/90 group-hover:to-primary/70 shadow-sm"
                  style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-semibold text-foreground/80 z-10">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

