// VieNeu-TTS v3 Nano Engine — Premium Vietnamese TTS via self-hosted server

import type { TTSEngine, TTSRequest, TTSResult, TTSVoice } from '../types';

export class VieNeuEngine implements TTSEngine {
  readonly name = 'vieneu';
  readonly type = 'server' as const;
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async isAvailable(): Promise<boolean> {
    if (!navigator.onLine) return false;
    if (!this.endpoint) return false;
    try {
      const res = await fetch(`${this.endpoint}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    const response = await fetch(`${this.endpoint}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: req.text,
        voice: req.voice || 'default',
        speed: req.speed || 1.0,
        mode: 'v3nano',
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`VieNeu error: ${response.status} ${response.statusText}`);
    }

    const audio = await response.blob();
    return {
      audio,
      format: 'wav',
      duration: 0,
      engine: this.name,
      cached: false,
    };
  }

  getVoices(): TTSVoice[] {
    return [
      { id: 'default', name: 'VieNeu Default', lang: 'vi-VN', gender: 'female', engine: this.name },
      { id: 'clone', name: 'VieNeu Clone', lang: 'vi-VN', gender: 'female', engine: this.name },
    ];
  }

  getEstimatedLatency(): number {
    return 200;
  }
}
