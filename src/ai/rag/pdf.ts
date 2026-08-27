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
 * pdfjs-dist ships as ESM only. `new Function` keeps this a genuine dynamic
 * import so it survives both TypeScript's CommonJS output and the tsx dev
 * loader — a plain `await import()` is rewritten to `require()` by tsc, which
 * cannot load an .mjs module.
 */
const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  s: string,
) => Promise<Record<string, unknown>>;

type PdfJsModule = {
  getDocument: (opts: Record<string, unknown>) => {
    promise: Promise<{
      numPages: number;
      getPage: (n: number) => Promise<{
        getTextContent: () => Promise<{ items: { str?: string; hasEOL?: boolean }[] }>;
      }>;
      destroy: () => Promise<void>;
    }>;
  };
};

let pdfjsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfjs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = dynamicImport('pdfjs-dist/legacy/build/pdf.mjs').then(
      (m) => (m.default ?? m) as unknown as PdfJsModule,
    );
  }
  return pdfjsPromise;
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

  const pdfjs = await loadPdfjs();
  const pages: ExtractedPage[] = [];
  let document: Awaited<ReturnType<PdfJsModule['getDocument']>['promise']> | null = null;

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
      for (const item of content.items) {
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
