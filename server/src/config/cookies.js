const isProduction = process.env.NODE_ENV === "production";

/** Vercel + Render (cross-site): SameSite=None + Secure so refresh cookies work. */
export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
};

export const accessTokenCookieOptions = {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000,
};

export const refreshTokenCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const clearCookieOptions = {
  ...cookieOptions,
};
