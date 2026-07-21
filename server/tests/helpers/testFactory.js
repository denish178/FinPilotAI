import User from "../../src/models/User.js";
import * as authService from "../../src/services/auth.service.js";

export const createTestUser = async (overrides = {}) => {
  const user = await User.create({
    name: overrides.name || "Test User",
    email: overrides.email || `user_${Date.now()}@test.com`,
    password: overrides.password || "Password123!",
    currency: overrides.currency || "INR",
  });

  return user;
};

export const getAuthTokens = (user) => authService.issueAuthTokens(user);

export const authHeader = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
});

export const registerAndLogin = async (request, app, credentials = {}) => {
  const payload = {
    name: credentials.name || "API Test User",
    email: credentials.email || `api_${Date.now()}@test.com`,
    password: credentials.password || "Password123!",
  };

  await request(app).post("/api/auth/register").send(payload);

  const loginRes = await request(app).post("/api/auth/login").send({
    email: payload.email,
    password: payload.password,
  });

  return {
    user: loginRes.body.data.user,
    accessToken: loginRes.body.data.accessToken,
    cookies: loginRes.headers["set-cookie"],
    credentials: payload,
  };
};
