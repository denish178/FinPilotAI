import rateLimit from "express-rate-limit";

const jsonHandler = (message) => (_req, res) => {
  res.status(429).json({
    success: false,
    message,
    errors: [],
  });
};

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

/** Local Vite proxy / same-machine API calls should not burn production-style auth quotas. */
const isLocalRequest = (req) => {
  const ip = req.ip || "";
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.endsWith("127.0.0.1") ||
    ip === "::ffff:127.0.0.1"
  );
};

export const apiLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler("Too many requests. Please try again later."),
});

/** Login, register, Google, password reset — separate from refresh-token traffic. */
export const authLimiter = rateLimit({
  windowMs,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalRequest,
  handler: jsonHandler("Too many authentication attempts. Please try again later."),
});

/** Token refresh can happen often (tabs, retries); do not share the login attempt budget. */
export const refreshTokenLimiter = rateLimit({
  windowMs,
  max: Number(process.env.REFRESH_RATE_LIMIT_MAX) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalRequest,
  handler: jsonHandler("Too many requests. Please try again later."),
});
