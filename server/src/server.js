import "./config/loadEnv.js";
import validateEnv from "./config/env.js";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startRecurringScheduler } from "./scheduler/recurring.scheduler.js";

try {
  validateEnv();
} catch (error) {
  console.error("Environment validation failed:", error.message);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    startRecurringScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
