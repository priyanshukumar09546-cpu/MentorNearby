const apiResponse = {
  success: (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  },
  error: (res, message, statusCode = 400, errorCode = null) => {
    const response = {
      success: false,
      message
    };
    if (errorCode) {
      response.errorCode = errorCode;
    }
    return res.status(statusCode).json(response);
  }
};

module.exports = apiResponse;
