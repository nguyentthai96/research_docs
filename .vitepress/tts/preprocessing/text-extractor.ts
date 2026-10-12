// Text Extractor — Extract readable text segments from page content
// Strips code blocks, scripts, nav elements, and returns structured segments

import type { TextSegment } from '../types';

/**
 * Extract readable text segments from a VitePress page content container.
 * Walks the DOM tree, skipping code/nav/script elements, 
 * and returns structured heading + paragraph segments.
 */
export function extractReadableText(container: HTMLElement): TextSegment[] {
  const segments: TextSegment[] = [];

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Node) {
        if (node instanceof HTMLElement) {
          const tag = node.tagName.toLowerCase();
          // Skip non-readable elements
          if (
            [
              'code', 'pre', 'script', 'style', 'nav', 'aside',
              'button', 'input', 'select', 'textarea', 'svg',
              'img', 'video', 'audio', 'canvas', 'iframe',
            ].includes(tag)
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          // Skip TTS player itself
          if (node.classList.contains('tts-player')) {
            return NodeFilter.FILTER_REJECT;
          }
          // Skip table of contents
          if (node.classList.contains('table-of-contents') || node.classList.contains('VPDocOutlineDropdown')) {
            return NodeFilter.FILTER_REJECT;
          }
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let currentParagraph = '';
  let currentElement: HTMLElement | null = null;

  const flushParagraph = () => {
    const cleaned = cleanText(currentParagraph);
    if (cleaned.length > 2) {
      segments.push({
        type: 'paragraph',
        text: cleaned,
        element: currentElement!,
      });
    }
    currentParagraph = '';
    currentElement = null;
  };

  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node instanceof HTMLElement) {
      const tag = node.tagName.toLowerCase();

      // Handle headings
      if (/^h[1-6]$/.test(tag)) {
        flushParagraph();
        const text = node.textContent?.trim();
        if (text && text.length > 0) {
          segments.push({
            type: 'heading',
            level: parseInt(tag[1]),
            text: cleanText(text),
            element: node,
          });
        }
      }

      // Block elements start new paragraphs
      if (['p', 'div', 'li', 'blockquote', 'td', 'th', 'dt', 'dd'].includes(tag)) {
        flushParagraph();
        currentElement = node;
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text && text.length > 0) {
        if (!currentElement) {
          currentElement = node.parentElement!;
        }
        currentParagraph += (currentParagraph ? ' ' : '') + text;
      }
    }
  }

  flushParagraph();

  return segments;
}

/**
 * Clean text for TTS reading:
 * - Remove markdown artifacts
 * - Remove URLs
 * - Normalize whitespace
 * - Remove emojis (optional, keep some)
 */
function cleanText(text: string): string {
  return (
    text
      // Remove inline code backticks (but keep the text)
      .replace(/`([^`]+)`/g, '$1')
      // Remove markdown links, keep text: [text](url) → text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove bare URLs
      .replace(/https?:\/\/[^\s)]+/g, '')
      // Remove markdown bold/italic markers
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      // Remove markdown strikethrough
      .replace(/~~([^~]+)~~/g, '$1')
      // Remove anchor links #
      .replace(/\s*¶\s*/g, '')
      // Normalize multiple spaces
      .replace(/\s+/g, ' ')
      // Remove leading/trailing special chars
      .replace(/^[#\-*>]+\s*/g, '')
      .trim()
  );
}

/**
 * Merge adjacent short segments to avoid choppy reading.
 * Segments under `minLength` chars are merged with the next segment.
 */
export function mergeShortSegments(
  segments: TextSegment[],
  minLength = 20
): TextSegment[] {
  const merged: TextSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.type === 'heading') {
      merged.push(seg);
      continue;
    }

    // If too short, try to merge with next paragraph
    if (seg.text.length < minLength && i + 1 < segments.length) {
      const next = segments[i + 1];
      if (next.type === 'paragraph') {
        next.text = seg.text + '. ' + next.text;
        continue; // Skip this segment, it's merged into next
      }
    }

    merged.push(seg);
  }

  return merged;
}

/**
 * Get the full preprocessed text from all segments (for cache hashing).
 */
export function segmentsToFullText(segments: TextSegment[]): string {
  return segments.map((s) => s.text).join('\n');
}
