// ============================================================
// services/discovery/providers/DirectoryIndexProvider.js
// Searches Authorized Public Educational Directory Indexes & Feeds
// Real Data Only • Strict Provenance • Zero Synthetic Generation
// ============================================================

const BaseProvider = require('../BaseProvider');

class DirectoryIndexProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      name: 'DirectoryIndexProvider',
      attribution: 'Public Educational Directory Index',
      rateLimitMs: config.rateLimitMs || 1500,
      isEnabled: config.isEnabled !== undefined ? config.isEnabled : Boolean(process.env.DISCOVERY_DIRECTORY_INDEX_URL),
    });

    this.apiUrl = process.env.DISCOVERY_DIRECTORY_INDEX_URL || '';
    this.apiKey = process.env.DISCOVERY_DIRECTORY_INDEX_KEY || '';
  }

  /**
   * Check if external authorized feed is connected
   * @returns {boolean}
   */
  isConnected() {
    return Boolean(this.apiUrl);
  }

  /**
   * Search authorized educational directory feed for real tutor candidates
   * @param {string} city
   * @param {Object} options
   */
  async search(city, options = {}) {
    const targetCity = (city || '').trim();
    if (!targetCity) return [];

    if (!this.isConnected()) {
      console.log(`[${this.name}] Source not connected (DISCOVERY_DIRECTORY_INDEX_URL not configured). Returning 0 leads.`);
      return [];
    }

    const candidates = [];
    try {
      const url = `${this.apiUrl}?city=${encodeURIComponent(targetCity)}&limit=${options.limit || 50}`;
      const headers = {
        'Accept': 'application/json',
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const res = await this.safeFetch(url, { headers });
      if (res.ok && res.isJson && Array.isArray(res.data?.tutors || res.data?.leads || res.data)) {
        const rawList = Array.isArray(res.data?.tutors)
          ? res.data.tutors
          : Array.isArray(res.data?.leads)
          ? res.data.leads
          : res.data;

        for (const item of rawList) {
          const normalized = this.normalizeResult(item, targetCity);
          if (normalized && this.validateResult(normalized)) {
            candidates.push(normalized);
          }
        }
      }
    } catch (err) {
      console.warn(`[${this.name}] Authorized directory query error for ${targetCity}:`, err.message);
    }

    return candidates;
  }

  /**
   * Normalize real directory entry without fabricating any attributes
   */
  normalizeResult(raw, city) {
    if (!raw || !raw.name) return null;

    const name = String(raw.name).trim();
    if (name.length < 3) return null;

    return {
      name,
      city: city || raw.city || '',
      locality: raw.locality || '',
      subjects: Array.isArray(raw.subjects) ? raw.subjects : (raw.subject ? [raw.subject] : []),
      classes: Array.isArray(raw.classes) ? raw.classes : (raw.classLevel ? [raw.classLevel] : []),
      qualification: raw.qualification || '',
      experience: raw.experience || '',
      teachingMode: raw.teachingMode || 'Not Specified',
      fee: {
        amount: typeof raw.feeAmount === 'number' ? raw.feeAmount : (raw.fee?.amount || null),
        frequency: raw.feeFrequency || raw.fee?.frequency || 'PER_MONTH',
        rawText: raw.feeText || raw.fee?.rawText || '',
      },
      source: raw.source || 'Authorized Educational Directory',
      sourceUrl: raw.sourceUrl || raw.url || '',
      sourceProvider: this.name,
      rawSourceData: raw.raw || raw,
      phone: raw.phone || '',
      email: raw.email || '',
    };
  }
}

module.exports = DirectoryIndexProvider;

