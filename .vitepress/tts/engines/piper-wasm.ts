// Piper TTS WASM Engine — Lightweight offline fallback in browser

import type { TTSEngine, TTSRequest, TTSResult, TTSVoice } from '../types';

/**
 * Dynamically import a module by name, fully bypassing Vite static analysis.
 * This is necessary because @realtimex/piper-tts-web is an optional dependency.
 */
async function dynamicImport(name: string): Promise<any> {
  return new Function('name', 'return import(name)')(name);
}

export class PiperWASMEngine implements TTSEngine {
  readonly name = 'piper-wasm';
  readonly type = 'browser' as const;
  private session: any = null;
  private initPromise: Promise<void> | null = null;

  async isAvailable(): Promise<boolean> {
    return typeof WebAssembly !== 'undefined';
  }

  private async initialize(): Promise<void> {
    if (this.session) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const piperModule = await dynamicImport('@realtimex/piper-tts-web');
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
        throw err;
      }
    })();

    return this.initPromise;
  }

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    await this.initialize();

    const wav = await this.session.predict({
      text: req.text,
    });

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
