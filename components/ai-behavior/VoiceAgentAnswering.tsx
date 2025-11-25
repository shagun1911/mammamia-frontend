"use client";

import { useState, useEffect } from "react";
import { Phone, ChevronDown, ChevronUp, TestTube2 } from "lucide-react";
import { useKnowledgeBase } from "@/contexts/KnowledgeBaseContext";
import { toast } from "sonner";

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'tr', name: 'Turkish' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' }
];

export function VoiceAgentAnswering() {
  const { voiceAgentPrompt, setVoiceAgentPrompt } = useKnowledgeBase();
  const [improvements, setImprovements] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
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

    setIsTesting(true);
    try {
      const response = await fetch('/api/v1/ai-behavior/voice-agent/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          phoneNumber: testPhoneNumber
        })
      });

      const result = await response.json();
      console.log('✅ Test call response:', result);

      if (response.ok && result.success) {
        toast.success(result.data?.message || 'Test call initiated! You should receive a call shortly.');
        setShowTestModal(false);
        setTestPhoneNumber("");
      } else {
        const errorMessage = result.error?.message || result.message || 'Failed to initiate test call';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error testing voice agent:', error);
      toast.error('Failed to initiate test call');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Question */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              What would you like to improve?
            </h3>
            <p className="text-sm text-muted-foreground">
              Describe how you want your AI voice agent to respond during phone calls
            </p>
          </div>
        </div>

        <textarea
          value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
          placeholder="E.g., Speak clearly and at a moderate pace, be empathetic when handling complaints, confirm important information before ending calls..."
          rows={6}
          className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
        />

        <div className="flex justify-end gap-3 mt-4">
          <button 
            onClick={() => {
              const defaultPrompt = "You are a helpful AI voice assistant. Speak clearly and be empathetic.";
              setImprovements(defaultPrompt);
              setVoiceAgentPrompt(defaultPrompt);
            }}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
          <button 
            onClick={handleSavePrompt}
            className="px-6 py-2 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all"
          >
            Save Prompt
          </button>
        </div>
      </div>

      {/* Language Selection */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Voice Language
            </h3>
            <p className="text-sm text-muted-foreground">
              Select the language for your AI voice agent
            </p>
          </div>
        </div>

        <select
          value={selectedLanguage}
          onChange={(e) => handleSaveLanguage(e.target.value)}
          className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
        >
          {LANGUAGE_OPTIONS.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

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
          <button 
            onClick={() => setShowTestModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
          >
            Test Now
          </button>
        </div>
      </div>

      {/* Advanced Section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-foreground">Advanced Settings</div>
            <span className="text-xs text-muted-foreground">
              View the current system prompt
            </span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {showAdvanced && (
          <div className="px-6 pb-6 pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              This is the current system prompt that will be used for your AI voice agent
            </p>
            <div className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground font-mono whitespace-pre-wrap min-h-[200px]">
              {voiceAgentPrompt}
            </div>
          </div>
        )}
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Test Voice Agent
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your phone number with country code (e.g., +1234567890) to receive a test call.
            </p>
            <input
              type="tel"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestPhoneNumber("");
                }}
                disabled={isTesting}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTestVoiceAgent}
                disabled={isTesting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

