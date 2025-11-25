"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Code } from "lucide-react";
import { useKnowledgeBase } from "@/contexts/KnowledgeBaseContext";
import { toast } from "sonner";

export function WidgetLinkGenerator() {
  const { collections, selectedCollection } = useKnowledgeBase();
  const [copied, setCopied] = useState(false);
  const [widgetId] = useState(() => `widget-${Date.now()}`);

  // Generate widget URL with collection parameter
  const widgetUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/widget/${widgetId}${selectedCollection ? `?collection=${encodeURIComponent(selectedCollection)}` : ''}`;
  
  // Generate embed code
  const embedCode = `<!-- KepleroAI Chatbot Widget -->
<script>
  window.KepleroAI = {
    widgetId: "${widgetId}",
    collection: "${selectedCollection || 'default'}",
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
          <a
            href={widgetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-accent text-foreground rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </a>
        </div>
      </div>

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
          <li>• RAG Service: <code className="bg-blue-500/20 px-2 py-0.5 rounded">https://keplerov1-python-production.up.railway.app</code></li>
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

