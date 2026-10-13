// Piper TTS WASM Engine — Lightweight offline fallback in browser

import type { TTSEngine, TTSRequest, TTSResult, TTSVoice } from '../types';

export class PiperWASMEngine implements TTSEngine {
  readonly name = 'piper-wasm';
  readonly type = 'browser' as const;
  private session: any = null;
  private initPromise: Promise<void> | null = null;
  private initFailed = false;

  async isAvailable(): Promise<boolean> {
    if (this.initFailed) return false;
    return typeof WebAssembly !== 'undefined';
  }

  private async initialize(): Promise<void> {
    if (this.session) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Vite code-splits this import — only loaded when engine is actually used
        const piperModule = await import('@realtimex/piper-tts-web');
        const TtsSession = piperModule.TtsSession || piperModule.default?.TtsSession;

        if (!TtsSession) {
          throw new Error('TtsSession not found in @realtimex/piper-tts-web');
        }

        this.session = new TtsSession({
          voiceId: 'vi_VN-vais1000-medium',
          allowLocalModels: true,
        });

        console.log('[piper-wasm] Session initialized');
      } catch (err) {
        this.initPromise = null;
        this.initFailed = true;
        console.warn('[piper-wasm] Init failed, marking engine unavailable:', (err as Error).message);
        throw err;
      }
    })();

    return this.initPromise;
  }

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    await this.initialize();

    // piper-tts-web predict() expects a plain string, not an object
    const text = String(req.text || '');
    const wav = await this.session.predict(text);

    const blob = wav instanceof Blob
      ? wav
      : new Blob([wav], { type: 'audio/wav' });

    return {
      audio: blob,
      format: 'wav',
      duration: 0,
      engine: this.name,
      cached: false,
    };
  }

  getVoices(): TTSVoice[] {
    return [
      {
        id: 'vi_VN-vais1000-medium',
        name: 'VAIS1000 (Offline)',
        lang: 'vi-VN',
        gender: 'female',
        engine: this.name,
      },
    ];
  }

  getEstimatedLatency(): number {
    return 1500;
  }
}
