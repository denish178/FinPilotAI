import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { generateSecureToken, hashToken } from "../utils/token.util.js";
import { sendEmail, isEmailConfigured } from "./email.service.js";
import * as authService from "./auth.service.js";

const RESET_TTL_MS = 60 * 60 * 1000;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

const clientBaseUrl = () =>
  (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

const clearPasswordResetFields = (user) => {
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
};

const emailDeliveryError = () =>
  new ApiError(
    503,
    isEmailConfigured()
      ? "Unable to send email right now. Please try again in a few minutes."
      : "Email is not configured on the server. Set SMTP_* variables in server/.env.",
  );

export const requestPasswordReset = async (email) => {
  const normalized = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalized, isDeleted: false });

  if (!user) {
    return { sent: false };
  }

  const rawToken = generateSecureToken();
  user.passwordResetTokenHash = hashToken(rawToken);
  user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${clientBaseUrl()}/reset-password?token=${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your FinPilot password",
      text: `Use this link to reset your password (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
      html: `<p>Use this link to reset your password (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
  } catch {
    clearPasswordResetFields(user);
    await user.save({ validateBeforeSave: false });
    throw emailDeliveryError();
  }

  return { sent: true };
};

export const resetPasswordWithToken = async (token, newPassword) => {
  if (!token?.trim()) {
    throw new ApiError(400, "Reset token is required");
  }

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token.trim()),
    passwordResetExpires: { $gt: new Date() },
    isDeleted: false,
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  user.password = newPassword;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await authService.revokeUserTokens(user._id);

  return user;
};

export const sendEmailVerification = async (user) => {
  const rawToken = generateSecureToken();
  user.emailVerificationTokenHash = hashToken(rawToken);
  user.emailVerificationExpires = new Date(Date.now() + VERIFY_TTL_MS);
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${clientBaseUrl()}/verify-email?token=${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Verify your FinPilot email",
      text: `Verify your email:\n\n${verifyUrl}`,
      html: `<p>Verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
  } catch {
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw emailDeliveryError();
  }
};

export const verifyEmailWithToken = async (token) => {
  if (!token?.trim()) {
    throw new ApiError(400, "Verification token is required");
  }

  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token.trim()),
    emailVerificationExpires: { $gt: new Date() },
    isDeleted: false,
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return user;
};
