import fs from "fs/promises";
import path from "path";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import Goal from "../models/Goal.js";
import Notification from "../models/Notification.js";
import RecurringTransaction from "../models/RecurringTransaction.js";
import ApiError from "../utils/ApiError.js";
import { AVATAR_UPLOAD_DIR } from "../middleware/upload.middleware.js";

const ALLOWED_UPDATE_FIELDS = ["name", "currency"];

const resolveAvatarPath = (avatarUrl) => {
  if (!avatarUrl || !avatarUrl.startsWith("/uploads/avatars/")) return null;
  const filename = path.basename(avatarUrl);
  return path.join(AVATAR_UPLOAD_DIR, filename);
};

const removeAvatarFile = async (avatarUrl) => {
  const filePath = resolveAvatarPath(avatarUrl);
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // File may already be removed
  }
};

export const updateProfile = async (userId, payload) => {
  const updates = {};
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (payload[field] !== undefined) {
      updates[field] = payload[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  const user = await User.findOneAndUpdate(
    { _id: userId, isDeleted: false },
    { $set: updates },
    { returnDocument: "after", runValidators: true },
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findOne({ _id: userId, isDeleted: false });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isValid = await user.isPasswordCorrect(currentPassword);
  if (!isValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must be different from current password");
  }

  user.password = newPassword;
  await user.save();

  return true;
};

export const updateAvatar = async (userId, file) => {
  if (!file) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const avatarPath = `/uploads/avatars/${file.filename}`;

  if (user.avatar) {
    await removeAvatarFile(user.avatar);
  }

  user.avatar = avatarPath;
  await user.save();

  const updatedUser = await User.findById(userId).select("-password");
  return updatedUser;
};

const formatSettings = (user) => ({
  currency: user.currency,
  language: user.preferences?.language ?? "en",
  theme: user.preferences?.theme ?? "light",
  emailNotifications: user.preferences?.emailNotifications ?? true,
  pushNotifications: user.preferences?.pushNotifications ?? true,
  budgetAlerts: user.preferences?.budgetAlerts ?? true,
  goalAlerts: user.preferences?.goalAlerts ?? true,
  largeExpenseAlerts: user.preferences?.largeExpenseAlerts ?? true,
});

export const getSettings = async (userId) => {
  const user = await User.findOne({ _id: userId, isDeleted: false }).select(
    "currency preferences",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return formatSettings(user);
};

export const updateSettings = async (userId, payload) => {
  const user = await User.findOne({ _id: userId, isDeleted: false });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const preferenceFields = [
    "language",
    "theme",
    "emailNotifications",
    "pushNotifications",
    "budgetAlerts",
    "goalAlerts",
    "largeExpenseAlerts",
  ];

  let hasUpdates = false;

  if (payload.currency !== undefined) {
    user.currency = payload.currency;
    hasUpdates = true;
  }

  if (!user.preferences) {
    user.preferences = {};
  }

  for (const field of preferenceFields) {
    if (payload[field] !== undefined) {
      user.preferences[field] = payload[field];
      hasUpdates = true;
    }
  }

  if (!hasUpdates) {
    throw new ApiError(400, "No valid settings provided for update");
  }

  user.markModified("preferences");
  await user.save();

  return formatSettings(user);
};

export const deleteAccount = async (userId, password) => {
  const user = await User.findOne({ _id: userId, isDeleted: false }).select(
    "+password",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isGoogleSignInAccount = user.authProvider === "google";

  if (!isGoogleSignInAccount) {
    if (!password?.trim()) {
      throw new ApiError(400, "Password is required to delete your account");
    }

    const isValid = await user.isPasswordCorrect(password);
    if (!isValid) {
      throw new ApiError(401, "Incorrect password");
    }
  }

  const deletedAt = new Date();

  await Promise.all([
    User.updateOne(
      { _id: userId },
      {
        $set: {
          isDeleted: true,
          deletedAt,
          email: `deleted_${userId}_${user.email}`,
        },
        $unset: { googleId: "" },
        $inc: { tokenVersion: 1 },
      },
    ),
    Transaction.updateMany({ user: userId }, { $set: { isDeleted: true, deletedAt } }),
    Budget.updateMany({ user: userId }, { $set: { isDeleted: true, deletedAt } }),
    Goal.updateMany({ user: userId }, { $set: { isDeleted: true, deletedAt } }),
    RecurringTransaction.updateMany(
      { user: userId },
      { $set: { isDeleted: true, deletedAt, isActive: false } },
    ),
    Notification.deleteMany({ user: userId }),
  ]);

  if (user.avatar) {
    await removeAvatarFile(user.avatar);
  }

  return true;
};
