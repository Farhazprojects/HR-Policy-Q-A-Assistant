import { env } from '@backend/config/env';
import type { ExtractedPage } from './pdf';

export interface Chunk {
  chunkIndex: number;
  page: number;
  section: string;
  content: string;
  tokenCount: number;
}

/** Rough token estimate (~4 characters per token) — used for reporting only. */
const estimateTokens = (s: string): number => Math.ceil(s.length / 4);

const HEADING_PATTERNS: RegExp[] = [
  /^\s*(\d+(?:\.\d+)*)[.)]?\s+([A-Z][A-Za-z0-9 ,&'\u2018\u2019()/–-]{3,70})\s*$/, // "4.1 Annual Leave"
  /^\s*(?:SECTION|PART|APPENDIX)\s+[A-Z0-9]+[:.]?\s*(.{3,70})$/i,
  /^\s*([A-Z][A-Z \d&'\u2018\u2019()/–-]{5,60})\s*$/, // ALL CAPS heading
];

function detectHeading(line: string): string | null {
  const trimmed = line.trim();
  if (trimmed.length < 4 || trimmed.length > 90) return null;
  if (/[.;:]$/.test(trimmed) && !/^\s*\d/.test(trimmed)) return null;
  for (const re of HEADING_PATTERNS) {
    const m = trimmed.match(re);
    if (m) {
      const title = (m[2] ?? m[1] ?? trimmed).trim();
      // A heading should not read like a sentence.
      if (title.split(/\s+/).length <= 10) return title;
    }
  }
  return null;
}

/**
 * Page-aware chunking with section attribution.
 *
 * Chunks never span pages, so every chunk carries an accurate page number for
 * citation. Section headings are carried forward within a page and across page
 * breaks, so a passage under "4. Annual Leave" is cited as such even when the
 * heading appeared earlier.
 */
export function chunkPages(
  pages: ExtractedPage[],
  options?: { targetChars?: number; overlapChars?: number },
): Chunk[] {
  const target = options?.targetChars ?? env.rag.chunkTargetChars;
  const overlap = options?.overlapChars ?? env.rag.chunkOverlapChars;

  const chunks: Chunk[] = [];
  let chunkIndex = 0;
  let currentSection = 'General';

  for (const page of pages) {
    const lines = page.text.split('\n');
    // Group the page into blocks that each belong to one section.
    const blocks: { section: string; text: string }[] = [];
    let buffer: string[] = [];

    const flush = () => {
      const text = buffer.join(' ').replace(/\s+/g, ' ').trim();
      if (text) blocks.push({ section: currentSection, text });
      buffer = [];
    };

    for (const line of lines) {
      const heading = detectHeading(line);
      if (heading) {
        flush();
        currentSection = heading;
        continue;
      }
      if (line.trim()) buffer.push(line.trim());
    }
    flush();

    for (const block of blocks) {
      if (block.text.length <= target) {
        chunks.push({
          chunkIndex: chunkIndex++,
          page: page.page,
          section: block.section,
          content: block.text,
          tokenCount: estimateTokens(block.text),
        });
        continue;
      }

      // Split long blocks on sentence boundaries with a sliding overlap so that
      // a rule split across a boundary still appears whole in one chunk.
      const sentences = block.text.split(/(?<=[.!?])\s+/);
      let current = '';
      for (const sentence of sentences) {
        if (current.length + sentence.length + 1 > target && current.length > 0) {
          chunks.push({
            chunkIndex: chunkIndex++,
            page: page.page,
            section: block.section,
            content: current.trim(),
            tokenCount: estimateTokens(current),
          });
          const tail = current.slice(Math.max(0, current.length - overlap));
          const boundary = tail.indexOf(' ');
          current = `${boundary > 0 ? tail.slice(boundary + 1) : tail} ${sentence}`;
        } else {
          current += (current ? ' ' : '') + sentence;
        }
      }
      if (current.trim()) {
        chunks.push({
          chunkIndex: chunkIndex++,
          page: page.page,
          section: block.section,
          content: current.trim(),
          tokenCount: estimateTokens(current),
        });
      }
    }
  }

  // Drop fragments too small to be useful evidence.
  return chunks.filter((c) => c.content.length >= 60);
}
