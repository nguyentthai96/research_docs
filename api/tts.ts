import { NextRequest, NextResponse } from 'next/server';

// Edge TTS Proxy — Vercel Serverless Function
// Proxies TTS requests to Microsoft Edge TTS service

export const config = {
  runtime: 'edge',
};

const TRUSTED_ORIGINS = [
  'https://nguyentthai96.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];

function corsHeaders(origin: string | null) {
  const allowed = origin && TRUSTED_ORIGINS.some(o => origin.startsWith(o));
  return {
    'Access-Control-Allow-Origin': allowed ? origin! : TRUSTED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default async function handler(req: NextRequest) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/api/tts', '');

  // Health check
  if (path === '/health' || path === '') {
    return NextResponse.json({ status: 'ok', engine: 'edge-tts' }, { headers });
  }

  // Synthesize
  if (path === '/synthesize' && req.method === 'POST') {
    try {
      const body = await req.json();
      const { text, voice = 'vi-VN-HoaiMyNeural', rate = '+0%' } = body;

      if (!text || text.length > 5000) {
        return NextResponse.json(
          { error: 'Text required (max 5000 chars)' },
          { status: 400, headers }
        );
      }

      // Use edge-tts-universal to synthesize
      const { EdgeTTS } = await import('edge-tts-universal');
      const tts = new EdgeTTS();
      await tts.setMetadata(voice, 'audio-24khz-48kbitrate-mono-mp3');

      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="vi-VN">
          <voice name="${voice}">
            <prosody rate="${rate}">${escapeXml(text)}</prosody>
          </voice>
        </speak>
      `.trim();

      const audioStream = await tts.toStream(ssml);
      const chunks: Uint8Array[] = [];

      for await (const chunk of audioStream) {
        if (chunk.type === 'audio') {
          chunks.push(chunk.data);
        }
      }

      const audioBuffer = concatUint8Arrays(chunks);

      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          ...headers,
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
        },
      });
    } catch (err: any) {
      console.error('[edge-tts] Error:', err);
      return NextResponse.json(
        { error: err.message || 'TTS synthesis failed' },
        { status: 500, headers }
      );
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404, headers });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
