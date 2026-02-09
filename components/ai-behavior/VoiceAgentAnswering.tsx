"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, TestTube2 } from "lucide-react";
import { useKnowledgeBase } from "@/contexts/KnowledgeBaseContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAIBehavior } from "@/hooks/useAIBehavior";
import { usePhoneNumbersList } from "@/hooks/usePhoneNumber";
import { useSocialIntegrationsStatus } from "@/hooks/useSocialIntegrationsStatus";
import { useAgents } from "@/hooks/useAgents";
import { useOutboundCall } from "@/hooks/useSipTrunk";
import { toast } from "sonner";

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'tr', name: 'Turkish' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' }
];

export function VoiceAgentAnswering() {
  const router = useRouter();
  const { voiceAgentPrompt, setVoiceAgentPrompt } = useKnowledgeBase();
  const { user } = useAuth();
  const { aiBehavior } = useAIBehavior();
  const { data: phoneNumbers } = usePhoneNumbersList();
  // Show all numbers that support outbound (Twilio + SIP). If SIP number isn't registered with the provider, backend will return a clear error when placing the call.
  const outboundPhoneNumbers = phoneNumbers?.filter(phone => phone.supports_outbound === true) || [];
  const { integrations } = useSocialIntegrationsStatus();
  const { data: agents = [], isLoading: isLoadingAgents } = useAgents();
  const outboundCallMutation = useOutboundCall();

  const [improvements, setImprovements] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState<string>("");
  const [callerProvider, setCallerProvider] = useState<'sip' | 'twilio'>('sip');
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setImprovements(voiceAgentPrompt);
    loadVoiceAgentSettings();
  }, [voiceAgentPrompt]);

  const loadVoiceAgentSettings = async () => {
    try {
      const response = await fetch('/api/v1/ai-behavior', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.voiceAgent?.language) {
          setSelectedLanguage(data.data.voiceAgent.language);
        }
      }
    } catch (error) {
      console.error('Error loading voice agent settings:', error);
    }
  };

  const handleSavePrompt = async () => {
    if (improvements.trim()) {
      setVoiceAgentPrompt(improvements);

      try {
        const response = await fetch('/api/v1/ai-behavior/voice-agent/prompt', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ systemPrompt: improvements })
        });

        if (response.ok) {
          toast.success('Voice agent prompt saved to database!');
        } else {
          toast.error('Failed to save prompt');
        }
      } catch (error) {
        console.error('Error saving voice agent prompt:', error);
      }
    }
  };

  const handleSaveLanguage = async (language: string) => {
    try {
      const response = await fetch('/api/v1/ai-behavior/voice-agent/language', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ language })
      });

      if (response.ok) {
        setSelectedLanguage(language);
        toast.success('Voice agent language updated!');
      } else {
        toast.error('Failed to update language');
      }
    } catch (error) {
      console.error('Error saving voice agent language:', error);
      toast.error('Failed to update language');
    }
  };

  const handleTestVoiceAgent = async () => {
    if (!testPhoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    if (!selectedAgentId) {
      toast.error('Please select an agent');
      return;
    }

    if (!selectedPhoneNumberId) {
      toast.error('Please select an agent phone number');
      return;
    }

    // Get agent_id from selected agent (use agent_id field from Agent model, not _id)
    const selectedAgent = agents.find(agent => agent._id === selectedAgentId || agent.agent_id === selectedAgentId);
    if (!selectedAgent) {
      toast.error('Selected agent not found');
      return;
    }

    // Use agent_id field from Agent model (this is the Python API agent ID)
    const agentId = selectedAgent.agent_id;
    if (!agentId) {
      toast.error('Agent ID not found in selected agent');
      return;
    }

    // Get sender email from connected Gmail social integration
    let senderEmail = '';

    // First check Gmail integration
    if (integrations.gmail?.status === 'connected') {
      // Check credentials.email first
      if (integrations.gmail.credentials?.email) {
        senderEmail = integrations.gmail.credentials.email;
      }
      // If not in credentials, check metadata
      if (!senderEmail && integrations.gmail.metadata && 'email' in integrations.gmail.metadata) {
        senderEmail = (integrations.gmail.metadata as any).email;
      }
    }

    // Fallback: try any connected integration with email
    if (!senderEmail) {
      const connectedIntegration = Object.values(integrations).find(
        (integration) => integration?.status === 'connected' && integration?.credentials?.email
      );
      if (connectedIntegration?.credentials?.email) {
        senderEmail = connectedIntegration.credentials.email;
      }
    }

    // Log for debugging
    if (senderEmail) {
      console.log('[Outbound Call] Using sender email:', senderEmail);
    } else {
      console.warn('[Outbound Call] No sender email found from social integrations');
    }

    setIsTesting(true);
    try {
      console.log(`[Outbound Call] Using provider: ${callerProvider}`);

      const result = await outboundCallMutation.mutateAsync({
        agent_id: agentId,
        agent_phone_number_id: selectedPhoneNumberId,
        to_number: testPhoneNumber,
        customer_info: {
          name: customerName,
          ...(customerEmail.trim() && { email: customerEmail })
        },
        provider: callerProvider, // Pass the selected provider
        ...(senderEmail && { sender_email: senderEmail })
      });

      console.log('Outbound call response:', result);

      if (result.success) {
        toast.success(result.message || 'Outbound call initiated successfully!');

        // Navigate to conversation if conversation_db_id is available
        if (result.conversation_db_id) {
          setTimeout(() => {
            router.push(`/conversations?conversation=${result.conversation_db_id}`);
          }, 1000); // Small delay to ensure conversation is created
        }

        setShowTestModal(false);
        setTestPhoneNumber("");
        setCustomerName("");
        setCustomerEmail("");
        setSelectedAgentId("");
        setSelectedPhoneNumberId("");
        setCallerProvider('sip');
      } else {
        toast.error(result.message || 'Outbound call failed');
      }
    } catch (error: any) {
      console.error('Error initiating outbound call:', error);
      toast.error(error.message || 'Failed to initiate outbound call');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Test Voice Agent */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <TestTube2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Test Voice Agent
              </h3>
              <p className="text-sm text-muted-foreground">
                Test your voice agent configuration with a real phone call
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTestModal(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all cursor-pointer"
            >
              Test Now
            </button>
          </div>
        </div>
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Test Outbound Call
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fill in the details below to initiate an outbound call test.
            </p>

            <div className="space-y-4">
              {/* Agent Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Agent <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  disabled={isLoadingAgents}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select an agent</option>
                  {agents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name} ({agent.agent_id})
                    </option>
                  ))}
                </select>
                {isLoadingAgents && (
                  <p className="text-xs text-muted-foreground mt-1">Loading agents...</p>
                )}
                {!isLoadingAgents && agents.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No agents available. Please create an agent first.
                  </p>
                )}
              </div>

              {/* Agent Phone Number Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Agent Phone Number <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedPhoneNumberId}
                  onChange={(e) => setSelectedPhoneNumberId(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select a phone number</option>
                  {outboundPhoneNumbers.map((phone) => (
                    <option key={phone.id} value={phone.id}>
                      {phone.label} ({phone.phone_number})
                    </option>
                  ))}
                </select>
                {outboundPhoneNumbers.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No phone numbers with outbound support available. Please import a phone number with outbound capabilities first.
                  </p>
                )}
              </div>

              {/* Caller Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Caller Provider <span className="text-red-500">*</span>
                </label>
                <select
                  value={callerProvider}
                  onChange={(e) => setCallerProvider(e.target.value as 'sip' | 'twilio')}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="sip">SIP</option>
                  <option value="twilio">Twilio</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose the provider to use for this call. Default: SIP
                </p>
              </div>

              {/* Customer Phone Number */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Customer Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Customer Email (Optional) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Customer Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestPhoneNumber("");
                  setCustomerName("");
                  setCustomerEmail("");
                  setSelectedAgentId("");
                  setSelectedPhoneNumberId("");
                  setCallerProvider('sip');
                }}
                disabled={isTesting}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleTestVoiceAgent}
                disabled={isTesting || !selectedAgentId || !selectedPhoneNumberId || !testPhoneNumber.trim() || !customerName.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isTesting ? 'Calling...' : 'Start Test Call'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

