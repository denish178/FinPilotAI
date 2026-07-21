import ApiError from "../utils/ApiError.js";

const requiredEnv = ["MONGODB_URI", "JWT_SECRET", "JWT_REFRESH_SECRET", "CLIENT_URL"];

const validateEnv = () => {
  const missing = requiredEnv.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error("JWT_REFRESH_SECRET must be at least 32 characters long");
  }

  const nodeEnv = process.env.NODE_ENV || "development";
  process.env.NODE_ENV = nodeEnv;

  return {
    port: Number(process.env.PORT) || 5000,
    nodeEnv,
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    clientUrl: process.env.CLIENT_URL,
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 200,
    authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  };
};

let cachedEnv = null;

export const getEnv = () => {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
};

export default validateEnv;
