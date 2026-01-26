"use client";

import { useState, useEffect } from "react";
import axios from "axios"; // Import axios directly
import { ArrowLeft, Copy, Check, ChevronDown, ChevronUp, Loader2, Sparkles, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePhoneSettings } from "@/hooks/usePhoneSettings";
import { useAIBehavior } from "@/hooks/useAIBehavior";
import { useInboundAgentConfig } from "@/hooks/useInboundAgentConfig";
import { VOICE_OPTIONS, phoneSettingsService } from "@/services/phoneSettings.service";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

export default function PhoneSettingsDetailPage() {
  const router = useRouter();
  const { settings, isLoading, updateSettings, isUpdating } = usePhoneSettings();
  const { aiBehavior, updateVoiceAgentHumanOperator, updateVoiceAgentPrompt } = useAIBehavior();
  const { configs: inboundConfigs, syncConfig, updateConfig, deleteConfig } = useInboundAgentConfig();

  const [activeTab, setActiveTab] = useState<"voiceAgentBehaviour" | "endOfCall" | "inbound">("voiceAgentBehaviour");
  const [copied, setCopied] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null); // State to track which voice is currently playing

  // Form state
  const [voiceType, setVoiceType] = useState<"predefined" | "custom">(
    settings?.customVoiceId ? "custom" : "predefined"
  );
  const [selectedVoice, setSelectedVoice] = useState(settings?.selectedVoice || "adam");
  const [customVoiceId, setCustomVoiceId] = useState(settings?.customVoiceId || "");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState(settings?.twilioPhoneNumber || "");
  const [livekitSipTrunkId, setLivekitSipTrunkId] = useState(settings?.livekitSipTrunkId || "");
  const [twilioTrunkSid, setTwilioTrunkSid] = useState(settings?.twilioTrunkSid || "");
  const [terminationUri, setTerminationUri] = useState(settings?.terminationUri || "");
  const [originationUri, setOriginationUri] = useState(settings?.originationUri || "");
  const [humanOperatorPhone, setHumanOperatorPhone] = useState(settings?.humanOperatorPhone || "");
  const [escalationRules, setEscalationRules] = useState<string[]>(
    aiBehavior?.voiceAgent?.humanOperator?.escalationRules || []
  );

  // Setup methods state
  const [showSetupMethods, setShowSetupMethods] = useState(false);
  const [activeSetupMethod, setActiveSetupMethod] = useState<"full" | "generic" | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Full Setup (Method 1) form state
  const [fullSetupLabel, setFullSetupLabel] = useState("");
  const [fullSetupPhone, setFullSetupPhone] = useState("");
  const [fullSetupTwilioSid, setFullSetupTwilioSid] = useState("");
  const [fullSetupTwilioToken, setFullSetupTwilioToken] = useState("");

  // Generic SIP Trunk (Method 2) form state
  const [genericSetupLabel, setGenericSetupLabel] = useState("");
  const [genericSetupPhone, setGenericSetupPhone] = useState("");
  const [genericSetupSipAddress, setGenericSetupSipAddress] = useState("");
  const [genericSetupUsername, setGenericSetupUsername] = useState("");
  const [genericSetupPassword, setGenericSetupPassword] = useState("");
  const [genericSetupTransport, setGenericSetupTransport] = useState("udp");

  // Inbound setup state
  const [inboundStep, setInboundStep] = useState(1);
  const [inboundName, setInboundName] = useState("");
  const [inboundPhoneNumbers, setInboundPhoneNumbers] = useState("");
  const [inboundKrispEnabled, setInboundKrispEnabled] = useState(true);
  const [inboundTrunkId, setInboundTrunkId] = useState("");
  const [inboundTrunkName, setInboundTrunkName] = useState("");
  const [inboundConnectedNumbers, setInboundConnectedNumbers] = useState<string[]>([]);
  const [isCreatingInbound, setIsCreatingInbound] = useState(false);

  // Greeting message, language, and system prompt settings
  const [greetingMessage, setGreetingMessage] = useState("");
  const [language, setLanguage] = useState("en");
  const [systemPrompt, setSystemPrompt] = useState(aiBehavior?.voiceAgent?.systemPrompt || "");

  // Edit mode for inbound configs
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [editGreetingMessage, setEditGreetingMessage] = useState("");
  const [editLanguage, setEditLanguage] = useState("en");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Update form state when settings load
  useEffect(() => {
    if (settings) {
      setSelectedVoice(settings.selectedVoice || "adam");
      setCustomVoiceId(settings.customVoiceId || "");
      setVoiceType(settings.customVoiceId ? "custom" : "predefined");
      setTwilioPhoneNumber(settings.twilioPhoneNumber || "");
      setLivekitSipTrunkId(settings.livekitSipTrunkId || "");
      setTwilioTrunkSid(settings.twilioTrunkSid || "");
      setTerminationUri(settings.terminationUri || "");
      setOriginationUri(settings.originationUri || "");
      setHumanOperatorPhone(settings.humanOperatorPhone || "");
      setGreetingMessage(settings.greetingMessage || "Hello! How can I help you today?");
      setLanguage(settings.language || "en");
    }
  }, [settings]);

  useEffect(() => {
    if (aiBehavior?.voiceAgent?.humanOperator?.escalationRules) {
      setEscalationRules(aiBehavior.voiceAgent.humanOperator.escalationRules);
    }
    if (aiBehavior?.voiceAgent?.systemPrompt) {
      setSystemPrompt(aiBehavior.voiceAgent.systemPrompt);
    }
  }, [aiBehavior]);

  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        selectedVoice,
        customVoiceId,
        twilioPhoneNumber,
        livekitSipTrunkId,
        humanOperatorPhone,
        greetingMessage,
        language,
      });
     
      if (inboundConfigs && inboundConfigs.length > 0) {
        await Promise.all(
          inboundConfigs.map((config) =>
            updateConfig.mutateAsync({
              calledNumber: config.calledNumber,
              greeting_message: greetingMessage,
              language,
            })
          )
        );
        if (typeof syncConfig.mutateAsync === 'function') await syncConfig.mutateAsync();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    }
  };

  const handleSaveSystemPrompt = async () => {
    if (!systemPrompt.trim()) {
      toast.error("System prompt cannot be empty");
      return;
    }
    try {
      await updateVoiceAgentPrompt.mutateAsync(systemPrompt);

    } catch (error: any) {
      toast.error(error.message || "Failed to save system prompt");
    }
  };

  const handleDeleteOutboundNumber = async () => {
    if (!confirm("Are you sure you want to delete the outbound number? This will remove all associated configurations.")) {
      return;
    }
    try {
      await updateSettings({
        twilioPhoneNumber: "",
        livekitSipTrunkId: "",
        twilioTrunkSid: "",
        terminationUri: "",
        originationUri: "",
      });
     
    } catch (error: any) {
      toast.error(error.message || "Failed to delete outbound number");
    }
  };

  const handleDeleteInboundNumber = async (phoneNumber: string) => {
    if (!confirm(`Are you sure you want to delete ${phoneNumber}? This will remove the inbound configuration.`)) {
      return;
    }
    try {
      await deleteConfig.mutateAsync(phoneNumber);
      if (typeof syncConfig.mutateAsync === 'function') await syncConfig.mutateAsync();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete inbound number");
    }
  };

  const handleCopyNumber = () => {
    if (settings?.twilioPhoneNumber) {
      navigator.clipboard.writeText(settings.twilioPhoneNumber);
      setCopied(true);
      toast.success("Phone number copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const addEscalationRule = () => {
    setEscalationRules([...escalationRules, ""]);
  };

  const updateEscalationRule = (index: number, value: string) => {
    const updated = [...escalationRules];
    updated[index] = value;
    setEscalationRules(updated);
  };

  const removeEscalationRule = (index: number) => {
    setEscalationRules(escalationRules.filter((_, i) => i !== index));
  };

  // Full SIP Trunk Setup (Method 1)
  const handleFullSetup = async () => {
    if (!fullSetupLabel || !fullSetupPhone || !fullSetupTwilioSid || !fullSetupTwilioToken) {
      toast.error("Please fill in all required fields");
      return;
    }

    console.log('🚀 [SIP Trunk Setup] Starting full setup...');
    console.log('📋 [SIP Trunk Setup] Request data:', {
      label: fullSetupLabel,
      phone_number: fullSetupPhone,
      twilio_sid: fullSetupTwilioSid,
      twilio_auth_token: '***hidden***'
    });

    setIsSettingUp(true);
    try {
      const result = await phoneSettingsService.setupSipTrunk({
        label: fullSetupLabel,
        phone_number: fullSetupPhone,
        twilio_sid: fullSetupTwilioSid,
        twilio_auth_token: fullSetupTwilioToken,
      });

      console.log('✅ [SIP Trunk Setup] Full response received:');
      console.log(JSON.stringify(result, null, 2));

      // Auto-fill the form with returned values
      setTwilioPhoneNumber(fullSetupPhone);
      setLivekitSipTrunkId(result.livekit_trunk_id);
      setTwilioTrunkSid(result.twilio_trunk_sid);
      setTerminationUri(result.termination_uri);
      setOriginationUri(result.origination_uri);

      // Save settings automatically
      await updateSettings({
        selectedVoice,
        twilioPhoneNumber: fullSetupPhone,
        livekitSipTrunkId: result.livekit_trunk_id,
        twilioTrunkSid: result.twilio_trunk_sid,
        terminationUri: result.termination_uri,
        originationUri: result.origination_uri,
        humanOperatorPhone,
      });

      toast.success("SIP Trunk setup completed successfully!");
      setShowSetupMethods(false);
      setActiveSetupMethod(null);

      setFullSetupLabel("");
      setFullSetupPhone("");
      setFullSetupTwilioSid("");
      setFullSetupTwilioToken("");

    } catch (error: any) {
      console.error('❌ [SIP Trunk Setup] Setup failed:', error);
      toast.error(error.message || "Failed to setup SIP trunk");
    } finally {
      setIsSettingUp(false);
    }
  };

  // Inbound Setup - Step 1
  const handleCreateInboundTrunk = async () => {
    if (!inboundName || !inboundPhoneNumbers) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreatingInbound(true);
    try {
      const phoneNumbersArray = inboundPhoneNumbers.split(',').map(n => n.trim()).filter(Boolean);

      const API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'https://keplerov1-python-2.onrender.com';
      const response = await fetch(`${API_URL}/calls/create-inbound-trunk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inboundName,
          phone_numbers: phoneNumbersArray,
          krisp_enabled: inboundKrispEnabled,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to create inbound trunk");
      }

      const data = await response.json();
      setInboundTrunkId(data.trunk_id);
      setInboundTrunkName(data.trunk_name);
      setInboundConnectedNumbers(data.phone_numbers);
      setInboundStep(2);

      toast.success("Inbound trunk created successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreatingInbound(false);
    }
  };

  // Inbound Setup - Step 2
  const handleCreateDispatchRule = async () => {
    if (!inboundTrunkId) {
      toast.error("Trunk ID missing");
      return;
    }

    setIsCreatingInbound(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'https://keplerov1-python-2.onrender.com';

      const params = new URLSearchParams({
        sip_trunk_id: inboundTrunkId,
        name: inboundTrunkName,
        agent_name: "inbound-agent",
      });

      const response = await fetch(`${API_URL}/calls/create-dispatch-rule?${params}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to create dispatch rule");
      }

      const data = await response.json();

      const existingNumbers = settings?.inboundPhoneNumbers || [];
      const newNumbers = inboundConnectedNumbers.filter(n => !existingNumbers.includes(n));
      const allNumbers = [...existingNumbers, ...newNumbers];

      await updateSettings({
        inboundTrunkId,
        inboundTrunkName,
        inboundDispatchRuleId: data.dispatch_rule_id,
        inboundDispatchRuleName: data.dispatch_rule_name,
        inboundPhoneNumbers: allNumbers,
      });

      // ✅ IMPORTANT FIX
      await syncConfig.mutateAsync();

      toast.success("Inbound setup completed successfully!");
      setInboundStep(3);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreatingInbound(false);
    }
  };
// Reset inbound setup
const resetInboundSetup = () => {
  setInboundStep(1);
  setInboundName("");
  setInboundPhoneNumbers("");
  setInboundKrispEnabled(true);
  setInboundTrunkId("");
  setInboundTrunkName("");
  setInboundConnectedNumbers([]);
};

// Handle edit config
const handleEditConfig = (config: any) => {
  console.log('🖊️ [Edit Config] Starting edit for config:', config._id);
  console.log('📋 [Edit Config] Current values:', {
    greeting_message: config.greeting_message,
    language: config.language
  });

  setEditingConfigId(config._id);
  setEditGreetingMessage(
    config.greeting_message || "Hello! How can I help you today?"
  );
  setEditLanguage(config.language || "en");
};

// Handle cancel edit
const handleCancelEdit = () => {
  console.log('❌ [Edit Config] Canceling edit');
  setEditingConfigId(null);
  setEditGreetingMessage("");
  setEditLanguage("en");
};

// Handle save config
const handleSaveConfig = async (config: any) => {
  console.log('💾 [Save Config] ==========================================');
  console.log('💾 [Save Config] SAVE CONFIG CALLED');
  console.log('💾 [Save Config] Config ID:', config._id);
  console.log('💾 [Save Config] Called Number:', config.calledNumber);
  console.log('💾 [Save Config] New greeting message:', editGreetingMessage);
  console.log('💾 [Save Config] New language:', editLanguage);
  console.log('💾 [Save Config] ==========================================');

  setIsSavingConfig(true);
  try {
    const updateData = {
      calledNumber: config.calledNumber,
      greeting_message: editGreetingMessage,
      language: editLanguage,
    };

    console.log(
      '📤 [Save Config] Sending update request with data:',
      JSON.stringify(updateData, null, 2)
    );

    await updateConfig.mutateAsync(updateData);

    console.log('✅ [Save Config] Config updated successfully');

    toast.success('Configuration updated successfully');
    setEditingConfigId(null);
    setEditGreetingMessage("");
    setEditLanguage("en");
  } catch (error: any) {
    console.error('❌ [Save Config] Error updating config:', error);
    console.error('📊 [Save Config] Error details:', {
      message: error.message,
      response: error.response?.data
    });
    toast.error(error.message || 'Failed to update configuration');
  } finally {
    setIsSavingConfig(false);
  }
};

// Generic SIP Trunk Setup (Method 2)
const handleGenericSetup = async () => {
  if (settings?.isConfigured && settings.twilioPhoneNumber) {
    toast.error(
      "Please delete the existing outbound number before adding a new one"
    );
    return;
  }

  if (
    !genericSetupLabel ||
    !genericSetupPhone ||
    !genericSetupSipAddress ||
    !genericSetupUsername ||
    !genericSetupPassword
  ) {
    toast.error("Please fill in all required fields");
    return;
  }

  setIsSettingUp(true);
  try {
    const result = await phoneSettingsService.createGenericSipTrunk({
      label: genericSetupLabel,
      phone_number: genericSetupPhone,
      sip_address: genericSetupSipAddress,
      username: genericSetupUsername,
      password: genericSetupPassword,
      transport: genericSetupTransport,
    });

    // Auto-fill the form with returned values
    setTwilioPhoneNumber(result.phone_number);
    setLivekitSipTrunkId(result.livekit_trunk_id);

    // Save settings automatically
    await updateSettings({
      selectedVoice,
      twilioPhoneNumber: result.phone_number,
      livekitSipTrunkId: result.livekit_trunk_id,
      humanOperatorPhone,
    });

    toast.success("Generic SIP Trunk created successfully!");
    setShowSetupMethods(false);
    setActiveSetupMethod(null);

    // Clear form
    setGenericSetupLabel("");
    setGenericSetupPhone("");
    setGenericSetupSipAddress("");
    setGenericSetupUsername("");
    setGenericSetupPassword("");
    setGenericSetupTransport("udp");
  } catch (error: any) {
    toast.error(error.message || "Failed to create Generic SIP trunk");
    console.error("Setup error:", error);
  } finally {
    setIsSettingUp(false);
  }
};

  const handleSaveEscalationRules = async () => {
    try {
      await updateVoiceAgentHumanOperator.mutateAsync({ escalationRules });
      toast.success("Escalation rules saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save escalation rules");
    }
  };

  const playVoiceSample = async (voiceId: string, voiceName: string) => {
    setPlayingVoiceId(voiceId); // Set the voice currently playing
    try {
      const sampleText = `Hey, I am your ${voiceName} voice from Aistein.`;
      const token = localStorage.getItem('accessToken'); // Get token for Authorization header
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

      const response = await axios.post(
        `${API_BASE_URL}/tts/generate-audio`,
        { voiceId, text: sampleText },
        {
          responseType: 'arraybuffer',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      const responseData = response.data; // Extract data from the raw axios response

      // ❗ SAFETY CHECK
      if (!responseData || !(responseData instanceof ArrayBuffer) || responseData.byteLength < 1000) {
        throw new Error("Invalid audio received from backend: data is not ArrayBuffer or too small");
      }

      const audioBlob = new Blob([responseData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setPlayingVoiceId(null); // Reset when audio finishes
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        toast.error('Failed to play voice sample.');
        setPlayingVoiceId(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.play();
      toast.success(`Playing sample for ${voiceName}...`);
    } catch (error: any) {
      console.error("Error playing voice sample:", error.response?.data ? new TextDecoder().decode(error.response.data) : error.message);
      toast.error(error.message || "Failed to play voice sample");
      setPlayingVoiceId(null);
    }
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
  <div className="h-full overflow-auto">
    <div className="max-w-7xl mx-auto p-6">
      {/* Small Header */}
      <div className="mb-6 pb-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">
          Phone Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure AI-powered voice conversations with SIP providers and LiveKit
        </p>
      </div>

      {/* Back Header */}
      <div className="mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/configuration/phone")}
            className="w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Phone Settings
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your voice agent and phone integration
            </p>
          </div>
        </div>
      </div>

      {/* Connected Numbers Display */}
      <div className="flex items-center gap-4 mb-6">
        {settings?.isConfigured && settings.twilioPhoneNumber && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <div>
              <div className="text-xs text-green-400 font-medium mb-0.5">
                Outbound Number
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-foreground">
                  {settings.twilioPhoneNumber}
                </span>
                <button
                  onClick={handleCopyNumber}
                  className="p-1 hover:bg-green-500/10 rounded transition-colors cursor-pointer"
                  title="Copy number"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
                <button
                  onClick={handleDeleteOutboundNumber}
                  className="p-1 hover:bg-red-500/10 rounded transition-colors cursor-pointer text-red-400 hover:text-red-500"
                  title="Delete outbound number"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inbound Numbers */}
      {inboundConfigs && inboundConfigs.length > 0 && (
        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <div>
            <div className="text-xs text-blue-400 font-medium mb-0.5">Inbound Numbers ({inboundConfigs.length})</div>
            <div className="flex flex-wrap items-center gap-2">
              {inboundConfigs.map((config) => (
                <div key={config._id} className="flex items-center gap-1 bg-background/50 rounded px-2 py-1">
                  <span className="text-xs font-mono text-foreground">{config.calledNumber}</span>
                  <button
                    onClick={() => handleDeleteInboundNumber(config.calledNumber)}
                    className="p-0.5 hover:bg-red-500/10 rounded transition-colors cursor-pointer text-red-400 hover:text-red-500"
                    title={`Delete ${config.calledNumber}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6 max-w-2xl">
        <button
          onClick={() => setActiveTab("voiceAgentBehaviour")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
            activeTab === "voiceAgentBehaviour"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Voice Agent Behaviour
        </button>
        <button
          onClick={() => setActiveTab("endOfCall")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
            activeTab === "endOfCall"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Escalation Rules
        </button>
        <button
          onClick={() => setActiveTab("inbound")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
            activeTab === "inbound"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Inbound Numbers
        </button>
      </div>

      {/* Voice Agent Behaviour Tab */}
      {activeTab === "voiceAgentBehaviour" && (
        <div className="space-y-6 max-w-2xl">
          {/* Auto Setup Methods Section */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowSetupMethods(!showSetupMethods)}
              className="w-full p-6 flex items-center justify-between hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground">Import Number</h3>
                  <p className="text-sm text-muted-foreground">Configure your number with automatic SIP trunk setup</p>
                </div>
              </div>
              {showSetupMethods ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {showSetupMethods && (
              <div className="p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Method 1: Full Setup */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      activeSetupMethod === "full"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setActiveSetupMethod(activeSetupMethod === "full" ? null : "full")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-lg">🚀</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1">Full Setup</h4>
                        <p className="text-xs text-muted-foreground">
                          Complete setup from scratch with SIP provider credentials
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Method 2: Generic SIP Trunk */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      activeSetupMethod === "generic"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setActiveSetupMethod(activeSetupMethod === "generic" ? null : "generic")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-lg">🔧</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1">Generic SIP Trunk</h4>
                        <p className="text-xs text-muted-foreground">
                          Universal setup for any SIP provider
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Setup Form */}
                {activeSetupMethod === "full" && (
                  <div className="mt-4 p-4 bg-secondary/50 rounded-lg space-y-4 border border-border">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullSetupLabel}
                        onChange={(e) => setFullSetupLabel(e.target.value)}
                        placeholder="e.g., My Voice Agent"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullSetupPhone}
                        onChange={(e) => setFullSetupPhone(e.target.value)}
                        placeholder="+1234567890"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Provider Account SID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullSetupTwilioSid}
                        onChange={(e) => setFullSetupTwilioSid(e.target.value)}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Provider Auth Token <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={fullSetupTwilioToken}
                        onChange={(e) => setFullSetupTwilioToken(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleFullSetup}
                      disabled={isSettingUp || !fullSetupLabel || !fullSetupPhone || !fullSetupTwilioSid || !fullSetupTwilioToken}
                      className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSettingUp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        "Setup SIP Trunk"
                      )}
                    </button>
                  </div>
                )}

                {/* Generic SIP Trunk Form */}
                {activeSetupMethod === "generic" && (
                  <div className="mt-4 p-4 bg-secondary/50 rounded-lg space-y-4 border border-border">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={genericSetupLabel}
                        onChange={(e) => setGenericSetupLabel(e.target.value)}
                        placeholder="e.g., My SIP Provider"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={genericSetupPhone}
                        onChange={(e) => setGenericSetupPhone(e.target.value)}
                        placeholder="+1234567890"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        SIP Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={genericSetupSipAddress}
                        onChange={(e) => setGenericSetupSipAddress(e.target.value)}
                        placeholder="sip.provider.com"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={genericSetupUsername}
                        onChange={(e) => setGenericSetupUsername(e.target.value)}
                        placeholder="your_username"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={genericSetupPassword}
                        onChange={(e) => setGenericSetupPassword(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Transport <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={genericSetupTransport}
                        onChange={(e) => setGenericSetupTransport(e.target.value)}
                        className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="udp">UDP</option>
                        <option value="tcp">TCP</option>
                        <option value="tls">TLS</option>
                      </select>
                    </div>
                    <button
                      onClick={handleGenericSetup}
                      disabled={isSettingUp || !genericSetupLabel || !genericSetupPhone || !genericSetupSipAddress || !genericSetupUsername || !genericSetupPassword}
                      className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSettingUp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Generic SIP Trunk"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Manual Configuration */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Manual Configuration</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Or enter your settings manually if you prefer
              </p>
            </div>
            
          <div className="space-y-6">
            {/* Voice Type Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Voice Type <span className="text-red-500">*</span>
              </label>
              <select
                value={voiceType}
                onChange={(e) => {
                  const newType = e.target.value as "predefined" | "custom";
                  setVoiceType(newType);
                  // Clear custom voice ID when switching to predefined
                  if (newType === "predefined") {
                    setCustomVoiceId("");
                  }
                }}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="predefined">Predefined Voice</option>
                <option value="custom">Custom Voice ID</option>
              </select>
            </div>

            {/* Predefined Voice Selection (Custom UI) */}
            {voiceType === "predefined" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Select Voice <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {VOICE_OPTIONS.map((voice) => (
                    <div
                      key={voice.value}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all
                        ${selectedVoice === voice.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                      `}
                      onClick={() => setSelectedVoice(voice.value)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{voice.flag}</span>
                        <div>
                          <div className="font-medium text-foreground">
                            {voice.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {voice.language} • {voice.gender}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent selecting the voice when clicking play
                          playVoiceSample(voice.voiceId, voice.label);
                        }}
                        disabled={playingVoiceId === voice.voiceId}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                          ${playingVoiceId === voice.voiceId ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-secondary hover:bg-primary/10 text-primary"}
                        `}
                        title={`Play sample for ${voice.label}`}
                      >
                        {playingVoiceId === voice.voiceId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Select the voice for your AI agent.
                </p>
              </div>
            )}

            {/* Custom Voice ID */}
            {voiceType === "custom" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Custom Voice ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customVoiceId}
                  onChange={(e) => setCustomVoiceId(e.target.value)}
                  placeholder="Enter custom ElevenLabs voice ID"
                  className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter your custom ElevenLabs voice ID. This will override any predefined voice selection.
                </p>
              </div>
            )}

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Language <span className="text-red-500">*</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
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
              <p className="text-xs text-muted-foreground mt-2">
                Select the language for the voice agent and greeting message.
              </p>
            </div>

            {/* Greeting Message */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Greeting Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                placeholder="Hello! How can I help you today?"
                rows={4}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                This greeting message will be used when the voice agent starts a conversation.
              </p>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                System Prompt <span className="text-red-500">*</span>
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful AI assistant. Be friendly and concise."
                rows={6}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Define the personality and behavior of your voice agent. This prompt guides how the AI responds to users.
              </p>
            </div>

            {/* Save Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={handleSaveSystemPrompt}
                disabled={updateVoiceAgentPrompt.isPending || !systemPrompt.trim()}
                className="h-11 px-6 bg-secondary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {updateVoiceAgentPrompt.isPending ? "Saving..." : "Save System Prompt"}
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={isUpdating || (voiceType === "predefined" && !selectedVoice) || (voiceType === "custom" && !customVoiceId.trim()) || !greetingMessage.trim()}
                className="h-11 px-6 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isUpdating ? "Saving..." : "Save Configuration"}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Rules Tab */}
      {activeTab === "endOfCall" && (
        <div className="bg-card border border-border rounded-xl p-6 max-w-2xl">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Escalation Conditions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define when calls should be escalated to a human operator
                  </p>
                </div>
                <button
                  onClick={addEscalationRule}
                  className="h-9 px-4 bg-secondary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all cursor-pointer"
                >
                  Add Rule
                </button>
              </div>

              <div className="space-y-3">
                {escalationRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No escalation rules defined. Click "Add Rule" to create one.
                  </div>
                ) : (
                  escalationRules.map((rule, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => updateEscalationRule(index, e.target.value)}
                        placeholder="e.g., Customer requests to speak with human"
                        className="flex-1 h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                      <button
                        onClick={() => removeEscalationRule(index)}
                        className="h-11 px-4 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Example Escalation Rules:</h4>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>• Customer explicitly requests to speak with a human operator</li>
                  <li>• Customer expresses frustration or anger</li>
                  <li>• Complex technical issue that requires human expertise</li>
                  <li>• Request for refund or account changes</li>
                  <li>• Multiple failed attempts to resolve the issue</li>
                </ul>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveEscalationRules}
                disabled={updateVoiceAgentHumanOperator.isPending}
                className="h-11 px-6 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {updateVoiceAgentHumanOperator.isPending ? "Saving..." : "Save Escalation Rules"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inbound Tab */}
      {activeTab === "inbound" && (
        <div className="space-y-6 max-w-3xl">
          {/* Current Inbound Agent Configs */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Inbound Agent Configurations {inboundConfigs && inboundConfigs.length > 0 && `(${inboundConfigs.length})`}
              </h3>
              <button
                onClick={() => syncConfig.mutate()}
                disabled={syncConfig.isPending}
                className="h-9 px-4 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
              >
                {syncConfig.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  "Sync All Configs"
                )}
              </button>
            </div>
            
            {!inboundConfigs || inboundConfigs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-4">
                  No inbound agent configurations found.
                </p>
                <p className="text-xs text-muted-foreground">
                  Add inbound phone numbers below and configurations will be created automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {inboundConfigs.map((config, index) => (
                  <div key={config._id} className="border border-border rounded-lg p-4 bg-secondary/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        {config.calledNumber}
                      </h4>
                      {editingConfigId === config._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveConfig(config)}
                            disabled={isSavingConfig}
                            className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {isSavingConfig ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                Save
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSavingConfig}
                            className="h-8 px-3 bg-secondary text-foreground rounded-lg text-xs font-medium hover:brightness-110 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditConfig(config)}
                          className="h-8 px-3 bg-primary text-foreground rounded-lg text-xs font-medium hover:brightness-110 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {editingConfigId === config._id ? (
                        <>
                          {/* Editable Language */}
                          <div className="p-2 bg-background/50 rounded">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Language:</label>
                            <select
                              value={editLanguage}
                              onChange={(e) => setEditLanguage(e.target.value)}
                              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                            >
                              <option value="en">English</option>
                              <option value="es">Spanish</option>
                              <option value="it">Italian</option>
                              <option value="fr">French</option>
                              <option value="de">German</option>
                              <option value="pt">Portuguese</option>
                              <option value="ar">Arabic</option>
                              <option value="zh">Chinese</option>
                              <option value="ja">Japanese</option>
                              <option value="ko">Korean</option>
                            </select>
                          </div>

                          {/* Editable Greeting Message */}
                          <div className="p-2 bg-background/50 rounded">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Greeting Message:</label>
                            <textarea
                              value={editGreetingMessage}
                              onChange={(e) => setEditGreetingMessage(e.target.value)}
                              placeholder="Enter greeting message..."
                              rows={3}
                              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Read-only Language */}
                          <div className="flex items-start gap-3 p-2 bg-background/50 rounded">
                            <div className="text-xs font-medium text-muted-foreground min-w-[120px]">Language:</div>
                            <div className="text-xs text-foreground">{config.language || 'en'}</div>
                          </div>

                          {/* Read-only Greeting Message */}
                          <div className="flex items-start gap-3 p-2 bg-background/50 rounded">
                            <div className="text-xs font-medium text-muted-foreground min-w-[120px]">Greeting Message:</div>
                            <div className="text-xs text-foreground">{config.greeting_message || 'Hello! How can I help you today?'}</div>
                          </div>
                        </>
                      )}
                      
                      <div className="flex items-start gap-3 p-2 bg-background/50 rounded">
                        <div className="text-xs font-medium text-muted-foreground min-w-[120px]">Voice ID:</div>
                        <div className="text-xs text-foreground font-mono">{config.voice_id || 'Not set'}</div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-2 bg-background/50 rounded">
                        <div className="text-xs font-medium text-muted-foreground min-w-[120px]">Collections:</div>
                        <div className="text-xs text-foreground">
                          {config.collections && config.collections.length > 0 
                            ? config.collections.join(', ') 
                            : 'No collections'}
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-2 bg-background/50 rounded">
                        <div className="text-xs font-medium text-muted-foreground min-w-[120px]">Agent Instruction:</div>
                        <div className="text-xs text-foreground line-clamp-2">
                          {config.agent_instruction || 'No instruction set'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Setup Inbound Trunk */}
          <div className="bg-card border border-border rounded-xl p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                inboundStep >= 1 ? 'bg-primary text-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                1
              </div>
              <div className={`w-16 h-0.5 ${inboundStep >= 2 ? 'bg-primary' : 'bg-secondary'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                inboundStep >= 2 ? 'bg-primary text-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                2
              </div>
              <div className={`w-16 h-0.5 ${inboundStep >= 3 ? 'bg-primary' : 'bg-secondary'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                inboundStep >= 3 ? 'bg-primary text-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                ✓
              </div>
            </div>
          </div>

          {/* Step 1: Create Inbound Trunk */}
          {inboundStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Setup Inbound Trunk</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create an inbound SIP trunk to receive calls
                </p>
              </div>

              {/* Warning if numbers already exist */}
              {(inboundConfigs && inboundConfigs.length > 0) && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-yellow-400 mb-2">⚠️ Inbound Numbers Already Configured</h4>
                  <p className="text-xs text-muted-foreground">
                    You have {inboundConfigs.length} inbound number(s) configured. Please delete existing numbers above before adding new ones.
                  </p>
                </div>
              )}

              {(inboundConfigs && inboundConfigs.length > 0) ? (
                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Please delete existing inbound numbers before adding new ones.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Trunk Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={inboundName}
                      onChange={(e) => setInboundName(e.target.value)}
                      placeholder="e.g., My Inbound Trunk"
                      className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Numbers <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={inboundPhoneNumbers}
                      onChange={(e) => setInboundPhoneNumbers(e.target.value)}
                      placeholder="+1234567890, +0987654321"
                      className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter phone numbers in E.164 format, separated by commas
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="krispEnabled"
                      checked={inboundKrispEnabled}
                      onChange={(e) => setInboundKrispEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="krispEnabled" className="text-sm text-foreground cursor-pointer">
                      Enable Krisp noise cancellation
                    </label>
                  </div>

              <button
                onClick={handleCreateInboundTrunk}
                disabled={isCreatingInbound || !inboundName || !inboundPhoneNumbers || (inboundConfigs && inboundConfigs.length > 0)}
                className="w-full h-11 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                    {isCreatingInbound ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Trunk...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 2: Create Dispatch Rule */}
          {inboundStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Create Dispatch Rule</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Configure routing for incoming calls
                </p>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="text-sm font-medium text-green-400 mb-2">Trunk Created Successfully!</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Trunk ID: <span className="font-mono text-foreground">{inboundTrunkId}</span></p>
                  <p>Trunk Name: <span className="text-foreground">{inboundTrunkName}</span></p>
                  <p>Phone Numbers:</p>
                  <ul className="ml-4 list-disc">
                    {inboundConnectedNumbers.map((num, idx) => (
                      <li key={idx} className="font-mono text-foreground">{num}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  The dispatch rule will route incoming calls to the <span className="font-mono text-primary">inbound-agent</span> automatically.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setInboundStep(1)}
                  className="flex-1 h-11 bg-secondary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateDispatchRule}
                  disabled={isCreatingInbound}
                  className="flex-1 h-11 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingInbound ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Rule...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {inboundStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Inbound Setup Complete!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Your inbound trunk and dispatch rule have been configured successfully
                </p>
              </div>

              <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-green-400 mb-2">Connected Phone Numbers:</h4>
                  <div className="space-y-2">
                    {inboundConnectedNumbers.map((num, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-background rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-mono text-foreground">{num}</span>
                        <Check className="w-4 h-4 text-green-500 ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-green-500/20">
                  <p className="text-xs text-muted-foreground">
                    All incoming calls to these numbers will be automatically routed to your inbound agent.
                  </p>
                </div>
              </div>

              <button
                onClick={resetInboundSetup}
                className="w-full h-11 bg-secondary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all cursor-pointer"
              >
                Setup Another Inbound Trunk
              </button>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  </div>
);
}

