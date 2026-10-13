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
const isMinimized = ref(false);
const audioCurrentTime = ref(0);
const audioDuration = ref(0);

// === VitePress ===
const { page, isDark } = useData();

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
let preloadedAudio: Map<number, Blob> = new Map();
let animationFrameId: number | null = null;

onMounted(async () => {
  // Register engines — order matters (first registered = higher priority when same score)
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
  // WebSpeech removed — audio quality too poor for production use

  // Set default voice
  const voices = router.getAllVoices();
  if (voices.length > 0 && !selectedVoice.value) {
    selectedVoice.value = voices[0].id;
  }

  // Load cache stats
  try {
    cacheStats.value = await cache.getStats();
  } catch {}

  // Register keyboard shortcuts
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  stop();
  document.removeEventListener('keydown', handleKeydown);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});

// Reset when page changes
watch(() => page.value.relativePath, () => {
  stop();
  segments = [];
  preloadedAudio.clear();
  currentSegmentIndex.value = -1;
});

// === Available voices ===
const availableVoices = computed(() => router.getAllVoices());

// When voice changes during playback, restart current segment with new voice
watch(selectedVoice, (newVoice, oldVoice) => {
  if (!newVoice || newVoice === oldVoice) return;
  if (state.value === 'playing' || state.value === 'paused' || state.value === 'loading') {
    if (audioElement) {
      audioElement.pause();
      URL.revokeObjectURL(audioElement.src);
      audioElement = null;
    }
    preloadedAudio.clear(); // Clear preloaded since voice changed
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
  if (state.value === 'idle') return '🔊 Nhấn Play để nghe bài viết';
  if (state.value === 'loading') return '⏳ Đang chuẩn bị...';
  if (state.value === 'error') return `❌ ${error.value}`;
  if (totalSegments.value === 0) return '';
  return `📖 ${currentSegmentIndex.value + 1} / ${totalSegments.value} đoạn`;
});

const engineBadge = computed(() => {
  const badges: Record<string, { label: string; color: string; glow: string }> = {
    'edge-tts':    { label: '☁️ Edge TTS',    color: '#0078d4', glow: 'rgba(0,120,212,0.3)' },
    'vieneu':      { label: '🏆 VieNeu',      color: '#e91e63', glow: 'rgba(233,30,99,0.3)' },
    'kokoro-js':   { label: '🎙️ Kokoro',     color: '#ff9800', glow: 'rgba(255,152,0,0.3)' },
    'piper-wasm':  { label: '🛡️ Piper',      color: '#4caf50', glow: 'rgba(76,175,80,0.3)' },

  };
  const key = currentEngine.value.replace(' (cached)', '');
  return badges[key] || { label: '', color: 'transparent', glow: 'transparent' };
});

// Estimated reading time
const estimatedTime = computed(() => {
  if (totalSegments.value === 0) return '';
  const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0);
  const charsPerMin = 250 * speed.value; // ~250 chars/min for Vietnamese
  const mins = Math.ceil(totalChars / charsPerMin);
  return `~${mins} phút`;
});

// === Actions ===
async function play() {
  if (state.value === 'paused' && audioElement) {
    audioElement.play();
    state.value = 'playing';
    startAudioProgress();
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

async function preprocessText(text: string): Promise<string> {
  let processedText = text;
  processedText = expandAbbreviations(processedText);
  processedText = handleBilingualText(processedText);
  processedText = normalizeVietnamese(processedText);
  return processedText;
}

// Preload next segment in background for gapless playback
async function preloadNextSegment(currentIndex: number) {
  const nextIndex = currentIndex + 1;
  if (nextIndex >= segments.length || preloadedAudio.has(nextIndex)) return;

  try {
    const seg = segments[nextIndex];
    const processedText = await preprocessText(seg.text);
    const voice = selectedVoice.value || 'vi-VN-HoaiMyNeural';
    const cacheKey = await cache.hash(processedText, voice, speed.value);
    const cached = await cache.get(cacheKey);

    if (cached && cached.audio.size > 0) {
      preloadedAudio.set(nextIndex, cached.audio);
      return;
    }

    const result = await router.synthesize({
      text: processedText,
      voice,
      speed: speed.value,
      ssml: false,
    });

    if (result.audio.size > 0) {
      preloadedAudio.set(nextIndex, result.audio);
      await cache.put(cacheKey, result.audio, result.engine, voice, speed.value);
    }
  } catch {
    // Preload failure is non-critical
  }
}

async function readSegment(index: number) {
  if (index >= segments.length) {
    state.value = 'idle';
    currentSegmentIndex.value = -1;
    stopAudioProgress();
    return;
  }

  currentSegmentIndex.value = index;
  state.value = 'loading';

  // Highlight current segment
  highlightSegment(index);

  const seg = segments[index];

  // 3. Preprocessing pipeline
  const processedText = await preprocessText(seg.text);

  // 4. Check preloaded audio first, then cache
  const voice = selectedVoice.value || 'vi-VN-HoaiMyNeural';
  
  const preloaded = preloadedAudio.get(index);
  if (preloaded && preloaded.size > 0) {
    preloadedAudio.delete(index);
    currentEngine.value = 'edge-tts (preloaded)';
    preloadNextSegment(index); // Start preloading next
    await playAudio(preloaded, index);
    return;
  }

  const cacheKey = await cache.hash(processedText, voice, speed.value);
  const cached = await cache.get(cacheKey);

  if (cached && cached.audio.size > 0) {
    currentEngine.value = cached.engine + ' (cached)';
    preloadNextSegment(index); // Start preloading next
    await playAudio(cached.audio, index);
    return;
  }

  // 5. Synthesize
  try {
    const result = await router.synthesize({
      text: processedText,
      voice,
      speed: speed.value,
      ssml: false,
    });

    currentEngine.value = result.selectedEngine || result.engine;

    // 6. Cache the result
    if (result.audio.size > 0) {
      await cache.put(cacheKey, result.audio, result.engine, voice, speed.value);
      cacheStats.value = await cache.getStats();
    }

    // Start preloading next segment
    preloadNextSegment(index);

    // 7. Play
    await playAudio(result.audio, index);
  } catch (err) {
    console.warn(`[TTS] Segment ${index} failed, skipping:`, err);
    await readSegment(index + 1);
  }
}

function startAudioProgress() {
  stopAudioProgress();
  const update = () => {
    if (audioElement) {
      audioCurrentTime.value = audioElement.currentTime;
      audioDuration.value = audioElement.duration || 0;
    }
    animationFrameId = requestAnimationFrame(update);
  };
  animationFrameId = requestAnimationFrame(update);
}

function stopAudioProgress() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function playAudio(blob: Blob, segmentIndex: number): Promise<void> {
  return new Promise((resolve) => {
    if (blob.size === 0) {
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
      startAudioProgress();
    };

    audioElement.onended = () => {
      unhighlightSegment(segmentIndex);
      stopAudioProgress();
      resolve();
      readSegment(segmentIndex + 1);
    };

    audioElement.onerror = () => {
      unhighlightSegment(segmentIndex);
      stopAudioProgress();
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
    stopAudioProgress();
  }
}

function stop() {
  if (audioElement) {
    audioElement.pause();
    URL.revokeObjectURL(audioElement.src);
    audioElement = null;
  }

  unhighlightAll();
  stopAudioProgress();
  state.value = 'idle';
  currentSegmentIndex.value = -1;
  preloadedAudio.clear();
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
  preloadedAudio.clear(); // Different speed = different audio
}

async function clearCache() {
  await cache.clear();
  cacheStats.value = { count: 0, totalSizeMB: 0 };
  preloadedAudio.clear();
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
    case 'KeyM':
      if (state.value !== 'idle') {
        isMinimized.value = !isMinimized.value;
      }
      break;
  }
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
</script>

<template>
  <Transition name="tts-slide">
    <div
      class="tts-player"
      :class="{
        'tts-playing': state === 'playing',
        'tts-minimized': isMinimized,
        'tts-error': state === 'error',
      }"
    >
      <!-- Waveform animation bar (top accent) -->
      <div class="tts-waveform" v-if="state === 'playing'">
        <span v-for="i in 12" :key="i" class="tts-wave-bar" :style="{ animationDelay: `${i * 0.08}s` }" />
      </div>

      <!-- Main Controls -->
      <div class="tts-controls">
        <!-- Play/Pause/Stop -->
        <div class="tts-buttons">
          <button
            v-if="state === 'idle' || state === 'error'"
            class="tts-btn tts-btn-play"
            @click="play"
            title="Đọc bài viết (Space)"
            aria-label="Đọc bài viết"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>

          <button
            v-else-if="state === 'playing'"
            class="tts-btn tts-btn-pause"
            @click="pause"
            title="Tạm dừng (Space)"
            aria-label="Tạm dừng"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>

          <button
            v-else-if="state === 'paused'"
            class="tts-btn tts-btn-play"
            @click="play"
            title="Tiếp tục (Space)"
            aria-label="Tiếp tục đọc"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>

          <button
            v-else-if="state === 'loading'"
            class="tts-btn tts-btn-loading"
            disabled
            aria-label="Đang tải"
          >
            <svg class="tts-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.2"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
              </path>
            </svg>
          </button>

          <!-- Skip backward -->
          <button
            v-if="state === 'playing' || state === 'paused'"
            class="tts-btn tts-btn-skip"
            @click="skipBackward"
            title="Đoạn trước (←)"
            aria-label="Đoạn trước"
            :disabled="currentSegmentIndex <= 0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>

          <!-- Skip forward -->
          <button
            v-if="state === 'playing' || state === 'paused'"
            class="tts-btn tts-btn-skip"
            @click="skipForward"
            title="Đoạn sau (→)"
            aria-label="Đoạn sau"
            :disabled="currentSegmentIndex >= totalSegments - 1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 6h2v12h-2z"/>
              <path d="M6 18l8.5-6L6 6z"/>
            </svg>
          </button>

          <!-- Stop -->
          <button
            v-if="state !== 'idle'"
            class="tts-btn tts-btn-stop"
            @click="stop"
            title="Dừng (Esc)"
            aria-label="Dừng đọc"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>
        </div>

        <!-- Progress & Status -->
        <div class="tts-info">
          <div class="tts-progress-bar" v-if="state !== 'idle'">
            <div class="tts-progress-fill" :style="{ width: progress + '%' }">
              <div class="tts-progress-glow" />
            </div>
          </div>
          <div class="tts-status">
            <span class="tts-label">{{ progressLabel }}</span>
            <span v-if="estimatedTime && state !== 'idle'" class="tts-time">{{ estimatedTime }}</span>
          </div>
          <span
            v-if="currentEngine && state !== 'idle'"
            class="tts-engine-badge"
            :style="{ backgroundColor: engineBadge.color, boxShadow: `0 0 12px ${engineBadge.glow}` }"
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
            aria-label="Tốc độ đọc"
          >
            <option v-for="s in SPEED_OPTIONS" :key="s" :value="s">
              {{ s }}x
            </option>
          </select>

          <!-- Minimize button -->
          <button
            v-if="state !== 'idle'"
            class="tts-btn tts-btn-mini"
            @click="isMinimized = !isMinimized"
            :title="isMinimized ? 'Mở rộng (M)' : 'Thu nhỏ (M)'"
            :aria-label="isMinimized ? 'Mở rộng player' : 'Thu nhỏ player'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path v-if="isMinimized" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              <path v-else d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            </svg>
          </button>

          <button
            class="tts-btn tts-btn-settings"
            @click="showSettings = !showSettings"
            :title="showSettings ? 'Đóng cài đặt' : 'Cài đặt'"
            :class="{ 'tts-btn-active': showSettings }"
            aria-label="Cài đặt TTS"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Settings Panel (animated) -->
      <Transition name="tts-expand">
        <div v-if="showSettings" class="tts-settings">
          <div class="tts-setting-row">
            <label>🎤 Giọng đọc</label>
            <select v-model="selectedVoice" class="tts-select">
              <option v-for="v in availableVoices" :key="v.id" :value="v.id">
                {{ v.name }} ({{ v.engine }})
              </option>
            </select>
          </div>
          <div class="tts-setting-row">
            <label>💾 Cache</label>
            <span class="tts-cache-info">
              {{ cacheStats.count }} mục · {{ cacheStats.totalSizeMB }} MB
            </span>
            <button class="tts-btn-link" @click="clearCache">Xóa cache</button>
          </div>
          <div class="tts-setting-row tts-shortcuts">
            <label>⌨️ Phím tắt</label>
            <div>
              <kbd>Space</kbd> Play/Pause ·
              <kbd>←</kbd><kbd>→</kbd> Skip ·
              <kbd>Esc</kbd> Stop ·
              <kbd>M</kbd> Thu nhỏ
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
/* === Glassmorphism Player === */
.tts-player {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px 20px;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .tts-player {
  background: rgba(30, 30, 32, 0.88);
  border-top-color: rgba(255, 255, 255, 0.06);
}

.tts-player.tts-playing {
  border-top-color: var(--vp-c-brand-1);
  box-shadow:
    0 -2px 20px rgba(0, 0, 0, 0.06),
    0 -1px 0 var(--vp-c-brand-1);
}

.dark .tts-player.tts-playing {
  box-shadow:
    0 -2px 24px rgba(0, 0, 0, 0.3),
    0 -1px 0 var(--vp-c-brand-1);
}

.tts-player.tts-error {
  border-top-color: #ef4444;
}

.tts-player.tts-minimized {
  padding: 6px 20px;
}

.tts-player.tts-minimized .tts-info,
.tts-player.tts-minimized .tts-btn-skip,
.tts-player.tts-minimized .tts-btn-stop,
.tts-player.tts-minimized .tts-btn-settings {
  display: none;
}

/* === Waveform Animation === */
.tts-waveform {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  height: 4px;
  margin-bottom: 8px;
}

.tts-wave-bar {
  width: 3px;
  border-radius: 2px;
  background: var(--vp-c-brand-1);
  animation: tts-wave 1.2s ease-in-out infinite;
}

@keyframes tts-wave {
  0%, 100% { height: 2px; opacity: 0.4; }
  50% { height: 12px; opacity: 1; }
}

/* === Controls Layout === */
.tts-controls {
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 960px;
  margin: 0 auto;
}

.tts-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* === Button Styles === */
.tts-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--vp-c-text-1);
  background: transparent;
  position: relative;
}

.tts-btn:hover:not(:disabled) {
  background: var(--vp-c-default-soft);
  transform: scale(1.08);
}

.tts-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.tts-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.tts-btn-play,
.tts-btn-pause {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-2, var(--vp-c-brand-1)));
  color: white;
  border-radius: 50%;
  box-shadow: 0 2px 12px rgba(var(--vp-c-brand-1-rgb, 100, 108, 255), 0.35);
}

.tts-btn-play:hover:not(:disabled),
.tts-btn-pause:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--vp-c-brand-2, var(--vp-c-brand-1)), var(--vp-c-brand-1)) !important;
  transform: scale(1.12);
  box-shadow: 0 4px 20px rgba(var(--vp-c-brand-1-rgb, 100, 108, 255), 0.45);
}

.tts-btn-loading {
  cursor: wait;
  width: 42px;
  height: 42px;
}

.tts-spinner {
  animation: tts-spin 0.8s linear infinite;
}

@keyframes tts-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.tts-btn-stop {
  color: var(--vp-c-text-2);
}

.tts-btn-stop:hover:not(:disabled) {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1) !important;
}

.tts-btn-active {
  background: var(--vp-c-brand-soft) !important;
  color: var(--vp-c-brand-1) !important;
}

/* === Progress & Info === */
.tts-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tts-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tts-progress-bar {
  width: 100%;
  height: 4px;
  background: var(--vp-c-default-soft);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.tts-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--vp-c-brand-1), var(--vp-c-brand-2, var(--vp-c-brand-1)));
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.tts-progress-glow {
  position: absolute;
  right: 0;
  top: -2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 8px var(--vp-c-brand-1);
  opacity: 0.8;
}

.tts-label {
  font-size: 12px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tts-time {
  font-size: 11px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.tts-engine-badge {
  font-size: 10px;
  padding: 3px 10px;
  border-radius: 12px;
  color: white;
  white-space: nowrap;
  font-weight: 600;
  letter-spacing: 0.02em;
  align-self: flex-start;
  transition: all 0.3s ease;
}

/* === Speed & Extra Controls === */
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
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.2s;
}

.tts-speed:hover {
  border-color: var(--vp-c-brand-1);
}

/* === Settings Panel === */
.tts-settings {
  max-width: 960px;
  margin: 12px auto 0;
  padding: 14px 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.dark .tts-settings {
  background: rgba(30, 30, 32, 0.95);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.tts-setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 13px;
}

.tts-setting-row + .tts-setting-row {
  border-top: 1px solid var(--vp-c-divider-light, var(--vp-c-divider));
}

.tts-setting-row label {
  font-weight: 600;
  min-width: 100px;
  color: var(--vp-c-text-1);
}

.tts-select {
  flex: 1;
  appearance: none;
  background: var(--vp-c-default-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: border-color 0.2s;
}

.tts-select:hover {
  border-color: var(--vp-c-brand-1);
}

.tts-cache-info {
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.tts-btn-link {
  background: none;
  border: none;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.tts-btn-link:hover {
  background: var(--vp-c-brand-soft);
}

.tts-shortcuts {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.tts-shortcuts kbd {
  background: var(--vp-c-default-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: var(--vp-font-family-mono);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* === Transitions === */
.tts-slide-enter-active,
.tts-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.tts-slide-enter-from,
.tts-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.tts-expand-enter-active,
.tts-expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.tts-expand-enter-from,
.tts-expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.tts-expand-enter-to,
.tts-expand-leave-from {
  max-height: 200px;
}

/* === Mobile Responsive === */
@media (max-width: 640px) {
  .tts-player {
    padding: 8px 12px;
  }

  .tts-controls {
    flex-wrap: wrap;
    gap: 8px;
  }

  .tts-info {
    order: 3;
    flex-basis: 100%;
  }

  .tts-engine-badge {
    display: none;
  }

  .tts-waveform {
    margin-bottom: 4px;
  }

  .tts-btn-play,
  .tts-btn-pause {
    width: 38px;
    height: 38px;
  }
}

/* === Reading highlight (global, leaked on purpose) === */
:global(.tts-reading) {
  background: linear-gradient(90deg,
    rgba(var(--vp-c-brand-1-rgb, 100, 108, 255), 0.08),
    rgba(var(--vp-c-brand-1-rgb, 100, 108, 255), 0.04)
  ) !important;
  border-left: 3px solid var(--vp-c-brand-1) !important;
  padding-left: 12px !important;
  border-radius: 4px;
  transition: all 0.3s ease !important;
}

.dark :global(.tts-reading) {
  background: linear-gradient(90deg,
    rgba(var(--vp-c-brand-1-rgb, 100, 108, 255), 0.12),
    rgba(var(--vp-c-brand-1-rgb, 100, 108, 255), 0.05)
  ) !important;
}
</style>
