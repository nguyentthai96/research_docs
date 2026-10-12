// Kokoro-JS Engine — Client-side TTS via WebGPU/WASM with 14 Vietnamese voices

import type { TTSEngine, TTSRequest, TTSResult, TTSVoice } from '../types';

/**
 * Dynamically import a module by name, fully bypassing Vite static analysis.
 * This is necessary because kokoro-js is an optional dependency.
 */
async function dynamicImport(name: string): Promise<any> {
  return new Function('name', 'return import(name)')(name);
}

export class KokoroJSEngine implements TTSEngine {
  readonly name = 'kokoro-js';
  readonly type = 'browser' as const;
  private tts: any = null;
  private initializing = false;
  private initPromise: Promise<void> | null = null;

  async isAvailable(): Promise<boolean> {
    // Needs WebGPU (fast) or at least WASM (slower)
    const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
    const hasWASM = typeof WebAssembly !== 'undefined';
    return hasWebGPU || hasWASM;
  }

  private async initialize(): Promise<void> {
    if (this.tts) return;
    if (this.initPromise) return this.initPromise;

    this.initializing = true;
    this.initPromise = (async () => {
      try {
        const mod = await dynamicImport('kokoro-js');
        const KokoroTTS = mod.KokoroTTS || mod.default?.KokoroTTS;

        if (!KokoroTTS) {
          throw new Error('KokoroTTS not found in kokoro-js module');
        }

        const device = (navigator as any).gpu ? 'webgpu' : 'wasm';
        const dtype = device === 'webgpu' ? 'fp32' : 'q8';

        console.log(`[kokoro-js] Initializing with device=${device}, dtype=${dtype}`);

        this.tts = await KokoroTTS.from_pretrained(
          'onnx-community/Kokoro-82M-v1.0-ONNX',
          { dtype, device }
        );

        console.log('[kokoro-js] Model loaded successfully');
      } catch (err) {
        this.initPromise = null;
        throw err;
      } finally {
        this.initializing = false;
      }
    })();

    return this.initPromise;
  }

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    await this.initialize();

    const voice = req.voice || 'af_heart';
    const audio = await this.tts.generate(req.text, { voice });

    // Convert to WAV blob
    const wavBlob = audioToWavBlob(audio);

    return {
      audio: wavBlob,
      format: 'wav',
      duration: audio.audio.length / audio.sampling_rate,
      engine: this.name,
      cached: false,
    };
  }

  getVoices(): TTSVoice[] {
    return [
      { id: 'af_heart', name: 'Heart (Default)', lang: 'vi-VN', gender: 'female', engine: this.name },
      { id: 'af_bella', name: 'Bella', lang: 'vi-VN', gender: 'female', engine: this.name },
      { id: 'af_sarah', name: 'Sarah', lang: 'vi-VN', gender: 'female', engine: this.name },
      { id: 'am_adam', name: 'Adam', lang: 'vi-VN', gender: 'male', engine: this.name },
      { id: 'am_michael', name: 'Michael', lang: 'vi-VN', gender: 'male', engine: this.name },
      // Vietnamese-specific voices (when using kokoro-vi model)
      { id: 'diem_trinh', name: 'Diễm Trinh', lang: 'vi-VN', gender: 'female', engine: this.name },
      { id: 'hung_thinh', name: 'Hưng Thịnh', lang: 'vi-VN', gender: 'male', engine: this.name },
      { id: 'mai_linh', name: 'Mai Linh', lang: 'vi-VN', gender: 'female', engine: this.name },
      { id: 'manh_dung', name: 'Mạnh Dũng', lang: 'vi-VN', gender: 'male', engine: this.name },
      { id: 'my_yen', name: 'Mỹ Yến', lang: 'vi-VN', gender: 'female', engine: this.name },
    ];
  }

  getEstimatedLatency(): number {
    const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
    return hasWebGPU ? 500 : 2000;
  }
}

/**
 * Convert kokoro-js audio output to WAV blob.
 */
function audioToWavBlob(audioOutput: any): Blob {
  const samples = audioOutput.audio;
  const sampleRate = audioOutput.sampling_rate || 24000;
  const numChannels = 1;
  const bitsPerSample = 16;

  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);  // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write samples
  const offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
