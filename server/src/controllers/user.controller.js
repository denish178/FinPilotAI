import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as userService from "../services/user.service.js";
import * as authService from "../services/auth.service.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user._id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await userService.updateAvatar(req.user._id, req.file);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req.user._id, req.body.password);
  authService.clearAuthCookies(res);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Account deleted successfully"));
});

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await userService.getSettings(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, settings, "Settings fetched successfully"));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await userService.updateSettings(req.user._id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, settings, "Settings updated successfully"));
});
