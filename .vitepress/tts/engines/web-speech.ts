// Web Speech API Engine — Last resort fallback, always available

import type { TTSEngine, TTSRequest, TTSResult, TTSVoice } from '../types';

export class WebSpeechEngine implements TTSEngine {
  readonly name = 'web-speech';
  readonly type = 'browser' as const;

  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(req.text);
      utterance.lang = 'vi-VN';
      utterance.rate = req.speed || 1.0;

      // Try to find a Vietnamese voice
      const voices = speechSynthesis.getVoices();
      const viVoice = voices.find((v) => v.lang.startsWith('vi'));
      if (viVoice) {
        utterance.voice = viVoice;
      }

      utterance.onend = () => {
        // Web Speech API doesn't produce a blob — return empty marker
        resolve({
          audio: new Blob([], { type: 'audio/wav' }),
          format: 'wav',
          duration: 0,
          engine: this.name,
          cached: false,
        });
      };

      utterance.onerror = (e) => {
        reject(new Error(`Web Speech API error: ${e.error}`));
      };

      speechSynthesis.cancel(); // Cancel any ongoing speech
      speechSynthesis.speak(utterance);
    });
  }

  getVoices(): TTSVoice[] {
    if (typeof window === 'undefined') return [];

    const voices = speechSynthesis.getVoices();
    return voices
      .filter((v) => v.lang.startsWith('vi'))
      .map((v) => ({
        id: v.voiceURI,
        name: `${v.name} (System)`,
        lang: 'vi-VN' as const,
        gender: 'female' as const, // Can't reliably detect
        engine: this.name,
      }));
  }

  getEstimatedLatency(): number {
    return 50;
  }
}
