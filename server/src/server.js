import "./config/loadEnv.js";
import validateEnv from "./config/env.js";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startRecurringScheduler } from "./scheduler/recurring.scheduler.js";
import {
  getEmailDeliveryMode,
  verifyEmailTransport,
} from "./services/email.service.js";

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

    const { getProviderInfo } = await import("./services/ai.service.js");
    const aiInfo = getProviderInfo();
    console.log(
      `AI engine: ${aiInfo.activeProvider} (configured: ${aiInfo.configuredProvider})`,
    );
    if (aiInfo.fallbackReason) {
      console.log(`AI note: ${aiInfo.fallbackReason}`);
    }

    const emailMode = getEmailDeliveryMode();
    if (emailMode === "console") {
      console.log(
        "Email: console mode (set SMTP_HOST in .env to send real password-reset mail)",
      );
    } else {
      const emailCheck = await verifyEmailTransport();
      if (emailCheck.ok) {
        console.log("Email: SMTP connected and ready");
      } else {
        console.warn(
          `Email: SMTP configured but verify failed — ${emailCheck.error}`,
        );
      }
    }

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
