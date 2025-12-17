"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { mockChatbotSettings } from "@/data/mockSettings";
import { ToggleRow } from "@/components/settings/ToggleRow";
import { ColorPicker } from "@/components/settings/ColorPicker";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useKnowledgeBases } from "@/hooks/useKnowledgeBase";
import { toast } from "sonner";

export default function ChatbotSettingsPage() {
  const { data: dbSettings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: knowledgeBases } = useKnowledgeBases();
  const [settings, setSettings] = useState(mockChatbotSettings);
  const [activeLanguage, setActiveLanguage] = useState("en");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<string>("");
  const [selectedKnowledgeBaseIds, setSelectedKnowledgeBaseIds] = useState<string[]>([]);
  const [showKBDropdown, setShowKBDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  }, [dbSettings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      // Find selected knowledge bases details
      const selectedKBs = knowledgeBases?.filter((kb: any) => 
        selectedKnowledgeBaseIds.includes(kb._id)
      );
      const collectionNames = selectedKBs?.map((kb: any) => kb.collectionName) || [];
      
      // For now, save without logo upload (would need backend support for file upload)
      await updateSettings.mutateAsync({
        chatbotName: settings.customization.chatbotName,
        primaryColor: settings.customization.widgetColor,
        chatbotAvatar: logoUrl || undefined,
        defaultKnowledgeBaseIds: selectedKnowledgeBaseIds.length > 0 ? selectedKnowledgeBaseIds : undefined,
        defaultKnowledgeBaseNames: collectionNames.length > 0 ? collectionNames : undefined,
        // Keep legacy single selection for backward compatibility
        defaultKnowledgeBaseId: selectedKnowledgeBaseIds[0] || undefined,
        defaultKnowledgeBaseName: collectionNames[0] || undefined,
      });
      toast.success("Chatbot settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
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
    const allIds = knowledgeBases?.map((kb: any) => kb._id) || [];
    setSelectedKnowledgeBaseIds(allIds);
  };

  const clearAllKnowledgeBases = () => {
    setSelectedKnowledgeBaseIds([]);
  };

  return (
    <div className="p-8">
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
                className="w-20 h-20 border-2 border-dashed border-border rounded-xl flex items-center justify-center hover:border-primary transition-colors overflow-hidden relative"
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
                    setLogoFile(null);
                  }}
                  className="text-xs text-red-500 hover:text-red-400 mt-2"
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

            {/* Personality */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Personality
              </label>
              <select
                value={settings.customization.personality}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    customization: {
                      ...settings.customization,
                      personality: e.target.value as any,
                    },
                  })
                }
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="neutral">Neutral 👋</option>
                <option value="casual">Casual 🤙</option>
                <option value="formal">Formal 🤝</option>
              </select>
            </div>

            {/* Character */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Character
              </label>
              <select
                value={settings.customization.character}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    customization: {
                      ...settings.customization,
                      character: e.target.value as any,
                    },
                  })
                }
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="adventurous">Adventurous 🦁</option>
                <option value="confident">Confident 💪</option>
                <option value="convincing">Convincing 🤝</option>
                <option value="energetic">Energetic ⚡</option>
                <option value="friendly">Friendly 🙂</option>
                <option value="funny">Funny 🤣</option>
                <option value="professional">Professional 💼</option>
              </select>
            </div>

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
                    className="text-xs text-primary hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAllKnowledgeBases}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowKBDropdown(!showKBDropdown)}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-left text-foreground focus:outline-none focus:border-primary transition-colors flex items-center justify-between"
                >
                  <span className="truncate text-sm">
                    {selectedKnowledgeBaseIds.length === 0 
                      ? 'Select knowledge bases for calls & AI responses'
                      : selectedKnowledgeBaseIds.length === 1
                      ? knowledgeBases?.find((kb: any) => kb._id === selectedKnowledgeBaseIds[0])?.name || 'Unknown'
                      : `${selectedKnowledgeBaseIds.length} knowledge bases selected`
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showKBDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showKBDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-secondary border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {!knowledgeBases || knowledgeBases.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        No knowledge bases available. Create one first.
                      </div>
                    ) : (
                      knowledgeBases.map((kb: any) => (
                        <label
                          key={kb._id}
                          className="flex items-center px-4 py-2 hover:bg-accent cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedKnowledgeBaseIds.includes(kb._id)}
                            onChange={() => toggleKnowledgeBase(kb._id)}
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

        {/* Section 3 - Quick Buttons */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-5">Quick Buttons</h2>
          
          <div className="space-y-2">
            {settings.quickButtons.map((button, index) => (
              <div
                key={button.id}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
              >
                <span className="text-sm text-foreground">{button.text}</span>
                <div className="flex gap-2">
                  <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            <button className="w-full h-12 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Button</span>
            </button>
          </div>
        </div>

        {/* Section 4 - Welcome Messages */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-5">Welcome Messages</h2>
          
          <div className="flex gap-2 mb-4">
            {Object.keys(settings.welcomeMessages).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLanguage(lang)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeLanguage === lang
                    ? "bg-primary text-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <textarea
            value={settings.welcomeMessages[activeLanguage]}
            onChange={(e) =>
              setSettings({
                ...settings,
                welcomeMessages: {
                  ...settings.welcomeMessages,
                  [activeLanguage]: e.target.value,
                },
              })
            }
            className="w-full min-h-[100px] bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Section 5 - Notifications */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-5">Notifications</h2>
          
          <div className="space-y-3">
            {[
              { key: "newConversation", label: "New conversation started" },
              { key: "contactFormSubmitted", label: "Contact form submitted" },
              { key: "supportRequest", label: "Support request from chat" },
              { key: "operatorMentioned", label: "Operator mentioned" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 h-12 px-3 cursor-pointer hover:bg-secondary rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={settings.notifications[key as keyof typeof settings.notifications]}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        [key]: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="sticky bottom-0 pt-4 pb-2 bg-background">
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending || isLoading}
            className="w-full h-12 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateSettings.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

