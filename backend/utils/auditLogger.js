const AuditLog = require('../models/AuditLog');

const logAuditAction = async ({ adminId, action, targetType = 'SYSTEM', targetId = null, details = '', req = null }) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
    await AuditLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      details,
      ipAddress
    });
  } catch (err) {
    console.error('Audit log creation failed:', err.message);
  }
};

module.exports = logAuditAction;
