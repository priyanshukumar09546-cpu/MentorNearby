// ============================================================
// services/discovery/DeduplicationService.js
// Multi-Factor Tutor Lead Normalization & Deduplication
// Prevents duplicate leads across multiple discovery providers
// ============================================================

const TutorLead = require('../../models/TutorLead');

class DeduplicationService {
  /**
   * Normalize tutor name for canonical deduplication matching
   * Removes honorifics (Mr, Ms, Er, Dr, Prof), cleans punctuation, trims
   * @param {string} rawName
   * @returns {string}
   */
  normalizeName(rawName) {
    if (!rawName || typeof rawName !== 'string') return '';
    return rawName
      .trim()
      .replace(/^(mr\.|mrs\.|ms\.|dr\.|er\.|prof\.|shri|smt\.|adv\.)\s+/i, '')
      .replace(/,\s*(ph\.?d|m\.?tech|b\.?tech|m\.?sc|b\.?sc|m\.?a|b\.?a|b\.?ed|m\.?ed).*$/i, '')
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Check if candidate lead already exists in TutorLead collection
   * @param {Object} candidate
   * @returns {Promise<{ isDuplicate: boolean, existingLead: Object|null, normalizedCandidate: Object }>}
   */
  async checkDuplicate(candidate) {
    const normalizedName = this.normalizeName(candidate.name);
    const city = (candidate.city || '').trim();
    const sourceUrl = (candidate.sourceUrl || '').trim();
    const phone = (candidate.phone || '').trim();
    const email = (candidate.email || '').trim().toLowerCase();

    const normalizedCandidate = {
      ...candidate,
      normalizedName,
      city,
    };

    // 1. Check exact sourceUrl
    if (sourceUrl) {
      const byUrl = await TutorLead.findOne({ sourceUrl });
      if (byUrl) {
        return { isDuplicate: true, existingLead: byUrl, normalizedCandidate, reason: 'SOURCE_URL_MATCH' };
      }
    }

    // 2. Check normalizedName + city
    if (normalizedName && city) {
      const byNameCity = await TutorLead.findOne({
        normalizedName,
        city: new RegExp(`^${city}$`, 'i'),
      });
      if (byNameCity) {
        // Merge source reference if new URL
        if (sourceUrl && byNameCity.sourceUrl !== sourceUrl) {
          const alreadyReferenced = byNameCity.sourceReferences?.some((r) => r.url === sourceUrl);
          if (!alreadyReferenced) {
            byNameCity.sourceReferences.push({
              provider: candidate.sourceProvider || candidate.source || 'Other',
              url: sourceUrl,
              discoveredAt: new Date(),
            });
            await byNameCity.save().catch(() => {});
          }
        }
        return { isDuplicate: true, existingLead: byNameCity, normalizedCandidate, reason: 'NAME_AND_CITY_MATCH' };
      }
    }

    // 3. Check Phone (if valid 10 digits)
    if (phone && /^\d{10}$/.test(phone)) {
      const byPhone = await TutorLead.findOne({ phone });
      if (byPhone) {
        return { isDuplicate: true, existingLead: byPhone, normalizedCandidate, reason: 'PHONE_MATCH' };
      }
    }

    // 4. Check Email (if valid)
    if (email && email.includes('@')) {
      const byEmail = await TutorLead.findOne({ email });
      if (byEmail) {
        return { isDuplicate: true, existingLead: byEmail, normalizedCandidate, reason: 'EMAIL_MATCH' };
      }
    }

    return { isDuplicate: false, existingLead: null, normalizedCandidate };
  }

  /**
   * Run a global deduplication sweep on TutorLead collection
   * Groups records with same normalizedName + city and consolidates them
   * @returns {Promise<{ scanned: number, consolidated: number }>}
   */
  async sweepDuplicates() {
    const leads = await TutorLead.find().sort({ createdAt: 1 });
    const seen = new Map();
    let consolidated = 0;

    for (const lead of leads) {
      const key = `${lead.normalizedName}|${(lead.city || '').toLowerCase()}`;
      if (seen.has(key)) {
        const primaryLead = seen.get(key);
        // Append source to primary
        if (lead.sourceUrl && lead.sourceUrl !== primaryLead.sourceUrl) {
          primaryLead.sourceReferences.push({
            provider: lead.sourceProvider,
            url: lead.sourceUrl,
            discoveredAt: lead.discoveredAt,
          });
          await primaryLead.save();
        }
        // Remove duplicate
        await TutorLead.findByIdAndDelete(lead._id);
        consolidated++;
      } else {
        seen.set(key, lead);
      }
    }

    return { scanned: leads.length, consolidated };
  }
}

module.exports = new DeduplicationService();
