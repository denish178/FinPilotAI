import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  clearCookieOptions,
} from "../config/cookies.js";

export const issueAuthTokens = (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  return { accessToken, refreshToken };
};

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie("accessToken", accessToken, accessTokenCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);
};

export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", clearCookieOptions);
  res.clearCookie("refreshToken", clearCookieOptions);
};

export const revokeUserTokens = async (userId) => {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
};

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token not found");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findOne({
    _id: decoded.id,
    isDeleted: false,
  });

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (decoded.tokenVersion !== user.tokenVersion) {
    throw new ApiError(401, "Refresh token has been revoked");
  }

  const accessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  return {
    user,
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const sanitizeUser = async (userId) =>
  User.findById(userId).select("-password");
