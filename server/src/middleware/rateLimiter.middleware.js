import rateLimit from "express-rate-limit";

const jsonHandler = (message) => (_req, res) => {
  res.status(429).json({
    success: false,
    message,
    errors: [],
  });
};

export const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler("Too many requests. Please try again later."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler("Too many authentication attempts. Please try again later."),
});
