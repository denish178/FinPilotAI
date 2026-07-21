import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  if (err.name === "ValidationError" && err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field} already exists`;
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path || "value"}`;
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  } else if (err.status === 429 || statusCode === 429) {
    statusCode = 429;
    message = message || "Too many requests";
  }

  if (statusCode >= 500) {
    console.error("========== ERROR ==========");
    console.error(`[${req.method}] ${req.originalUrl}`);
    console.error(err.stack || err);
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    ...(process.env.NODE_ENV === "development" && statusCode >= 500
      ? { stack: err.stack }
      : {}),
  });
};

export default errorHandler;
