// ============================================================
// services/pdfWatermarkService.js
// Adds diagonal watermark to PDF pages using pdf-lib
// ============================================================

const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');

/**
 * Fetches a PDF from a URL (Cloudinary etc.) and returns it as a Buffer
 */
const fetchPdfBuffer = async (url) => {
  // Use native https/http (compatible with Render/Node without extra deps)
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? require('https') : require('http');
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        return fetchPdfBuffer(response.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
};

/**
 * Add diagonal watermark text to every page of a PDF.
 * @param {Buffer} pdfBuffer  - Original PDF bytes
 * @param {string} watermarkText - e.g. "MentorNearby | Downloaded by Priya - 9876543210"
 * @returns {Promise<Buffer>} - Watermarked PDF as Buffer
 */
const addWatermarkToPdf = async (pdfBuffer, watermarkText) => {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Draw watermark diagonally across the full page
    const fontSize = Math.max(14, Math.min(24, width / 22));
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

    // Place multiple watermarks in a grid pattern
    const positions = [
      { x: width * 0.05, y: height * 0.25 },
      { x: width * 0.15, y: height * 0.6 },
      { x: width * 0.5, y: height * 0.45 },
    ];

    for (const pos of positions) {
      page.drawText(watermarkText, {
        x: pos.x,
        y: pos.y,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.2,
        rotate: degrees(35), // diagonal
      });
    }
  }

  const watermarkedBytes = await pdfDoc.save();
  return Buffer.from(watermarkedBytes);
};

/**
 * Extract the first N pages from a PDF as a new PDF buffer
 * @param {Buffer} pdfBuffer
 * @param {number} pageCount - number of pages to include (default: 2)
 * @returns {Promise<Buffer>} - PDF with only first N pages
 */
const extractFirstPages = async (pdfBuffer, pageCount = 2) => {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const pagesToCopy = Math.min(pageCount, totalPages);

  const previewDoc = await PDFDocument.create();
  const copiedPages = await previewDoc.copyPages(srcDoc, Array.from({ length: pagesToCopy }, (_, i) => i));
  copiedPages.forEach((p) => previewDoc.addPage(p));

  const previewBytes = await previewDoc.save();
  return Buffer.from(previewBytes);
};

module.exports = { fetchPdfBuffer, addWatermarkToPdf, extractFirstPages };
