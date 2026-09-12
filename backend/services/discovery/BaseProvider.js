// ============================================================
// services/discovery/BaseProvider.js
// Modular TutorDiscoveryProvider Interface
// Strict Ethical Guidelines:
// - No CAPTCHA/login/paywall bypass
// - Polite rate limits & custom User-Agent
// - Transparent attribution & source provenance
// ============================================================

const fetch = require('node-fetch');

class BaseProvider {
  /**
   * @param {Object} config
   * @param {string} config.name - Unique provider name
   * @param {string} config.attribution - Source attribution label
   * @param {number} [config.rateLimitMs=2000] - Politeness delay between requests
   * @param {boolean} [config.isEnabled=true] - Active flag
   */
  constructor({ name, attribution, rateLimitMs = 2000, isEnabled = true }) {
    if (!name) throw new Error('Provider must have a name');
    this.name = name;
    this.attribution = attribution || name;
    this.rateLimitMs = rateLimitMs;
    this.isEnabled = isEnabled;
    this.userAgent = 'MentorNearby-TutorDiscoveryBot/1.0 (+https://mentornearby.com/safety; automated legitimate discovery)';
  }

  /**
   * Safe fetch with standard headers and polite rate limiting
   * @param {string} url
   * @param {Object} [options={}]
   */
  async safeFetch(url, options = {}) {
    const headers = {
      'User-Agent': this.userAgent,
      'Accept': 'application/json, text/html, application/xhtml+xml',
      'Accept-Language': 'en-IN,en;q=0.9',
      ...(options.headers || {}),
    };

    // Polite rate limit sleep
    if (this.rateLimitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.rateLimitMs));
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        timeout: 15000, // 15s timeout
      });

      // Handle common bot/access barriers cleanly without attempting bypass
      if (response.status === 403 || response.status === 401 || response.status === 429) {
        console.warn(`[${this.name}] Source returned ${response.status}. Respecting restrictions and skipping.`);
        return { ok: false, status: response.status, data: null, blocked: true };
      }

      if (!response.ok) {
        return { ok: false, status: response.status, data: null };
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        return { ok: true, status: response.status, data: json, isJson: true };
      } else {
        const text = await response.text();
        return { ok: true, status: response.status, data: text, isJson: false };
      }
    } catch (err) {
      console.warn(`[${this.name}] Network or fetch error:`, err.message);
      return { ok: false, status: 0, error: err.message };
    }
  }

  /**
   * Search for real tutor leads in a city
   * @param {string} city - Target Indian city
   * @param {Object} [options={}] - Search filters (subjects, classes, limit)
   * @returns {Promise<Array<Object>>} Raw candidate listings
   */
  async search(city, options = {}) {
    throw new Error(`search() must be implemented by provider [${this.name}]`);
  }

  /**
   * Normalize a single raw source result into standard lead candidate
   * @param {Object} raw
   * @param {string} city
   * @returns {Object|null} Normalized candidate
   */
  normalizeResult(raw, city) {
    throw new Error(`normalizeResult() must be implemented by provider [${this.name}]`);
  }

  /**
   * Validate that candidate has genuine tutor attributes
   * @param {Object} candidate
   * @returns {boolean}
   */
  validateResult(candidate) {
    if (!candidate) return false;
    // Name validation: must have real name (at least 2 chars, letters, not generic company/ad)
    if (!candidate.name || typeof candidate.name !== 'string') return false;
    const cleanName = candidate.name.trim();
    if (cleanName.length < 3 || cleanName.length > 80) return false;
    if (/advertisement|sponsored|institute|coaching classes|academy|pvt ltd/i.test(cleanName)) {
      return false;
    }

    // City validation: candidate must have a city
    if (!candidate.city || typeof candidate.city !== 'string') return false;

    // Must have a valid source URL for verification
    if (!candidate.sourceUrl || !candidate.sourceUrl.startsWith('http')) return false;

    return true;
  }
}

module.exports = BaseProvider;
