"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Code } from "lucide-react";
import { useKnowledgeBase } from "@/contexts/KnowledgeBaseContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function WidgetLinkGenerator() {
  const { selectedCollection } = useKnowledgeBase();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [visitorNameInput, setVisitorNameInput] = useState("");

  // CRITICAL: widgetId MUST be the logged-in user's MongoDB ObjectId
  // Backend expects widgetId === userId (validated as 24-char hex ObjectId)
  // User.id is the MongoDB ObjectId string
  const widgetId = user?.id || null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const buildWidgetUrl = (visitorName?: string) => {
    if (!widgetId) return "";
    const params = new URLSearchParams();
    if (selectedCollection) params.set("collection", selectedCollection);
    if (visitorName?.trim()) params.set("visitorName", visitorName.trim());
    const qs = params.toString();
    return `${origin}/widget/${widgetId}${qs ? `?${qs}` : ""}`;
  };

  const widgetUrl = buildWidgetUrl();

  // CRITICAL: Validate widgetId is available (user must be logged in)
  if (!widgetId) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Authentication Required</h3>
          <p className="text-sm text-red-300">
            You must be logged in to generate widget links. Please sign in to continue.
          </p>
        </div>
      </div>
    );
  }
  
  // Generate embed code
  const embedCode = `<!-- Aistein Chatbot Widget -->
<script>
  window.Aistein = {
    widgetId: "${widgetId}",
    collection: "${selectedCollection || ''}",
    position: "bottom-right",
    primaryColor: "#6366f1"
  };
</script>
<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" defer></script>`;

  // Generate iframe code
  const iframeCode = `<iframe
  src="${widgetUrl}"
  width="400"
  height="600"
  frameborder="0"
  allow="microphone"
  style="border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
></iframe>`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const openWidgetInNewTab = () => {
    const name = visitorNameInput.trim();
    if (!name) {
      toast.error("Please enter your name");
      return;
    }
    const url = buildWidgetUrl(name);
    window.open(url, "_blank", "noopener,noreferrer");
    setNameModalOpen(false);
    setVisitorNameInput("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Widget Link & Embed Code</h3>
        <p className="text-sm text-muted-foreground">
          Share your chatbot or embed it on your website
        </p>
      </div>

      {/* Direct Widget Link */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Direct Widget Link</h4>
          </div>
        </div>

        <div className="bg-secondary border border-border rounded-lg p-4 mb-3">
          <code className="text-sm text-foreground break-all">{widgetUrl}</code>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => copyToClipboard(widgetUrl, 'Widget link')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            type="button"
            onClick={() => setNameModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-accent text-foreground rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </button>
        </div>
      </div>

      <Modal
        isOpen={nameModalOpen}
        onClose={() => {
          setNameModalOpen(false);
          setVisitorNameInput("");
        }}
        title="Before we open the chatbot"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your name so the assistant can greet you personally.
          </p>
          <div className="space-y-2">
            <Label htmlFor="visitor-name-widget">Your name</Label>
            <Input
              id="visitor-name-widget"
              value={visitorNameInput}
              onChange={(e) => setVisitorNameInput(e.target.value)}
              placeholder="e.g. Alex"
              autoComplete="name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  openWidgetInNewTab();
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNameModalOpen(false);
                setVisitorNameInput("");
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={openWidgetInNewTab}>
              Open chatbot
            </Button>
          </div>
        </div>
      </Modal>

      {/* Embed Code (Script) */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-green-500" />
            <h4 className="font-semibold text-foreground">Embed Code (Script)</h4>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Add this code to your website's HTML, just before the closing <code>&lt;/body&gt;</code> tag
        </p>

        <div className="bg-secondary border border-border rounded-lg p-4 mb-3 overflow-x-auto">
          <pre className="text-xs text-foreground whitespace-pre">{embedCode}</pre>
        </div>

        <button
          onClick={() => copyToClipboard(embedCode, 'Embed code')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:brightness-110 transition-all"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Embed Code'}
        </button>
      </div>

      {/* Iframe Embed */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-500" />
            <h4 className="font-semibold text-foreground">Iframe Embed</h4>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Embed the chatbot as an iframe on your website
        </p>

        <div className="bg-secondary border border-border rounded-lg p-4 mb-3 overflow-x-auto">
          <pre className="text-xs text-foreground whitespace-pre">{iframeCode}</pre>
        </div>

        <button
          onClick={() => copyToClipboard(iframeCode, 'Iframe code')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:brightness-110 transition-all"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Iframe Code'}
        </button>
      </div>

      {/* Configuration Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="font-semibold text-blue-400 mb-2">Current Configuration</h4>
        <ul className="space-y-1 text-sm text-blue-300">
          <li>• Widget ID: <code className="bg-blue-500/20 px-2 py-0.5 rounded">{widgetId}</code></li>
          <li>• Collection: <code className="bg-blue-500/20 px-2 py-0.5 rounded">{selectedCollection || 'None selected'}</code></li>
        </ul>
        {!selectedCollection && (
          <p className="text-xs text-amber-400 mt-3">
            ⚠️ No collection selected. Select a knowledge base collection above for AI-powered responses.
          </p>
        )}
      </div>
    </div>
  );
}

