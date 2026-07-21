import cron from "node-cron";
import { processDueRecurringTransactions } from "../services/recurring.service.js";

let cronTask = null;

export const startRecurringScheduler = () => {
  const enabled = process.env.RECURRING_CRON_ENABLED !== "false";
  const schedule = process.env.RECURRING_CRON_SCHEDULE || "5 0 * * *";

  if (!enabled) {
    console.log("Recurring transaction scheduler is disabled");
    return;
  }

  if (!cron.validate(schedule)) {
    console.error(`Invalid RECURRING_CRON_SCHEDULE: ${schedule}`);
    return;
  }

  cronTask = cron.schedule(
    schedule,
    async () => {
      try {
        console.log("[RecurringScheduler] Processing due recurring transactions...");
        const summary = await processDueRecurringTransactions(new Date());
        console.log(
          `[RecurringScheduler] Done. processed=${summary.processed} created=${summary.createdCount}`,
        );
      } catch (error) {
        console.error("[RecurringScheduler] Error:", error.message);
      }
    },
    {
      timezone: "UTC",
    },
  );

  console.log(`Recurring scheduler started (${schedule} UTC)`);

  // Catch up missed runs on startup
  processDueRecurringTransactions(new Date())
    .then((summary) => {
      if (summary.createdCount > 0) {
        console.log(
          `[RecurringScheduler] Startup catch-up created ${summary.createdCount} transaction(s)`,
        );
      }
    })
    .catch((error) => {
      console.error("[RecurringScheduler] Startup catch-up failed:", error.message);
    });
};

export const stopRecurringScheduler = () => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
};
