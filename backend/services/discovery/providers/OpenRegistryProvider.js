// ============================================================
// services/discovery/providers/OpenRegistryProvider.js
// Open Educational Registry & Public Teacher Register Adapter
// Authorized Registry Endpoints Only • Zero Synthetic Generation
// ============================================================

const BaseProvider = require('../BaseProvider');

class OpenRegistryProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      name: 'OpenRegistryProvider',
      attribution: 'Open Educational Practitioner Registry',
      rateLimitMs: config.rateLimitMs || 1500,
      isEnabled: config.isEnabled !== undefined ? config.isEnabled : Boolean(process.env.DISCOVERY_OPEN_REGISTRY_URL),
    });

    this.apiUrl = process.env.DISCOVERY_OPEN_REGISTRY_URL || '';
    this.apiKey = process.env.DISCOVERY_OPEN_REGISTRY_KEY || '';
  }

  /**
   * Check if open registry feed is connected
   * @returns {boolean}
   */
  isConnected() {
    return Boolean(this.apiUrl);
  }

  /**
   * Search authorized open registry feed for real tutor practitioners
   * @param {string} city
   * @param {Object} options
   */
  async search(city, options = {}) {
    const targetCity = (city || '').trim();
    if (!targetCity) return [];

    if (!this.isConnected()) {
      console.log(`[${this.name}] Source not connected (DISCOVERY_OPEN_REGISTRY_URL not configured). Returning 0 leads.`);
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
      if (res.ok && res.isJson && Array.isArray(res.data?.practitioners || res.data?.teachers || res.data)) {
        const rawList = Array.isArray(res.data?.practitioners)
          ? res.data.practitioners
          : Array.isArray(res.data?.teachers)
          ? res.data.teachers
          : res.data;

        for (const item of rawList) {
          const normalized = this.normalizeResult(item, targetCity);
          if (normalized && this.validateResult(normalized)) {
            candidates.push(normalized);
          }
        }
      }
    } catch (err) {
      console.warn(`[${this.name}] Open registry query error for ${targetCity}:`, err.message);
    }

    return candidates;
  }

  /**
   * Normalize open educational record into standard lead without inventing data
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
      source: raw.source || 'Open Educational Practitioner Registry',
      sourceUrl: raw.sourceUrl || raw.url || '',
      sourceProvider: this.name,
      rawSourceData: raw.raw || raw,
      phone: raw.phone || '',
      email: raw.email || '',
    };
  }
}

module.exports = OpenRegistryProvider;

