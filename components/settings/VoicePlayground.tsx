"use client";

import { useState } from "react";
import { Play, Pause, Volume2, Check } from "lucide-react";
import { VOICE_OPTIONS, VoiceOption } from "@/services/phoneSettings.service";
import { toast } from "sonner";

interface VoicePlaygroundProps {
  selectedVoice: string;
  onVoiceSelect: (voiceValue: string) => void;
}

export function VoicePlayground({ selectedVoice, onVoiceSelect }: VoicePlaygroundProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Group voices by language and gender
  const groupedVoices = VOICE_OPTIONS.reduce((acc, voice) => {
    const key = `${voice.language}-${voice.gender}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(voice);
    return acc;
  }, {} as Record<string, VoiceOption[]>);

  const handlePlayVoice = async (voice: VoiceOption) => {
    try {
      // Stop currently playing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      // If clicking the same voice that's playing, just stop it
      if (playingVoice === voice.value || loadingVoice === voice.value) {
        setPlayingVoice(null);
        setLoadingVoice(null);
        return;
      }

      setLoadingVoice(voice.value);
      toast.info(`Loading ${voice.label}...`);

      // Sample text based on language
      const sampleTexts: Record<string, string> = {
        'Italian': "Ciao! Sono un assistente virtuale. Come posso aiutarti oggi?",
        'Spanish': "¡Hola! Soy un asistente virtual. ¿Cómo puedo ayudarte hoy?",
        'English': "Hello! I am a virtual assistant. How can I help you today?"
      };

      const sampleText = sampleTexts[voice.language] || sampleTexts['English'];

      // Call ElevenLabs API
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': 'sk_3b1731773d047b2b8fd4612df9032faf9a8588c38454e1a4'
          },
          body: JSON.stringify({
            text: sampleText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Convert response to audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);

      audio.onloadeddata = () => {
        setLoadingVoice(null);
        setPlayingVoice(voice.value);
        toast.success(`Playing ${voice.label}...`);
      };

      audio.onended = () => {
        setPlayingVoice(null);
        setLoadingVoice(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        toast.error("Failed to play voice sample");
        setPlayingVoice(null);
        setLoadingVoice(null);
        URL.revokeObjectURL(audioUrl);
      };

      setAudioElement(audio);
      await audio.play();

    } catch (error: any) {
      console.error('Voice playback error:', error);
      toast.error(error.message || "Failed to play voice sample");
      setPlayingVoice(null);
      setLoadingVoice(null);
    }
  };

  const renderVoiceGroup = (language: string, gender: string) => {
    const key = `${language}-${gender}`;
    const voices = groupedVoices[key] || [];

    if (voices.length === 0) return null;

    return (
      <div key={key} className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>{voices[0].flag}</span>
          <span>{language.toUpperCase()} — {gender.toUpperCase()}</span>
          <span className="text-xs text-muted-foreground font-normal">({voices.length} voices)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {voices.map((voice) => (
            <button
              key={voice.value}
              onClick={() => onVoiceSelect(voice.value)}
              className={`relative group p-4 rounded-lg border-2 transition-all text-left ${selectedVoice === voice.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary hover:border-primary/50 hover:bg-secondary/80"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{voice.flag}</span>
                    <span className="font-medium text-foreground">{voice.label}</span>
                    {selectedVoice === voice.value && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {voice.language} • {voice.gender}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayVoice(voice);
                  }}
                  disabled={loadingVoice === voice.value}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${playingVoice === voice.value
                      ? "bg-primary text-primary-foreground"
                      : loadingVoice === voice.value
                        ? "bg-primary/50 text-primary-foreground cursor-wait"
                        : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                    }`}
                  title={loadingVoice === voice.value ? "Loading..." : "Preview voice"}
                >
                  {loadingVoice === voice.value ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : playingVoice === voice.value ? (
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Volume2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Voice Playground</h2>
          <p className="text-sm text-muted-foreground">
            Select and preview voices for your AI agent
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-blue-400 mt-0.5">💡</div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-400 mb-1">How to use</h4>
            <p className="text-xs text-muted-foreground">
              Click on a voice card to select it, then click the <strong>play button (▶️)</strong> to hear a live preview.
              Each voice speaks in its native language. The selected voice will be used for all voice calls.
            </p>
          </div>
        </div>
      </div>

      {/* Voice Groups */}
      <div className="space-y-6">
        {renderVoiceGroup('Italian', 'Male')}
        {renderVoiceGroup('Italian', 'Female')}
        {renderVoiceGroup('Spanish', 'Male')}
        {renderVoiceGroup('Spanish', 'Female')}
        {renderVoiceGroup('English', 'Female')}
        {renderVoiceGroup('English', 'Male')}
      </div>

      {/* Selected Voice Info */}
      {selectedVoice && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">Selected Voice:</span>
            <span className="text-foreground">
              {VOICE_OPTIONS.find(v => v.value === selectedVoice)?.label}
            </span>
            <span className="text-muted-foreground">
              ({VOICE_OPTIONS.find(v => v.value === selectedVoice)?.language} • {VOICE_OPTIONS.find(v => v.value === selectedVoice)?.gender})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

