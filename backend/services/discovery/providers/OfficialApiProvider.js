// ============================================================
// services/discovery/providers/OfficialApiProvider.js
// Official Partner & Education Directory API Adapter
// Enables integration with authorized partner API endpoints
// ============================================================

const BaseProvider = require('../BaseProvider');

class OfficialApiProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      name: 'OfficialApiProvider',
      attribution: 'Official Education Partner API',
      rateLimitMs: config.rateLimitMs || 1000,
      isEnabled: config.isEnabled !== undefined ? config.isEnabled : Boolean(process.env.DISCOVERY_OFFICIAL_API_URL),
    });

    this.apiUrl = process.env.DISCOVERY_OFFICIAL_API_URL || '';
    this.apiKey = process.env.DISCOVERY_OFFICIAL_API_KEY || '';
  }

  /**
   * Check if official partner API is connected
   * @returns {boolean}
   */
  isConnected() {
    return Boolean(this.apiUrl);
  }

  /**
   * Search official partner API if configured
   * @param {string} city
   * @param {Object} options
   */
  async search(city, options = {}) {
    const targetCity = (city || '').trim();
    if (!targetCity) return [];

    if (!this.isConnected()) {
      console.log(`[${this.name}] Source not connected (DISCOVERY_OFFICIAL_API_URL not configured). Returning 0 leads.`);
      return [];
    }

    const candidates = [];
    try {
      const url = `${this.apiUrl}/tutors?city=${encodeURIComponent(targetCity)}&limit=${options.limit || 50}`;
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      };

      const res = await this.safeFetch(url, { headers });
      if (res.ok && res.isJson && Array.isArray(res.data?.tutors)) {
        for (const item of res.data.tutors) {
          const normalized = this.normalizeResult(item, targetCity);
          if (normalized && this.validateResult(normalized)) {
            candidates.push(normalized);
          }
        }
      }
    } catch (err) {
      console.warn(`[${this.name}] Official API search error:`, err.message);
    }

    return candidates;
  }

  normalizeResult(raw, city) {
    if (!raw || !raw.name) return null;

    return {
      name: raw.name.trim(),
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
      source: 'Official Education Partner API',
      sourceUrl: raw.sourceUrl || (this.apiUrl ? `${this.apiUrl}/tutors/${raw.id || raw._id}` : ''),
      sourceProvider: this.name,
      rawSourceData: raw,
      phone: raw.phone || '',
      email: raw.email || '',
    };
  }
}

module.exports = OfficialApiProvider;

