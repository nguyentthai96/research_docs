// Edge-TTS Proxy Server — Lightweight Node.js proxy for Microsoft Neural TTS
// Can run standalone, on Cloudflare Workers, Vercel Serverless, or Fly.io

import { createServer } from 'http';

const PORT = process.env.PORT || 3100;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Microsoft Edge TTS WebSocket endpoint
const EDGE_TTS_WS = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';

/**
 * Generate audio from text using edge-tts npm package.
 */
async function synthesize(text: string, voice: string, rate: string, ssml: boolean): Promise<Buffer> {
  // Use edge-tts-universal for cross-platform support
  const { EdgeTTS } = await import('edge-tts-universal');
  
  const tts = new EdgeTTS();
  await tts.setMetadata(voice, 'audio-24khz-96kbitrate-mono-mp3');
  
  if (rate && rate !== '+0%') {
    await tts.setRate(rate);
  }

  const audioData = await tts.toBuffer(text);
  return Buffer.from(audioData);
}

const server = createServer(async (req, res) => {
  // CORS headers
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
    res.end(JSON.stringify({ status: 'ok', engine: 'edge-tts', timestamp: Date.now() }));
    return;
  }

  // List available voices
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

  // Synthesize endpoint
  if (url.pathname === '/synthesize' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { text, voice = 'vi-VN-HoaiMyNeural', rate = '+0%', ssml = false } = JSON.parse(body);

      if (!text || text.trim().length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Text is required' }));
        return;
      }

      // Limit text length to prevent abuse
      if (text.length > 5000) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Text too long (max 5000 chars)' }));
        return;
      }

      console.log(`[edge-tts] Synthesizing: voice=${voice}, rate=${rate}, text=${text.slice(0, 80)}...`);

      const audioBuffer = await synthesize(text, voice, rate, ssml);

      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length,
        'Cache-Control': 'public, max-age=86400', // Cache 24h
      });
      res.end(audioBuffer);
    } catch (err) {
      console.error('[edge-tts] Error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: (err as Error).message }));
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

function readBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

server.listen(PORT, () => {
  console.log(`🎤 Edge-TTS Proxy running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Voices: http://localhost:${PORT}/voices`);
  console.log(`   Synthesize: POST http://localhost:${PORT}/synthesize`);
});
