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

const SORT_FIELDS = ["date", "amount", "createdAt", "category", "type"];

export const createTransactionValidator = [
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

  body("date")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date")
    .toDate(),

  body("paymentMethod")
    .optional({ values: "falsy" })
    .isIn(PAYMENT_METHODS)
    .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(", ")}`),

  body("notes")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must be at most 500 characters"),
];

export const updateTransactionValidator = [
  param("id").isMongoId().withMessage("Invalid transaction ID"),

  body("type")
    .optional()
    .trim()
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

  body("date")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date")
    .toDate(),

  body("paymentMethod")
    .optional({ values: "falsy" })
    .isIn(PAYMENT_METHODS)
    .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(", ")}`),

  body("notes")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must be at most 500 characters"),
];

export const transactionIdValidator = [
  param("id").isMongoId().withMessage("Invalid transaction ID"),
];

export const listTransactionsValidator = [
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

  query("sortBy")
    .optional()
    .isIn(SORT_FIELDS)
    .withMessage(`sortBy must be one of: ${SORT_FIELDS.join(", ")}`),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),

  query("type")
    .optional()
    .isIn(["income", "expense"])
    .withMessage("Type must be income or expense"),

  query("category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category cannot be empty"),

  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date")
    .toDate(),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid ISO 8601 date")
    .toDate(),

  query("minAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("minAmount must be a non-negative number")
    .toFloat(),

  query("maxAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("maxAmount must be a non-negative number")
    .toFloat(),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search must be at most 100 characters"),

  query("paymentMethod")
    .optional()
    .isIn(PAYMENT_METHODS)
    .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(", ")}`),
];

const importTransactionItemValidator = [
  body("transactions")
    .isArray({ min: 1, max: 500 })
    .withMessage("transactions must be an array with 1 to 500 items"),

  body("transactions.*.type")
    .trim()
    .notEmpty()
    .withMessage("Each transaction type is required")
    .isIn(["income", "expense"])
    .withMessage("Each transaction type must be income or expense"),

  body("transactions.*.amount")
    .notEmpty()
    .withMessage("Each transaction amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Each transaction amount must be greater than zero")
    .toFloat(),

  body("transactions.*.category")
    .trim()
    .notEmpty()
    .withMessage("Each transaction category is required")
    .isLength({ max: 50 })
    .withMessage("Each transaction category must be at most 50 characters"),

  body("transactions.*.description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Each transaction description must be at most 200 characters"),

  body("transactions.*.date")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Each transaction date must be a valid ISO 8601 date")
    .toDate(),

  body("transactions.*.paymentMethod")
    .optional({ values: "falsy" })
    .isIn(PAYMENT_METHODS)
    .withMessage(`Each payment method must be one of: ${PAYMENT_METHODS.join(", ")}`),

  body("transactions.*.notes")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Each transaction notes must be at most 500 characters"),
];

export { importTransactionItemValidator };
