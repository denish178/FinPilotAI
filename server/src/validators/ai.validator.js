import { query } from "express-validator";

export const aiPeriodValidator = [
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
];
