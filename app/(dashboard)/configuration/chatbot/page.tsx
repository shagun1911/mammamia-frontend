"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Plus, Pencil, Trash2, ChevronDown, Sparkles, UserCircle, MessageSquare, Globe, Loader2 } from "lucide-react";
import { mockChatbotSettings } from "@/data/mockSettings";
import { ToggleRow } from "@/components/settings/ToggleRow";
import { ColorPicker } from "@/components/settings/ColorPicker";
import { useSettings, useUpdateSettings, useUploadChatbotAvatar } from "@/hooks/useSettings";
import { useKnowledgeBases } from "@/hooks/useKnowledgeBase";
import { useAIBehavior } from "@/hooks/useAIBehavior";
import { toast } from "sonner";
import { googleTranslate } from "@/lib/googleTranslate";



interface EscalationRule {
  id: string;
  condition: string;
}




export default function ChatbotSettingsPage() {
  const { data: dbSettings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const uploadChatbotAvatar = useUploadChatbotAvatar();
  const { data: knowledgeBases, isLoading: isLoadingKBs, refetch: refetchKBs, error: kbError, isError: isKbError } = useKnowledgeBases();
  const { aiBehavior, updateChatAgentPrompt, updateChatAgentHumanOperator } = useAIBehavior();
  const [settings, setSettings] = useState(mockChatbotSettings);
  const [activeLanguage, setActiveLanguage] = useState("en");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<string>("");
  const [selectedKnowledgeBaseIds, setSelectedKnowledgeBaseIds] = useState<string[]>([]);
  const [showKBDropdown, setShowKBDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for chatbot behavior features
  const [systemPrompt, setSystemPrompt] = useState("");
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([{ id: "1", condition: "" }]);
  const [greetingMessage, setGreetingMessage] = useState("");
  const [language, setLanguage] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);

  // Refetch knowledge bases when component mounts and periodically
  useEffect(() => {
    console.log('🔄 [ChatbotConfig] Component mounted, refetching KBs...');
    refetchKBs();
    

    // Also refetch every 5 seconds to catch newly created KBs
    const interval = setInterval(() => {
      console.log('🔄 [ChatbotConfig] Periodic refetch...');
      refetchKBs();
    }, 5000);
    
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Debug: Log knowledge bases data
  useEffect(() => {
    console.log('📦 [ChatbotConfig] knowledgeBases:', knowledgeBases);
    console.log('📦 [ChatbotConfig] isLoadingKBs:', isLoadingKBs);
    console.log('📦 [ChatbotConfig] isKbError:', isKbError);
    console.log('📦 [ChatbotConfig] kbError:', kbError);
    console.log('📦 [ChatbotConfig] knowledgeBases length:', Array.isArray(knowledgeBases) ? knowledgeBases.length : 0);
    console.log('📦 [ChatbotConfig] knowledgeBases array:', Array.isArray(knowledgeBases) ? 'YES' : 'NO');
    if (Array.isArray(knowledgeBases) && knowledgeBases.length > 0) {
      console.log('📦 [ChatbotConfig] First KB:', knowledgeBases[0]);
    }
    if (isKbError) {
      console.error('❌ [ChatbotConfig] Error loading KBs:', kbError);
    }
  }, [knowledgeBases, isLoadingKBs, isKbError, kbError]);

  // Load settings from database when available
  useEffect(() => {
    if (dbSettings) {
      setSettings({
        ...settings,
        customization: {
          ...settings.customization,
          chatbotName: dbSettings.chatbotName || settings.customization.chatbotName,
          widgetColor: dbSettings.primaryColor || settings.customization.widgetColor,
          personality: settings.customization.personality,
          character: settings.customization.character,
        },
      });
      if (dbSettings.chatbotAvatar) {
        setLogoUrl(dbSettings.chatbotAvatar);
      }
      // Load multiple knowledge bases (new format)
      if (dbSettings.defaultKnowledgeBaseIds && dbSettings.defaultKnowledgeBaseIds.length > 0) {
        setSelectedKnowledgeBaseIds(dbSettings.defaultKnowledgeBaseIds);
      }
      // Fallback to single selection (legacy format)
      else if (dbSettings.defaultKnowledgeBaseId) {
        setSelectedKnowledgeBaseId(dbSettings.defaultKnowledgeBaseId);
        setSelectedKnowledgeBaseIds([dbSettings.defaultKnowledgeBaseId]);
      }
      // Load greeting message and language
      if (dbSettings.autoReplyMessage) {
        setGreetingMessage(dbSettings.autoReplyMessage);
      }
      if (dbSettings.language) {
        setLanguage(dbSettings.language);
      }
    }
  }, [dbSettings]);

  // Load AI behavior settings
  useEffect(() => {
    if (aiBehavior) {
      // Load system prompt
      if (aiBehavior.chatAgent?.systemPrompt) {
        setSystemPrompt(aiBehavior.chatAgent.systemPrompt);
      }
      // Load escalation rules
      if (aiBehavior.chatAgent?.humanOperator?.escalationRules?.length > 0) {
        setEscalationRules(
          aiBehavior.chatAgent.humanOperator.escalationRules.map((rule: string, index: number) => ({
            id: (index + 1).toString(),
            condition: rule
          }))
        );
      }
    }
  }, [aiBehavior]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const uploadedUrl = await uploadChatbotAvatar.mutateAsync(file);
        setLogoUrl(uploadedUrl);
      } catch (error) {
        console.error("Failed to upload logo:", error);
      }
    }
  };

  const handleSave = async () => {
    try {
      // Find selected knowledge bases details
      const kbArray = Array.isArray(knowledgeBases) ? knowledgeBases : [];
      const selectedKBs = kbArray.filter((kb: any) =>
        selectedKnowledgeBaseIds.includes(kb.id)
      );
      const collectionNames = selectedKBs.map((kb: any) => kb.collectionName || kb.name) || [];

      // Save chatbot settings
      await updateSettings.mutateAsync({
        chatbotName: settings.customization.chatbotName,
        primaryColor: settings.customization.widgetColor,
        chatbotAvatar: logoUrl || undefined,
        defaultKnowledgeBaseIds: selectedKnowledgeBaseIds.length > 0 ? selectedKnowledgeBaseIds : undefined,
        defaultKnowledgeBaseNames: collectionNames.length > 0 ? collectionNames : undefined,
        // Keep legacy single selection for backward compatibility
        defaultKnowledgeBaseId: selectedKnowledgeBaseIds[0] || undefined,
        defaultKnowledgeBaseName: collectionNames[0] || undefined,
        autoReplyMessage: greetingMessage || undefined, // Use autoReplyMessage for greeting
        language: language || undefined,
      });

      // Save system prompt
      if (systemPrompt.trim()) {
        await updateChatAgentPrompt.mutateAsync(systemPrompt);
      }

      // Save escalation rules
      const rulesToSave = escalationRules.map(r => r.condition).filter(c => c.trim());
      if (rulesToSave.length > 0) {
        await updateChatAgentHumanOperator.mutateAsync({
          escalationRules: rulesToSave
        });
      }

      toast.success("Chatbot settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save some settings");
    }
  };

  const addEscalationRule = () => {
    setEscalationRules([
      ...escalationRules,
      { id: Date.now().toString(), condition: "" }
    ]);
  };

  const removeEscalationRule = (id: string) => {
    if (escalationRules.length > 1) {
      setEscalationRules(escalationRules.filter(rule => rule.id !== id));
    }
  };

  const updateEscalationRule = (id: string, condition: string) => {
    setEscalationRules(
      escalationRules.map(rule =>
        rule.id === id ? { ...rule, condition } : rule
      )
    );
  };

  const toggleKnowledgeBase = (kbId: string) => {
    setSelectedKnowledgeBaseIds(prev => {
      if (prev.includes(kbId)) {
        return prev.filter(id => id !== kbId);
      } else {
        return [...prev, kbId];
      }
    });
  };

  const selectAllKnowledgeBases = () => {
    const allIds = Array.isArray(knowledgeBases) ? knowledgeBases.map((kb: any) => kb.id) : [];
    setSelectedKnowledgeBaseIds(allIds);
  };

  const clearAllKnowledgeBases = () => {
    setSelectedKnowledgeBaseIds([]);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Small Header */}
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Chatbot</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure your chatbot widget appearance and behavior</p>
        </div>

        <div className="max-w-[900px] mx-auto space-y-6">
          {/* Section 1 - General */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-5">General</h2>

            <div className="space-y-0">
              <ToggleRow
                label="Enable website widget"
                description="Show the chat widget on your website"
                checked={settings.general.enableWebsiteWidget}
                onChange={(checked) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, enableWebsiteWidget: checked },
                  })
                }
              />
              <ToggleRow
                label="Email required"
                description="Require email before starting conversation"
                checked={settings.general.emailRequired}
                onChange={(checked) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, emailRequired: checked },
                  })
                }
              />
              <ToggleRow
                label="Phone required"
                description="Require phone number before starting conversation"
                checked={settings.general.phoneRequired}
                onChange={(checked) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, phoneRequired: checked },
                  })
                }
              />
              <ToggleRow
                label="Bubble messages"
                description="Show messages in bubble style"
                checked={settings.general.bubbleMessages}
                onChange={(checked) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, bubbleMessages: checked },
                  })
                }
                isLast
              />
            </div>
          </div>

          {/* Section 2 - Customization */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-5">Customization</h2>

            <div className="grid gap-5">
              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Logo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-border rounded-xl flex items-center justify-center hover:border-primary transition-colors overflow-hidden relative cursor-pointer"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  )}
                </button>
                {logoUrl && (
                  <button
                    onClick={() => {
                      setLogoUrl(null);
                    }}
                    className="text-xs text-red-500 hover:text-red-400 mt-2 cursor-pointer"
                  >
                    Remove logo
                  </button>
                )}
              </div>

              {/* Chatbot name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Chatbot Name
                </label>
                <input
                  value={settings.customization.chatbotName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      customization: { ...settings.customization, chatbotName: e.target.value },
                    })
                  }
                  className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Color picker */}
              <ColorPicker
                selectedColor={settings.customization.widgetColor}
                onColorChange={(color) =>
                  setSettings({
                    ...settings,
                    customization: { ...settings.customization, widgetColor: color },
                  })
                }
              />

              {/* Default Knowledge Bases (Multiple Selection) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Default Knowledge Bases ({selectedKnowledgeBaseIds.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllKnowledgeBases}
                      className="text-xs text-primary hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllKnowledgeBases}
                      className="text-xs text-muted-foreground hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowKBDropdown(!showKBDropdown)}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-left text-foreground focus:outline-none focus:border-primary transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate text-sm">
                      {selectedKnowledgeBaseIds.length === 0
                        ? 'Select knowledge bases for calls & AI responses'
                        : selectedKnowledgeBaseIds.length === 1
                          ? (Array.isArray(knowledgeBases) ? knowledgeBases.find((kb: any) => kb.id === selectedKnowledgeBaseIds[0])?.name : null) || 'Unknown'
                          : `${selectedKnowledgeBaseIds.length} knowledge bases selected`
                      }
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showKBDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showKBDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-secondary border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingKBs ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading knowledge bases...
                        </div>
                      ) : isKbError ? (
                        <div className="px-4 py-3 text-sm text-destructive">
                          Error loading knowledge bases. Please refresh the page.
                          <div className="text-xs mt-1 text-muted-foreground">
                            {kbError instanceof Error ? kbError.message : 'Unknown error'}
                          </div>
                        </div>
                      ) : !Array.isArray(knowledgeBases) || knowledgeBases.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                          No knowledge bases available. Create one first.
                        </div>
                      ) : (
                        knowledgeBases.map((kb: any) => (
                          <label
                            key={kb.id}
                            className="flex items-center px-4 py-2 hover:bg-accent cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedKnowledgeBaseIds.includes(kb.id)}
                              onChange={() => toggleKnowledgeBase(kb.id)}
                              className="mr-3 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                            />
                            <span className="text-sm text-foreground">
                              {kb.name}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Selected knowledge bases will be used for outbound calls and automated AI responses
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 - Chatbot Behavior */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-5">Chatbot Behavior</h2>

            <div className="space-y-6">
              {/* System Prompt */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      System Prompt <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Define the personality and behavior of your chatbot. This prompt guides how the AI responds to users.
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Use Previous System Prompt
                  </label>
                  <select
                    value={systemPrompt}
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        setSystemPrompt('');
                      } else {
                        setSystemPrompt(e.target.value);
                      }
                    }}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="new">Create New System Prompt</option>
                    {aiBehavior?.chatAgent?.systemPrompt && (
                      <option value={aiBehavior.chatAgent.systemPrompt}>
                        Current: {aiBehavior.chatAgent.systemPrompt.substring(0, 50)}...
                      </option>
                    )}
                    <option value="You are a helpful AI assistant designed to provide excellent customer service. Be friendly, professional, and helpful.">
                      Default: You are a helpful AI assistant...
                    </option>
                  </select>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="E.g., You are a helpful AI assistant. Be friendly and concise. Always ask for email before providing quotes..."
                  rows={6}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* Escalation Conditions */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <UserCircle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Escalation Conditions
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Define when the chatbot should escalate conversations to a human operator
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {escalationRules.map((rule) => (
                    <div key={rule.id} className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={rule.condition}
                          onChange={(e) => updateEscalationRule(rule.id, e.target.value)}
                          placeholder="E.g., Customer requests to speak with a manager, Complex technical issue, Refund request over €500..."
                          className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      {escalationRules.length > 1 && (
                        <button
                          onClick={() => removeEscalationRule(rule.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:border-red-500 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addEscalationRule}
                  className="mt-3 flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Condition
                </button>
              </div>

              {/* Greeting Message */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Greeting Message <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      In the initial message, it is mandatory to ask the user for their name so the conversation can be properly tracked. The agent should politely request the user's name at the beginning before proceeding with the rest of the conversation.
                    </p>
                  </div>
                </div>
                <textarea
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  placeholder="Hello! How can I help you today?"
                  rows={4}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* Language */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Language <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select the primary language for your chatbot
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={language}
                    disabled={isTranslating}
                    onChange={async (e) => {
                      const newLanguage = e.target.value;
                      const oldLanguage = language;
                      setLanguage(newLanguage);

                      if (greetingMessage && greetingMessage.trim()) {
                        setIsTranslating(true);
                        try {
                          const translated = await googleTranslate.translate(greetingMessage, newLanguage, oldLanguage);
                          if (translated) {
                            setGreetingMessage(translated);
                            toast.success(`Greeting translated to ${newLanguage.toUpperCase()}`);
                          }
                        } catch (error) {
                          console.error("Translation failed:", error);
                          // Fallback to default if translation fails
                          const defaultMessage = mockChatbotSettings.welcomeMessages[newLanguage];
                          if (defaultMessage) {
                            setGreetingMessage(defaultMessage);
                          }
                        } finally {
                          setIsTranslating(false);
                        }
                      } else {
                        // No current message, set default
                        const defaultMessage = mockChatbotSettings.welcomeMessages[newLanguage];
                        if (defaultMessage) {
                          setGreetingMessage(defaultMessage);
                        }
                      }
                    }}
                    className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ar">Arabic</option>
                    <option value="tr">Turkish</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                  </select>
                  {isTranslating && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="sticky bottom-0 pt-4 pb-2 bg-background">
            <button
              onClick={handleSave}
              disabled={updateSettings.isPending || updateChatAgentPrompt.isPending || updateChatAgentHumanOperator.isPending || isLoading}
              className="w-full h-12 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {(updateSettings.isPending || updateChatAgentPrompt.isPending || updateChatAgentHumanOperator.isPending) ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

