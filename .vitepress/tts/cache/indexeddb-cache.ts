// IndexedDB Audio Cache Manager

import type { TTSCacheEntry } from '../types';

const DB_NAME = 'tts-audio-cache';
const DB_VERSION = 1;
const STORE_NAME = 'audio';

export class TTSCache {
  private db: IDBDatabase | null = null;
  private maxSizeMB: number;

  constructor(maxSizeMB = 200) {
    this.maxSizeMB = maxSizeMB;
  }

  async open(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'hash' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('engine', 'engine');
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /** Generate SHA-256 content hash for cache key */
  async hash(text: string, voice: string, speed: number): Promise<string> {
    const data = `${text}|${voice}|${speed}`;
    const buffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(data)
    );
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32); // Use first 32 chars for shorter keys
  }

  /** Get cached audio by hash */
  async get(hash: string): Promise<TTSCacheEntry | null> {
    await this.open();
    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(hash);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  /** Store audio in cache */
  async put(
    hash: string,
    audio: Blob,
    engine: string,
    voice: string,
    speed: number
  ): Promise<void> {
    await this.open();
    await this.evictIfNeeded();

    const entry: TTSCacheEntry = {
      hash,
      audio,
      engine,
      voice,
      speed,
      timestamp: Date.now(),
      sizeBytes: audio.size,
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /** Get cache statistics */
  async getStats(): Promise<{ count: number; totalSizeMB: number }> {
    const entries = await this.getAll();
    const totalBytes = entries.reduce((sum, e) => sum + e.sizeBytes, 0);
    return {
      count: entries.length,
      totalSizeMB: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
    };
  }

  /** Clear all cached audio */
  async clear(): Promise<void> {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /** Evict oldest entries if cache exceeds max size */
  private async evictIfNeeded(): Promise<void> {
    const entries = await this.getAll();
    const totalSize = entries.reduce((sum, e) => sum + e.sizeBytes, 0);
    const maxBytes = this.maxSizeMB * 1024 * 1024;

    if (totalSize > maxBytes) {
      const sorted = entries.sort((a, b) => a.timestamp - b.timestamp);
      const toEvict = sorted.slice(0, Math.ceil(sorted.length * 0.2));

      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const entry of toEvict) {
        store.delete(entry.hash);
      }
    }
  }

  private async getAll(): Promise<TTSCacheEntry[]> {
    await this.open();
    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }
}
