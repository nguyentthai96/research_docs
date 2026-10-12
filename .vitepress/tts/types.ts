// TTS Engine Types & Interfaces

export interface TTSEngine {
  readonly name: string;
  readonly type: 'cloud' | 'browser' | 'server';
  
  isAvailable(): Promise<boolean>;
  synthesize(request: TTSRequest): Promise<TTSResult>;
  getVoices(): TTSVoice[];
  getEstimatedLatency(): number;
}

export interface TTSRequest {
  text: string;
  voice?: string;
  speed?: number;
  format?: 'mp3' | 'wav';
  ssml?: boolean;
}

export interface TTSResult {
  audio: Blob;
  format: 'mp3' | 'wav';
  duration: number;
  engine: string;
  cached: boolean;
}

export interface TTSVoice {
  id: string;
  name: string;
  lang: 'vi-VN' | 'en-US';
  gender: 'female' | 'male';
  engine: string;
}

export type QualityPreference = 'fast' | 'balanced' | 'premium';

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface TTSConfig {
  quality: QualityPreference;
  enableVieNeu: boolean;
  vieneuEndpoint?: string;
  edgeTtsProxy: string;
  enablePreload: boolean;
  cacheMaxSizeMB: number;
  defaultSpeed: number;
  defaultVoice?: string;
}

export interface TextSegment {
  type: 'heading' | 'paragraph';
  level?: number;
  text: string;
  element: HTMLElement;
}

export interface TTSCacheEntry {
  hash: string;
  audio: Blob;
  engine: string;
  voice: string;
  speed: number;
  timestamp: number;
  sizeBytes: number;
}

export const DEFAULT_CONFIG: TTSConfig = {
  quality: 'balanced',
  enableVieNeu: false,
  edgeTtsProxy: '',
  enablePreload: true,
  cacheMaxSizeMB: 200,
  defaultSpeed: 1.0,
};
