"use client";

import { useState, useRef } from "react";
import { Zap, Paperclip, Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualControlPanelProps {
  isManualControl: boolean;
  onTakeControl: () => void;
  onReleaseControl: () => void;
  onSendMessage: (message: string, isInternal: boolean, files?: File[]) => void;
}

interface SelectedFile {
  file: File;
  preview?: string;
}

export function ManualControlPanel({
  isManualControl,
  onTakeControl,
  onReleaseControl,
  onSendMessage,
}: ManualControlPanelProps) {
  const [activeTab, setActiveTab] = useState<"conversation" | "internal">("conversation");
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles: SelectedFile[] = files.map(file => {
      const selectedFile: SelectedFile = { file };
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          setSelectedFiles(prev => prev.map(f => 
            f.file === file ? { ...f, preview } : f
          ));
        };
        reader.readAsDataURL(file);
      }
      return selectedFile;
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (message.trim() || selectedFiles.length > 0) {
      onSendMessage(message, activeTab === "internal", selectedFiles.map(f => f.file));
      setMessage("");
      setSelectedFiles([]);
    }
  };

  if (!isManualControl) {
    return (
      <div className="border-t border-border p-4">
        <button
          onClick={onTakeControl}
          className="w-full h-11 bg-primary rounded-lg text-foreground text-sm font-medium hover:brightness-110 transition-all"
        >
          Take Control
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-border">
      {/* Tabs */}
      <div className="flex px-4 pt-3 border-b border-border">
        <button
          onClick={() => setActiveTab("conversation")}
          className={cn(
            "px-4 pb-3 text-sm font-medium transition-colors relative",
            activeTab === "conversation"
              ? "text-foreground"
              : "text-muted-foreground hover:text-secondary-foreground"
          )}
        >
          Conversation
          {activeTab === "conversation" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("internal")}
          className={cn(
            "px-4 pb-3 text-sm font-medium transition-colors relative",
            activeTab === "internal"
              ? "text-foreground"
              : "text-muted-foreground hover:text-secondary-foreground"
          )}
        >
          Internal Note
          {activeTab === "internal" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Input area */}
      <div className="p-4 space-y-3">
        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((selectedFile, index) => (
              <div
                key={index}
                className="relative group bg-secondary rounded-lg p-2 flex items-center gap-2"
              >
                {selectedFile.preview ? (
                  <img
                    src={selectedFile.preview}
                    alt={selectedFile.file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary/20 rounded flex items-center justify-center">
                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate max-w-[120px]">
                    {selectedFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          {/* Text input */}
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                activeTab === "conversation"
                  ? "Type your message..."
                  : "Add an internal note..."
              }
              className="w-full bg-secondary border border-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary transition-colors"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          {/* Button column */}
          <div className="flex flex-col gap-2">
            <button
              className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Templates"
            >
              <Zap className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Attachments"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,audio/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSend}
            disabled={!message.trim() && selectedFiles.length === 0}
            className="px-5 py-2.5 bg-primary rounded-lg text-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
          <button
            onClick={onReleaseControl}
            className="px-5 py-2.5 bg-secondary rounded-lg text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
          >
            Release to mammam-ia
          </button>
        </div>
      </div>
    </div>
  );
}

