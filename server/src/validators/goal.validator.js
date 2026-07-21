import { body, param, query } from "express-validator";

export const createGoalValidator = [
  body("goalName")
    .trim()
    .notEmpty()
    .withMessage("goalName is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("goalName must be between 2 and 100 characters"),

  body("targetAmount")
    .notEmpty()
    .withMessage("targetAmount is required")
    .isFloat({ gt: 0 })
    .withMessage("targetAmount must be greater than zero")
    .toFloat(),

  body("savedAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("savedAmount cannot be negative")
    .toFloat(),

  body("deadline")
    .notEmpty()
    .withMessage("deadline is required")
    .isISO8601()
    .withMessage("deadline must be a valid ISO 8601 date")
    .toDate(),

  body("description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 300 })
    .withMessage("description must be at most 300 characters"),

  body("status")
    .optional()
    .isIn(["active", "completed", "cancelled", "overdue"])
    .withMessage("Invalid status"),
];

export const updateGoalValidator = [
  param("id").isMongoId().withMessage("Invalid goal ID"),

  body("goalName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("goalName must be between 2 and 100 characters"),

  body("targetAmount")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("targetAmount must be greater than zero")
    .toFloat(),

  body("savedAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("savedAmount cannot be negative")
    .toFloat(),

  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("deadline must be a valid ISO 8601 date")
    .toDate(),

  body("description")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 300 })
    .withMessage("description must be at most 300 characters"),

  body("status")
    .optional()
    .isIn(["active", "completed", "cancelled", "overdue"])
    .withMessage("Invalid status"),
];

export const contributeGoalValidator = [
  param("id").isMongoId().withMessage("Invalid goal ID"),

  body("amount")
    .notEmpty()
    .withMessage("amount is required")
    .isFloat({ gt: 0 })
    .withMessage("amount must be greater than zero")
    .toFloat(),
];

export const goalIdValidator = [
  param("id").isMongoId().withMessage("Invalid goal ID"),
];

export const listGoalsValidator = [
  query("status")
    .optional()
    .isIn(["active", "completed", "cancelled", "overdue"])
    .withMessage("Invalid status filter"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("limit must be between 1 and 50")
    .toInt(),
];
