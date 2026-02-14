"use client";

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, ChevronDown, Check, Eye, Plus, Trash2, Play, Pause } from 'lucide-react';
import { useUpdateAgentPrompt } from '@/hooks/useAgents';
import { useKnowledgeBases } from '@/hooks/useKnowledgeBase';
import { Agent, agentService } from '@/services/agent.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  VOICE_OPTIONS,
  getDefaultGreeting,
  getDefaultSystemPrompt,
  getDefaultEscalationConditions,
  getVoiceIdFromValue,
  getVoiceByVoiceId,
  renderGreeting,
  playVoicePreview,
  preloadVoicePreview,
  VoiceOption
} from '@/utils/voiceUtils';

interface EditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
}

export function EditAgentModal({ isOpen, onClose, agent }: EditAgentModalProps) {
  const [firstMessage, setFirstMessage] = useState('Hello! How can I help you today?');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [language, setLanguage] = useState('en');
  // Track if user has manually edited first message/system prompt
  const [hasCustomizedFirstMessage, setHasCustomizedFirstMessage] = useState(false);
  const [hasCustomizedSystemPrompt, setHasCustomizedSystemPrompt] = useState(false);
  const [voiceType, setVoiceType] = useState<'predefined' | 'manual'>('predefined');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [manualVoiceId, setManualVoiceId] = useState('');
  const [selectedKBIds, setSelectedKBIds] = useState<string[]>([]);
  const [showKBDropdown, setShowKBDropdown] = useState(false);
  const [showGreetingPreview, setShowGreetingPreview] = useState(false);
  const [escalationRules, setEscalationRules] = useState<string[]>(['']);

  // Voice testing state
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);
  const [syncingToElevenLabs, setSyncingToElevenLabs] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preview contact data for greeting
  const previewContact = { name: 'John Doe', email: 'john@example.com', phone: '+14155551234' };

  const updateAgentPrompt = useUpdateAgentPrompt();
  const { data: knowledgeBases = [], isLoading: isLoadingKBs } = useKnowledgeBases();

  // Get available voices for selected language
  const availableVoices = VOICE_OPTIONS.filter(v => v.languageCode === language);

  // Group voices by gender for display
  const voicesByGender = availableVoices.reduce((acc, voice) => {
    if (!acc[voice.gender]) {
      acc[voice.gender] = [];
    }
    acc[voice.gender].push(voice);
    return acc;
  }, {} as Record<string, VoiceOption[]>);

  // Load agent data when modal opens
  useEffect(() => {
    if (agent && isOpen) {
      const agentLanguage = agent.language || 'en';
      setFirstMessage(agent.first_message || 'Hello! How can I help you today?');
      setSystemPrompt(agent.system_prompt || getDefaultSystemPrompt(agentLanguage));
      setLanguage(agentLanguage);
      setSelectedKBIds(agent.knowledge_base_ids || []);
      setEscalationRules(agent.escalationRules && agent.escalationRules.length > 0 ? agent.escalationRules : getDefaultEscalationConditions(agentLanguage));

      // Check if first message/system prompt match defaults (user hasn't customized)
      const defaultFirstMessage = getDefaultGreeting(agentLanguage);
      const defaultSystemPrompt = getDefaultSystemPrompt(agentLanguage);
      setHasCustomizedFirstMessage(!!(agent.first_message && agent.first_message !== defaultFirstMessage));
      setHasCustomizedSystemPrompt(!!(agent.system_prompt && agent.system_prompt !== defaultSystemPrompt));

      // Set voice type and selection from voice_id
      if (agent.voice_id) {
        const voice = getVoiceByVoiceId(agent.voice_id);
        if (voice) {
          setVoiceType('predefined');
          setSelectedVoice(voice.value);
          setManualVoiceId('');
        } else {
          setVoiceType('manual');
          setManualVoiceId(agent.voice_id);
          setSelectedVoice('');
        }
      }
    }
  }, [agent, isOpen]);

  // Update defaults when language changes
  useEffect(() => {
    if (language) {
      // Always update first message to language-specific default when language changes
      // unless user has explicitly customized it
      if (!hasCustomizedFirstMessage) {
        const currentDefault = getDefaultGreeting(language);
        setFirstMessage(currentDefault);
      }

      // Always update system prompt to language-specific default when language changes
      // unless user has explicitly customized it
      if (!hasCustomizedSystemPrompt) {
        const currentSystemDefault = getDefaultSystemPrompt(language);
        setSystemPrompt(currentSystemDefault);
      }

      // Update escalation conditions if empty or default
      const defaultEscalation = getDefaultEscalationConditions(language);
      if (escalationRules.length === 0 || (escalationRules.length === 1 && escalationRules[0] === '')) {
        setEscalationRules(defaultEscalation);
      }

      // Reset voice selection if current voice doesn't match language
      if (selectedVoice && voiceType === 'predefined') {
        const currentVoice = VOICE_OPTIONS.find(v => v.value === selectedVoice);
        if (currentVoice && currentVoice.languageCode !== language) {
          setSelectedVoice('');
        }
      }
    }
  }, [language]);

  // Reset customization flags when language changes
  useEffect(() => {
    setHasCustomizedFirstMessage(false);
    setHasCustomizedSystemPrompt(false);
  }, [language]);

  // Get rendered first message preview
  const firstMessagePreview = firstMessage
    ? renderGreeting(firstMessage, previewContact)
    : '';

  // Handle voice preview playback - instant playback with caching
  const handlePlayVoice = async (voice: VoiceOption) => {
    try {
      // Stop currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // If clicking the same voice that's playing, just stop it
      if (playingVoice === voice.value) {
        setPlayingVoice(null);
        setLoadingVoice(null);
        return;
      }

      // Set playing state immediately
      setPlayingVoice(voice.value);
      setLoadingVoice(voice.value);

      const audio = await playVoicePreview(
        voice.voiceId,
        language,
        undefined, // No loading callback - instant playback
        () => {
          setLoadingVoice(null);
        },
        (error) => {
          toast.error(error);
          setLoadingVoice(null);
          setPlayingVoice(null);
        }
      );

      if (audio) {
        audioRef.current = audio;
        audio.onended = () => {
          setPlayingVoice(null);
          setLoadingVoice(null);
        };
        audio.onerror = () => {
          setPlayingVoice(null);
          setLoadingVoice(null);
        };
      } else {
        setPlayingVoice(null);
        setLoadingVoice(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to play voice sample");
      setLoadingVoice(null);
      setPlayingVoice(null);
    }
  };

  // Preload voice on hover for instant playback (throttled)
  const handleVoiceHover = (voice: VoiceOption) => {
    // Only preload if not already playing or loading
    if (playingVoice !== voice.value && loadingVoice !== voice.value) {
      preloadVoicePreview(voice.voiceId, language);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agent) return;

    if (!firstMessage.trim() || !systemPrompt.trim()) {
      return;
    }

    // Get voice_id from selected voice or manual input
    let voiceId: string | undefined;
    if (voiceType === 'predefined') {
      voiceId = selectedVoice ? getVoiceIdFromValue(selectedVoice) || undefined : undefined;
      console.log('[EditAgentModal] 🎤 Predefined voice selected:', {
        selectedVoice,
        resolvedVoiceId: voiceId
      });
    } else {
      voiceId = manualVoiceId.trim() || undefined;
      console.log('[EditAgentModal] 🎤 Manual voice ID:', voiceId);
    }

    if (!voiceId) {
      toast.error('Please select a voice');
      return;
    }

    console.log('[EditAgentModal] 🚀 Updating agent with voice_id:', voiceId);

    try {
      await updateAgentPrompt.mutateAsync({
        agentId: agent.agent_id,
        data: {
          first_message: firstMessage.trim() || getDefaultGreeting(language),
          system_prompt: systemPrompt.trim() || getDefaultSystemPrompt(language),
          language: language.trim(),
          voice_id: voiceId,
          escalationRules: escalationRules.filter(rule => rule.trim() !== '') || undefined,
          knowledge_base_ids: selectedKBIds,
        },
      });

      // Automatically sync to ElevenLabs after successful update
      // This ensures webhook is attached and tools are properly configured
      try {
        await agentService.syncToElevenLabs(agent.agent_id);
        toast.success('Agent updated and synced successfully');
      } catch (syncError: any) {
        console.error('Failed to sync agent after update:', syncError);
        toast.warning('Agent updated but sync failed. Click "Sync" button to retry.');
      }

      onClose();
    } catch (error: any) {
      console.error('Failed to update agent prompt:', error);
    }
  };

  const toggleKB = (kbId: string) => {
    setSelectedKBIds(prev =>
      prev.includes(kbId) ? prev.filter(id => id !== kbId) : [...prev, kbId]
    );
  };

  const handleSyncToElevenLabs = async () => {
    if (!agent?.agent_id) return;
    setSyncingToElevenLabs(true);
    try {
      await agentService.syncToElevenLabs(agent.agent_id);
      toast.success('Agent synced. Tools should now execute during calls.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync agent');
    } finally {
      setSyncingToElevenLabs(false);
    }
  };

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Edit Agent</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{agent.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            disabled={updateAgentPrompt.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* First Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                First Message <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowGreetingPreview(!showGreetingPreview)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3 h-3" />
                Preview
              </button>
            </div>
            <textarea
              value={firstMessage}
              onChange={(e) => {
                setFirstMessage(e.target.value);
                setHasCustomizedFirstMessage(true);
              }}
              placeholder="Hi {{name}}, this is an AI assistant calling from Aistein.it."
              rows={3}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
              disabled={updateAgentPrompt.isPending}
              required
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Use variables: <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">{'{{name}}'}</code>, <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">{'{{email}}'}</code>, <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">{'{{phone}}'}</code>
            </p>
            {showGreetingPreview && firstMessagePreview && (
              <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Preview:</p>
                <p className="text-sm text-foreground">{firstMessagePreview}</p>
              </div>
            )}
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Language <span className="text-destructive">*</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={updateAgentPrompt.isPending}
              required
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="pl">Polish</option>
              <option value="hi">Hindi</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="tr">Turkish</option>
              <option value="ar">Arabic</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1.5">
              Changing language will automatically update greeting, system prompt, and escalation conditions
            </p>
          </div>

          {/* Voice Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Voice Configuration <span className="text-destructive">*</span>
              </label>

              {/* Voice Type Toggle */}
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="voiceType"
                    value="predefined"
                    checked={voiceType === 'predefined'}
                    onChange={(e) => setVoiceType(e.target.value as 'predefined' | 'manual')}
                    disabled={updateAgentPrompt.isPending}
                    className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 border-border"
                  />
                  <span className={cn(
                    "text-sm font-medium",
                    voiceType === 'predefined' ? "text-foreground" : "text-muted-foreground"
                  )}>
                    Predefined Voice
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="voiceType"
                    value="manual"
                    checked={voiceType === 'manual'}
                    onChange={(e) => setVoiceType(e.target.value as 'predefined' | 'manual')}
                    disabled={updateAgentPrompt.isPending}
                    className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 border-border"
                  />
                  <span className={cn(
                    "text-sm font-medium",
                    voiceType === 'manual' ? "text-foreground" : "text-muted-foreground"
                  )}>
                    Manual Voice ID
                  </span>
                </label>
              </div>

              {voiceType === 'predefined' ? (
                <div className="space-y-4">
                  {availableVoices.length === 0 ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-sm text-yellow-400">
                        No voices available for {language}. Please select a different language.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(voicesByGender).map(([gender, voices]) => (
                        <div key={gender} className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {gender} Voices
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {voices.map((voice) => (
                              <button
                                key={voice.value}
                                type="button"
                                onClick={() => setSelectedVoice(voice.value)}
                                onMouseEnter={() => handleVoiceHover(voice)}
                                disabled={updateAgentPrompt.isPending}
                                className={cn(
                                  "relative group p-3 rounded-lg border-2 transition-all text-left",
                                  selectedVoice === voice.value
                                    ? "border-primary bg-primary/10 shadow-md"
                                    : "border-border bg-secondary hover:border-primary/50 hover:bg-secondary/80",
                                  updateAgentPrompt.isPending && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-base">{voice.flag}</span>
                                      <span className="font-medium text-foreground truncate">{voice.label}</span>
                                      {selectedVoice === voice.value && (
                                        <Check className="w-4 h-4 text-primary shrink-0" />
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {voice.language} • {voice.gender}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePlayVoice(voice);
                                    }}
                                    onMouseEnter={(e) => {
                                      e.stopPropagation();
                                      handleVoiceHover(voice);
                                    }}
                                    disabled={updateAgentPrompt.isPending}
                                    className={cn(
                                      "w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ml-2",
                                      playingVoice === voice.value
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
                                      updateAgentPrompt.isPending && "opacity-50 cursor-not-allowed"
                                    )}
                                    title="Preview voice"
                                  >
                                    {playingVoice === voice.value ? (
                                      <Pause className="w-4 h-4" />
                                    ) : (
                                      <Play className="w-4 h-4 ml-0.5" />
                                    )}
                                  </button>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={manualVoiceId}
                    onChange={(e) => setManualVoiceId(e.target.value)}
                    disabled={updateAgentPrompt.isPending}
                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono text-sm"
                    placeholder="Enter Voice ID (e.g., pNInz6obpgDQGcFmaJgB)"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Enter a custom voice ID. You can find voice IDs in your dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>


          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              System Prompt <span className="text-destructive">*</span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => {
                setSystemPrompt(e.target.value);
                setHasCustomizedSystemPrompt(true);
              }}
              placeholder="You are a polite, empathetic AI voice agent..."
              rows={6}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
              disabled={updateAgentPrompt.isPending}
              required
            />
          </div>

          {/* Escalation Conditions */}
          <div className="border-t border-border pt-4">
            <label className="block text-sm font-medium text-foreground mb-3">
              Escalation Conditions
            </label>
            <div className="space-y-2">
              {escalationRules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => {
                      const newRules = [...escalationRules];
                      newRules[index] = e.target.value;
                      setEscalationRules(newRules);
                    }}
                    className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="e.g., user says transfer, sentiment negative, user requests human"
                    disabled={updateAgentPrompt.isPending}
                  />
                  {escalationRules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setEscalationRules(escalationRules.filter((_, i) => i !== index));
                      }}
                      className="p-2.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      disabled={updateAgentPrompt.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEscalationRules([...escalationRules, ''])}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={updateAgentPrompt.isPending}
              >
                <Plus className="w-4 h-4" />
                Add escalation condition
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Define when the AI should transfer calls to a human operator
            </p>
          </div>

          {/* Knowledge Bases */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Knowledge Bases
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowKBDropdown(!showKBDropdown)}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground flex items-center justify-between hover:bg-accent transition-colors"
                disabled={updateAgentPrompt.isPending || isLoadingKBs}
              >
                <span className="text-sm">
                  {selectedKBIds.length === 0
                    ? 'Select knowledge bases...'
                    : `${selectedKBIds.length} knowledge base${selectedKBIds.length === 1 ? '' : 's'} selected`}
                </span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', showKBDropdown && 'rotate-180')} />
              </button>

              {showKBDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isLoadingKBs ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading knowledge bases...
                    </div>
                  ) : knowledgeBases.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No knowledge bases available
                    </div>
                  ) : (
                    <div className="p-2">
                      {knowledgeBases.map((kb) => (
                        <button
                          key={kb.id}
                          type="button"
                          onClick={() => toggleKB(kb.id)}
                          className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-secondary rounded-md flex items-center gap-2 transition-colors"
                        >
                          <div
                            className={cn(
                              'w-4 h-4 border-2 rounded flex items-center justify-center',
                              selectedKBIds.includes(kb.id)
                                ? 'bg-primary border-primary'
                                : 'border-border'
                            )}
                          >
                            {selectedKBIds.includes(kb.id) && (
                              <Check className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                          <span className="flex-1 truncate">{kb.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded-lg hover:bg-accent transition-colors"
              disabled={updateAgentPrompt.isPending || syncingToElevenLabs}
            >
              Cancel
            </button>
            {(agent.tool_ids?.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={handleSyncToElevenLabs}
                className="px-4 py-2 text-sm font-medium text-foreground bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={updateAgentPrompt.isPending || syncingToElevenLabs}
                title="Enable tool execution (fixes 'Unable to execute function')"
              >
                {syncingToElevenLabs && <Loader2 className="w-4 h-4 animate-spin" />}
                Sync
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={updateAgentPrompt.isPending || syncingToElevenLabs}
            >
              {updateAgentPrompt.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
