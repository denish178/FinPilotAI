export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
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
