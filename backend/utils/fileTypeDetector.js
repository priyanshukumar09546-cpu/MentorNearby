// ============================================================
// utils/fileTypeDetector.js
// Single Source of Truth for File Type, MIME, and Format Detection
// Supports: PNG, JPG, JPEG, WEBP (Images) and PDF (Documents)
// ============================================================

/**
 * Accurately detects the fileType ('image' | 'pdf'), mimeType, fileFormat, and friendly label
 * Checks: MIME type, filename, format, Cloudinary URL structure, and explicit flags.
 * 
 * @param {Object} data - Object containing fileName, mimeType, fileUrl, fileType, etc.
 * @returns {{ fileType: 'image'|'pdf', mimeType: string, format: string, label: string, isImage: boolean }}
 */
function detectFileType(data) {
  const safeData = data || {};
  const mime = String(safeData.mimeType || safeData.mimetype || safeData.fileReference?.mimeType || '').toLowerCase().trim();
  const fType = String(safeData.fileType || safeData.fileReference?.fileType || '').toLowerCase().trim();
  const fName = String(safeData.fileName || safeData.filename || safeData.fileReference?.filename || safeData.originalname || '').toLowerCase().trim();
  const fUrl = String(safeData.fileUrl || safeData.url || safeData.fileReference?.url || '').toLowerCase().trim();
  const fFormat = String(safeData.fileFormat || safeData.format || '').toLowerCase().trim();

  // 1. Check explicit fileType & MIME type first
  if (fType === 'image' || mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/webp' || mime.startsWith('image/')) {
    const format = (fName.split('.').pop() || fFormat || (mime.startsWith('image/') ? mime.split('/')[1] : 'png')).toLowerCase();
    const finalFormat = ['png', 'jpg', 'jpeg', 'webp'].includes(format) ? format : 'png';
    const finalMime = finalFormat === 'png' ? 'image/png' : finalFormat === 'webp' ? 'image/webp' : 'image/jpeg';
    const label = finalFormat === 'png' ? 'PNG Image' : finalFormat === 'webp' ? 'WEBP Image' : 'JPEG Image';
    return { fileType: 'image', mimeType: finalMime, format: finalFormat, label, isImage: true };
  }

  if (fType === 'pdf' || mime === 'application/pdf' || mime === 'application/x-pdf') {
    return { fileType: 'pdf', mimeType: 'application/pdf', format: 'pdf', label: 'PDF Document', isImage: false };
  }

  // 2. Check filename extension
  if (fName.endsWith('.png') || fName.includes('.png')) return { fileType: 'image', mimeType: 'image/png', format: 'png', label: 'PNG Image', isImage: true };
  if (fName.endsWith('.jpg') || fName.endsWith('.jpeg') || fName.includes('.jpg') || fName.includes('.jpeg')) return { fileType: 'image', mimeType: 'image/jpeg', format: 'jpg', label: 'JPEG Image', isImage: true };
  if (fName.endsWith('.webp') || fName.includes('.webp')) return { fileType: 'image', mimeType: 'image/webp', format: 'webp', label: 'WEBP Image', isImage: true };
  if (fName.endsWith('.pdf') || fName.includes('.pdf')) return { fileType: 'pdf', mimeType: 'application/pdf', format: 'pdf', label: 'PDF Document', isImage: false };

  // 3. Check format field
  if (['png', 'jpg', 'jpeg', 'webp'].includes(fFormat)) {
    const m = fFormat === 'png' ? 'image/png' : fFormat === 'webp' ? 'image/webp' : 'image/jpeg';
    const label = fFormat === 'png' ? 'PNG Image' : fFormat === 'webp' ? 'WEBP Image' : 'JPEG Image';
    return { fileType: 'image', mimeType: m, format: fFormat, label, isImage: true };
  }
  if (fFormat === 'pdf') return { fileType: 'pdf', mimeType: 'application/pdf', format: 'pdf', label: 'PDF Document', isImage: false };

  // 4. Check URL patterns
  if (fUrl.includes('.png')) return { fileType: 'image', mimeType: 'image/png', format: 'png', label: 'PNG Image', isImage: true };
  if (fUrl.includes('.jpg') || fUrl.includes('.jpeg')) return { fileType: 'image', mimeType: 'image/jpeg', format: 'jpg', label: 'JPEG Image', isImage: true };
  if (fUrl.includes('.webp')) return { fileType: 'image', mimeType: 'image/webp', format: 'webp', label: 'WEBP Image', isImage: true };
  if (fUrl.includes('/image/upload/')) return { fileType: 'image', mimeType: 'image/jpeg', format: 'jpg', label: 'JPEG Image', isImage: true };
  if (fUrl.includes('.pdf')) return { fileType: 'pdf', mimeType: 'application/pdf', format: 'pdf', label: 'PDF Document', isImage: false };

  // 5. Default based on resource type
  const isFormula = data.resourceType === 'FORMULA_SHEET';
  return isFormula
    ? { fileType: 'image', mimeType: 'image/png', format: 'png', label: 'PNG Image', isImage: true }
    : { fileType: 'pdf', mimeType: 'application/pdf', format: 'pdf', label: 'PDF Document', isImage: false };
}

module.exports = { detectFileType };
