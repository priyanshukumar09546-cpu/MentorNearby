// ============================================================
// utils/studyResourceAccess.js
// Single Source of Truth for Study Resource Access & Pricing
// ============================================================

/**
 * Calculates standardized access permissions and pricing for a study resource.
 * 
 * Exact Business Rules:
 * - ONLINE READING = 100% FREE for all Formula Sheets, Q&A Notes, and Combos across Class 9-12.
 * - ORIGINAL FILE/PDF DOWNLOAD = PAID (requires purchase/unlock).
 * 
 * @param {Object} resource - The study resource object from API or DB
 * @param {Object} [options] - Optional purchase state flags
 * @returns {Object} Standardized access and pricing properties
 */
export function getResourceAccess(resource) {
  const safeRes = resource || {};
  const chNum = Number(safeRes.chapterNumber) || 1;
  const isFormula = safeRes.resourceType === 'FORMULA_SHEET' || safeRes.comboType === 'FORMULA_COMBO';

  // Rule 1: Free Online Reading for ALL Study Resources (Formula Sheets & Q&A)
  const isFreeDemo = true;
  const isFree = true;
  const accessType = 'FREE_DEMO';

  // Rule 2: Pricing configuration (Preserves database configured price, with fallback defaults)
  const isSenior = ['11', '12'].includes(String(safeRes.classLevel || ''));
  const isCombo = Boolean(safeRes.comboType || safeRes.isCombo);
  const defaultOrigPrice = isFormula ? 49 : 79;
  const defaultSalePrice = isCombo
    ? (safeRes.comboType === 'QA_COMBO' ? (isSenior ? 120 : 100) : (isSenior ? 60 : 50))
    : (isFormula ? (isSenior ? 8 : 7) : (isSenior ? 14 : 12));

  const originalPrice = Number(safeRes.originalPrice) || defaultOrigPrice;
  const salePrice = Number(safeRes.salePrice || safeRes.downloadPrice || safeRes.price) || defaultSalePrice;
  const price = salePrice;

  // Rule 3: Unlocked status for downloading original PDF/File
  const isUnlocked = Boolean(safeRes.isDownloadUnlocked || safeRes.isUnlocked);
  const unlockedVia = safeRes.unlockedVia || null;

  // Rule 4: Access permissions
  // Online reading is 100% FREE for all resources
  const canReadFree = true;
  const canReadOnline = true;
  // Downloading PDF strictly requires unlocked status (payment)
  const canDownload = isUnlocked;
  const requiresPurchase = !isUnlocked;

  // Reading status label and color for Admin Table & Cards
  let readingStatus = {
    label: isUnlocked ? 'PURCHASED' : 'FREE READING',
    text: isUnlocked ? '✓ Unlocked' : (isFormula ? '📖 Free Reading' : '📝 Free Reading'),
    badgeClass: isUnlocked ? 'unlocked' : 'free-demo',
    color: isUnlocked ? '#15803D' : '#059669',
    bgColor: isUnlocked ? '#DCFCE7' : '#D1FAE5',
    borderColor: isUnlocked ? '#86EFAC' : '#A7F3D0',
  };

  return {
    isFreeDemo,
    isFree,
    accessType,
    isFormula,
    originalPrice,
    salePrice,
    price,
    downloadPrice: salePrice,
    isUnlocked,
    unlockedVia,
    canReadFree,
    canReadOnline,
    canDownload,
    requiresPurchase,
    readingStatus,
    chapterNumber: chNum,
    title: safeRes.title || '',
    subject: safeRes.subject || '',
    classLevel: safeRes.classLevel || '',
  };
}

/**
 * Accurately detects the file format, MIME type, and user-facing label for a study resource.
 * Supports: PNG, JPG, JPEG, WEBP (Images) and PDF (Documents).
 * 
 * @param {Object} resource
 * @returns {{ fileType: 'image'|'pdf', mimeType: string, label: string, isImage: boolean, extension: string }}
 */
export function detectStudyFileType(resource) {
  const safeRes = resource || {};
  const mime = String(safeRes.mimeType || safeRes.fileReference?.mimeType || '').toLowerCase().trim();
  const fType = String(safeRes.fileType || safeRes.fileReference?.fileType || '').toLowerCase().trim();
  const fName = String(safeRes.fileName || safeRes.filename || safeRes.fileReference?.filename || '').toLowerCase().trim();
  const fUrl = String(safeRes.fileUrl || safeRes.fileReference?.url || '').toLowerCase().trim();
  const fFormat = String(safeRes.fileFormat || '').toLowerCase().trim();

  // 1. Check explicit fileType & MIME type first
  if (fType === 'image' || mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/webp' || mime.startsWith('image/')) {
    const ext = (fName.split('.').pop() || fFormat || (mime.startsWith('image/') ? mime.split('/')[1] : 'png')).toLowerCase();
    const finalExt = ['png', 'jpg', 'jpeg', 'webp'].includes(ext) ? ext : 'png';
    const finalMime = finalExt === 'png' ? 'image/png' : finalExt === 'webp' ? 'image/webp' : 'image/jpeg';
    const label = finalExt === 'png' ? 'PNG Image' : finalExt === 'webp' ? 'WEBP Image' : 'JPEG Image';
    return { fileType: 'image', mimeType: finalMime, label, isImage: true, extension: finalExt };
  }

  if (fType === 'pdf' || mime === 'application/pdf' || mime === 'application/x-pdf') {
    return { fileType: 'pdf', mimeType: 'application/pdf', label: 'PDF Document', isImage: false, extension: 'pdf' };
  }

  // 2. Check original filename
  if (fName.endsWith('.png') || fName.includes('.png')) return { fileType: 'image', mimeType: 'image/png', label: 'PNG Image', isImage: true, extension: 'png' };
  if (fName.endsWith('.jpg') || fName.endsWith('.jpeg') || fName.includes('.jpg') || fName.includes('.jpeg')) return { fileType: 'image', mimeType: 'image/jpeg', label: 'JPEG Image', isImage: true, extension: 'jpg' };
  if (fName.endsWith('.webp') || fName.includes('.webp')) return { fileType: 'image', mimeType: 'image/webp', label: 'WEBP Image', isImage: true, extension: 'webp' };
  if (fName.endsWith('.pdf') || fName.includes('.pdf')) return { fileType: 'pdf', mimeType: 'application/pdf', label: 'PDF Document', isImage: false, extension: 'pdf' };

  // 3. Check format field
  if (['png', 'jpg', 'jpeg', 'webp'].includes(fFormat)) {
    const m = fFormat === 'png' ? 'image/png' : fFormat === 'webp' ? 'image/webp' : 'image/jpeg';
    const label = fFormat === 'png' ? 'PNG Image' : fFormat === 'webp' ? 'WEBP Image' : 'JPEG Image';
    return { fileType: 'image', mimeType: m, label, isImage: true, extension: fFormat };
  }
  if (fFormat === 'pdf') return { fileType: 'pdf', mimeType: 'application/pdf', label: 'PDF Document', isImage: false, extension: 'pdf' };

  // 4. Check URL patterns
  if (fUrl.includes('.png')) return { fileType: 'image', mimeType: 'image/png', label: 'PNG Image', isImage: true, extension: 'png' };
  if (fUrl.includes('.jpg') || fUrl.includes('.jpeg')) return { fileType: 'image', mimeType: 'image/jpeg', label: 'JPEG Image', isImage: true, extension: 'jpg' };
  if (fUrl.includes('.webp')) return { fileType: 'image', mimeType: 'image/webp', label: 'WEBP Image', isImage: true, extension: 'webp' };
  if (fUrl.includes('/image/upload/')) return { fileType: 'image', mimeType: 'image/jpeg', label: 'JPEG Image', isImage: true, extension: 'jpg' };
  if (fUrl.includes('.pdf')) return { fileType: 'pdf', mimeType: 'application/pdf', label: 'PDF Document', isImage: false, extension: 'pdf' };

  // 5. Default fallback for formula sheets / notes
  const isFormula = safeRes.resourceType === 'FORMULA_SHEET';
  return isFormula
    ? { fileType: 'image', mimeType: 'image/png', label: 'PNG Image', isImage: true, extension: 'png' }
    : { fileType: 'pdf', mimeType: 'application/pdf', label: 'PDF Document', isImage: false, extension: 'pdf' };
}
