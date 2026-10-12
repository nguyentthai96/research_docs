// Edge-TTS Proxy — Uses Python edge-tts backend (more reliable than Node.js version)
// Run with: node server/edge-tts-proxy.mjs

import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const PORT = process.env.PORT || 3100;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Simple in-memory cache (text+voice → audio buffer)
const audioCache = new Map();
const MAX_CACHE = 100;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Concurrent request deduplication (in-flight promises)
const pendingRequests = new Map();

/**
 * Synthesize text to audio using Python edge-tts CLI.
 * More reliable than the Node.js edge-tts-universal package.
 */
async function _synthesizeRaw(text, voice, rate) {
  const tmpFile = join(tmpdir(), `tts-${randomUUID()}.mp3`);
  const scriptDir = new URL('.', import.meta.url).pathname;
  const scriptPath = join(scriptDir, 'tts_synthesize.py');

  return new Promise((resolve, reject) => {
    const args = [scriptPath, text, voice, rate || '+0%', tmpFile];

    execFile('python3', args, { timeout: 30000 }, async (err, stdout, stderr) => {
      if (err) {
        try { await unlink(tmpFile); } catch {}
        reject(new Error(`edge-tts failed: ${stderr || err.message}`));
        return;
      }

      try {
        const audioBuffer = await readFile(tmpFile);
        try { await unlink(tmpFile); } catch {}

        if (audioBuffer.length === 0) {
          reject(new Error('Empty audio output'));
          return;
        }

        resolve(audioBuffer);
      } catch (readErr) {
        reject(new Error(`Failed to read audio: ${readErr.message}`));
      }
    });
  });
}

// Serial queue — process max 1 concurrent Edge-TTS request
// Microsoft rate-limits concurrent WebSocket connections
const MAX_CONCURRENT = 1;
let activeCount = 0;
const queue = [];

function synthesize(text, voice, rate, retries = 3) {
  return new Promise((resolve, reject) => {
    const task = async () => {
      activeCount++;
      try {
        let lastErr;
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const result = await _synthesizeRaw(text, voice, rate);
            resolve(result);
            return;
          } catch (err) {
            lastErr = err;
            console.warn(`[TTS] Attempt ${attempt}/${retries} failed: ${err.message.split('\n')[0]}`);
            if (attempt < retries) {
              await new Promise(r => setTimeout(r, 1500 * attempt));
            }
          }
        }
        reject(lastErr);
      } finally {
        activeCount--;
        if (queue.length > 0) {
          const next = queue.shift();
          next();
        }
      }
    };

    if (activeCount < MAX_CONCURRENT) {
      task();
    } else {
      queue.push(task);
    }
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', engine: 'edge-tts-python' }));
    return;
  }

  // Voices
  if (url.pathname === '/voices' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      voices: [
        { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My', lang: 'vi-VN', gender: 'Female' },
        { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh', lang: 'vi-VN', gender: 'Male' },
      ]
    }));
    return;
  }

  // Synthesize
  if (url.pathname === '/synthesize' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const raw = JSON.parse(body);
      const rate = raw.rate || '+0%';

      // Only allow valid Edge-TTS voice IDs
      const VALID_VOICES = ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'];
      let voice = raw.voice || 'vi-VN-HoaiMyNeural';
      if (!VALID_VOICES.includes(voice) && !voice.match(/^[a-z]{2}-[A-Z]{2}-/)) {
        voice = 'vi-VN-HoaiMyNeural';
      }

      // Sanitize text: remove emojis, zero-width chars, SSML-unsafe chars
      let text = (raw.text || '')
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')   // Supplemental symbols
        .replace(/[\u{2600}-\u{27BF}]/gu, '')      // Misc symbols
        .replace(/[\u{FE00}-\u{FE0F}]/gu, '')      // Variation selectors
        .replace(/[\u{200B}-\u{200D}\u{FEFF}]/gu, '') // Zero-width chars
        .replace(/[\u{E000}-\u{F8FF}]/gu, '')      // Private use area
        .replace(/[\u{2700}-\u{27BF}]/gu, '')      // Dingbats
        .replace(/[\u{2300}-\u{23FF}]/gu, '')       // Misc technical
        .replace(/&/g, ' và ')                      // SSML-safe
        .replace(/<[^>]*>/g, '')                    // Strip HTML tags
        .replace(/[()[\]{}]/g, ', ')                // Brackets break SSML
        .replace(/[#→←↑↓—–]/g, ' ')               // Arrows, anchors, dashes
        .replace(/,\s*,/g, ',')                     // Clean double commas
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^,\s*/, '')                       // Leading comma
        .replace(/,\s*$/, '');                      // Trailing comma

      if (!text || text.trim().length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Text is required' }));
        return;
      }

      if (text.length > 5000) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Text too long (max 5000 chars)' }));
        return;
      }

      console.log(`[TTS] voice=${voice} rate=${rate} text="${text.slice(0, 60)}..."`);

      const cacheKey = `${voice}:${rate}:${text}`;

      // Check cache first
      const cached = audioCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        console.log(`[TTS] 📦 Cache hit (${cached.buf.length} bytes)`);
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Content-Length': cached.buf.length,
          'Cache-Control': 'public, max-age=86400',
          'X-TTS-Cache': 'hit',
        });
        res.end(cached.buf);
        return;
      }

      // Deduplicate concurrent requests for same text
      let audioPromise = pendingRequests.get(cacheKey);
      if (!audioPromise) {
        audioPromise = synthesize(text, voice, rate);
        pendingRequests.set(cacheKey, audioPromise);
      }

      try {
        const audioBuffer = await audioPromise;

        // Cache the result
        if (audioCache.size >= MAX_CACHE) {
          const oldest = audioCache.keys().next().value;
          audioCache.delete(oldest);
        }
        audioCache.set(cacheKey, { buf: audioBuffer, ts: Date.now() });

        console.log(`[TTS] ✅ Generated ${audioBuffer.length} bytes`);

        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length,
          'Cache-Control': 'public, max-age=86400',
        });
        res.end(audioBuffer);
      } catch (synthErr) {
        console.error('[TTS] Synth Error:', synthErr.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: synthErr.message }));
      } finally {
        pendingRequests.delete(cacheKey);
      }
    } catch (err) {
      console.error('[TTS] Error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`\n🎤 Edge-TTS Proxy running at http://localhost:${PORT}`);
  console.log(`   Backend:    Python edge-tts (more reliable)`);
  console.log(`   Health:     GET  http://localhost:${PORT}/health`);
  console.log(`   Voices:     GET  http://localhost:${PORT}/voices`);
  console.log(`   Synthesize: POST http://localhost:${PORT}/synthesize\n`);
});
