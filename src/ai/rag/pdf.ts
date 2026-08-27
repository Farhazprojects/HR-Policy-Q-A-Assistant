import { BadRequest } from '@backend/utils/errors';

export interface ExtractedPage {
  page: number;
  text: string;
}

export interface ExtractionResult {
  pages: ExtractedPage[];
  pageCount: number;
  totalCharacters: number;
}

/**
 * pdfjs-dist is pinned to the 3.x line because it ships a genuine CommonJS
 * build. The 4.x line is ESM-only, which forced a `new Function('return
 * import(s)')` escape hatch to survive TypeScript's CommonJS output — and that
 * hatch throws ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING under Vitest's module
 * runner on Node 20. A static import of the CJS build needs no escape hatch and
 * behaves identically under tsx, Vitest and plain Node.
 *
 * The package entry point is used rather than `legacy/`, which tries to polyfill
 * DOMMatrix and Path2D from the optional native `canvas` package and prints two
 * warnings per process when it is absent. Text extraction never rasterises, so
 * the polyfills are not needed.
 */
import * as pdfjs from 'pdfjs-dist';

interface TextItem {
  str?: string;
  hasEOL?: boolean;
}

/**
 * Page-aware PDF text extraction. Extracting page by page is what allows every
 * citation to carry a real page number rather than an estimate.
 */
export async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  if (!buffer || buffer.length === 0) throw BadRequest('The uploaded file is empty.');
  if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw BadRequest('That file is not a valid PDF. Please upload a PDF policy document.');
  }

  const pages: ExtractedPage[] = [];
  let document: Awaited<ReturnType<typeof pdfjs.getDocument>['promise']> | null = null;

  try {
    document = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      isEvalSupported: false,
      disableFontFace: true,
      // Suppress pdfjs console noise for malformed but readable documents.
      verbosity: 0,
    }).promise;

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();

      // hasEOL marks genuine line ends, which is what preserves headings.
      let text = '';
      for (const item of content.items as TextItem[]) {
        if (typeof item.str !== 'string') continue;
        text += item.str;
        if (item.hasEOL) text += '\n';
        else if (item.str.length > 0 && !item.str.endsWith(' ')) text += ' ';
      }

      pages.push({
        page: pageNumber,
        text: text
          .split('\n')
          .map((l) => l.replace(/[ \t]+/g, ' ').trim())
          .join('\n')
          .trim(),
      });
    }
  } catch (e) {
    throw BadRequest(
      'The PDF could not be read. It may be corrupt, password-protected, or image-only (scanned documents need OCR, which is outside this prototype).',
      { cause: e instanceof Error ? e.message : String(e) },
    );
  } finally {
    await document?.destroy().catch(() => undefined);
  }

  const usable = pages.filter((p) => p.text.length > 0);
  if (usable.length === 0) {
    throw BadRequest(
      'No selectable text was found in that PDF. Scanned or image-only documents are not supported by this prototype.',
    );
  }

  return {
    pages: usable,
    pageCount: pages.length,
    totalCharacters: usable.reduce((n, p) => n + p.text.length, 0),
  };
}
