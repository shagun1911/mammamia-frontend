"use client";

import { useState, useEffect } from "react";
import { useApiKeys, useUpdateApiKeys } from "@/hooks/useApiKeys";
import { toast } from "sonner";
import { Key, Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ApiKeysSettingsPage() {
  const { data: apiKeysData, isLoading } = useApiKeys();
  const updateApiKeys = useUpdateApiKeys();

  const [llmProvider, setLlmProvider] = useState<"openai" | "gemini">("openai");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (apiKeysData) {
      setLlmProvider(apiKeysData.llmProvider || "openai");
      setApiKey(apiKeysData.apiKey || "");
    }
  }, [apiKeysData]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    try {
      await updateApiKeys.mutateAsync({
        llmProvider,
        apiKey,
      });
    } catch (error: any) {
      // Error is handled by the mutation
    }
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 8) + "•".repeat(Math.max(key.length - 8, 20));
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-secondary rounded mb-6"></div>
          <div className="h-64 bg-card rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">API Keys</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Configure your AI model provider and API keys for chat and voice features
        </p>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <div className="text-blue-400 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-400 mb-1">Important</h4>
              <p className="text-xs text-muted-foreground">
                Your API keys are encrypted and stored securely. They are used for:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li><strong>Chat Endpoint:</strong> RAG-based chatbot responses</li>
                <li><strong>Outbound Calls:</strong> AI-powered voice conversations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Keys Configuration */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">LLM Configuration</h2>
          </div>

          <div className="space-y-6">
            {/* Model Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Model Provider <span className="text-red-500">*</span>
              </label>
              <select
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value as "openai" | "gemini")}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
                <option value="gemini">Google Gemini</option>
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Select the AI model provider you want to use for chat and voice features
              </p>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                API Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    llmProvider === "openai"
                      ? "sk-..."
                      : "AIza..."
                  }
                  className="w-full h-11 bg-secondary border border-border rounded-lg px-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded transition-colors"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {llmProvider === "openai"
                  ? "Get your API key from: https://platform.openai.com/api-keys"
                  : "Get your API key from: https://makersuite.google.com/app/apikey"}
              </p>
            </div>

            {/* Current Configuration Status */}
            {apiKeysData?.apiKey && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-green-400 mb-1">
                      API Key Configured
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Current provider: <span className="font-medium text-foreground">{apiKeysData.llmProvider === "openai" ? "OpenAI" : "Google Gemini"}</span>
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      Key: {maskApiKey(apiKeysData.apiKey)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 mt-6 border-t border-border">
            <button
              onClick={handleSave}
              disabled={updateApiKeys.isPending || !apiKey.trim()}
              className="h-11 px-6 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateApiKeys.isPending ? "Saving..." : "Save API Keys"}
            </button>
          </div>
        </div>

        {/* Model Comparison */}
        <div className="mt-6 bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Model Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-secondary rounded-lg">
              <h4 className="font-medium text-foreground mb-2">OpenAI</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• GPT-4 Turbo - Most capable model</li>
                <li>• GPT-3.5 Turbo - Fast and cost-effective</li>
                <li>• Excellent for complex reasoning</li>
                <li>• Superior code understanding</li>
              </ul>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Google Gemini</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Gemini Pro - Balanced performance</li>
                <li>• Strong multimodal capabilities</li>
                <li>• Good for factual information</li>
                <li>• Competitive pricing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

