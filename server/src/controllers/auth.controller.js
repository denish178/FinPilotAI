import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as authService from "../services/auth.service.js";
import * as passwordResetService from "../services/passwordReset.service.js";
import * as googleAuthService from "../services/googleAuth.service.js";

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
    isEmailVerified: false,
  });

  await user.save();

  try {
    await passwordResetService.sendEmailVerification(user);
  } catch (error) {
    console.warn("Verification email failed:", error.message);
  }

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
  }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.password) {
    throw new ApiError(
      401,
      "This account uses Google sign-in. Continue with Google instead.",
    );
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
        refreshToken: tokens.refreshToken,
      },
      "Login successful",
    ),
  );
});

export const googleAuth = asyncHandler(async (req, res) => {
  const user = await googleAuthService.authenticateWithGoogle(
    req.body.credential,
  );

  const tokens = authService.issueAuthTokens(user);
  const loggedInUser = await authService.sanitizeUser(user._id);
  authService.setAuthCookies(res, tokens);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      "Google sign-in successful",
    ),
  );
});

export const refreshToken = asyncHandler(async (req, res) => {
  const incoming =
    req.body?.refreshToken?.trim() || req.cookies?.refreshToken;

  const result = await authService.refreshAccessToken(incoming);

  authService.setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
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

export const forgotPassword = asyncHandler(async (req, res) => {
  await passwordResetService.requestPasswordReset(req.body.email);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "If the email exists, a reset link will be sent.",
    ),
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  await passwordResetService.resetPasswordWithToken(
    req.body.token,
    req.body.password,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset successfully"));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await passwordResetService.verifyEmailWithToken(req.body.token);
  const sanitized = await authService.sanitizeUser(user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, sanitized, "Email verified successfully"));
});
