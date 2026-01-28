"use client";

import { AgentList } from "@/components/agents/AgentList";
import { TrainingSidebar } from "@/components/training/TrainingSidebar";

export default function AgentsPage() {
  return (
    <div className="fixed inset-0 flex" style={{ left: "240px" }}>
      <TrainingSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <AgentList />
        </div>
      </div>
    </div>
  );
}

