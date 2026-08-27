/**
 * Renders the fictional policy specifications into real PDF files.
 *
 * The seeded policies are then ingested through exactly the same pipeline as an
 * HR Officer upload (extract → chunk → embed → index), so the demonstration data
 * is produced by the real system rather than inserted directly into the database.
 */
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { DEMO_UPLOAD_POLICY, ORGANISATION, POLICIES, type PolicySpec } from './policy-content';

const OUT_DIR = path.resolve(__dirname, 'policies');

function renderPolicy(spec: PolicySpec): Promise<string> {
  return new Promise((resolve, reject) => {
    const filePath = path.join(OUT_DIR, spec.fileName);
    const doc = new PDFDocument({ size: 'A4', margins: { top: 72, bottom: 72, left: 72, right: 72 } });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title page
    doc.fontSize(10).fillColor("#555555").text(ORGANISATION, { align: "left" });
    doc.moveDown(4);
    doc.fontSize(26).fillColor('#141A29').text(spec.title, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#444444').text(spec.summary);
    doc.moveDown(2);
    doc.fontSize(10).fillColor('#666666');
    doc.text(`Version: ${spec.version}`);
    doc.text(`Category: ${spec.category}`);
    doc.text(`Effective date: 1 July 2026`);
    doc.text(`Review date: 1 July 2028`);
    doc.text(`Acknowledgement required: ${spec.requiresAcknowledgement ? 'Yes' : 'No'}`);
    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor('#888888')
      .text(
        'DEMONSTRATION DOCUMENT — This is a fictional HR policy written for the COIT20254 Information Systems Project at CQUniversity. It describes a fictional organisation and is not the policy of any real employer.',
        { align: 'left' },
      );

    doc.addPage();

    for (const section of spec.sections) {
      // Keep a heading with at least some of its body text.
      if (doc.y > 640) doc.addPage();
      doc.fontSize(14).fillColor('#141A29').text(section.heading);
      doc.moveDown(0.4);
      doc.fontSize(11).fillColor('#222222');
      for (const paragraph of section.paragraphs) {
        doc.text(paragraph, { align: 'left', lineGap: 2 });
        doc.moveDown(0.6);
      }
      doc.moveDown(0.6);
    }

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

export async function generateAll(): Promise<string[]> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const written: string[] = [];
  for (const spec of [...POLICIES, DEMO_UPLOAD_POLICY]) {
    written.push(await renderPolicy(spec));
  }
  return written;
}

if (require.main === module) {
  generateAll()
    .then((files) => {
      console.log(`Generated ${files.length} policy PDFs in ${OUT_DIR}`);
      for (const f of files) console.log(`  • ${path.basename(f)}`);
    })
    .catch((e) => {
      console.error('PDF generation failed:', e);
      process.exit(1);
    });
}
