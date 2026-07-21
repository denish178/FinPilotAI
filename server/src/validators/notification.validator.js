import { param, query } from "express-validator";

export const listNotificationsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100")
    .toInt(),

  query("isRead")
    .optional()
    .isIn(["true", "false"])
    .withMessage("isRead must be true or false"),

  query("type")
    .optional()
    .isIn([
      "budget_exceeded",
      "goal_achieved",
      "large_expense",
      "recurring_payment",
    ])
    .withMessage("Invalid notification type"),
];

export const notificationIdValidator = [
  param("id").isMongoId().withMessage("Invalid notification ID"),
];
