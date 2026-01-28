"use client";

import { useState, useEffect } from "react";
import { Globe, RotateCw, Pencil, Trash2, Loader2 } from "lucide-react";
import { Website } from "@/services/knowledgeBase.service";
import { toast } from "@/lib/toast";

interface WebsiteTabProps {
  websites: Website[];
  onAddWebsite: (url: string) => void;
  onDeleteWebsite: (id: string) => void;
  onResyncWebsite: (id: string) => void;
}

export function WebsiteTab({
  websites,
  onAddWebsite,
  onDeleteWebsite,
  onResyncWebsite,
}: WebsiteTabProps) {
  const [urlInput, setUrlInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resyncingId, setResyncingId] = useState<string | null>(null);

  const handleAddWebsite = async () => {
    if (!urlInput.trim()) {
      toast.error("Please enter a website URL");
      return;
    }
    setIsAdding(true);
    try {
      await onAddWebsite(urlInput.trim());
      toast.success("Website added and ingestion started!");
      setUrlInput("");
    } catch (error: any) {
      console.error("Failed to add website:", error);
      toast.error(error.message || "Failed to add website");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteWebsite = async (id: string) => {
    if (!confirm("Are you sure you want to delete this website document? This cannot be undone.")) {
      return;
    }
    setDeletingId(id);
    try {
      await onDeleteWebsite(id);
      toast.success("Website document deleted.");
    } catch (error: any) {
      console.error("Failed to delete website:", error);
      toast.error(error.message || "Failed to delete website");
    } finally {
      setDeletingId(null);
    }
  };

  const handleResyncWebsite = async (id: string) => {
    setResyncingId(id);
    try {
      await onResyncWebsite(id);
      toast.success("Website resync initiated.");
    } catch (error: any) {
      console.error("Failed to resync website:", error);
      toast.error(error.message || "Failed to resync website");
    } finally {
      setResyncingId(null);
    }
  };

  return (
    <div className="p-6">
      {/* Top section - URL input */}
      <div className="max-w-[600px] mb-6">
        <div className="flex gap-3">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter website URL to scrape (e.g., https://example.com/docs)"
            className="flex-1 bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddWebsite();
              }
            }}
            disabled={isAdding}
          />
          <button
            onClick={handleAddWebsite}
            disabled={!urlInput.trim() || isAdding}
            className="px-6 py-3 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Website"}
          </button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter a URL to scrape its content and add it as a new knowledge base document.
        </p>
      </div>

      {/* Website cards */}
      {websites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="rounded-full bg-secondary p-4 mb-4">
            <Globe className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No websites added yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Enter a website URL above to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {websites.map((website) => (
            <div
              key={website.id}
              className="border border-border rounded-xl p-5"
            >
              {/* Document header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-foreground truncate">
                        {website.name}
                      </h3>
                      {website.status && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                          website.status === 'ready' ? 'bg-green-500/10 text-green-500' :
                          website.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                          'bg-yellow-500/10 text-yellow-500 animate-pulse'
                        }`}>
                          {website.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {website.url}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ingested: {new Date(website.created_at_unix * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResyncWebsite(website.id)}
                    disabled={resyncingId === website.id || website.status === 'processing'}
                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Resync Website"
                  >
                    {resyncingId === website.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCw className="w-4 h-4" />
                    )}
                  </button>
                  {/* <button
                    className="p-2 text-green-400 hover:text-green-300 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button> */}
                  <button
                    onClick={() => handleDeleteWebsite(website.id)}
                    disabled={deletingId === website.id || website.status === 'processing'}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    {deletingId === website.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
