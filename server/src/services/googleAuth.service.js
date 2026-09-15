import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID?.trim();

export const isGoogleAuthConfigured = () => Boolean(getGoogleClientId());

export const authenticateWithGoogle = async (credential, intent = "signup") => {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new ApiError(503, "Google sign-in is not configured on the server");
  }

  if (!credential?.trim()) {
    throw new ApiError(400, "Google credential is required");
  }

  const client = new OAuth2Client(clientId);
  let payload;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential.trim(),
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, "Invalid Google sign-in token");
  }

  if (!payload?.email) {
    throw new ApiError(401, "Google account did not provide an email");
  }

  if (!payload.email_verified) {
    throw new ApiError(401, "Google email is not verified");
  }

  const googleId = payload.sub;
  const email = payload.email.toLowerCase();
  const name =
    payload.name?.trim() ||
    payload.given_name?.trim() ||
    email.split("@")[0];
  const avatar = payload.picture || "";

  let user = await User.findOne({ googleId, isDeleted: false }).select(
    "+password",
  );

  if (user) {
    if (avatar && !user.avatar) {
      user.avatar = avatar;
      await user.save({ validateBeforeSave: false });
    }
    return user;
  }

  user = await User.findOne({ email, isDeleted: false }).select("+password");

  if (user) {
    if (intent === "signup") {
      throw new ApiError(
        409,
        `An account with ${email} already exists. Sign in instead.`,
      );
    }

    user.googleId = googleId;
    user.isEmailVerified = true;
    if (avatar && !user.avatar) {
      user.avatar = avatar;
    }
    if (!user.name && name) {
      user.name = name;
    }
    await user.save({ validateBeforeSave: false });
    return user;
  }

  if (intent === "login") {
    throw new ApiError(
      404,
      `No account found for ${email}. Create an account on the sign-up page first.`,
    );
  }

  // Free googleId from soft-deleted accounts so the same Google identity can sign up again
  await User.updateMany(
    { googleId, isDeleted: true },
    { $unset: { googleId: "" } },
  );

  user = new User({
    name,
    email,
    googleId,
    authProvider: "google",
    avatar,
    isEmailVerified: true,
    password: crypto.randomBytes(32).toString("hex"),
  });

  await user.save();
  return user;
};
