import { query } from "express-validator";

export const dashboardPeriodValidator = [
  query("month")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("month must be between 1 and 12")
    .toInt(),

  query("year")
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage("year must be between 2000 and 2100")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("limit must be between 1 and 50")
    .toInt(),

  query("recentLimit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("recentLimit must be between 1 and 50")
    .toInt(),

  query("days")
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage("days must be between 1 and 90")
    .toInt(),

  query("months")
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage("months must be between 1 and 24")
    .toInt(),
];
