"use client";

import { KnowledgeBaseList } from "@/components/knowledge-base/KnowledgeBaseList";

export default function KnowledgeBasePage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Create and manage knowledge bases for your AI agents. Data is stored in Python RAG service (https://keplerov1-python-2.onrender.com).
          </p>
        </div>

        <KnowledgeBaseList />
      </div>
    </div>
  );
}

