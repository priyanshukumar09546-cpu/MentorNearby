const { error } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let errorObj = { ...err };
  errorObj.message = err.message;

  // Log to console for dev
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    errorObj = new Error(message);
    errorObj.statusCode = 400;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    const message = field === 'email' 
      ? 'Email already exists. Please log in instead.' 
      : `An account with that ${field} already exists.`;
    errorObj = new Error(message);
    errorObj.statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    errorObj = new Error(message);
    errorObj.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Not authorized to access this route';
    errorObj = new Error(message);
    errorObj.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Not authorized to access this route, token expired';
    errorObj = new Error(message);
    errorObj.statusCode = 401;
  }

  // CORS Error simulation
  if (err.message && err.message.includes('CORS')) {
    errorObj.statusCode = 403;
  }

  const statusCode = errorObj.statusCode || 500;
  const message = errorObj.message || 'Server Error';

  return error(res, message, statusCode, errorObj.errorCode);
};

module.exports = errorHandler;
