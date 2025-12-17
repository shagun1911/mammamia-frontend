"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Check, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePhoneSettings } from "@/hooks/usePhoneSettings";
import { useAIBehavior } from "@/hooks/useAIBehavior";
import { VOICE_OPTIONS, phoneSettingsService } from "@/services/phoneSettings.service";
import { toast } from "sonner";
import { VoicePlayground } from "@/components/settings/VoicePlayground";

export default function PhoneSettingsDetailPage() {
  const router = useRouter();
  const { settings, isLoading, updateSettings, isUpdating } = usePhoneSettings();
  const { aiBehavior, updateVoiceAgentHumanOperator } = useAIBehavior();

  const [activeTab, setActiveTab] = useState<"settings" | "voice" | "endOfCall" | "inbound">("settings");
  const [copied, setCopied] = useState(false);

  // Form state
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


  // Update form state when settings load
  useEffect(() => {
    if (settings) {
      setSelectedVoice(settings.selectedVoice);
      setCustomVoiceId(settings.customVoiceId || "");
      setTwilioPhoneNumber(settings.twilioPhoneNumber);
      setLivekitSipTrunkId(settings.livekitSipTrunkId);
      setTwilioTrunkSid(settings.twilioTrunkSid || "");
      setTerminationUri(settings.terminationUri || "");
      setOriginationUri(settings.originationUri || "");
      setHumanOperatorPhone(settings.humanOperatorPhone);
    }
  }, [settings]);

  useEffect(() => {
    if (aiBehavior?.voiceAgent?.humanOperator?.escalationRules) {
      setEscalationRules(aiBehavior.voiceAgent.humanOperator.escalationRules);
    }
  }, [aiBehavior]);

  const handleSaveSettings = () => {
    updateSettings({
      selectedVoice,
      customVoiceId,
      twilioPhoneNumber,
      livekitSipTrunkId,
      humanOperatorPhone,
    });
  };

  const handleSaveEscalationRules = () => {
    if (!aiBehavior) return;

    updateVoiceAgentHumanOperator.mutate({
      escalationRules,
    });
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
      console.log('📊 [SIP Trunk Setup] Response fields:', {
        status: result.status,
        message: result.message,
        livekit_trunk_id: result.livekit_trunk_id,
        twilio_trunk_sid: result.twilio_trunk_sid,
        termination_uri: result.termination_uri,
        origination_uri: result.origination_uri,
        credential_list_sid: result.credential_list_sid,
        ip_acl_sid: result.ip_acl_sid,
        username: result.username,
        origination_uri_sid: result.origination_uri_sid
      });

      // Auto-fill the form with returned values
      console.log('💾 [SIP Trunk Setup] Setting form values...');
      setTwilioPhoneNumber(fullSetupPhone);
      setLivekitSipTrunkId(result.livekit_trunk_id);
      setTwilioTrunkSid(result.twilio_trunk_sid);
      setTerminationUri(result.termination_uri);
      setOriginationUri(result.origination_uri);
      console.log('✅ [SIP Trunk Setup] Form values set:', {
        twilioPhoneNumber: fullSetupPhone,
        livekitSipTrunkId: result.livekit_trunk_id,
        twilioTrunkSid: result.twilio_trunk_sid,
        terminationUri: result.termination_uri,
        originationUri: result.origination_uri
      });

      // Save settings automatically
      console.log('💾 [SIP Trunk Setup] Saving settings to database...');
      await updateSettings({
        selectedVoice,
        twilioPhoneNumber: fullSetupPhone,
        livekitSipTrunkId: result.livekit_trunk_id,
        twilioTrunkSid: result.twilio_trunk_sid,
        terminationUri: result.termination_uri,
        originationUri: result.origination_uri,
        humanOperatorPhone,
      });
      console.log('✅ [SIP Trunk Setup] Settings saved successfully');

      toast.success("SIP Trunk setup completed successfully!");
      setShowSetupMethods(false);
      setActiveSetupMethod(null);
      
      // Clear form
      setFullSetupLabel("");
      setFullSetupPhone("");
      setFullSetupTwilioSid("");
      setFullSetupTwilioToken("");
      
      console.log('🎉 [SIP Trunk Setup] Setup process completed!');
    } catch (error: any) {
      console.error('❌ [SIP Trunk Setup] Setup failed:', error);
      console.error('📊 [SIP Trunk Setup] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.message || "Failed to setup SIP trunk");
    } finally {
      setIsSettingUp(false);
    }
  };

  // Inbound Setup - Step 1: Create Inbound Trunk
  const handleCreateInboundTrunk = async () => {
    if (!inboundName || !inboundPhoneNumbers) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreatingInbound(true);
    try {
      const phoneNumbersArray = inboundPhoneNumbers.split(',').map(num => num.trim()).filter(Boolean);
      
      const API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'https://keplerov1-python-2.onrender.com';
      const url = `${API_URL}/calls/create-inbound-trunk`;
      const requestBody = {
        name: inboundName,
        phone_numbers: phoneNumbersArray,
        krisp_enabled: inboundKrispEnabled,
      };

      console.log('\n🚀 [Inbound Trunk] Creating inbound trunk...');
      console.log('📍 [Inbound Trunk] URL:', url);
      console.log('📦 [Inbound Trunk] Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📊 [Inbound Trunk] Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Inbound Trunk] Error Response:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData.detail || 'Failed to create inbound trunk');
      }

      const data = await response.json();
      console.log('✅ [Inbound Trunk] Response Body:', JSON.stringify(data, null, 2));
      
      // Store trunk info and move to step 2
      setInboundTrunkId(data.trunk_id);
      setInboundTrunkName(data.trunk_name);
      setInboundConnectedNumbers(data.phone_numbers);
      setInboundStep(2);
      
      toast.success('Inbound trunk created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create inbound trunk');
      console.error('❌ [Inbound Trunk] Error:', error);
    } finally {
      setIsCreatingInbound(false);
    }
  };

  // Inbound Setup - Step 2: Create Dispatch Rule
  const handleCreateDispatchRule = async () => {
    if (!inboundTrunkId) {
      toast.error("Trunk ID is missing");
      return;
    }

    setIsCreatingInbound(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'https://keplerov1-python-2.onrender.com';
      
      // Build URL with query parameters
      const queryParams = new URLSearchParams({
        sip_trunk_id: inboundTrunkId,
        name: inboundTrunkName,
        agent_name: "inbound-agent",
      });
      const url = `${API_URL}/calls/create-dispatch-rule?${queryParams.toString()}`;

      console.log('\n🚀 [Dispatch Rule] Creating dispatch rule...');
      console.log('📍 [Dispatch Rule] URL:', url);
      console.log('📦 [Dispatch Rule] Query Parameters:', {
        sip_trunk_id: inboundTrunkId,
        name: inboundTrunkName,
        agent_name: "inbound-agent",
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 [Dispatch Rule] Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Dispatch Rule] Error Response:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData.detail || 'Failed to create dispatch rule');
      }

      const data = await response.json();
      console.log('✅ [Dispatch Rule] Response Body:', JSON.stringify(data, null, 2));
      
      // Save to database
      console.log('💾 [Dispatch Rule] Saving to database...');
      const updateData = {
        inboundTrunkId: inboundTrunkId,
        inboundTrunkName: inboundTrunkName,
        inboundDispatchRuleId: data.dispatch_rule_id,
        inboundDispatchRuleName: data.dispatch_rule_name,
        inboundPhoneNumbers: inboundConnectedNumbers,
      };
      console.log('💾 [Dispatch Rule] Update data:', JSON.stringify(updateData, null, 2));
      
      // Await the mutation to ensure it completes
      try {
        await updateSettings(updateData);
        console.log('✅ [Dispatch Rule] Saved to database successfully');
        
        toast.success('Inbound setup completed successfully!');
        setInboundStep(3); // Success screen
      } catch (dbError: any) {
        console.error('❌ [Dispatch Rule] Database save error:', dbError);
        toast.error('Dispatch rule created but failed to save settings: ' + (dbError.message || 'Unknown error'));
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create dispatch rule');
      console.error('❌ [Dispatch Rule] Error:', error);
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

  // Generic SIP Trunk Setup (Method 2)
  const handleGenericSetup = async () => {
    if (!genericSetupLabel || !genericSetupPhone || !genericSetupSipAddress || !genericSetupUsername || !genericSetupPassword) {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/settings/channels")}
            className="w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Phone (Voice) Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your voice agent and phone integration
            </p>
          </div>
        </div>

        {settings?.isConfigured && settings.twilioPhoneNumber && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <div>
              <div className="text-xs text-green-400 font-medium mb-0.5">Number Connected</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-foreground">{settings.twilioPhoneNumber}</span>
                <button
                  onClick={handleCopyNumber}
                  className="p-1 hover:bg-green-500/10 rounded transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6 max-w-2xl">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "settings"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab("voice")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "voice"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Voice Playground
        </button>
        <button
          onClick={() => setActiveTab("endOfCall")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "endOfCall"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          End of Call
        </button>
        <button
          onClick={() => setActiveTab("inbound")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "inbound"
              ? "bg-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Inbound
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6 max-w-2xl">
          {/* Auto Setup Methods Section */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowSetupMethods(!showSetupMethods)}
              className="w-full p-6 flex items-center justify-between hover:bg-secondary/50 transition-colors"
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
                          Complete setup from scratch with Twilio credentials
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
                        Twilio Account SID <span className="text-red-500">*</span>
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
                        Twilio Auth Token <span className="text-red-500">*</span>
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
                      className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                      className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Voice <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                {VOICE_OPTIONS.map((voice) => (
                  <option key={voice.value} value={voice.value}>
                    {voice.flag} {voice.label} ({voice.language} • {voice.gender})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Select the voice for your AI agent. Go to the <button onClick={() => setActiveTab("voice")} className="text-primary hover:underline font-medium">Voice Playground</button> tab to preview all voices.
              </p>
            </div>

            {/* Custom Voice ID */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Custom Voice ID (Optional)
              </label>
              <input
                type="text"
                value={customVoiceId}
                onChange={(e) => setCustomVoiceId(e.target.value)}
                placeholder="Enter custom ElevenLabs voice ID"
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Override the selected voice by providing a custom ElevenLabs voice ID. If provided, this will be used instead of the selected voice above.
              </p>
            </div>

            {/* Twilio Phone Number */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Twilio Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={twilioPhoneNumber}
                onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter your Twilio phone number in E.164 format (e.g., +1234567890)
              </p>
            </div>

            {/* LiveKit SIP Trunk ID */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                LiveKit SIP Trunk ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={livekitSipTrunkId}
                onChange={(e) => setLivekitSipTrunkId(e.target.value)}
                placeholder="ST_xxxxxxxxxxxxxxxxxx"
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Your LiveKit SIP Trunk ID (automatically set from setup)
              </p>
            </div>

            {/* Twilio Trunk SID */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Twilio Trunk SID
              </label>
              <input
                type="text"
                value={twilioTrunkSid}
                onChange={(e) => setTwilioTrunkSid(e.target.value)}
                placeholder="TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-2">
                Twilio Trunk SID (automatically set from setup)
              </p>
            </div>

            {/* Termination URI */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Termination URI
              </label>
              <input
                type="text"
                value={terminationUri}
                onChange={(e) => setTerminationUri(e.target.value)}
                placeholder="tkxxxx...pstn.twilio.com"
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-2">
                Twilio termination URI (automatically set from setup)
              </p>
            </div>

            {/* Origination URI */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Origination URI
              </label>
              <input
                type="text"
                value={originationUri}
                onChange={(e) => setOriginationUri(e.target.value)}
                placeholder="sip:xxxxxx.sip.livekit.cloud"
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-2">
                LiveKit origination SIP URI (automatically set from setup)
              </p>
            </div>

            {/* Human Operator Phone Number */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Human Operator Phone Number (Transfer To)
              </label>
              <input
                type="text"
                value={humanOperatorPhone}
                onChange={(e) => setHumanOperatorPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Phone number to transfer calls to when escalation conditions are met (E.164 format)
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveSettings}
                disabled={isUpdating || !selectedVoice || !twilioPhoneNumber || !livekitSipTrunkId}
                className="h-11 px-6 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Saving..." : "Save Settings"}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Playground Tab */}
      {activeTab === "voice" && (
        <div className="bg-card border border-border rounded-xl p-6 max-w-4xl">
          <VoicePlayground 
            selectedVoice={selectedVoice}
            onVoiceSelect={setSelectedVoice}
          />
          
          {/* Save Button */}
          <div className="flex justify-end pt-6 mt-6 border-t border-border">
            <button
              onClick={handleSaveSettings}
              disabled={isUpdating || !selectedVoice}
              className="h-11 px-6 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Saving..." : "Save Voice Selection"}
            </button>
          </div>
        </div>
      )}

      {/* End of Call Tab */}
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
                  className="h-9 px-4 bg-secondary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all"
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
                        className="h-11 px-4 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all"
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
                className="h-11 px-6 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateVoiceAgentHumanOperator.isPending ? "Saving..." : "Save Escalation Rules"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inbound Tab */}
      {activeTab === "inbound" && (
        <div className="bg-card border border-border rounded-xl p-6 max-w-3xl">
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

              {/* Show existing configured numbers */}
              {settings?.inboundPhoneNumbers && settings.inboundPhoneNumbers.length > 0 && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h4 className="text-sm font-medium text-green-400 mb-3">Previously Configured Numbers:</h4>
                  <div className="space-y-2">
                    {settings.inboundPhoneNumbers.map((num, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-background rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-mono text-foreground text-sm">{num}</span>
                        <Check className="w-4 h-4 text-green-500 ml-auto" />
                      </div>
                    ))}
                  </div>
                  {settings.inboundTrunkName && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Trunk: <span className="text-foreground">{settings.inboundTrunkName}</span>
                    </p>
                  )}
                </div>
              )}

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
                disabled={isCreatingInbound || !inboundName || !inboundPhoneNumbers}
                className="w-full h-11 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  className="flex-1 h-11 bg-secondary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateDispatchRule}
                  disabled={isCreatingInbound}
                  className="flex-1 h-11 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="w-full h-11 bg-secondary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all"
              >
                Setup Another Inbound Trunk
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

