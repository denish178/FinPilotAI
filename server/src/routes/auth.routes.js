import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.controller.js";
import {
  updateProfile,
  changePassword,
  uploadAvatar as uploadAvatarHandler,
  deleteAccount,
  getSettings,
  updateSettings,
} from "../controllers/user.controller.js";
import express from "express";
import verifyJWT from "../middleware/verifyJWT.js";
import validate from "../middleware/validate.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import { uploadAvatar, handleMulterError } from "../middleware/upload.middleware.js";
import {
  updateProfileValidator,
  changePasswordValidator,
  deleteAccountValidator,
  updateSettingsValidator,
} from "../validators/user.validator.js";

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/refresh-token", authLimiter, refreshToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/verify-email", authLimiter, verifyEmail);
router.get("/me", verifyJWT, getCurrentUser);
router.post("/logout", verifyJWT, logoutUser);

router.patch("/profile", verifyJWT, updateProfileValidator, validate, updateProfile);
router.patch("/change-password", verifyJWT, changePasswordValidator, validate, changePassword);
router.post(
  "/avatar",
  verifyJWT,
  uploadAvatar.single("avatar"),
  handleMulterError,
  uploadAvatarHandler,
);
router.delete("/account", verifyJWT, deleteAccountValidator, validate, deleteAccount);

router.get("/settings", verifyJWT, getSettings);
router.patch("/settings", verifyJWT, updateSettingsValidator, validate, updateSettings);

export default router;
