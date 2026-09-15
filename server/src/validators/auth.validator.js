import { body } from "express-validator";

export const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email")
    .normalizeEmail(),
];

export const resetPasswordValidator = [
  body("token").trim().notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const verifyEmailValidator = [
  body("token").trim().notEmpty().withMessage("Verification token is required"),
];

export const googleAuthValidator = [
  body("credential")
    .trim()
    .notEmpty()
    .withMessage("Google credential is required"),
  body("intent")
    .trim()
    .notEmpty()
    .withMessage("intent is required")
    .isIn(["login", "signup"])
    .withMessage("intent must be login or signup"),
];
