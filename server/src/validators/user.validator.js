import { body } from "express-validator";

export const updateProfileValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("currency")
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be a 3-letter code")
    .isUppercase()
    .withMessage("Currency must be uppercase"),
];

export const changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

export const deleteAccountValidator = [
  body("password")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Password must be a string"),
];

export const updateSettingsValidator = [
  body("currency")
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be a 3-letter code")
    .isUppercase()
    .withMessage("Currency must be uppercase"),

  body("language")
    .optional()
    .isIn(["en", "hi"])
    .withMessage("Language must be en or hi"),

  body("theme")
    .optional()
    .isIn(["light", "dark", "system"])
    .withMessage("Theme must be light, dark, or system"),

  body("emailNotifications")
    .optional()
    .isBoolean()
    .withMessage("emailNotifications must be a boolean")
    .toBoolean(),

  body("pushNotifications")
    .optional()
    .isBoolean()
    .withMessage("pushNotifications must be a boolean")
    .toBoolean(),

  body("budgetAlerts")
    .optional()
    .isBoolean()
    .withMessage("budgetAlerts must be a boolean")
    .toBoolean(),

  body("goalAlerts")
    .optional()
    .isBoolean()
    .withMessage("goalAlerts must be a boolean")
    .toBoolean(),

  body("largeExpenseAlerts")
    .optional()
    .isBoolean()
    .withMessage("largeExpenseAlerts must be a boolean")
    .toBoolean(),
];
