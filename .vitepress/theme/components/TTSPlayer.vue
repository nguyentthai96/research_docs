<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useData } from 'vitepress';
import { EngineRouter } from '../../tts/engine-router';
import { TTSCache } from '../../tts/cache/indexeddb-cache';
import { EdgeTTSEngine } from '../../tts/engines/edge-tts';
import { KokoroJSEngine } from '../../tts/engines/kokoro-js';
import { PiperWASMEngine } from '../../tts/engines/piper-wasm';
import { VieNeuEngine } from '../../tts/engines/vieneu';

import { extractReadableText, mergeShortSegments, segmentsToFullText } from '../../tts/preprocessing/text-extractor';
import { expandAbbreviations } from '../../tts/preprocessing/tech-dictionary';
import { handleBilingualText } from '../../tts/preprocessing/bilingual-handler';
import { normalizeVietnamese } from '../../tts/preprocessing/normalizer';
import { injectSSML, toPlainTextWithPauses } from '../../tts/preprocessing/ssml-injector';
import type { PlaybackState, TTSVoice, TextSegment } from '../../tts/types';

// === State ===
const state = ref<PlaybackState>('idle');
const currentEngine = ref('');
const error = ref('');
const speed = ref(1.0);
const selectedVoice = ref('');
const showSettings = ref(false);
const currentSegmentIndex = ref(-1);
const totalSegments = ref(0);
const cacheStats = ref({ count: 0, totalSizeMB: 0 });

// === VitePress ===
const { page } = useData();

// === Init engines ===
const cache = new TTSCache(200);
const router = new EngineRouter({
  quality: 'balanced',
  enableVieNeu: false,
  edgeTtsProxy: import.meta.env.VITE_EDGE_TTS_PROXY || '',
  enablePreload: true,
  cacheMaxSizeMB: 200,
  defaultSpeed: 1.0,
});

// Audio element
let audioElement: HTMLAudioElement | null = null;
let segments: TextSegment[] = [];

onMounted(async () => {
  // Register engines
  const edgeProxy = import.meta.env.VITE_EDGE_TTS_PROXY;
  if (edgeProxy) {
    router.register(new EdgeTTSEngine(edgeProxy));
  }

  const vieneuEndpoint = import.meta.env.VITE_VIENEU_ENDPOINT;
  if (vieneuEndpoint) {
    router.register(new VieNeuEngine(vieneuEndpoint));
  }

  router.register(new KokoroJSEngine());
  router.register(new PiperWASMEngine());
  // WebSpeechEngine removed — voice quality too low for Vietnamese

  // Set default voice
  const voices = router.getAllVoices();
  if (voices.length > 0 && !selectedVoice.value) {
    selectedVoice.value = voices[0].id;
  }

  // Load cache stats
  try {
    cacheStats.value = await cache.getStats();
  } catch {}
});

onUnmounted(() => {
  stop();
});

// Reset when page changes
watch(() => page.value.relativePath, () => {
  stop();
  segments = [];
  currentSegmentIndex.value = -1;
});

// === Available voices ===
const availableVoices = computed(() => router.getAllVoices());

// When voice changes during playback, restart current segment with new voice
watch(selectedVoice, (newVoice, oldVoice) => {
  if (!newVoice || newVoice === oldVoice) return;
  if (state.value === 'playing' || state.value === 'paused' || state.value === 'loading') {
    // Stop current audio
    if (audioElement) {
      audioElement.pause();
      URL.revokeObjectURL(audioElement.src);
      audioElement = null;
    }
    // Re-read current segment with new voice
    const idx = currentSegmentIndex.value;
    if (idx >= 0 && segments.length > 0) {
      readSegment(idx);
    }
  }
});

// === Progress ===
const progress = computed(() => {
  if (totalSegments.value === 0) return 0;
  return Math.round(((currentSegmentIndex.value + 1) / totalSegments.value) * 100);
});

const progressLabel = computed(() => {
  if (state.value === 'idle') return 'Nhấn Play để đọc bài viết';
  if (state.value === 'loading') return 'Đang chuẩn bị...';
  if (state.value === 'error') return error.value;
  if (totalSegments.value === 0) return '';
  return `${currentSegmentIndex.value + 1} / ${totalSegments.value} đoạn`;
});

const engineBadge = computed(() => {
  const badges: Record<string, { label: string; color: string }> = {
    'edge-tts':   { label: '☁️ Edge TTS',    color: '#0078d4' },
    'vieneu':     { label: '🏆 VieNeu',      color: '#e91e63' },
    'kokoro-js':  { label: '🎙️ Kokoro',     color: '#ff9800' },
    'piper-wasm': { label: '🛡️ Piper',      color: '#4caf50' },

  };
  return badges[currentEngine.value] || { label: '', color: 'transparent' };
});

// === Actions ===
async function play() {
  if (state.value === 'paused' && audioElement) {
    audioElement.play();
    state.value = 'playing';
    return;
  }

  state.value = 'loading';
  error.value = '';

  try {
    // 1. Extract text from page
    const contentEl = document.querySelector('.vp-doc') as HTMLElement;
    if (!contentEl) throw new Error('Không tìm thấy nội dung bài viết');

    segments = extractReadableText(contentEl);
    segments = mergeShortSegments(segments);
    totalSegments.value = segments.length;

    if (segments.length === 0) throw new Error('Không có nội dung để đọc');

    // 2. Start reading from current segment
    currentSegmentIndex.value = Math.max(0, currentSegmentIndex.value);
    await readSegment(currentSegmentIndex.value);
  } catch (err) {
    state.value = 'error';
    error.value = (err as Error).message;
    console.error('[TTS] Error:', err);
  }
}

async function readSegment(index: number) {
  if (index >= segments.length) {
    state.value = 'idle';
    currentSegmentIndex.value = -1;
    return;
  }

  currentSegmentIndex.value = index;
  state.value = 'loading';

  // Highlight current segment
  highlightSegment(index);

  const seg = segments[index];

  // 3. Preprocessing pipeline
  let processedText = seg.text;
  processedText = expandAbbreviations(processedText);   // API → ây-pê-ai
  processedText = handleBilingualText(processedText);    // Throughput → thru-pút
  processedText = normalizeVietnamese(processedText);    // 100 → một trăm

  // 4. Check cache
  const voice = selectedVoice.value || 'vi-VN-HoaiMyNeural';
  const cacheKey = await cache.hash(processedText, voice, speed.value);
  const cached = await cache.get(cacheKey);

  if (cached && cached.audio.size > 0) {
    currentEngine.value = cached.engine + ' (cached)';
    await playAudio(cached.audio, index);
    return;
  }

  // 5. Synthesize
  try {
    // Use SSML for edge-tts, plain text for others
    const segmentForSSML = [{ ...seg, text: processedText }];
    const ssmlText = injectSSML(segmentForSSML as TextSegment[], voice);
    const plainText = processedText;

    // Try with plain text first (works for all engines)
    // SSML is only used when edge-tts is selected and supports it
    const result = await router.synthesize({
      text: plainText,
      voice,
      speed: speed.value,
      ssml: false,
    });

    currentEngine.value = (result as any).selectedEngine || result.engine;

    // 6. Cache the result
    if (result.audio.size > 0) {
      await cache.put(cacheKey, result.audio, result.engine, voice, speed.value);
      cacheStats.value = await cache.getStats();
    }

    // 7. Play
    await playAudio(result.audio, index);
  } catch (err) {
    // If this segment fails, try next
    console.warn(`[TTS] Segment ${index} failed, skipping:`, err);
    await readSegment(index + 1);
  }
}

function playAudio(blob: Blob, segmentIndex: number): Promise<void> {
  return new Promise((resolve) => {
    if (blob.size === 0) {
      // Skip empty audio
      unhighlightSegment(segmentIndex);
      resolve();
      readSegment(segmentIndex + 1);
      return;
    }

    if (audioElement) {
      audioElement.pause();
      URL.revokeObjectURL(audioElement.src);
    }

    audioElement = new Audio(URL.createObjectURL(blob));
    audioElement.playbackRate = speed.value;

    audioElement.onplay = () => {
      state.value = 'playing';
    };

    audioElement.onended = () => {
      unhighlightSegment(segmentIndex);
      resolve();
      readSegment(segmentIndex + 1);
    };

    audioElement.onerror = () => {
      unhighlightSegment(segmentIndex);
      resolve();
      readSegment(segmentIndex + 1);
    };

    audioElement.play().catch(() => {
      resolve();
      readSegment(segmentIndex + 1);
    });
  });
}

function pause() {
  if (audioElement && state.value === 'playing') {
    audioElement.pause();
    state.value = 'paused';
  }

}

function stop() {
  if (audioElement) {
    audioElement.pause();
    URL.revokeObjectURL(audioElement.src);
    audioElement = null;
  }

  unhighlightAll();
  state.value = 'idle';
  currentSegmentIndex.value = -1;
}

function skipForward() {
  if (currentSegmentIndex.value < totalSegments.value - 1) {
    if (audioElement) {
      audioElement.pause();
      URL.revokeObjectURL(audioElement.src);
      audioElement = null;
    }

    readSegment(currentSegmentIndex.value + 1);
  }
}

function skipBackward() {
  if (currentSegmentIndex.value > 0) {
    if (audioElement) {
      audioElement.pause();
      URL.revokeObjectURL(audioElement.src);
      audioElement = null;
    }

    readSegment(currentSegmentIndex.value - 1);
  }
}

function setSpeed(newSpeed: number) {
  speed.value = newSpeed;
  if (audioElement) {
    audioElement.playbackRate = newSpeed;
  }
}

async function clearCache() {
  await cache.clear();
  cacheStats.value = { count: 0, totalSizeMB: 0 };
}

// === Highlight ===
function highlightSegment(index: number) {
  if (segments[index]?.element) {
    segments[index].element.classList.add('tts-reading');
    segments[index].element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function unhighlightSegment(index: number) {
  if (segments[index]?.element) {
    segments[index].element.classList.remove('tts-reading');
  }
}

function unhighlightAll() {
  document.querySelectorAll('.tts-reading').forEach((el) => {
    el.classList.remove('tts-reading');
  });
}

// === Keyboard shortcuts ===
function handleKeydown(e: KeyboardEvent) {
  // Only handle when not in input/textarea
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      if (state.value === 'playing') pause();
      else play();
      break;
    case 'ArrowRight':
      if (state.value === 'playing' || state.value === 'paused') {
        e.preventDefault();
        skipForward();
      }
      break;
    case 'ArrowLeft':
      if (state.value === 'playing' || state.value === 'paused') {
        e.preventDefault();
        skipBackward();
      }
      break;
    case 'Escape':
      stop();
      break;
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
</script>

<template>
  <div class="tts-player" :class="{ 'tts-playing': state === 'playing' }">
    <!-- Main Controls -->
    <div class="tts-controls">
      <!-- Play/Pause/Stop -->
      <div class="tts-buttons">
        <button
          v-if="state === 'idle' || state === 'error'"
          class="tts-btn tts-btn-play"
          @click="play"
          title="Đọc bài viết (Space)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>

        <button
          v-else-if="state === 'playing'"
          class="tts-btn tts-btn-pause"
          @click="pause"
          title="Tạm dừng (Space)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        </button>

        <button
          v-else-if="state === 'paused'"
          class="tts-btn tts-btn-play"
          @click="play"
          title="Tiếp tục (Space)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>

        <button
          v-else-if="state === 'loading'"
          class="tts-btn tts-btn-loading"
          disabled
        >
          <svg class="tts-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
          </svg>
        </button>

        <button
          v-if="state !== 'idle'"
          class="tts-btn tts-btn-stop"
          @click="stop"
          title="Dừng (Esc)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1"/>
          </svg>
        </button>

        <!-- Skip buttons -->
        <button
          v-if="state === 'playing' || state === 'paused'"
          class="tts-btn tts-btn-skip"
          @click="skipBackward"
          title="Đoạn trước (←)"
          :disabled="currentSegmentIndex <= 0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>

        <button
          v-if="state === 'playing' || state === 'paused'"
          class="tts-btn tts-btn-skip"
          @click="skipForward"
          title="Đoạn sau (→)"
          :disabled="currentSegmentIndex >= totalSegments - 1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zm2 0h2V6h-2v12z" transform="scale(-1,1) translate(-24,0)"/>
            <path d="M16 6h2v12h-2z"/>
            <path d="M6 18l8.5-6L6 6z"/>
          </svg>
        </button>
      </div>

      <!-- Progress & Status -->
      <div class="tts-info">
        <div class="tts-progress-bar" v-if="state !== 'idle'">
          <div class="tts-progress-fill" :style="{ width: progress + '%' }"/>
        </div>
        <span class="tts-label">{{ progressLabel }}</span>
        <span
          v-if="currentEngine"
          class="tts-engine-badge"
          :style="{ backgroundColor: engineBadge.color }"
        >
          {{ engineBadge.label }}
        </span>
      </div>

      <!-- Speed & Settings -->
      <div class="tts-extra">
        <select
          class="tts-speed"
          :value="speed"
          @change="setSpeed(parseFloat(($event.target as HTMLSelectElement).value))"
          title="Tốc độ đọc"
        >
          <option v-for="s in SPEED_OPTIONS" :key="s" :value="s">
            {{ s }}x
          </option>
        </select>

        <button class="tts-btn tts-btn-settings" @click="showSettings = !showSettings" title="Cài đặt">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Settings Panel -->
    <div v-if="showSettings" class="tts-settings">
      <div class="tts-setting-row">
        <label>Giọng đọc</label>
        <select v-model="selectedVoice" class="tts-select">
          <option v-for="v in availableVoices" :key="v.id" :value="v.id">
            {{ v.name }} ({{ v.engine }})
          </option>
        </select>
      </div>
      <div class="tts-setting-row">
        <label>Cache</label>
        <span class="tts-cache-info">
          {{ cacheStats.count }} mục · {{ cacheStats.totalSizeMB }} MB
        </span>
        <button class="tts-btn-link" @click="clearCache">Xóa cache</button>
      </div>
      <div class="tts-setting-row tts-shortcuts">
        <label>Phím tắt</label>
        <div>
          <kbd>Space</kbd> Play/Pause · 
          <kbd>←</kbd><kbd>→</kbd> Skip · 
          <kbd>Esc</kbd> Stop
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tts-player {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--vp-c-bg-soft);
  border-top: 1px solid var(--vp-c-divider);
  padding: 10px 20px;
  backdrop-filter: blur(12px);
  transition: all 0.3s ease;
}

.tts-player.tts-playing {
  border-top-color: var(--vp-c-brand-1);
  box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.08);
}

.tts-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 900px;
  margin: 0 auto;
}

.tts-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.tts-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--vp-c-text-1);
  background: transparent;
}

.tts-btn:hover:not(:disabled) {
  background: var(--vp-c-default-soft);
}

.tts-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tts-btn-play {
  background: var(--vp-c-brand-1);
  color: white;
  border-radius: 50%;
}

.tts-btn-play:hover {
  background: var(--vp-c-brand-2) !important;
  transform: scale(1.05);
}

.tts-btn-pause {
  background: var(--vp-c-brand-1);
  color: white;
  border-radius: 50%;
}

.tts-btn-loading {
  cursor: wait;
}

.tts-spinner {
  animation: tts-spin 1s linear infinite;
}

@keyframes tts-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.tts-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tts-progress-bar {
  flex: 1;
  height: 4px;
  background: var(--vp-c-default-soft);
  border-radius: 2px;
  overflow: hidden;
}

.tts-progress-fill {
  height: 100%;
  background: var(--vp-c-brand-1);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.tts-label {
  font-size: 12px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.tts-engine-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  color: white;
  white-space: nowrap;
  font-weight: 500;
}

.tts-extra {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.tts-speed {
  appearance: none;
  -webkit-appearance: none;
  background: var(--vp-c-default-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--vp-c-text-1);
  cursor: pointer;
}

.tts-settings {
  max-width: 900px;
  margin: 10px auto 0;
  padding: 12px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.tts-setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 13px;
}

.tts-setting-row label {
  font-weight: 600;
  min-width: 80px;
  color: var(--vp-c-text-1);
}

.tts-select {
  flex: 1;
  appearance: none;
  background: var(--vp-c-default-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--vp-c-text-1);
}

.tts-cache-info {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.tts-btn-link {
  background: none;
  border: none;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}

.tts-btn-link:hover {
  text-decoration: underline;
}

.tts-shortcuts {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.tts-shortcuts kbd {
  background: var(--vp-c-default-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 11px;
  font-family: var(--vp-font-family-mono);
}

/* Mobile */
@media (max-width: 640px) {
  .tts-controls {
    flex-wrap: wrap;
  }
  .tts-info {
    order: 3;
    flex-basis: 100%;
  }
}
</style>
