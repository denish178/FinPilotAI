import { body, param, query } from "express-validator";

export const createBudgetValidator = [
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isLength({ max: 50 })
    .withMessage("Category must be at most 50 characters"),

  body("monthlyLimit")
    .notEmpty()
    .withMessage("monthlyLimit is required")
    .isFloat({ gt: 0 })
    .withMessage("monthlyLimit must be greater than zero")
    .toFloat(),

  body("month")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("month must be between 1 and 12")
    .toInt(),

  body("year")
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage("year must be between 2000 and 2100")
    .toInt(),
];

export const updateBudgetValidator = [
  param("id").isMongoId().withMessage("Invalid budget ID"),

  body("category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category cannot be empty")
    .isLength({ max: 50 })
    .withMessage("Category must be at most 50 characters"),

  body("monthlyLimit")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("monthlyLimit must be greater than zero")
    .toFloat(),

  body("month")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("month must be between 1 and 12")
    .toInt(),

  body("year")
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage("year must be between 2000 and 2100")
    .toInt(),
];

export const budgetIdValidator = [
  param("id").isMongoId().withMessage("Invalid budget ID"),
];

export const listBudgetsValidator = [
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

  query("category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("category cannot be empty"),
];
