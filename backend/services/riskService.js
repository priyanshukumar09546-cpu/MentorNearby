// ============================================================
// services/riskService.js
// Basic risk detection and scoring engine
// NOTE: Risk scores are advisory only. Humans review before action.
// ============================================================

const RiskFlag = require('../models/RiskFlag');
const User = require('../models/User');

/**
 * Calculate risk score from flags
 */
const calculateRiskScore = (flags) => {
  let score = 0;
  for (const flag of flags) {
    if (flag.severity === 'HIGH') score += 30;
    else if (flag.severity === 'MEDIUM') score += 15;
    else score += 5;
  }

  if (score >= 60) return 'CRITICAL';
  if (score >= 40) return 'HIGH';
  if (score >= 20) return 'MEDIUM';
  return 'LOW';
};

/**
 * Add a risk flag to a user
 */
const addRiskFlag = async (userId, type, description, severity = 'LOW') => {
  try {
    let riskFlag = await RiskFlag.findOne({ user: userId });

    if (!riskFlag) {
      riskFlag = new RiskFlag({ user: userId });
    }

    riskFlag.flags.push({
      type,
      description,
      detectedAt: new Date(),
      severity,
    });

    // Update counts
    if (type === 'FAILED_LOGIN') riskFlag.loginAttempts += 1;
    if (type === 'FAILED_PAYMENT') riskFlag.failedPayments += 1;
    if (type === 'REPORTED') riskFlag.reportCount += 1;

    // Recalculate score
    riskFlag.riskScore = calculateRiskScore(riskFlag.flags);

    await riskFlag.save();

    // Update user's riskScore field
    await User.findByIdAndUpdate(userId, { riskScore: riskFlag.riskScore });

    // Flag for manual review if HIGH or CRITICAL
    if (riskFlag.riskScore === 'HIGH' || riskFlag.riskScore === 'CRITICAL') {
      riskFlag.isManualReview = true;
      await riskFlag.save();
      console.warn(`⚠️  RISK: User ${userId} flagged as ${riskFlag.riskScore} — manual review required`);
    }

    return riskFlag;
  } catch (error) {
    // Risk service failures should not break normal flow
    console.error('Risk service error:', error.message);
    return null;
  }
};

/**
 * Check for suspicious login patterns
 */
const checkLoginAnomaly = async (userId, ipAddress) => {
  try {
    const riskFlag = await RiskFlag.findOne({ user: userId });
    if (riskFlag && riskFlag.loginAttempts > 10) {
      await addRiskFlag(userId, 'EXCESSIVE_LOGIN_ATTEMPTS', `${riskFlag.loginAttempts} login attempts detected`, 'MEDIUM');
    }
  } catch (error) {
    console.error('Risk login check error:', error.message);
  }
};

/**
 * Flag a user for receiving too many reports
 */
const checkReportThreshold = async (userId) => {
  try {
    const riskFlag = await RiskFlag.findOne({ user: userId });
    if (riskFlag && riskFlag.reportCount >= 3) {
      await addRiskFlag(
        userId,
        'EXCESSIVE_REPORTS',
        `User has received ${riskFlag.reportCount} reports`,
        riskFlag.reportCount >= 5 ? 'HIGH' : 'MEDIUM'
      );
    }
  } catch (error) {
    console.error('Risk report check error:', error.message);
  }
};

module.exports = {
  addRiskFlag,
  calculateRiskScore,
  checkLoginAnomaly,
  checkReportThreshold,
};
