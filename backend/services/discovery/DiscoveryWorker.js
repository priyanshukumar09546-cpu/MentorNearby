// ============================================================
// services/discovery/DiscoveryWorker.js
// Safe Background Tutor Discovery Worker Queue
// Polite Rate Limiting • Target Lead Enforcement • Strict Real Data
// ============================================================

const DiscoveryCity = require('../../models/DiscoveryCity');
const TutorLead = require('../../models/TutorLead');
const DiscoveryLog = require('../../models/DiscoveryLog');
const providerRegistry = require('./ProviderRegistry');
const deduplicationService = require('./DeduplicationService');

class DiscoveryWorker {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentCityName = null;
    this.activeProviderName = null;
    this.currentCityId = null;
    this.stats = {
      totalFound: 0,
      totalDuplicates: 0,
      totalSaved: 0,
      totalErrors: 0,
    };
  }

  /**
   * Log an event both to database and console
   */
  async log({ city, provider, level = 'INFO', message, resultsFound = 0, duplicatesSkipped = 0, newLeadsAdded = 0, errorDetail = '' }) {
    console.log(`[DiscoveryWorker][${level}] ${city ? `[${city}] ` : ''}${message}`);
    try {
      await DiscoveryLog.create({
        city: city || this.currentCityName || 'General',
        provider: provider || this.activeProviderName || 'Worker',
        level,
        message,
        resultsFound,
        duplicatesSkipped,
        newLeadsAdded,
        errorDetail,
      });
    } catch (e) {
      // Non-critical logging failure
    }
  }

  /**
   * Start discovery run for a specific city or all enabled cities
   * @param {Object} options
   * @param {string} [options.cityName]
   * @param {string} [options.cityId]
   * @param {boolean} [options.allEnabled=false]
   */
  async start({ cityName, cityId, allEnabled = false }) {
    if (this.isRunning) {
      return { success: false, message: 'Discovery is already running' };
    }

    this.isRunning = true;
    this.isPaused = false;

    // Run in background without blocking response
    setImmediate(async () => {
      try {
        if (allEnabled) {
          const cities = await DiscoveryCity.find({ isEnabled: true }).sort({ isPriority: -1, name: 1 });
          await this.log({ level: 'INFO', message: `Starting discovery queue for ${cities.length} enabled cities.` });

          for (const cityDoc of cities) {
            if (this.isPaused) {
              await this.log({ level: 'WARNING', message: 'Discovery queue paused by admin.' });
              break;
            }
            await this.processCity(cityDoc);
          }
        } else if (cityName || cityId) {
          const query = cityId ? { _id: cityId } : { name: new RegExp(`^${cityName.trim()}$`, 'i') };
          const cityDoc = await DiscoveryCity.findOne(query);

          if (!cityDoc) {
            await this.log({ level: 'ERROR', message: `City [${cityName || cityId}] not found in database.` });
            this.isRunning = false;
            return;
          }
          await this.processCity(cityDoc);
        }
      } catch (err) {
        await this.log({ level: 'ERROR', message: `Fatal worker error: ${err.message}`, errorDetail: err.stack });
      } finally {
        this.isRunning = false;
        this.currentCityName = null;
        this.activeProviderName = null;
        await this.log({ level: 'INFO', message: 'Discovery worker execution ended.' });
      }
    });

    return { success: true, message: 'Discovery worker triggered successfully' };
  }

  /**
   * Process a single city through enabled discovery providers
   * @param {Document} cityDoc
   */
  async processCity(cityDoc) {
    this.currentCityName = cityDoc.name;
    this.currentCityId = cityDoc._id;

    cityDoc.status = 'RUNNING';
    cityDoc.lastRunAt = new Date();
    cityDoc.lastError = '';
    await cityDoc.save();

    await this.log({
      city: cityDoc.name,
      level: 'INFO',
      message: `Starting discovery for ${cityDoc.name}. Target leads: ${cityDoc.targetLeadCount}. Current leads: ${cityDoc.discoveredCount}.`,
    });

    const enabledProviders = providerRegistry.getEnabled();
    if (enabledProviders.length === 0) {
      cityDoc.status = 'COMPLETED';
      cityDoc.lastError = 'No discovery providers are enabled.';
      await cityDoc.save();
      await this.log({ city: cityDoc.name, level: 'WARNING', message: 'No enabled discovery providers found.' });
      return;
    }

    let cityFoundTotal = 0;
    let cityDupTotal = 0;
    let citySavedTotal = 0;

    for (const provider of enabledProviders) {
      if (this.isPaused) {
        cityDoc.status = 'PAUSED';
        await cityDoc.save();
        await this.log({ city: cityDoc.name, level: 'WARNING', message: `Discovery for ${cityDoc.name} paused.` });
        return;
      }

      // Check if target already reached
      const currentCount = await TutorLead.countDocuments({
        city: new RegExp(`^${cityDoc.name}$`, 'i'),
      });

      if (currentCount >= cityDoc.targetLeadCount) {
        await this.log({
          city: cityDoc.name,
          level: 'SUCCESS',
          message: `Target of ${cityDoc.targetLeadCount} leads already reached for ${cityDoc.name}. Finishing city discovery.`,
        });
        break;
      }

      this.activeProviderName = provider.name;
      cityDoc.activeProvider = provider.name;
      await cityDoc.save();

      await this.log({
        city: cityDoc.name,
        provider: provider.name,
        level: 'INFO',
        message: `Querying [${provider.name}] (${provider.attribution}) for legitimate leads in ${cityDoc.name}...`,
      });

      try {
        const candidates = await provider.search(cityDoc.name, {
          targetRemaining: cityDoc.targetLeadCount - currentCount,
        });

        cityFoundTotal += candidates.length;

        let provSaved = 0;
        let provDups = 0;

        for (const cand of candidates) {
          if (this.isPaused) break;

          // Deduplication check
          const dedup = await deduplicationService.checkDuplicate(cand);
          if (dedup.isDuplicate) {
            provDups++;
            cityDupTotal++;
            continue;
          }

          // Save new legitimate lead
          await TutorLead.create({
            ...dedup.normalizedCandidate,
            status: 'LEAD',
            discoveredAt: new Date(),
          });

          provSaved++;
          citySavedTotal++;

          // Check target
          const updatedCount = await TutorLead.countDocuments({
            city: new RegExp(`^${cityDoc.name}$`, 'i'),
          });
          if (updatedCount >= cityDoc.targetLeadCount) {
            break;
          }
        }

        await this.log({
          city: cityDoc.name,
          provider: provider.name,
          level: provSaved > 0 ? 'SUCCESS' : 'INFO',
          message: `[${provider.name}] finished for ${cityDoc.name}: Found ${candidates.length}, Saved ${provSaved} new leads, Filtered ${provDups} duplicates.`,
          resultsFound: candidates.length,
          duplicatesSkipped: provDups,
          newLeadsAdded: provSaved,
        });
      } catch (provErr) {
        await this.log({
          city: cityDoc.name,
          provider: provider.name,
          level: 'ERROR',
          message: `Error querying provider [${provider.name}] for ${cityDoc.name}: ${provErr.message}`,
          errorDetail: provErr.stack,
        });
      }
    }

    // Refresh final city lead counts
    const finalDiscovered = await TutorLead.countDocuments({
      city: new RegExp(`^${cityDoc.name}$`, 'i'),
    });
    const finalClaimed = await TutorLead.countDocuments({
      city: new RegExp(`^${cityDoc.name}$`, 'i'),
      status: { $in: ['CLAIMED', 'PROFILE_COMPLETED', 'VERIFICATION_PENDING', 'VERIFIED', 'LIVE'] },
    });
    const finalVerified = await TutorLead.countDocuments({
      city: new RegExp(`^${cityDoc.name}$`, 'i'),
      status: { $in: ['VERIFIED', 'LIVE'] },
    });
    const finalLive = await TutorLead.countDocuments({
      city: new RegExp(`^${cityDoc.name}$`, 'i'),
      status: 'LIVE',
    });

    cityDoc.discoveredCount = finalDiscovered;
    cityDoc.claimedCount = finalClaimed;
    cityDoc.verifiedCount = finalVerified;
    cityDoc.liveCount = finalLive;
    cityDoc.status = 'COMPLETED';
    cityDoc.activeProvider = '';
    cityDoc.lastCompletedAt = new Date();
    await cityDoc.save();

    await this.log({
      city: cityDoc.name,
      level: 'SUCCESS',
      message: `Completed discovery for ${cityDoc.name}. Total legitimate leads in database: ${finalDiscovered}/${cityDoc.targetLeadCount}. (New saved in this run: ${citySavedTotal})`,
      newLeadsAdded: citySavedTotal,
      duplicatesSkipped: cityDupTotal,
      resultsFound: cityFoundTotal,
    });
  }

  /**
   * Pause current discovery execution
   */
  pause() {
    if (!this.isRunning) {
      return { success: false, message: 'Discovery is not running' };
    }
    this.isPaused = true;
    return { success: true, message: 'Discovery worker pausing requested' };
  }

  /**
   * Resume paused discovery
   */
  async resume() {
    if (!this.isRunning && !this.isPaused) {
      return { success: false, message: 'No paused discovery session to resume' };
    }
    this.isPaused = false;
    return this.start({ allEnabled: true });
  }

  /**
   * Return live worker state
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentCity: this.currentCityName,
      activeProvider: this.activeProviderName,
      stats: this.stats,
    };
  }
}

// Export singleton instance
module.exports = new DiscoveryWorker();
