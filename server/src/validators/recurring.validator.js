import { body, param, query } from "express-validator";

const PAYMENT_METHODS = [
  "cash",
  "upi",
  "credit_card",
  "debit_card",
  "bank_transfer",
  "wallet",
  "other",
];

const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"];

export const createRecurringValidator = [
  body("type")
    .trim()
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["income", "expense"])
    .withMessage("Type must be income or expense"),

  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be greater than zero")
    .toFloat(),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isLength({ max: 50 })
    .withMessage("Category must be at most 50 characters"),

  body("description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Description must be at most 200 characters"),

  body("paymentMethod")
    .optional({ values: "falsy" })
    .isIn(PAYMENT_METHODS)
    .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(", ")}`),

  body("notes")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must be at most 500 characters"),

  body("frequency")
    .trim()
    .notEmpty()
    .withMessage("frequency is required")
    .isIn(FREQUENCIES)
    .withMessage(`frequency must be one of: ${FREQUENCIES.join(", ")}`),

  body("startDate")
    .notEmpty()
    .withMessage("startDate is required")
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date")
    .toDate(),

  body("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("endDate must be a valid ISO 8601 date")
    .toDate(),

  body("dayOfWeek")
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage("dayOfWeek must be between 0 (Sunday) and 6 (Saturday)")
    .toInt(),

  body("dayOfMonth")
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage("dayOfMonth must be between 1 and 31")
    .toInt(),

  body("monthOfYear")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("monthOfYear must be between 1 and 12")
    .toInt(),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean")
    .toBoolean(),
];

export const updateRecurringValidator = [
  param("id").isMongoId().withMessage("Invalid recurring transaction ID"),

  body("type")
    .optional()
    .isIn(["income", "expense"])
    .withMessage("Type must be income or expense"),

  body("amount")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Amount must be greater than zero")
    .toFloat(),

  body("category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category cannot be empty")
    .isLength({ max: 50 })
    .withMessage("Category must be at most 50 characters"),

  body("description")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Description must be at most 200 characters"),

  body("paymentMethod")
    .optional({ values: "falsy" })
    .isIn(PAYMENT_METHODS)
    .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(", ")}`),

  body("notes")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must be at most 500 characters"),

  body("frequency")
    .optional()
    .isIn(FREQUENCIES)
    .withMessage(`frequency must be one of: ${FREQUENCIES.join(", ")}`),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date")
    .toDate(),

  body("endDate")
    .optional({ values: "null" })
    .isISO8601()
    .withMessage("endDate must be a valid ISO 8601 date")
    .toDate(),

  body("dayOfWeek")
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage("dayOfWeek must be between 0 and 6")
    .toInt(),

  body("dayOfMonth")
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage("dayOfMonth must be between 1 and 31")
    .toInt(),

  body("monthOfYear")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("monthOfYear must be between 1 and 12")
    .toInt(),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean")
    .toBoolean(),

  body("recalculateNextRun")
    .optional()
    .isBoolean()
    .withMessage("recalculateNextRun must be a boolean")
    .toBoolean(),
];

export const recurringIdValidator = [
  param("id").isMongoId().withMessage("Invalid recurring transaction ID"),
];

export const listRecurringValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("type")
    .optional()
    .isIn(["income", "expense"])
    .withMessage("Type must be income or expense"),

  query("frequency")
    .optional()
    .isIn(FREQUENCIES)
    .withMessage(`frequency must be one of: ${FREQUENCIES.join(", ")}`),

  query("isActive")
    .optional()
    .isIn(["true", "false"])
    .withMessage("isActive must be true or false"),
];

export const toggleRecurringValidator = [
  param("id").isMongoId().withMessage("Invalid recurring transaction ID"),

  body("isActive")
    .notEmpty()
    .withMessage("isActive is required")
    .isBoolean()
    .withMessage("isActive must be a boolean")
    .toBoolean(),
];
