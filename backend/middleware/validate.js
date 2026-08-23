const { validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ field: err.path, message: err.msg }));

    const detailedMessage = extractedErrors.map(e => e.message).join('. ');

    return res.status(400).json({
      success: false,
      message: detailedMessage || 'Validation Error',
      errors: extractedErrors
    });
  };
};

module.exports = { validate };
