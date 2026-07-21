import "./config/loadEnv.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import requestLogger from "./middleware/requestLogger.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";
import {
  securityHeaders,
  sanitizeRequest,
  xssSanitizer,
} from "./middleware/security.middleware.js";
import transactionRouter from "./routes/transaction.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import budgetRouter from "./routes/budget.routes.js";
import goalRouter from "./routes/goal.routes.js";
import recurringRouter from "./routes/recurring.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import aiRouter from "./routes/ai.routes.js";
import ApiError from "./utils/ApiError.js";
import { getEnv } from "./config/env.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

const app = express();
const env = getEnv();

const allowedOrigins = [
  env.clientUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.set("trust proxy", 1);
app.use(securityHeaders);
if (process.env.NODE_ENV !== "test") {
  app.use(requestLogger);
}
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(sanitizeRequest);
app.use(xssSanitizer);
if (process.env.NODE_ENV !== "test") {
  app.use("/api", apiLimiter);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "FinPilot API is running",
    environment: env.nodeEnv,
  });
});

if (process.env.NODE_ENV !== "test") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "FinPilot AI API Docs",
  }));
  app.get("/api/docs.json", (_req, res) => {
    res.status(200).json(swaggerSpec);
  });
}

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/budgets", budgetRouter);
app.use("/api/goals", goalRouter);
app.use("/api/recurring", recurringRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/ai", aiRouter);

app.use((_req, _res, next) => {
  next(new ApiError(404, "Route not found"));
});

app.use(errorHandler);

export default app;
