const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Report = require('../models/Report');
const riskService = require('../services/riskService');

exports.createReport = asyncHandler(async (req, res, next) => {
  const { category, description, reportedUser, reportedReview } = req.body;

  if (!category || !description) {
    return error(res, 'Category and description are required', 400);
  }

  if (!reportedUser && !reportedReview) {
    return error(res, 'Must report either a user or a review', 400);
  }

  await Report.create({
    reporter: req.user.id,
    category,
    description,
    reportedUser,
    reportedReview
  });

  if (reportedUser) {
    await riskService.addRiskFlag(reportedUser, `Reported for: ${category}`, 20);
    await riskService.checkReportThreshold(reportedUser);
  }

  return success(res, 'Report submitted successfully. We will review it shortly.');
});

exports.getMyReports = asyncHandler(async (req, res, next) => {
  const reports = await Report.find({ reporter: req.user.id });
  return success(res, 'Reports retrieved', { reports });
});
