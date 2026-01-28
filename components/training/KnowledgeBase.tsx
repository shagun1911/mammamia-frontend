"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQTab } from "./FAQTab";
import { WebsiteTab } from "./WebsiteTab";
import { FileTab } from "./FileTab";
import { 
  useFAQs, 
  useCreateFAQ, 
  useUpdateFAQ, 
  useDeleteFAQ,
  useWebsites,
  useAddWebsite,
  useRemoveWebsite,
  useFiles,
  useUploadFile,
  useDeleteFile,
  useResyncWebsite
} from "@/hooks/useKnowledgeBase";
import { useKnowledgeBase, KnowledgeBaseItem } from "@/contexts/KnowledgeBaseContext";

interface KnowledgeBaseProps {
  // knowledgeBases: KnowledgeBaseData[]; // No longer needed, fetched from context
}

export function KnowledgeBase({
  // knowledgeBases, // No longer needed
}: KnowledgeBaseProps) {
  const { collections, selectedCollection, setSelectedCollection } = useKnowledgeBase();
  const [activeTab, setActiveTab] = useState<"faq" | "website" | "file">("faq");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Use selectedCollection from context, which is the document ID
  const currentSelectedKBId = selectedCollection || '';

  // Update selectedCollection in context if no KB is selected and collections exist
  useEffect(() => {
    if (!selectedCollection && collections.length > 0) {
      setSelectedCollection(collections[0].id);
    }
  }, [collections, selectedCollection, setSelectedCollection]);

  // Fetch data from API only if we have a valid KB ID
  const { data: faqsData } = useFAQs(currentSelectedKBId || null);
  const { data: websitesData } = useWebsites(currentSelectedKBId || null);
  const { data: filesData } = useFiles(currentSelectedKBId || null);

  // Mutations - only initialize if we have a valid KB ID
  const createFAQ = useCreateFAQ(currentSelectedKBId);
  const updateFAQ = useUpdateFAQ(currentSelectedKBId);
  const deleteFAQ = useDeleteFAQ(currentSelectedKBId);
  const addWebsite = useAddWebsite(currentSelectedKBId);
  const removeWebsite = useRemoveWebsite(currentSelectedKBId);
  const resyncWebsite = useResyncWebsite(currentSelectedKBId);
  const uploadFile = useUploadFile(currentSelectedKBId);
  const deleteFile = useDeleteFile(currentSelectedKBId);

  const faqs = faqsData || [];
  const websites = websitesData || [];
  const files = filesData || [];

  // Check if no knowledge bases exist
  const hasNoKnowledgeBases = collections.length === 0;

  // FAQ handlers
  const handleAddFAQ = async (data: { question: string; answer: string }) => {
    if (!currentSelectedKBId) {
      throw new Error('No knowledge base selected');
    }
    await createFAQ.mutateAsync(data);
  };

  const handleEditFAQ = async (id: string, data: { question: string; answer: string }) => {
    if (!currentSelectedKBId) {
      throw new Error('No knowledge base selected');
    }
    await updateFAQ.mutateAsync({ faqId: id, data });
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!currentSelectedKBId) {
      throw new Error('No knowledge base selected');
    }
    await deleteFAQ.mutateAsync(id);
  };

  // Website handlers
  const handleAddWebsite = async (url: string) => {
    if (!currentSelectedKBId) {
      throw new Error('No knowledge base selected');
    }
    await addWebsite.mutateAsync({ url });
  };

  const handleDeleteWebsite = async (id: string) => {
    if (!currentSelectedKBId) {
      throw new Error('No knowledge base selected');
    }
    await removeWebsite.mutateAsync(id);
  };

  const handleResyncWebsite = async (id: string) => {
    if (!currentSelectedKBId) {
      throw new Error('No knowledge base selected');
    }
    await resyncWebsite.mutateAsync(id);
  };

  // File handlers
  const handleFilesAdded = async (newFiles: File[]) => {
    if (!currentSelectedKBId) {
      throw new Error('No knowledge base selected');
    }
    for (const file of newFiles) {
      await uploadFile.mutateAsync(file);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!currentSelectedKBId) {
      throw new Error('No knowledge base selected');
    }
    await deleteFile.mutateAsync(id);
  };

  const selectedKnowledgeBase = collections.find(kb => kb.id === currentSelectedKBId);

  // Show empty state if no knowledge bases
  if (hasNoKnowledgeBases) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📚</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Knowledge Bases Available
          </h3>
          <p className="text-muted-foreground mb-6">
            Create a new knowledge base document to start ingesting data.
          </p>
          {/* Removed seed script suggestion */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-16 px-6 flex items-center border-b border-border">
        <div className="relative">
          <button 
            className="flex items-center gap-2 w-[280px] px-4 py-2.5 bg-secondary rounded-lg text-sm text-white hover:bg-accent transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="flex-1 text-left">
              {selectedKnowledgeBase ? `${selectedKnowledgeBase.name} (${selectedKnowledgeBase.type})` : 'Select Knowledge Base'}
            </span>
            {isDropdownOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {isDropdownOpen && (
            <div className="absolute z-10 w-[280px] mt-1 bg-secondary border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {collections.map((kb) => (
                <button
                  key={kb.id}
                  onClick={() => {
                    setSelectedCollection(kb.id);
                    setIsDropdownOpen(false);
                  }}
                  className={cn(
                    "block w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors",
                    kb.id === currentSelectedKBId ? "bg-accent text-primary" : "text-foreground"
                  )}
                >
                  {kb.name} ({kb.type})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="px-6 pt-4 border-b border-border">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("faq")}
            className={cn(
              "relative pb-3 text-sm font-medium transition-colors",
              activeTab === "faq" ? "text-foreground" : "text-muted-foreground hover:text-secondary-foreground"
            )}
          >
            FAQ
            {activeTab === "faq" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("website")}
            className={cn(
              "relative pb-3 text-sm font-medium transition-colors",
              activeTab === "website" ? "text-foreground" : "text-muted-foreground hover:text-secondary-foreground"
            )}
          >
            Website
            {activeTab === "website" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("file")}
            className={cn(
              "relative pb-3 text-sm font-medium transition-colors",
              activeTab === "file" ? "text-foreground" : "text-muted-foreground hover:text-secondary-foreground"
            )}
          >
            File
            {activeTab === "file" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "faq" && (
          <FAQTab
            faqs={faqs}
            onAddFAQ={handleAddFAQ}
            onEditFAQ={handleEditFAQ}
            onDeleteFAQ={handleDeleteFAQ}
          />
        )}
        {activeTab === "website" && (
          <WebsiteTab
            websites={websites}
            onAddWebsite={handleAddWebsite}
            onDeleteWebsite={handleDeleteWebsite}
            onResyncWebsite={handleResyncWebsite}
          />
        )}
        {activeTab === "file" && (
          <FileTab
            files={files}
            onFilesAdded={handleFilesAdded}
            onDeleteFile={handleDeleteFile}
          />
        )}
      </div>
    </div>
  );
}
