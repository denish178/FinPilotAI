import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as authService from "../services/auth.service.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    isDeleted: false,
  });

  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  const user = new User({
    name,
    email: email.toLowerCase(),
    password,
  });

  await user.save();

  const createdUser = await authService.sanitizeUser(user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    isDeleted: false,
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const tokens = authService.issueAuthTokens(user);
  const loggedInUser = await authService.sanitizeUser(user._id);

  authService.setAuthCookies(res, tokens);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
        accessToken: tokens.accessToken,
      },
      "Login successful",
    ),
  );
});

export const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshAccessToken(req.cookies?.refreshToken);

  authService.setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { accessToken: result.accessToken },
      "Access token refreshed successfully",
    ),
  );
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export const logoutUser = asyncHandler(async (req, res) => {
  await authService.revokeUserTokens(req.user._id);
  authService.clearAuthCookies(res);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});
