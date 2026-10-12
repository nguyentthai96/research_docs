// Smart Engine Router — Selects optimal TTS engine based on context

import type { TTSEngine, TTSRequest, TTSResult, TTSConfig, QualityPreference } from './types';

interface EngineEntry {
  engine: TTSEngine;
  score: number;
}

/**
 * Smart Engine Router — automatically selects the best TTS engine
 * based on 5 factors: network, device capability, cache, quality preference, content type.
 */
export class EngineRouter {
  private engines: TTSEngine[] = [];
  private config: TTSConfig;

  constructor(config: TTSConfig) {
    this.config = config;
  }

  /** Register an engine */
  register(engine: TTSEngine): void {
    this.engines.push(engine);
  }

  /** Get all registered engines */
  getEngines(): TTSEngine[] {
    return [...this.engines];
  }

  /** Get all available voices across all engines */
  getAllVoices() {
    return this.engines.flatMap((e) => e.getVoices());
  }

  /**
   * Select the best engine for current context.
   * Returns engines sorted by score (best first).
   */
  async selectEngine(): Promise<EngineEntry[]> {
    const scored: EngineEntry[] = [];

    for (const engine of this.engines) {
      const available = await engine.isAvailable();
      if (!available) continue;

      const score = await this.scoreEngine(engine);
      scored.push({ engine, score });
    }

    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Synthesize with automatic engine selection and fallback.
   * Tries engines in order of score, falls back on failure.
   */
  async synthesize(request: TTSRequest): Promise<TTSResult & { selectedEngine: string }> {
    const ranked = await this.selectEngine();

    if (ranked.length === 0) {
      throw new Error('No TTS engine available. Please check your connection or wait for models to load.');
    }

    let lastError: Error | null = null;

    for (const { engine } of ranked) {
      try {
        console.log(`[TTS Router] Trying engine: ${engine.name} (type: ${engine.type})`);
        const result = await engine.synthesize(request);
        console.log(`[TTS Router] Success with: ${engine.name}`);
        return { ...result, selectedEngine: engine.name };
      } catch (err) {
        lastError = err as Error;
        console.warn(`[TTS Router] Engine ${engine.name} failed:`, err);
        continue;
      }
    }

    throw lastError || new Error('All TTS engines failed');
  }

  /**
   * Score an engine (0-100) based on 5 factors.
   */
  private async scoreEngine(engine: TTSEngine): Promise<number> {
    let score = 0;
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
    const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;

    // Factor 1: Network alignment (30 points)
    if (engine.type === 'cloud') {
      score += isOnline ? 30 : 0;
    } else if (engine.type === 'server') {
      score += isOnline ? 25 : 0;
    }

    // Factor 2: Device capability (25 points)
    if (engine.name === 'kokoro-js') {
      score += hasWebGPU ? 25 : 10; // Much better with WebGPU
    } else if (engine.name === 'piper-wasm') {
      score += 15; // Always decent on any device
    } else if (engine.type === 'cloud') {
      score += 20; // Cloud doesn't depend on device
    }

    // Factor 3: Quality preference (25 points)
    score += this.qualityBonus(engine.name, this.config.quality);

    // Factor 4: Latency (15 points)
    const latency = engine.getEstimatedLatency();
    if (latency < 200) score += 15;
    else if (latency < 500) score += 12;
    else if (latency < 1500) score += 8;
    else if (latency < 3000) score += 4;

    // Factor 5: Voices diversity (5 points)
    const voiceCount = engine.getVoices().length;
    score += Math.min(voiceCount, 5);

    return Math.min(score, 100);
  }

  private qualityBonus(engineName: string, pref: QualityPreference): number {
    const matrix: Record<string, Record<QualityPreference, number>> = {
      'edge-tts':    { fast: 25, balanced: 22, premium: 15 },
      'vieneu':      { fast: 10, balanced: 18, premium: 25 },
      'kokoro-js':   { fast: 8,  balanced: 15, premium: 20 },
      'piper-wasm':  { fast: 15, balanced: 10, premium: 5  },
    };
    return matrix[engineName]?.[pref] ?? 10;
  }
}
