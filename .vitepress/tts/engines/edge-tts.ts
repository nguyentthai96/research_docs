// Edge-TTS Engine — Primary cloud-based TTS via Microsoft Neural Voices

import type { TTSEngine, TTSRequest, TTSResult, TTSVoice } from '../types';

export class EdgeTTSEngine implements TTSEngine {
  readonly name = 'edge-tts';
  readonly type = 'cloud' as const;
  private proxyUrl: string;

  constructor(proxyUrl: string) {
    this.proxyUrl = proxyUrl;
  }

  async isAvailable(): Promise<boolean> {
    if (!navigator.onLine) return false;
    if (!this.proxyUrl) return false;
    try {
      const res = await fetch(`${this.proxyUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    const voice = req.voice || 'vi-VN-HoaiMyNeural';
    const rate = req.speed ? `${Math.round((req.speed - 1) * 100)}%` : '+0%';

    const response = await fetch(`${this.proxyUrl}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: req.text,
        voice,
        rate: rate.startsWith('-') || rate.startsWith('+') ? rate : `+${rate}`,
        ssml: req.ssml || false,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`edge-tts proxy error: ${response.status} ${response.statusText}`);
    }

    const audio = await response.blob();
    return {
      audio,
      format: 'mp3',
      duration: 0,
      engine: this.name,
      cached: false,
    };
  }

  getVoices(): TTSVoice[] {
    return [
      { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My (Nữ)', lang: 'vi-VN', gender: 'female', engine: this.name },
      { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh (Nam)', lang: 'vi-VN', gender: 'male', engine: this.name },
    ];
  }

  getEstimatedLatency(): number {
    return 150;
  }
}
