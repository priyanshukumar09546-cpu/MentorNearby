// ============================================================
// services/discovery/ProviderRegistry.js
// Modular Registry for Discovery Source Providers
// Admin Configurable • Pluggable Provider Architecture
// ============================================================

const DirectoryIndexProvider = require('./providers/DirectoryIndexProvider');
const OpenRegistryProvider = require('./providers/OpenRegistryProvider');
const OfficialApiProvider = require('./providers/OfficialApiProvider');

class ProviderRegistry {
  constructor() {
    this.providers = new Map();

    // Register built-in permitted providers
    this.register(new DirectoryIndexProvider());
    this.register(new OpenRegistryProvider());
    this.register(new OfficialApiProvider());
  }

  /**
   * Register a new provider instance
   * @param {BaseProvider} provider
   */
  register(provider) {
    if (!provider || !provider.name) {
      throw new Error('Invalid provider');
    }
    this.providers.set(provider.name, provider);
    console.log(`🔌 [ProviderRegistry] Registered provider: ${provider.name} (enabled: ${provider.isEnabled})`);
  }

  /**
   * Get provider by name
   * @param {string} name
   */
  get(name) {
    return this.providers.get(name);
  }

  /**
   * Return list of all registered providers with status
   */
  getAll() {
    return Array.from(this.providers.values()).map((p) => ({
      name: p.name,
      attribution: p.attribution,
      isEnabled: p.isEnabled,
      rateLimitMs: p.rateLimitMs,
    }));
  }

  /**
   * Return only enabled providers for discovery execution
   */
  getEnabled() {
    return Array.from(this.providers.values()).filter((p) => p.isEnabled);
  }

  /**
   * Enable or disable a provider dynamically
   * @param {string} name
   * @param {boolean} isEnabled
   */
  setEnabled(name, isEnabled) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider [${name}] not found`);
    }
    provider.isEnabled = Boolean(isEnabled);
    return provider;
  }
}

// Export singleton instance
module.exports = new ProviderRegistry();
