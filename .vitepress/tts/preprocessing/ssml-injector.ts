// SSML Injector — Add prosody, breaks, and emphasis for natural reading

import type { TextSegment } from '../types';

/**
 * Convert text segments into SSML for engines that support it (edge-tts).
 * Adds breaks after headings, slower rate for technical content, emphasis on keywords.
 */
export function injectSSML(segments: TextSegment[], voice = 'vi-VN-HoaiMyNeural'): string {
  const parts: string[] = [
    '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="vi-VN">',
    `<voice name="${voice}">`,
  ];

  for (const seg of segments) {
    if (seg.type === 'heading') {
      const breakTime = getHeadingBreak(seg.level);
      parts.push(
        `<prosody pitch="+5%" rate="-10%">`,
        `<emphasis level="strong">${escapeXml(seg.text)}</emphasis>`,
        `</prosody>`,
        `<break time="${breakTime}"/>`
      );
    } else {
      // Regular paragraph
      parts.push(
        `<prosody rate="-5%">`,
        escapeXml(seg.text),
        `</prosody>`,
        `<break time="350ms"/>`
      );
    }
  }

  parts.push('</voice>', '</speak>');
  return parts.join('\n');
}

/**
 * For engines that don't support SSML (kokoro-js, Piper, VieNeu):
 * Produce plain text with natural pauses via punctuation.
 */
export function toPlainTextWithPauses(segments: TextSegment[]): string {
  const parts: string[] = [];

  for (const seg of segments) {
    if (seg.type === 'heading') {
      // Add extra pause after headings
      parts.push('', seg.text + '.', '');
    } else {
      // Ensure sentences end with period for natural pause
      let text = seg.text;
      if (!/[.!?。]$/.test(text)) {
        text += '.';
      }
      parts.push(text);
    }
  }

  return parts.join('\n');
}

function getHeadingBreak(level?: number): string {
  switch (level) {
    case 1: return '800ms';
    case 2: return '600ms';
    case 3: return '500ms';
    default: return '400ms';
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
